
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { analyzeAudioForChords } from '../services/geminiService';
import { AudioAnalysis, Instrument } from '../types';
import { transposeChord, playChord } from '../utils/musicUtils';
import ChordVisualizer from './ChordVisualizer';

const Decoder: React.FC = () => {
  const { t } = useLanguage();
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  
  // Selection
  const [selectedChordIndex, setSelectedChordIndex] = useState<number | null>(null);
  
  // Input Modes
  const [inputType, setInputType] = useState<'upload' | 'mic' | 'youtube' | null>(null);
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state for the active chord string based on transposition
  const getTransposedChord = (originalChord: string) => {
    return transposeChord(originalChord, transpose);
  };

  const activeChordDisplay = analysis && selectedChordIndex !== null 
    ? getTransposedChord(analysis.chords[selectedChordIndex]) 
    : null;

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startAnalysis();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      processAnalysis({ type: 'audio', data: base64String, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone not supported");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            // Convert to Base64
            startAnalysis();
            const reader = new FileReader();
            reader.onloadend = () => {
                 const base64String = (reader.result as string).split(',')[1];
                 processAnalysis({ type: 'audio', data: base64String, mimeType: 'audio/webm' });
            };
            reader.readAsDataURL(audioBlob);
            
            // Stop tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic error", err);
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleYoutubeAnalysis = async () => {
    if (!youtubeLink) return;
    startAnalysis();
    processAnalysis({ type: 'url', url: youtubeLink });
  };

  const startAnalysis = () => {
      setIsAnalyzing(true);
      setAnalysis(null);
      setTranspose(0);
      setSelectedChordIndex(null);
      setInputType(null); // Return to view results
  };

  const processAnalysis = async (input: any) => {
      const result = await analyzeAudioForChords(input);
      setAnalysis(result);
      if (result?.chords?.length > 0) setSelectedChordIndex(0);
      setIsAnalyzing(false);
  };

  const selectAndPlay = (index: number) => {
    setSelectedChordIndex(index);
    if (analysis) {
        const chord = analysis.chords[index];
        const transposed = transposeChord(chord, transpose);
        playChord(transposed, instrument);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 md:pb-0 scroll-smooth animate-fade-in">
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
            SONURA <span className="text-purple-500">{t.decoder.title}</span>
          </h1>
          <p className="text-gray-400 text-lg">{t.decoder.subtitle}</p>
        </header>

        {/* INPUT SELECTION - 3 BIG CARDS */}
        {!isAnalyzing && !analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                
                {/* 1. Upload */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group bg-sonura-surface/50 border border-gray-800 hover:border-purple-500 rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-black/40 hover:-translate-y-1 shadow-lg h-64"
                >
                    <div className="p-4 bg-gray-900 rounded-full group-hover:bg-purple-900/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t.decoder.optionUpload}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t.decoder.uploadLabel}</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*,video/*" className="hidden" />
                </div>

                {/* 2. Microphone */}
                <div 
                    onClick={() => isRecording ? stopRecording() : startRecording()}
                    className={`group bg-sonura-surface/50 border border-gray-800 hover:border-red-500 rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-black/40 hover:-translate-y-1 shadow-lg h-64 ${isRecording ? 'border-red-500 bg-red-900/10' : ''}`}
                >
                    <div className={`p-4 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-900 group-hover:bg-red-900/30'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isRecording ? 'text-white' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t.decoder.optionMic}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        {isRecording ? t.decoder.stopRecord : t.decoder.startRecord}
                    </p>
                </div>

                {/* 3. YouTube */}
                <div className="group bg-sonura-surface/50 border border-gray-800 hover:border-red-600 rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all shadow-lg h-64">
                    <div className="p-4 bg-gray-900 rounded-full group-hover:bg-red-900/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t.decoder.optionYoutube}</h3>
                    <div className="w-full">
                        <input 
                            type="text" 
                            value={youtubeLink}
                            onChange={(e) => setYoutubeLink(e.target.value)}
                            placeholder={t.decoder.youtubePlaceholder}
                            className="w-full bg-black/40 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 mb-2"
                        />
                        <button 
                            onClick={handleYoutubeAnalysis}
                            disabled={!youtubeLink}
                            className="w-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600 rounded py-1 text-xs font-bold uppercase transition-all disabled:opacity-50"
                        >
                            {t.decoder.analyzeBtn}
                        </button>
                    </div>
                </div>

            </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="text-center py-20 animate-fade-in">
             <div className="inline-block w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="text-2xl text-purple-400 font-black tracking-widest animate-pulse">{t.decoder.analyzing}</p>
          </div>
        )}

        {/* Results */}
        {analysis && !isAnalyzing && (
          <div className="animate-fade-in-up space-y-6">
            
            <button 
                onClick={() => setAnalysis(null)}
                className="mb-4 text-gray-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
                ← Back to Selection
            </button>

            {/* Analysis Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-gray-900 rounded-lg p-6 border-l-4 border-purple-500">
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-1">{t.decoder.detectedKey}</h3>
                  <div className="flex items-baseline gap-4">
                    <p className="text-3xl text-white font-mono">{analysis.key}</p>
                    <p className="text-sm text-gray-400 font-mono border border-gray-700 px-2 rounded">BPM: {analysis.bpm}</p>
                  </div>
               </div>
               
               {/* Transpose Control */}
               <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-gray-500 text-xs font-bold uppercase">{t.decoder.transposeLabel}</h3>
                     <span className="text-purple-400 font-mono text-xl">{transpose > 0 ? `+${transpose}` : transpose}</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1"
                    value={transpose}
                    onChange={(e) => setTranspose(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
                     <span>-12</span>
                     <span className="text-purple-500">{t.decoder.original}</span>
                     <span>+12</span>
                  </div>
               </div>
            </div>

            {/* Chords and Visualizer Section */}
            <div className="bg-sonura-surface border border-gray-800 rounded-xl p-8">
               <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-gray-800 pb-4 gap-4">
                 <div className="w-full md:w-auto">
                    <h3 className="text-purple-500 font-bold uppercase tracking-widest mb-1">{t.decoder.chordsFound}</h3>
                    <span className="text-xs text-gray-500 bg-black px-2 py-1 rounded border border-gray-800 font-mono">
                        {analysis.progression}
                    </span>
                 </div>
                 
                 {/* Instrument Toggle */}
                 <div className="flex bg-black rounded p-1 self-end">
                    <button 
                    onClick={() => setInstrument('guitar')} 
                    className={`p-2 rounded ${instrument === 'guitar' ? 'bg-gray-700 text-purple-400 shadow-neon' : 'text-gray-500'}`}
                    title={t.studio.guitar}
                    >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </button>
                    <button 
                    onClick={() => setInstrument('piano')} 
                    className={`p-2 rounded ${instrument === 'piano' ? 'bg-gray-700 text-purple-400 shadow-neon' : 'text-gray-500'}`}
                    title={t.studio.piano}
                    >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </button>
                 </div>
               </div>

                {/* Visualizer for Active Chord */}
                {activeChordDisplay && (
                  <div className="mb-8 animate-fade-in bg-black/40 p-6 rounded-xl border border-purple-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                       <svg className="w-32 h-32 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                    <div className="flex justify-between items-end mb-4 relative z-10">
                       <div className="flex flex-col">
                         <span className="text-xs text-purple-400 uppercase tracking-widest mb-1">Active Chord</span>
                         <span className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{activeChordDisplay}</span>
                       </div>
                       <div className="text-right">
                         <button 
                           onClick={() => playChord(activeChordDisplay, instrument)}
                           className="text-xs text-white bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-full uppercase tracking-widest mb-1 shadow-neon flex items-center gap-1"
                         >
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           Play
                         </button>
                         <span className="text-xs text-gray-500 uppercase tracking-widest">{instrument} view</span>
                       </div>
                    </div>
                    <div className="relative z-10">
                       <ChordVisualizer chord={activeChordDisplay} instrument={instrument} />
                    </div>
                  </div>
                )}
               
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {analysis.chords.map((chord, idx) => {
                    const transposedChord = transposeChord(chord, transpose);
                    const isActive = selectedChordIndex === idx;
                    return (
                      <button 
                        key={idx} 
                        onClick={() => selectAndPlay(idx)}
                        className={`group relative aspect-square bg-black border rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 hover:-translate-y-1
                          ${isActive 
                            ? 'border-purple-500 bg-purple-900/10 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                            : 'border-gray-800 hover:border-purple-500 hover:bg-gray-900'}`
                        }
                      >
                        <span className={`text-xl md:text-2xl font-bold font-mono transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {transposedChord}
                        </span>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                           </svg>
                        </div>
                      </button>
                    );
                  })}
               </div>
               
               <div className="mt-8 p-4 bg-gray-900/50 rounded-lg text-sm text-gray-400 italic border-l-2 border-gray-700 flex gap-3 items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{analysis.notes}</p>
               </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Decoder;
