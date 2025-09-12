class ProsodyProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(0);
  this.sampleRate = sampleRate; // Use AudioWorklet global sampleRate
    this.frameSize = Math.round(this.sampleRate * 0.04);   // 40 ms
    this.hopSize = Math.round(this.sampleRate * 0.02);     // 20 ms
    this.minF0 = 70; this.maxF0 = 350;
  }
  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;
    // Append and slide window
    const merged = new Float32Array(this.buf.length + input.length);
    merged.set(this.buf, 0); merged.set(input, this.buf.length);
    this.buf = merged;

    while (this.buf.length >= this.frameSize) {
      const frame = this.buf.slice(0, this.frameSize);
      this.buf = this.buf.slice(this.hopSize);

  const rms = Math.hypot(...frame) / Math.sqrt(frame.length);
      const zcr = this.zeroCross(frame);
  const f0 = this.pitch(frame, this.sampleRate, 70, 350);
      // Simple VAD: energy + zcr gate; replace with RNNoise/WebRTC VAD for production
      const vad = (rms > 0.02) && (zcr < 0.2);

      // Jitter/Shimmer (approx): compute from recent voiced frames
      // For brevity, send 0 if insufficient history; keep a small circular buffer in production.

      this.port.postMessage({
        ts: currentTime, frameMs: 1000 * this.hopSize / this.sampleRate,
        rms, zcr, f0, jitter: 0, shimmer: 0, vad
      });
    }
    return true;
  }
  zeroCross(f) {
    let c = 0; for (let i = 1; i < f.length; i++) c += ((f[i - 1] >= 0) !== (f[i] >= 0)) ? 1 : 0;
    return c / f.length;
  }
  autocorrPitch(frame, sr, minF, maxF) {
    // Basic autocorrelation with peak picking
    const minLag = Math.round(sr / maxF), maxLag = Math.round(sr / minF);
    let bestLag = -1, best = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < frame.length - lag; i++) sum += frame[i] * frame[i + lag];
      if (sum > best) { best = sum; bestLag = lag; }
    }
    if (bestLag < 0) return 0;
    return sr / bestLag;
  }
}
registerProcessor('prosody-processor', ProsodyProcessor);
