export type SoundType = 'success' | 'error' | 'pop' | 'fanfare';

export function playSound(type: SoundType) {
    if (typeof window === 'undefined') return;
    
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        const ctx = new AudioContextClass();

        const playTone = (freq: number, waveType: OscillatorType, duration: number, startTime = ctx.currentTime) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, startTime);
            
            // Volume Envelope to avoid clicking
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        switch (type) {
            case 'success':
                // Fast ascending chime (C5, E5, G5, C6)
                playTone(523.25, 'sine', 0.15, ctx.currentTime);
                playTone(659.25, 'sine', 0.15, ctx.currentTime + 0.1);
                playTone(783.99, 'sine', 0.15, ctx.currentTime + 0.2);
                playTone(1046.50, 'sine', 0.4, ctx.currentTime + 0.3);
                break;
            case 'error':
                // Low buzz/descending
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
                
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
                break;
            case 'pop':
                // Quick bubble pop
                playTone(800, 'sine', 0.05, ctx.currentTime);
                break;
            case 'fanfare':
                // Victory Fanfare
                playTone(523.25, 'triangle', 0.15, ctx.currentTime);
                playTone(523.25, 'triangle', 0.15, ctx.currentTime + 0.15);
                playTone(523.25, 'triangle', 0.3, ctx.currentTime + 0.3);
                playTone(415.30, 'triangle', 0.3, ctx.currentTime + 0.6); // G#4
                playTone(466.16, 'triangle', 0.3, ctx.currentTime + 0.9); // A#4
                playTone(523.25, 'triangle', 0.6, ctx.currentTime + 1.2); // C5
                break;
        }
    } catch (e) {
        // Suppress audio errors silently if browser blocks autoplay
        console.debug('Audio blocked or not supported');
    }
}
