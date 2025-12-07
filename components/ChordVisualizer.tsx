
import React, { useRef, useEffect } from 'react';
import { Instrument } from '../types';
import { getChordNotes, getGuitarFretting } from '../utils/musicUtils';

interface Props {
  chord: string;
  instrument: Instrument;
}

const ChordVisualizer: React.FC<Props> = ({ chord, instrument }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to position 0 on new chord
  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollLeft = 0;
    }
  }, [chord]);

  if (instrument === 'piano') {
    const notes = getChordNotes(chord);
    const activeNotes = notes.map(n => n.replace(/[0-9]/g, ''));
    const allKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return (
      <div className="w-full h-40 flex items-center justify-center bg-black/40 rounded-lg p-4 overflow-hidden">
        <div className="relative flex h-32 scale-90 md:scale-100 origin-center">
          {allKeys.map((keyNote, i) => {
            const isBlack = keyNote.includes('#');
            const isActive = activeNotes.includes(keyNote);
            if (isBlack) return null;
            return (
              <div key={keyNote} className={`relative w-10 h-full border border-gray-400 rounded-b-md mx-[1px] flex items-end justify-center pb-4 transition-colors duration-200 
                  ${isActive ? 'bg-gray-200' : 'bg-white'}`}>
                 {isActive && <div className="w-4 h-4 rounded-full bg-sonura-cyan shadow-[0_0_10px_#00E5FF]" />}
              </div>
            );
          })}
          {allKeys.map((keyNote, i) => {
             if (!keyNote.includes('#')) return null;
             const isActive = activeNotes.includes(keyNote);
             let leftOffset = 0;
             if (keyNote === 'C#') leftOffset = 28;
             if (keyNote === 'D#') leftOffset = 70;
             if (keyNote === 'F#') leftOffset = 152;
             if (keyNote === 'G#') leftOffset = 194;
             if (keyNote === 'A#') leftOffset = 236;

             return (
               <div key={keyNote} className={`absolute w-7 h-20 z-10 border border-gray-700 rounded-b-md flex items-end justify-center pb-3 transition-colors duration-200 
                  ${isActive ? 'bg-gray-800' : 'bg-black'}`} style={{ left: `${leftOffset}px` }}>
                 {isActive && <div className="w-3 h-3 rounded-full bg-sonura-cyan shadow-[0_0_10px_#00E5FF]" />}
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  // GUITAR VISUALIZER (SVG 15-FRET SCROLLABLE)
  const fretting = getGuitarFretting(chord);
  
  // Settings
  const NUM_FRETS = 15;
  const START_FRET = 0; // Could be dynamic if we wanted to show only high frets, but scrolling is better
  
  // SVG Dimensions
  const paddingX = 40;
  const paddingY = 30;
  const fretWidth = 60; // Wider frets
  const width = paddingX * 2 + (NUM_FRETS * fretWidth);
  const height = 180;
  const stringSpacing = 24;

  // Calculate Barre lines
  // If multiple strings are pressed on the same fret by the index finger (usually lowest fret in shape)
  // We can visualize a bar.
  // Logic: Find min fret > 0. Check how many strings have this fret. If >= 2 strings, it might be a barre.
  const fretsPressed = fretting.filter(f => f > 0);
  const minFret = fretsPressed.length > 0 ? Math.min(...fretsPressed) : 0;
  
  let barreStartString = -1;
  let barreEndString = -1;

  if (minFret > 0) {
      // Find strings with this minFret
      const stringsWithMinFret = fretting.map((f, i) => f === minFret ? i : -1).filter(i => i !== -1);
      if (stringsWithMinFret.length >= 2) {
          barreStartString = Math.min(...stringsWithMinFret);
          barreEndString = Math.max(...stringsWithMinFret);
      }
  }

  return (
    <div className="w-full relative group">
        {/* Scroll Hint */}
        <div className="absolute right-2 top-2 z-10 bg-black/50 px-2 py-1 rounded text-[10px] text-gray-400 pointer-events-none md:hidden">
            Scroll →
        </div>

        <div 
            ref={containerRef}
            className="w-full overflow-x-auto bg-black/40 rounded-lg pb-2 scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
        >
        <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="min-w-full"
        >
            {/* Background Neck */}
            <rect x={paddingX} y={paddingY} width={width - paddingX * 2} height={stringSpacing * 5} fill="#1a1a1a" />

            {/* Nut (Only if starting at 0) */}
            {START_FRET === 0 && (
                <rect x={paddingX - 6} y={paddingY} width={6} height={stringSpacing * 5} fill="#444" />
            )}
            
            {/* Frets */}
            {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => {
                const x = paddingX + i * fretWidth;
                return (
                <g key={i}>
                    <line 
                    x1={x} y1={paddingY} 
                    x2={x} y2={paddingY + stringSpacing * 5} 
                    stroke="#555" 
                    strokeWidth={2} 
                    />
                    {/* Fret Numbers */}
                    <text 
                        x={x - (fretWidth / 2)} 
                        y={height - 10} 
                        fill="#666" 
                        fontSize="12" 
                        textAnchor="middle" 
                        fontFamily="monospace"
                        fontWeight="bold"
                    >
                        {i + START_FRET}
                    </text>
                    
                    {/* Single Inlays */}
                    {[3, 5, 7, 9, 15].includes(i + START_FRET) && (
                        <circle cx={x - (fretWidth / 2)} cy={paddingY + stringSpacing * 2.5} r={5} fill="#333" />
                    )}
                    {/* Double Inlay 12 */}
                    {(i + START_FRET) === 12 && (
                        <>
                            <circle cx={x - (fretWidth / 2)} cy={paddingY + stringSpacing} r={5} fill="#333" />
                            <circle cx={x - (fretWidth / 2)} cy={paddingY + stringSpacing * 4} r={5} fill="#333" />
                        </>
                    )}
                </g>
                );
            })}

            {/* Strings */}
            {[0, 1, 2, 3, 4, 5].map(i => (
                <line 
                    key={i} 
                    x1={paddingX} 
                    y1={paddingY + i * stringSpacing} 
                    x2={width - paddingX} 
                    y2={paddingY + i * stringSpacing} 
                    stroke="#888" 
                    strokeWidth={1 + (i * 0.3)} 
                />
            ))}

            {/* Barre Chord Line */}
            {barreStartString !== -1 && (
                 <rect 
                    x={paddingX + (minFret * fretWidth) - (fretWidth / 2) - 8} 
                    y={paddingY + barreStartString * stringSpacing}
                    width={16}
                    height={(barreEndString - barreStartString) * stringSpacing}
                    rx={8}
                    fill="#00E5FF"
                    opacity={0.3}
                 />
            )}

            {/* Fingers / Dots */}
            {fretting.map((fret, stringIdx) => {
                // Determine visual Y position
                // stringIdx 0 = Low E (Bottom string visually usually in diagrams, Top in Tab? Standard diagrams put Low E at bottom)
                // Let's standardise: Top Line = High e (Array index 5). Bottom Line = Low E (Array index 0).
                const visualLineIndex = 5 - stringIdx; 
                const yPos = paddingY + visualLineIndex * stringSpacing;
                
                if (fret === -1) {
                    // Mute (X)
                    return (
                        <text key={stringIdx} x={paddingX - 15} y={yPos + 5} fill="#EF4444" fontSize="16" fontWeight="bold" textAnchor="middle">X</text>
                    );
                }
                if (fret === 0) {
                    // Open (O)
                    return (
                        <circle key={stringIdx} cx={paddingX - 15} cy={yPos} r={6} stroke="#00E5FF" strokeWidth={2} fill="transparent" />
                    );
                }
                
                // Fretted Note
                // Position in center of fret
                const xPos = paddingX + (fret * fretWidth) - (fretWidth / 2);
                return (
                    <g key={stringIdx}>
                        {/* Glow */}
                        <circle cx={xPos} cy={yPos} r={10} fill="#00E5FF" opacity={0.4} filter="blur(2px)" />
                        <circle cx={xPos} cy={yPos} r={8} fill="#00E5FF" stroke="#fff" strokeWidth={1} />
                        <text x={xPos} y={yPos + 4} fontSize="10" fill="#000" textAnchor="middle" fontWeight="bold">{fret}</text>
                    </g>
                );
            })}
        </svg>
      </div>
    </div>
  );
};

export default ChordVisualizer;
