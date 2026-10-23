"""Bounded in-memory utterance detection; no audio is persisted."""
from collections import deque
import re

STOP_WORDS={'стоп','замолчи','подожди','остановись','хватит','погоди','stop'}
BACKCHANNELS={'а','э','ээ','эээ','эм','мм','м','ну','угу','ага','да','нет','хм','понятно','ясно','ок','окей'}


def accept_transcript(text, during_reply=False):
    words=re.findall(r'[а-яёa-z0-9]+',text.lower())
    if not words or all(w in BACKCHANNELS for w in words):
        return not during_reply and any(w in {'да','нет'} for w in words)
    if ' '.join(words) in {'продолжение следует','спасибо за просмотр','субтитры сделал'}:return False
    if not during_reply:return len(''.join(words))>=2 or any(w.isdigit() for w in words)
    if STOP_WORDS.intersection(words):return True
    meaningful=[w for w in words if w not in BACKCHANNELS]
    return len(meaningful)>=2 or (len(words)==1 and words[0] in {'почему','зачем','повтори','поясни','что','как','где','когда'})


def stop_only(text):
    words=re.findall(r'[а-яёa-z0-9]+',text.lower())
    return bool(STOP_WORDS.intersection(words)) and all(w in STOP_WORDS|{'пожалуйста','секунду','минуту','пока'} for w in words)


class Segmenter:
    def __init__(self, vad, rate=48000, frame_ms=30, start_frames=3,
                 end_frames=18, max_frames=400, pre_frames=8, interrupt_frames=10):
        self.vad = vad
        self.rate = rate
        self.frame_bytes = rate * frame_ms // 1000 * 2
        self.start_frames, self.end_frames, self.max_frames = start_frames, end_frames, max_frames
        self.interrupt_frames = max(start_frames, interrupt_frames)
        self.interrupted = False
        self.pre = deque(maxlen=pre_frames)
        self.pending = bytearray()
        self.active = None
        self.positive = self.silent = 0

    def push(self, pcm):
        """Yield start, confirmed interrupt, and utterance events. Accept arbitrary chunk sizes."""
        self.pending.extend(pcm)
        while len(self.pending) >= self.frame_bytes:
            frame = bytes(self.pending[:self.frame_bytes])
            del self.pending[:self.frame_bytes]
            voiced = self.vad.is_speech(frame, self.rate)
            if self.active is None:
                self.pre.append(frame)
                self.positive = self.positive + 1 if voiced else 0
                if self.positive >= self.start_frames:
                    self.active = list(self.pre)
                    self.pre.clear()
                    self.silent = 0
                    self.interrupted = False
                    yield 'start', None
                    if self.positive >= self.interrupt_frames:
                        self.interrupted = True
                        yield 'interrupt', None
            else:
                self.active.append(frame)
                self.positive = self.positive + 1 if voiced else 0
                if not self.interrupted and self.positive >= self.interrupt_frames:
                    self.interrupted = True
                    yield 'interrupt', None
                self.silent = 0 if voiced else self.silent + 1
                if self.silent >= self.end_frames or len(self.active) >= self.max_frames:
                    audio = b''.join(self.active)
                    self.active = None
                    self.positive = self.silent = 0
                    yield 'utterance', audio
