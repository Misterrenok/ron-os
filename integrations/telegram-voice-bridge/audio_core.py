"""Bounded in-memory utterance detection; no audio is persisted."""
from collections import deque


class Segmenter:
    def __init__(self, vad, rate=48000, frame_ms=30, start_frames=3,
                 end_frames=14, max_frames=400, pre_frames=8, interrupt_frames=10):
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
