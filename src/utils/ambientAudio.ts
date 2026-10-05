export type SoundscapeId = 'off' | 'rain' | 'ocean' | 'forest' | 'alpha' | 'brown';

export interface SoundscapeMeta {
  id: SoundscapeId;
  name: string;
  shortName: string;
  description: string;
}

export const SOUNDSCAPES: SoundscapeMeta[] = [
  {
    id: 'off',
    name: 'Вимкнено',
    shortName: 'Тиша',
    description: 'Без фонового звукового супроводу',
  },
  {
    id: 'rain',
    name: 'М’який дощ',
    shortName: 'Дощ',
    description: 'Рівномірний шум теплого літнього дощу для глибокої концентрації',
  },
  {
    id: 'ocean',
    name: 'Морські хвилі',
    shortName: 'Океан',
    description: 'Плавний ритм морського прибою, що знімає тривожність під час тестів',
  },
  {
    id: 'forest',
    name: 'Лісовий вітер',
    shortName: 'Ліс',
    description: 'Шепіт вітру в кронах соснового лісу',
  },
  {
    id: 'alpha',
    name: 'Бінауральний фокус (10 Гц)',
    shortName: 'Альфа-хвилі',
    description: 'М’який акустичний тон для стимуляції уваги та пам’яті',
  },
  {
    id: 'brown',
    name: 'Теплий бібліотечний шум',
    shortName: 'Теплий шум',
    description: 'Глибокий низькочастотний коричневий шум, що блокує сторонні звуки',
  },
];

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private currentId: SoundscapeId = 'off';
  private currentVolume: number = 0.35;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.currentVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private stopActiveNodes() {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    this.activeNodes = [];
  }

  private createNoiseBuffer(type: 'pink' | 'brown'): AudioBuffer {
    this.ensureContext();
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 4; // 4-second seamless buffer
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const output = buffer.getChannelData(ch);
      if (type === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.2;
        }
      } else {
        // Pink noise (Paul Kellet's refined method)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.08;
          b6 = white * 0.115926;
        }
      }
    }

    return buffer;
  }

  public play(id: SoundscapeId, volume?: number) {
    if (volume !== undefined) {
      this.setVolume(volume);
    }

    if (id === 'off') {
      this.stop();
      return;
    }

    this.ensureContext();
    this.stopActiveNodes();
    this.currentId = id;

    const ctx = this.ctx!;
    const master = this.masterGain!;

    if (id === 'rain') {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer('pink');
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1150;

      source.connect(filter);
      filter.connect(master);
      source.start();

      this.activeNodes.push(source, filter);
    } else if (id === 'ocean') {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer('brown');
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 480;

      const waveGain = ctx.createGain();
      waveGain.gain.value = 0.55;

      // Slow LFO for ocean wave rhythm (0.12 Hz ~ 8 seconds per wave)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.12;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.38;

      const lfoFilterGain = ctx.createGain();
      lfoFilterGain.gain.value = 280;

      lfo.connect(lfoGain);
      lfoGain.connect(waveGain.gain);

      lfo.connect(lfoFilterGain);
      lfoFilterGain.connect(filter.frequency);

      source.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(master);

      source.start();
      lfo.start();

      this.activeNodes.push(source, filter, waveGain, lfo, lfoGain, lfoFilterGain);
    } else if (id === 'forest') {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer('pink');
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 520;
      filter.Q.value = 2.2;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;

      const lfoFilter = ctx.createGain();
      lfoFilter.gain.value = 220;

      lfo.connect(lfoFilter);
      lfoFilter.connect(filter.frequency);

      source.connect(filter);
      filter.connect(master);

      source.start();
      lfo.start();

      this.activeNodes.push(source, filter, lfo, lfoFilter);
    } else if (id === 'alpha') {
      // Binaural 10Hz Alpha waves (Left: 200Hz, Right: 210Hz) + soft brown warmth
      const merger = ctx.createChannelMerger(2);

      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.value = 196;

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.value = 206; // 10 Hz Alpha beat

      const toneGain = ctx.createGain();
      toneGain.gain.value = 0.16;

      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      merger.connect(toneGain);
      toneGain.connect(master);

      // Soft warm brown noise pad underneath
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('brown');
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.35;

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);

      oscL.start();
      oscR.start();
      noise.start();

      this.activeNodes.push(oscL, oscR, merger, toneGain, noise, filter, noiseGain);
    } else if (id === 'brown') {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer('brown');
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;

      source.connect(filter);
      filter.connect(master);
      source.start();

      this.activeNodes.push(source, filter);
    }
  }

  public stop() {
    this.stopActiveNodes();
    this.currentId = 'off';
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getCurrentId(): SoundscapeId {
    return this.currentId;
  }

  public getVolume(): number {
    return this.currentVolume;
  }
}

export const ambientAudio = new AmbientSoundEngine();
