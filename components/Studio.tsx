
import React, { useState, useRef } from 'react';
import { composeSong, refineLyrics, editSongWithVoice } from '../services/geminiService';
import { Composition, SongStructure, Instrument } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { playChord } from '../utils/musicUtils';
import ChordVisualizer from './ChordVisualizer';

const Studio: React.FC = () => {
  const { t, language } = useLanguage();
  
  // Mode: 'new' (Generate from scratch) or 'edit' (Co-Pilot)
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('');
  const [manualLyrics, setManualLyrics] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [song, setSong] = useState<Composition | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Voice Command State
  const [isRecordingCmd, setIsRecordingCmd] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // New States
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [activeChord, setActiveChord] = useState<string | null>(null);

  // Structure State
  const [structure, setStructure] = useState<SongStructure>({
    verseCount: 2,
    linesPerVerse: 4,
    linesPerChorus: 4,
    linesPerPreChorus: 2,
    linesPerOutro: 2,
    includePreChorus: false,
    includeOutro: true,
  });

  const handleCompose = async () => {
    if (!topic || !mood) return;
    
    setIsLoading(true);
    setSong(null);
    setActiveChord(null);
    
    const result = await composeSong(topic, mood, language, structure);
    setSong(result);
    if (result) setManualLyrics(result.lyrics);
    setIsLoading(false);
  };

  const handleAiAction = async (action: 'complete' | 'rhyme' | 'enhance') => {
    if (!manualLyrics) return;
    setIsLoading(true);
    const result = await refineLyrics(manualLyrics, action, language);
    if (result) {
      if (action === 'rhyme') {
        setManualLyrics(prev => prev + "\n\n--- AI SUGGESTIONS ---\n" + result);
      } else {
        setManualLyrics(result);
      }
    }
    setIsLoading(false);
  };

  const startVoiceCommand = async () => {
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Process Voice Command
        if (song) {
            setIsLoading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                 const base64String = (reader.result as string).split(',')[1];
                 const updatedSong = await editSongWithVoice(song, base64String, 'audio/webm');
                 if (updatedSong) {
                     setSong(updatedSong);
                     setManualLyrics(updatedSong.lyrics);
                 }
                 setIsLoading(false);
            };
            reader.readAsDataURL(audioBlob);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingCmd(true);
    } catch (err) {
      console.error("Mic error", err);
    }
  };

  const stopVoiceCommand = () => {
    if (mediaRecorderRef.current && isRecordingCmd) {
      mediaRecorderRef.current.stop();
      setIsRecordingCmd(false);
    }
  };

  const updateStructure = (key: keyof SongStructure, value: any) => {
    setStructure(prev => ({ ...prev, [key]: value }));
  };

  const playAndShowChord = (chord: string) => {
    setActiveChord(chord);
    playChord(chord, instrument);
  };

  // Helper to render lyrics with styled section headers
  const renderStyledLyrics = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Check for section headers like (Verse 1), [Chorus], etc.
      const isHeader = line.match(/^(\(|\[).+(\)|\])$/);
      if (isHeader) {
        return <div key={i} className="text-sonura-cyan font-bold uppercase tracking-widest mt-6 mb-2 text-sm">{line}</div>;
      }
      return <div key={i} className="min-h-[1.5em]">{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 md:pb-0 scroll-smooth">
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
              SONURA <span className="text-sonura-cyan">{t.studio.title}</span>
            </h1>
            <p className="text-sonura-muted text-lg">{t.studio.subtitle}</p>
          </div>
          
          {/* Mode Switcher */}
          <div className="mt-4 md:mt-0 flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            <button 
              onClick={() => setMode('new')}
              className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-all ${mode === 'new' ? 'bg-sonura-cyan text-black' : 'text-gray-500 hover:text-white'}`}
            >
              {t.studio.modeNew}
            </button>
             <button 
              onClick={() => setMode('edit')}
              className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-all ${mode === 'edit' ? 'bg-sonura-cyan text-black' : 'text-gray-500 hover:text-white'}`}
            >
              {t.studio.modeEdit}
            </button>
          </div>
        </header>

        {/* Controls Container */}
        <div className="mb-12 bg-sonura-surface/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm shadow-2xl">
          
          {mode === 'new' ? (
            <>
              {/* NEW SONG MODE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="group">
                  <label className="block text-xs font-bold text-sonura-cyan uppercase tracking-widest mb-2">{t.studio.topicLabel}</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t.studio.topicPlaceholder}
                    className="w-full bg-sonura-surface border border-gray-800 rounded-lg p-4 text-white focus:outline-none focus:border-sonura-cyan focus:shadow-neon transition-all"
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-sonura-cyan uppercase tracking-widest mb-2">{t.studio.moodLabel}</label>
                  <input 
                    type="text" 
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder={t.studio.moodPlaceholder}
                    className="w-full bg-sonura-surface border border-gray-800 rounded-lg p-4 text-white focus:outline-none focus:border-sonura-cyan focus:shadow-neon transition-all"
                  />
                </div>
              </div>

              {/* Structure Toggles */}
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-xs font-bold text-gray-500 hover:text-sonura-cyan uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {t.studio.structureTitle}
                </button>
              </div>

              {/* Collapsible Settings Panel */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showSettings ? 'max-h-[800px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                <div className="bg-black/20 rounded-lg p-6 border border-gray-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {/* Basic Counts */}
                  <div className="space-y-6 border-r border-gray-800 pr-0 md:pr-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-400 font-bold uppercase">{t.studio.verseCount}</label>
                        <span className="text-sonura-cyan font-mono">{structure.verseCount}</span>
                      </div>
                      <input 
                        type="range" min="1" max="9" step="1"
                        value={structure.verseCount} 
                        onChange={(e) => updateStructure('verseCount', parseInt(e.target.value))} 
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sonura-cyan"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-400 font-bold uppercase">{t.studio.linesPerVerse}</label>
                        <span className="text-sonura-cyan font-mono">{structure.linesPerVerse}</span>
                      </div>
                      <input 
                        type="range" min="2" max="12" step="1"
                        value={structure.linesPerVerse} 
                        onChange={(e) => updateStructure('linesPerVerse', parseInt(e.target.value))} 
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sonura-cyan"
                      />
                    </div>
                  </div>
                   <div className="space-y-6">
                     <div className="bg-gray-900/50 p-4 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer group mb-4">
                            <input type="checkbox" className="accent-sonura-cyan w-5 h-5 bg-gray-800" checked={structure.includePreChorus} onChange={(e) => updateStructure('includePreChorus', e.target.checked)} />
                            <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{t.studio.includePreChorus}</span>
                        </label>
                     </div>
                     <div className="bg-gray-900/50 p-4 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer group mb-4">
                            <input type="checkbox" className="accent-sonura-cyan w-5 h-5 bg-gray-800" checked={structure.includeOutro} onChange={(e) => updateStructure('includeOutro', e.target.checked)} />
                            <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{t.studio.includeOutro}</span>
                        </label>
                     </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompose}
                disabled={isLoading || !topic || !mood}
                className={`w-full h-[58px] rounded-lg font-black text-xl tracking-widest transition-all duration-300 transform
                  ${isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-sonura-cyan text-sonura-bg hover:bg-white hover:scale-[1.01] shadow-neon'}`}
              >
                {isLoading ? t.studio.processing : t.studio.composeBtn}
              </button>
            </>
          ) : (
            <>
              {/* EDIT / CO-PILOT MODE */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-sonura-cyan uppercase tracking-widest mb-2">{t.studio.inputLyricsLabel}</label>
                <textarea 
                  value={manualLyrics}
                  onChange={(e) => setManualLyrics(e.target.value)}
                  placeholder={t.studio.inputLyricsPlaceholder}
                  className="w-full h-64 bg-sonura-surface border border-gray-800 rounded-lg p-4 text-white focus:outline-none focus:border-sonura-cyan focus:shadow-neon transition-all font-mono leading-relaxed"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button onClick={() => handleAiAction('complete')} disabled={isLoading || !manualLyrics} className="py-3 bg-purple-600/20 border border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-50">{t.studio.btnComplete}</button>
                 <button onClick={() => handleAiAction('rhyme')} disabled={isLoading || !manualLyrics} className="py-3 bg-blue-600/20 border border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-50">{t.studio.btnRhymes}</button>
                 <button onClick={() => handleAiAction('enhance')} disabled={isLoading || !manualLyrics} className="py-3 bg-sonura-cyan/20 border border-sonura-cyan text-sonura-cyan hover:bg-sonura-cyan hover:text-black rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-50">{t.studio.btnEnhance}</button>
              </div>
            </>
          )}

        </div>

        {/* Loading Overlay for Voice Command */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-sonura-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sonura-cyan font-bold tracking-widest animate-pulse">GEMINI THINKING...</p>
            </div>
          </div>
        )}

        {/* Generated Results (Song Card) - Only show if in 'new' mode and song exists */}
        {mode === 'new' && song && (
          <div className="animate-fade-in-up space-y-8">
            <div className="bg-sonura-surface border-l-4 border-sonura-cyan p-6 rounded-r-xl shadow-lg flex flex-wrap gap-8 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{song.title}</h2>
                <span className="text-sonura-cyan text-sm font-semibold tracking-wider uppercase">{song.genre}</span>
              </div>
              
              {/* Voice Command Bar */}
              <div className="flex-grow flex items-center justify-center">
                 <button
                   onMouseDown={startVoiceCommand}
                   onMouseUp={stopVoiceCommand}
                   onTouchStart={startVoiceCommand}
                   onTouchEnd={stopVoiceCommand}
                   className={`relative px-6 py-3 rounded-full font-bold uppercase tracking-widest transition-all duration-200 border
                     ${isRecordingCmd ? 'bg-red-600 text-white border-red-500 scale-110 shadow-[0_0_20px_red]' : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-white'}`}
                 >
                   {isRecordingCmd ? 'Listening...' : 'Hold to Edit'}
                   <span className="absolute -top-2 -right-2 bg-sonura-cyan text-black text-[10px] px-2 rounded-full">AI</span>
                 </button>
              </div>

              <div className="flex gap-8 text-center">
                 <div>
                    <span className="block text-xs text-gray-500 uppercase">{t.studio.key}</span>
                    <span className="text-xl font-mono text-white">{song.key}</span>
                 </div>
                 <div>
                    <span className="block text-xs text-gray-500 uppercase">{t.studio.tempo}</span>
                    <span className="text-xl font-mono text-white">{song.tempo}</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-sonura-surface border border-gray-800 rounded-xl p-8 relative overflow-hidden group">
                <h3 className="text-sonura-cyan font-bold uppercase tracking-widest mb-6 border-b border-gray-800 pb-2 inline-block">{t.studio.lyricsHeader}</h3>
                
                {/* Custom Renderer for Lyrics Structure */}
                <div className="font-sans text-lg leading-relaxed text-gray-300">
                  {renderStyledLyrics(song.lyrics)}
                </div>
                
                 <button onClick={() => { setManualLyrics(song.lyrics); setMode('edit'); }} className="absolute top-4 right-4 text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-sonura-cyan hover:text-black">
                    Edit in Co-Pilot
                 </button>
              </div>

              {/* Chords Column */}
              <div className="bg-sonura-surface border border-gray-800 rounded-xl p-8 h-fit">
                <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
                  <h3 className="text-sonura-cyan font-bold uppercase tracking-widest">{t.studio.chordsHeader}</h3>
                  <div className="flex bg-black rounded p-1">
                    <button onClick={() => setInstrument('guitar')} className={`p-1 rounded ${instrument === 'guitar' ? 'bg-gray-700 text-sonura-cyan' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg></button>
                    <button onClick={() => setInstrument('piano')} className={`p-1 rounded ${instrument === 'piano' ? 'bg-gray-700 text-sonura-cyan' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
                  </div>
                </div>

                {/* Visualizer for Active Chord */}
                {activeChord && (
                  <div className="mb-6 animate-fade-in">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-4xl font-black text-white">{activeChord}</span>
                       <span className="text-xs text-gray-400 uppercase tracking-widest">{instrument}</span>
                    </div>
                    <ChordVisualizer chord={activeChord} instrument={instrument} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {song.chords.map((chord, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => playAndShowChord(chord)}
                      className={`p-4 rounded text-center border transition-all duration-200 
                        ${activeChord === chord 
                          ? 'bg-sonura-cyan text-black border-sonura-cyan shadow-neon font-black' 
                          : 'bg-gray-900/50 text-white border-gray-700 hover:border-sonura-cyan hover:bg-gray-800'}`}
                    >
                      <span className="text-lg font-mono">{chord}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Studio;
