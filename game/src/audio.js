// Solmar Bay — synthesized audio: WebAudio oscillators and noise only.
// No sound files, no network. Everything is generated in the browser.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let sirenTimer = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', volume = 0.12, when = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopEngine();
      return muted;
    },
    get muted() { return muted; },
    blip() { tone(660, 0.09, 'square', 0.08); },
    pickup() { tone(523, 0.1, 'sine', 0.12); tone(784, 0.16, 'sine', 0.12, 0.09); },
    missionComplete() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11));
    },
    gunshot() {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const len = c.sampleRate * 0.12;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const gain = c.createGain();
      gain.gain.value = 0.25;
      src.connect(gain);
      gain.connect(c.destination);
      src.start();
    },
    busted() { tone(220, 0.5, 'sawtooth', 0.14); tone(165, 0.7, 'sawtooth', 0.14, 0.3); },
    startEngine() {
      if (muted) return;
      const c = ensure();
      if (!c || engineOsc) return;
      engineOsc = c.createOscillator();
      engineGain = c.createGain();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain.gain.value = 0.035;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(c.destination);
      engineOsc.start();
    },
    setEngineSpeed(ratio) {
      if (engineOsc) engineOsc.frequency.value = 55 + ratio * 110;
      if (engineGain) engineGain.gain.value = 0.02 + ratio * 0.035;
    },
    stopEngine() {
      if (engineOsc) { try { engineOsc.stop(); } catch (e) { /* already stopped */ } }
      engineOsc = null;
      engineGain = null;
    },
    startSiren() {
      if (muted) return;
      const c = ensure();
      if (!c || sirenOsc) return;
      sirenOsc = c.createOscillator();
      sirenGain = c.createGain();
      sirenOsc.type = 'triangle';
      sirenOsc.frequency.value = 700;
      sirenGain.gain.value = 0.045;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(c.destination);
      sirenOsc.start();
      let high = true;
      sirenTimer = window.setInterval(() => {
        if (!sirenOsc) return;
        high = !high;
        sirenOsc.frequency.value = high ? 950 : 650;
      }, 420);
    },
    stopSiren() {
      if (sirenTimer) { window.clearInterval(sirenTimer); sirenTimer = null; }
      if (sirenOsc) { try { sirenOsc.stop(); } catch (e) { /* already stopped */ } }
      sirenOsc = null;
      sirenGain = null;
    },
  };
}
