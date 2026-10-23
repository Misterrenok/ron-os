"""Offline Russian neural speech from the official Silero v5.6 model."""
import re
import textwrap
import threading
import numpy as np


class LocalTTS:
    def __init__(self, model_path, speaker='eugene'):
        import torch
        torch.set_num_threads(2)
        self.torch = torch
        self.model = torch.package.PackageImporter(model_path).load_pickle('tts_models', 'model')
        self.model.to(torch.device('cpu'))
        self.speaker = speaker
        self.lock = threading.Lock()

    @staticmethod
    def chunks(text):
        for sentence in re.split(r'(?<=[.!?…])\s+', text.strip()):
            for chunk in textwrap.wrap(sentence, width=220, break_long_words=False,
                                       break_on_hyphens=False):
                if chunk.strip():
                    yield chunk.strip()

    def synthesize(self, text, speaker=None):
        with self.lock, self.torch.inference_mode():
            audio = self.model.apply_tts(text=text, speaker=speaker or self.speaker, sample_rate=48000)
            samples = audio.detach().cpu().numpy()
            return (np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()
