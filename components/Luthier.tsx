
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Luthier: React.FC = () => {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tuner Settings
  const [referenceHz, setReferenceHz] = useState(440);
  const [transposition, setTransposition] = useState(0); // In semitones

  // Tuner Data
  const [pitch, setPitch] = useState<number | null>(null);
  const [noteName, setNoteName] = useState('--');
  const [cents, setCents] = useState(0);

  // Animation Refs
  const currentRotation = useRef(0);
  const needleRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null); // Added Filter
  const requestRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array>(new Float32Array(2048));
  
  // Success Chime Logic
  const lastChimeTime = useRef(0);

  // --- AUDIO PROCESSING ---

  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    let size = buffer.length;
    let rms = 0;
    
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    
    if (rms < 0.01) return -1; // Signal too low

    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < thres) { r2 = size - i; break; }
    }
    
    buffer = buffer.slice(r1, r2);
    size = buffer.length;

    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j + i];
      }
    }
    
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    
    let T0 = maxpos;
    
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  const getNote = (freq: number) => {
    const noteNum = 12 * (Math.log(freq / referenceHz) / Math.log(2)) + 69;
    const noteInt = Math.round(noteNum);
    
    // Transposition Logic:
    const displayNoteInt = noteInt - transposition;

    // Javascript modulo bug for negative numbers fix
    const rawNoteName = NOTE_STRINGS[((displayNoteInt % 12) + 12) % 12];
    const deviation = Math.floor((noteNum - noteInt) * 100);

    return { note: rawNoteName, cents: deviation };
  };

  const playSuccessChime = () => {
    const now = Date.now();
    if (now - lastChimeTime.current < 2000) return; // Debounce
    lastChimeTime.current = now;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // High A
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 1.0);
  };

  const updatePitch = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const ac = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);

    let targetRotation = -50; 

    if (ac !== -1) {
      setPitch(ac);
      const { note, cents } = getNote(ac);
      setNoteName(note);
      setCents(cents);
      
      targetRotation = Math.max(-50, Math.min(50, cents)) * 1.5;

      if (Math.abs(cents) < 4) {
          playSuccessChime();
      }
    } else {
        targetRotation = -50;
    }

    currentRotation.current += (targetRotation - currentRotation.current) * 0.15;
    
    if (needleRef.current) {
        needleRef.current.style.transform = `translateX(-50%) rotate(${currentRotation.current}deg)`;
    }

    requestRef.current = requestAnimationFrame(updatePitch);
  };

  const startListening = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio API not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Setup Audio Chain with Filter for better precision
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      filterRef.current = audioContextRef.current.createBiquadFilter();

      // LowPass filter to remove harmonics that confuse tuner
      filterRef.current.type = 'lowpass';
      filterRef.current.frequency.value = 1000;

      sourceRef.current.connect(filterRef.current);
      filterRef.current.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 2048;
      
      setIsListening(true);
      updatePitch();
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No microphone found. Please connect a device.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         setError("Microphone permission denied. Please allow access.");
      } else {
        setError("Could not access microphone.");
      }
      setIsListening(false);
    }
  };

  const stopListening = () => {
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    filterRef.current?.disconnect(); // Disconnect filter
    if (audioContextRef.current?.state !== 'closed') {
       audioContextRef.current?.suspend();
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    setIsListening(false);
    setPitch(null);
    setNoteName('--');
    setCents(0);
    if (needleRef.current) {
        needleRef.current.style.transform = `translateX(-50%) rotate(-50deg)`;
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
      audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTuned = Math.abs(cents) < 5 && isListening && pitch;
  const needleColor = isTuned ? '#00E5FF' : (Math.abs(cents) < 15 ? '#FFFF00' : '#FF4444');

  return (
    <div className="flex flex-col items-center h-full p-4 pb-24 text-center animate-fade-in overflow-hidden max-h-screen">
      
      <header className="mb-4">
        <h1 className="text-3xl font-black text-white tracking-tighter">
            SONURA <span className="text-sonura-cyan">LUTHIER</span>
        </h1>
      </header>

      {/* Tuner Display */}
      <div className="flex-grow flex items-center justify-center w-full min-h-0">
        <div className="relative group scale-75 md:scale-100 transition-transform duration-300">
          <div className={`absolute -inset-1 bg-gradient-to-r from-sonura-cyan to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 ${isTuned ? 'opacity-100 animate-pulse' : ''}`}></div>
          <div className="relative w-72 h-72 bg-sonura-surface rounded-full border-4 border-gray-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
            
            {/* Ticks */}
            <div className="absolute inset-0">
               {[...Array(11)].map((_, i) => {
                 const deg = (i - 5) * 15; 
                 return (
                   <div key={i} className="absolute top-0 left-1/2 w-0.5 h-3 bg-gray-600 origin-bottom"
                        style={{ height: '50%', transform: `rotate(${deg}deg) translateY(10px)` }}>
                      <div className="w-full h-2 bg-gray-500 absolute top-0"></div>
                   </div>
                 )
               })}
               <div className="absolute top-2 left-1/2 w-1 h-6 bg-sonura-cyan -translate-x-1/2 shadow-neon"></div>
            </div>

            {/* Needle */}
            <div 
               ref={needleRef}
               className="absolute bottom-1/2 left-1/2 w-1 h-28 origin-bottom rounded-full z-10"
               style={{ 
                 backgroundColor: needleColor,
                 transform: `translateX(-50%) rotate(-50deg)`,
                 boxShadow: `0 0 10px ${needleColor}`,
                 transition: 'background-color 0.2s'
               }}
            ></div>

            {/* Pivot Dot */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-700 rounded-full -translate-x-1/2 -translate-y-1/2 border border-gray-500 z-20"></div>

            {/* Note Display */}
            <div className="absolute bottom-12 z-20 flex flex-col items-center">
              <h2 className="text-6xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                {noteName}
              </h2>
              <div className={`text-xs font-bold px-2 py-0.5 rounded mt-2 ${isTuned ? 'bg-sonura-cyan text-black' : 'bg-gray-800 text-gray-400'}`}>
                 {pitch ? `${pitch.toFixed(1)} Hz` : '---'}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                 {cents > 0 ? `+${cents}` : cents} cents
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Settings Panel & Controls */}
      <div className="w-full max-w-lg shrink-0 mt-2">
        {error ? (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-300 text-sm mb-4">
            <p className="font-bold mb-1">Error</p>
            {error}
            <button onClick={() => setError(null)} className="block mt-2 text-xs underline">Dismiss</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-3 rounded-xl border border-gray-800 backdrop-blur-sm mb-4">
             <div className="flex flex-col items-center">
                <label className="text-[10px] text-sonura-cyan font-bold uppercase tracking-widest mb-1">{t.luthier.calibration}</label>
                <div className="flex items-center gap-2">
                   <button onClick={() => setReferenceHz(h => h - 1)} className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold">-</button>
                   <span className="text-lg font-mono w-14 text-center">{referenceHz}</span>
                   <button onClick={() => setReferenceHz(h => h + 1)} className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold">+</button>
                </div>
             </div>

             <div className="flex flex-col items-center border-l border-gray-800">
                <label className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">{t.luthier.transposition}</label>
                <div className="flex items-center gap-2">
                   <button onClick={() => setTransposition(t => t - 1)} className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold">-</button>
                   <span className="text-lg font-mono w-8 text-center">{transposition > 0 ? `+${transposition}` : transposition}</span>
                   <button onClick={() => setTransposition(t => t + 1)} className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold">+</button>
                </div>
             </div>
          </div>
        )}

        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-full py-4 rounded-full font-bold text-lg tracking-wider transition-all duration-300 shadow-neon z-50 relative
            ${isListening 
              ? 'bg-red-500/10 text-red-400 border border-red-500 hover:bg-red-500/20' 
              : 'bg-sonura-cyan text-sonura-bg hover:bg-white hover:text-black hover:scale-[1.02]'
            }`}
        >
          {isListening ? t.luthier.stopBtn : t.luthier.startBtn}
        </button>
      </div>
    </div>
  );
};

export default Luthier;
