interface VoiceEntry {
  file: string;
  license: string;
  credit: string;
}
interface VoiceManifest {
  recordings: Record<string, VoiceEntry>;
}
export class AudioSystem {
  context?: AudioContext;
  master?: GainNode;
  ambience?: GainNode;
  sfx?: GainNode;
  voiceBus?: GainNode;
  muted = false;
  recordings: VoiceManifest = { recordings: {} };
  private activeVoice?: AudioBufferSourceNode;
  private voiceGeneration = 0;
  private active = new Set<OscillatorNode>();
  private ambienceTimer?: number;
  async init() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.context.destination);
      this.ambience = this.context.createGain();
      this.ambience.gain.value = 0.22;
      this.ambience.connect(this.master);
      this.sfx = this.context.createGain();
      this.sfx.gain.value = 0.32;
      this.sfx.connect(this.master);
      this.voiceBus = this.context.createGain();
      this.voiceBus.gain.value = 0.8;
      this.voiceBus.connect(this.master);
      this.ambienceTimer = window.setInterval(() => {
        if (!document.hidden && !this.muted) this.bird();
      }, 6500);
      try {
        const response = await fetch('/audio/voice/manifest.json');
        if (response.ok) this.recordings = await response.json();
      } catch {
        /* Subtitles remain available offline. */
      }
    }
    await this.context.resume();
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.context.currentTime, 0.03);
  }
  tone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    bus = this.sfx,
    volume = 0.2,
    target?: number,
  ) {
    const ctx = this.context;
    if (!ctx || !bus || this.muted || this.active.size >= 16) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    if (target)
      oscillator.frequency.exponentialRampToValueAtTime(target, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(bus);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    this.active.add(oscillator);
    oscillator.onended = () => {
      this.active.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  step() {
    this.tone(110 + Math.random() * 45, 0.045, 'triangle', this.sfx, 0.14);
  }
  bell() {
    this.tone(1318, 0.6, 'sine', this.sfx, 0.18);
    this.tone(1760, 0.3, 'sine', this.sfx, 0.08);
  }
  cup() {
    this.tone(1900, 0.15, 'sine', this.sfx, 0.2);
    this.tone(2500, 0.22, 'sine', this.sfx, 0.1);
  }
  bird() {
    this.tone(1900, 0.3, 'sine', this.ambience, 0.12, 3200);
  }
  async voice(id: string): Promise<boolean> {
    this.stopVoice();
    const generation = this.voiceGeneration;
    const entry = this.recordings.recordings[id];
    if (
      !entry?.license ||
      !entry.credit ||
      !entry.file.startsWith('/audio/voice/') ||
      !this.context ||
      !this.voiceBus
    )
      return false;
    try {
      const response = await fetch(entry.file);
      if (!response.ok) return false;
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      if (generation !== this.voiceGeneration) return false;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.voiceBus);
      this.activeVoice = source;
      this.ambience?.gain.setTargetAtTime(0.06, this.context.currentTime, 0.08);
      source.onended = () => {
        if (this.activeVoice === source) {
          this.activeVoice = undefined;
          this.ambience?.gain.setTargetAtTime(0.22, this.context!.currentTime, 0.3);
        }
        source.disconnect();
      };
      source.start();
      return true;
    } catch {
      return false;
    }
  }
  stopVoice() {
    this.voiceGeneration++;
    this.activeVoice?.stop();
    this.activeVoice = undefined;
    if (this.context) this.ambience?.gain.setTargetAtTime(0.22, this.context.currentTime, 0.3);
  }
  destroy() {
    clearInterval(this.ambienceTimer);
    this.stopVoice();
    void this.context?.close();
  }
}
