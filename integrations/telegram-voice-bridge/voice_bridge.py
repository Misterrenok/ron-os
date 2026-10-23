#!/usr/bin/env python3
"""Personal Telegram calls using NTgCalls. Private Unix IPC; no public listener."""
import asyncio
import contextlib
import fcntl
import json
import logging
import os
from pathlib import Path
import signal
import socket
import sys
import time
import threading
import uuid

import numpy as np
import webrtcvad
from telethon import TelegramClient
from telethon.sessions import StringSession
from pytgcalls import PyTgCalls, filters
from pytgcalls.types import (ChatUpdate, Device, Direction, ExternalMedia,
                            MediaStream, RecordStream)
from pytgcalls.types.raw import AudioParameters
from audio_core import Segmenter
from agent_worker import AgentWorker

LOG = logging.getLogger('voice_bridge')
RATE = 48000
FRAME_BYTES = 960  # 10 ms, mono s16le


def event(name, **fields):
    # Explicit fields only: never exception messages, peer IDs, speech or credentials.
    LOG.info(json.dumps({'event': name, **fields}, separators=(',', ':')))


async def kill_process(proc):
    if proc is None:
        return
    if proc.returncode is None:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(proc.pid, signal.SIGTERM)
    # Drain pipes while waiting: wait() alone can hang on a full ffmpeg stdout.
    drain = asyncio.create_task(proc.communicate())
    done, _ = await asyncio.wait({drain}, timeout=1)
    if not done:
        if proc.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(proc.pid, signal.SIGKILL)
        done, _ = await asyncio.wait({drain}, timeout=1)
    if done:
        with contextlib.suppress(Exception):
            drain.result()
    else:
        drain.cancel()



def notify(message):
    address = os.environ.get('NOTIFY_SOCKET')
    if not address:
        return
    if address.startswith('@'):
        address = chr(0) + address[1:]
    with socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM) as sock:
        sock.connect(address)
        sock.sendall(message.encode())


class Bridge:
    def __init__(self, cfg, stt):
        self.cfg, self.stt = cfg, stt
        self.tts = None
        if cfg.get('tts_model') and Path(cfg['tts_model']).is_file():
            from local_tts import LocalTTS
            self.tts = LocalTTS(cfg['tts_model'], cfg.get('tts_speaker', 'eugene'))
        self.worker = AgentWorker(cfg.get('hermes_command', []), next(iter(cfg['allowed_peers']),0), cfg.get('agent_timeout',35))
        self.allowed = {int(x) for x in cfg['allowed_peers']}
        if not self.allowed or any(x <= 0 for x in self.allowed):
            raise ValueError('An explicit nonempty private peer allowlist is required')
        self.client = TelegramClient(cfg.get('session_file') or StringSession(cfg['session']), cfg['api_id'], cfg['api_hash'])
        self.calls = PyTgCalls(self.client)
        self.peer = None
        self.generation = 0
        self.connected = False
        self.call_tag = None
        self.turn = self.receiver = self.timer = self.speech = None
        self.audible = False
        self.utterance_queue = asyncio.Queue(maxsize=2)
        self.queue = asyncio.Queue(maxsize=200)
        self.history = []
        self.metrics = {}
        self.lock = asyncio.Lock()
        self.stt_lock = threading.Lock()
        self.stop = asyncio.Event()
        self.started = time.monotonic()
        self.calls.on_update(filters.chat_update(ChatUpdate.Status.INCOMING_CALL))(self.incoming)
        self.calls.on_update(filters.chat_update(ChatUpdate.Status.LEFT_CALL))(self.left)
        self.calls.on_update(filters.stream_frame(directions=Direction.INCOMING))(self.frames)

    async def incoming(self, _, update):
        if update.chat_id not in self.allowed:
            event('incoming_not_allowed')
            # Do not play/answer. Avoid resolving or communicating with unknown peers.
            return
        try:
            await self.connect(update.chat_id, incoming=True)
        except Exception as e:
            event('accept_error', error=type(e).__name__)

    async def connect(self, peer, incoming=False):
        if peer not in self.allowed:
            raise PermissionError('peer_not_allowed')
        async with self.lock:
            if self.peer is not None:
                raise RuntimeError('busy')
            self.peer = peer
            self.generation += 1
            gen = self.generation
            self.call_tag = uuid.uuid4().hex[:12]
            self.metrics = dict(received_bytes=0, sent_bytes=0, utterances=0,
                                answers=0, interruptions=0, started_at=time.time())
            self.history = []
            self.utterance_queue = asyncio.Queue(maxsize=2)
            self.audible = False
            self.response_started_at = None
            self.queue = asyncio.Queue(maxsize=200)
            self.segmenter = Segmenter(webrtcvad.Vad(2))
            self.timer = None
        event('call_negotiating', incoming=incoming, tag=self.call_tag)
        try:
            await asyncio.wait_for(self.calls.play(peer, MediaStream(
                ExternalMedia.AUDIO, audio_parameters=AudioParameters(RATE, 1))), 35)
            if self.generation != gen or self.peer != peer:
                with contextlib.suppress(Exception):
                    await self.calls.leave_call(peer)
                return
            await self.calls.record(peer, RecordStream(audio=True,
                audio_parameters=AudioParameters(RATE, 1)))
            if self.generation != gen or self.peer != peer:
                return
            self.connected = True
            self.timer = asyncio.create_task(self.limit(gen))
            self.metrics['connected_at'] = time.time()
            self.receiver = asyncio.create_task(self.receive(gen))
            event('call_connected', tag=self.call_tag)
            self.speech = asyncio.create_task(self.greet(gen))
            self.turn = asyncio.create_task(self.dialogue(gen))
        except BaseException:
            await self.finish('connect_failed', gen)
            raise

    async def limit(self, gen):
        await asyncio.sleep(float(self.cfg.get('max_call_seconds', 60)))
        await self.finish('time_limit', gen)

    async def left(self, _, update):
        if update.chat_id == self.peer:
            await self.finish('remote_hangup', self.generation, discard=False)

    async def frames(self, _, update):
        if update.chat_id != self.peer or not self.connected:
            return
        if not (update.device & (Device.MICROPHONE | Device.SPEAKER)):
            return
        for frame in update.frames:
            data = frame.frame
            self.metrics['received_bytes'] += len(data)
            try:
                self.queue.put_nowait(data)
            except asyncio.QueueFull:
                # Keep latest audio; reset segmentation to avoid joining across a dropped gap.
                while not self.queue.empty():
                    self.queue.get_nowait()
                self.segmenter = Segmenter(webrtcvad.Vad(2))
                event('audio_overrun')

    async def receive(self, gen):
        while gen == self.generation and self.peer:
            try:
                pcm = await asyncio.wait_for(self.queue.get(), .15)
            except asyncio.TimeoutError:
                if self.segmenter.active is None:
                    continue
                # Opus DTX / a quiet remote may stop delivering frames.
                pcm = b'\0' * (self.segmenter.frame_bytes * 5)
            for kind, data in self.segmenter.push(pcm):
                if kind == 'interrupt' and self.audible and self.speech and not self.speech.done():
                    self.metrics['interruptions'] += 1
                    self.speech.cancel()
                    # Playback cleanup must never block incoming PCM processing.
                    self.audible = False
                    event('barge_in', tag=self.call_tag)
                elif kind == 'utterance':
                    if self.utterance_queue.full():
                        self.utterance_queue.get_nowait()
                        event('utterance_coalesced', tag=self.call_tag)
                    self.utterance_queue.put_nowait(data)

    async def dialogue(self, gen):
        # New speech may stop playback, but never destroys a warm inference worker.
        # Serialize completed utterances in a bounded queue instead of restarting STT/LLM.
        if self.speech:
            await asyncio.gather(self.speech, return_exceptions=True)
        while gen == self.generation and self.peer:
            pcm = await self.utterance_queue.get()
            await self.respond(pcm, gen)

    async def play_reply(self, text, gen):
        while self.segmenter.active is not None and gen == self.generation and self.connected:
            await asyncio.sleep(.03)
        if gen != self.generation or not self.connected:
            return False
        self.speech = asyncio.create_task(self.speak(text, gen))
        try:
            await self.speech
            return True
        except asyncio.CancelledError:
            if asyncio.current_task().cancelling():
                raise
            return False
        finally:
            self.audible = False

    def recognize(self, pcm):
        # Proper antialiasing: polyphase downsample for Whisper's 16 kHz input.
        from scipy.signal import resample_poly
        audio = np.frombuffer(pcm, dtype='<i2').astype(np.float32) / 32768
        audio = resample_poly(audio, 1, 3)
        with self.stt_lock:
            segments, _ = self.stt.transcribe(audio, language=self.cfg.get('language', 'ru'),
                                             beam_size=int(self.cfg.get('stt_beam_size', 1)), condition_on_previous_text=False,
                                             vad_filter=False)
            return ' '.join(s.text.strip() for s in segments).strip()

    async def ask_hermes(self, text):
        return await self.worker.ask({'text':text,'history':self.history[-16:],
            'call_tag':self.call_tag,'user_id':str(self.peer)})

    async def greet(self, gen):
        try:
            await self.speak('Привет! Это Гермес, ИИ-ассистент. Я слушаю.', gen)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            event('greeting_error', error=type(e).__name__)
        finally:
            self.audible = False

    async def respond(self, pcm, gen):
        started = time.monotonic()
        try:
            text = await asyncio.to_thread(self.recognize, pcm)
            if not text or gen != self.generation:
                return
            self.metrics['utterances'] += 1
            event('speech_recognized', tag=self.call_tag,
                  stt_ms=round((time.monotonic()-started)*1000))
            answer = await self.ask_hermes(text)
            self.history.extend([{'role': 'user', 'content': text},
                                 {'role': 'assistant', 'content': answer}])
            self.history = self.history[-16:]
            event('agent_finished', tag=self.call_tag, elapsed_ms=round((time.monotonic()-started)*1000))
            self.response_started_at = started
            if not await self.play_reply(answer, gen):
                return
            self.metrics['answers'] += 1
            event('answer_finished', tag=self.call_tag,
                  turn_ms=round((time.monotonic()-started)*1000))
        except asyncio.CancelledError:
            raise
        except Exception as e:
            event('turn_error', error=type(e).__name__, tag=self.call_tag)
            if gen == self.generation and self.connected:
                with contextlib.suppress(Exception):
                    await self.play_reply('Не получилось обработать ответ. Повтори, пожалуйста.', gen)

    async def speak(self, text, gen):
        if self.cfg.get('tts_backend') == 'silero':
            if self.tts is None:
                raise RuntimeError('local_tts_not_ready')
            return await self.speak_local(text, gen)
        try:
            return await self.speak_edge(text, gen)
        except asyncio.CancelledError:
            raise
        except Exception:
            if self.tts is None:
                raise
            event('tts_local_fallback', tag=self.call_tag)
            return await self.speak_local(text, gen)

    async def speak_local(self, text, gen):
        for sentence in self.tts.chunks(text):
            pcm = await asyncio.to_thread(self.tts.synthesize, sentence)
            deadline = time.monotonic()
            for offset in range(0, len(pcm), FRAME_BYTES):
                if gen != self.generation or not self.connected:
                    return
                frame = pcm[offset:offset+FRAME_BYTES].ljust(FRAME_BYTES, b'\0')
                if not self.audible:
                    event('speech_playback_started', tag=self.call_tag, processing_ms=round((time.monotonic()-self.response_started_at)*1000) if getattr(self,'response_started_at',None) else None)
                    self.audible = True
                await self.calls.send_frame(self.peer, Device.MICROPHONE, frame)
                self.metrics['sent_bytes'] += len(frame)
                deadline = max(deadline + .01, time.monotonic())
                await asyncio.sleep(max(0, deadline-time.monotonic()))

    async def speak_edge(self, text, gen):
        import edge_tts
        proc = feed = None
        async def feed_mp3():
            stream = edge_tts.Communicate(text, self.cfg.get('voice', 'ru-RU-SvetlanaNeural'))
            try:
                async for chunk in stream.stream():
                    if chunk['type'] == 'audio':
                        proc.stdin.write(chunk['data'])
                        await proc.stdin.drain()
            finally:
                if proc.stdin:
                    proc.stdin.close()
        try:
            proc = await asyncio.create_subprocess_exec('ffmpeg', '-hide_banner', '-loglevel',
                'error', '-f', 'mp3', '-probesize', '32', '-analyzeduration', '0', '-i', 'pipe:0', '-f', 's16le', '-ar', str(RATE), '-ac', '1', 'pipe:1',
                stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL, start_new_session=True)
            feed = asyncio.create_task(feed_mp3())
            deadline = time.monotonic()
            while gen == self.generation and self.connected:
                try:
                    frame = await asyncio.wait_for(proc.stdout.readexactly(FRAME_BYTES), 5)
                except asyncio.IncompleteReadError as e:
                    if not e.partial:
                        break
                    frame = e.partial.ljust(FRAME_BYTES, b'\0')
                if not self.audible:
                    event('speech_playback_started', tag=self.call_tag, processing_ms=round((time.monotonic()-self.response_started_at)*1000) if getattr(self,'response_started_at',None) else None)
                    self.audible = True
                await self.calls.send_frame(self.peer, Device.MICROPHONE, frame)
                self.metrics['sent_bytes'] += len(frame)
                # Reset after decoder startup delay; never enqueue a large unpaced burst.
                deadline = max(deadline + .01, time.monotonic())
                await asyncio.sleep(max(0, deadline-time.monotonic()))
            await feed
        finally:
            if feed and not feed.done():
                feed.cancel()
                done, _ = await asyncio.wait({feed}, timeout=.5)
                if done:
                    with contextlib.suppress(BaseException):
                        feed.result()
            await kill_process(proc)

    async def finish(self, reason, gen=None, discard=True):
        async with self.lock:
            if self.peer is None or (gen is not None and gen != self.generation):
                return
            peer, tag = self.peer, self.call_tag
            self.peer = None
            self.connected = False
            self.generation += 1
            current = asyncio.current_task()
            tasks = [t for t in (self.turn, self.receiver, self.timer, self.speech)
                     if t and t is not current and not t.done()]
            for t in tasks:
                t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        if discard:
            with contextlib.suppress(Exception):
                await asyncio.wait_for(self.calls.leave_call(peer), 8)
        self.history.clear()
        event('call_ended', reason=reason, tag=tag, **self.metrics)
        self.write_status()

    def write_status(self):
        state = {'ready': self.client.is_connected(), 'connected': self.connected,
                 'busy': self.peer is not None, 'uptime': round(time.monotonic()-self.started),
                 'metrics': self.metrics}
        path = Path(self.cfg['runtime_dir']) / 'status.json'
        tmp = path.with_suffix('.tmp')
        tmp.write_text(json.dumps(state))
        os.chmod(tmp, 0o600)
        tmp.replace(path)
        return state

    async def control(self, reader, writer):
        try:
            raw = await asyncio.wait_for(reader.readline(), 3)
            req = json.loads(raw)
            action = req['action']
            if action == 'status':
                result = self.write_status()
            elif action == 'hangup':
                await self.finish('local_hangup')
                result = {'ok': True}
            elif action == 'dial':
                peer = int(req.get('peer', next(iter(self.allowed))))
                if peer not in self.allowed:
                    raise PermissionError('peer_not_allowed')
                if self.peer is not None:
                    raise RuntimeError('busy')
                asyncio.create_task(self.dial(peer))
                result = {'ok': True, 'state': 'requested'}
            else:
                raise ValueError('unknown_action')
            writer.write(json.dumps(result).encode()+b'\n')
        except Exception as e:
            writer.write(json.dumps({'error': type(e).__name__}).encode()+b'\n')
        finally:
            with contextlib.suppress(Exception):
                await writer.drain()
            writer.close()
            await writer.wait_closed()

    async def dial(self, peer):
        try:
            await self.connect(peer)
        except Exception as e:
            event('dial_error', error=type(e).__name__)

    async def heartbeat(self):
        while True:
            if self.client.is_connected():
                notify('WATCHDOG=1')
            await asyncio.sleep(20)

    async def run(self):
        runtime = Path(self.cfg['runtime_dir'])
        runtime.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.lock_file = (runtime/'instance.lock').open('w')
        fcntl.flock(self.lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        socket = runtime/'control.sock'
        socket.unlink(missing_ok=True)
        await self.client.connect()
        if not await self.client.is_user_authorized():
            raise RuntimeError('telegram_authorization_required')
        me = await self.client.get_me()
        if me.bot or me.id != self.cfg['expected_account_id']:
            raise RuntimeError('wrong_telegram_account')
        await self.client.get_dialogs(limit=100)
        for peer_id, username in self.cfg.get('peer_usernames', {}).items():
            if int(peer_id) not in self.allowed:
                raise RuntimeError('unapproved_peer_mapping')
            entity = await self.client.get_entity(username)
            if entity.id != int(peer_id):
                raise RuntimeError('peer_identity_changed')
        await asyncio.to_thread(self.recognize, b'\0' * (RATE * 2))
        event('stt_warmed')
        await self.worker.start()
        await self.worker.ask({'text':'Ответь одним словом: готов.','history':[],
            'call_tag':'warmup','user_id':str(next(iter(self.allowed)))})
        await self.calls.start()
        server = await asyncio.start_unix_server(self.control, path=socket, limit=4096)
        os.chmod(socket, 0o600)
        for sig in (signal.SIGINT, signal.SIGTERM):
            asyncio.get_running_loop().add_signal_handler(sig, self.stop.set)
        self.write_status()
        event('service_ready')
        notify('READY=1')
        heartbeat = asyncio.create_task(self.heartbeat())
        try:
            async with server:
                await self.stop.wait()
        finally:
            heartbeat.cancel()
            await asyncio.gather(heartbeat, return_exceptions=True)
            await self.finish('service_shutdown')
            server.close()
            await server.wait_closed()
            await self.worker.close()
            await self.client.disconnect()
            socket.unlink(missing_ok=True)


def main():
    os.umask(0o077)
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    for name in ('telethon', 'pytgcalls', 'ntgcalls', 'httpx', 'httpcore'):
        logging.getLogger(name).setLevel(logging.ERROR)
    config = json.loads(Path(sys.argv[1]).read_text())
    from faster_whisper import WhisperModel
    stt = WhisperModel(config.get('stt_model', 'small'), device='cpu', compute_type='int8',
                       cpu_threads=2, num_workers=1, local_files_only=True)
    async def serve():
        await Bridge(config, stt).run()
    asyncio.run(serve())


if __name__ == '__main__':
    main()
