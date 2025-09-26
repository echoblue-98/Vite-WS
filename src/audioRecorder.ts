export class SimpleWavRecorder {
  private audioCtx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private buffers: Float32Array[] = [];
  private sampleRate = 44100;

  async start(stream: MediaStream) {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.sampleRate = this.audioCtx.sampleRate;
    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      this.buffers.push(new Float32Array(input));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
  }

  async stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null as any;
    }
    if (this.source) this.source.disconnect();
    if (this.audioCtx) await this.audioCtx.close();
  }

  exportWav(): Blob {
    // Flatten
    const length = this.buffers.reduce((acc, b) => acc + b.length, 0);
    const data = new Float32Array(length);
    let offset = 0;
    for (const b of this.buffers) {
      data.set(b, offset);
      offset += b.length;
    }
    // Convert to 16-bit PCM
    const pcm = new DataView(new ArrayBuffer(44 + data.length * 2));
    const writeString = (dv: DataView, offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) dv.setUint8(offset + i, s.charCodeAt(i));
    };
    const sr = this.sampleRate;
    // RIFF/WAVE header
    writeString(pcm, 0, 'RIFF');
    pcm.setUint32(4, 36 + data.length * 2, true);
    writeString(pcm, 8, 'WAVE');
    writeString(pcm, 12, 'fmt ');
    pcm.setUint32(16, 16, true); // PCM chunk size
    pcm.setUint16(20, 1, true); // format = PCM
    pcm.setUint16(22, 1, true); // channels = 1
    pcm.setUint32(24, sr, true); // sample rate
    pcm.setUint32(28, sr * 2, true); // byte rate (sr * channels * bytesPerSample)
    pcm.setUint16(32, 2, true); // block align (channels * bytesPerSample)
    pcm.setUint16(34, 16, true); // bits per sample
    writeString(pcm, 36, 'data');
    pcm.setUint32(40, data.length * 2, true);
    // Samples
    let idx = 44;
    for (let i = 0; i < data.length; i++, idx += 2) {
      let s = Math.max(-1, Math.min(1, data[i]));
      pcm.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([pcm], { type: 'audio/wav' });
  }
}
