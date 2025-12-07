
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'Cb': 'B', 'Fb': 'E'
};

const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23,
  'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
};

// Interval definitions (semitones from root)
const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],         // Major
  'm': [0, 3, 7],        // Minor
  'min': [0, 3, 7],
  '-': [0, 3, 7],
  
  // 7ths
  '7': [0, 4, 7, 10],    // Dominant 7
  'm7': [0, 3, 7, 10],   // Minor 7
  'maj7': [0, 4, 7, 11], // Major 7
  'M7': [0, 4, 7, 11],
  'dim7': [0, 3, 6, 9],  // Diminished 7
  'm7b5': [0, 3, 6, 10], // Half-diminished

  // Suspended & Add
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '7sus4': [0, 5, 7, 10],
  'add9': [0, 4, 7, 14],
  'madd9': [0, 3, 7, 14],

  // Extended
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  '11': [0, 4, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  
  // Altered
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  '+': [0, 4, 8],
  '5': [0, 7], // Power chord
};

/**
 * Normalizes a note to its Sharp representation (e.g., Bb -> A#)
 */
export const normalizeNote = (note: string): string => {
  if (!note) return 'C';
  // Capitalize first letter
  let n = note.charAt(0).toUpperCase() + note.slice(1);
  return FLAT_TO_SHARP[n] || n;
};

/**
 * Parses a chord string into Root, Quality, and Bass (for slash chords like C/G)
 */
const parseChordParts = (chord: string) => {
  const parts = chord.split('/');
  let mainChord = parts[0];
  let bassNote = parts.length > 1 ? normalizeNote(parts[1]) : null;

  const rootMatch = mainChord.match(/^([A-G][#b]?)(.*)$/);
  
  if (!rootMatch) return { root: 'C', quality: '', bass: bassNote };

  const root = normalizeNote(rootMatch[1]);
  const quality = rootMatch[2];

  return { root, quality, bass: bassNote };
};

export const transposeChord = (chord: string, semiTones: number): string => {
  const { root, quality, bass } = parseChordParts(chord);

  const transposeNote = (note: string, steps: number): string => {
    const idx = NOTES.indexOf(note);
    if (idx === -1) return note;
    let newIdx = (idx + steps) % 12;
    if (newIdx < 0) newIdx += 12;
    return NOTES[newIdx];
  };

  const newRoot = transposeNote(root, semiTones);
  const newBass = bass ? `/${transposeNote(bass, semiTones)}` : '';

  return `${newRoot}${quality}${newBass}`;
};

export const getChordNotes = (chordName: string): string[] => {
  const { root, quality, bass } = parseChordParts(chordName);
  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) return [];

  let intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''];
  
  if (!CHORD_INTERVALS[quality]) {
     const knownQuality = Object.keys(CHORD_INTERVALS)
        .sort((a, b) => b.length - a.length)
        .find(q => quality.startsWith(q));
     if (knownQuality) {
        intervals = CHORD_INTERVALS[knownQuality];
     }
  }

  const notes = intervals.map(interval => NOTES[(rootIndex + interval) % 12]);

  if (bass) {
     if (!notes.includes(bass)) {
       notes.unshift(bass); 
     } else {
       const idx = notes.indexOf(bass);
       notes.splice(idx, 1);
       notes.unshift(bass);
     }
  }

  return notes;
};

// --- AUDIO SYNTHESIS ---

export const playChord = (chordName: string, instrument: 'guitar' | 'piano') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const { root, quality, bass } = parseChordParts(chordName);
  
  let intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''];
  
  if (!CHORD_INTERVALS[quality]) {
     const knownQuality = Object.keys(CHORD_INTERVALS)
        .sort((a, b) => b.length - a.length)
        .find(q => quality.startsWith(q));
     if (knownQuality) intervals = CHORD_INTERVALS[knownQuality];
  }

  const rootIndex = NOTES.indexOf(root);
  const strumDelay = instrument === 'guitar' ? 0.05 : 0.01; 

  const playNote = (noteName: string, octaveOffset: number, startTime: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    let freq = NOTE_FREQUENCIES[noteName];
    if (!freq) return;

    if (octaveOffset !== 0) {
        freq = freq * Math.pow(2, octaveOffset);
    }

    osc.frequency.value = freq;

    if (instrument === 'piano') {
      osc.type = 'triangle'; 
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 2.5);
    } else {
      osc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800; 
      filter.Q.value = 5;
      osc.connect(filter);
      filter.connect(gainNode);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 3.0);
    }

    if (instrument === 'piano') osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 3.5);
  };

  let currentTime = ctx.currentTime;

  if (bass) {
      playNote(bass, -1, currentTime);
      currentTime += strumDelay;
  } else {
      playNote(root, -1, currentTime);
      currentTime += strumDelay;
  }

  intervals.forEach((interval, i) => {
      if (interval === 0 && !bass) return; 

      const noteName = NOTES[(rootIndex + interval) % 12];
      let octave = 0;
      if (interval >= 12) octave = 1;
      
      playNote(noteName, octave, currentTime + (i * strumDelay));
  });
};

// --- VISUAL DATA HELPERS (CAGED SYSTEM) ---

const OPEN_CHORDS: Record<string, number[]> = {
  // Common Open Shapes (Standard Tuning E A D G B e)
  'C': [-1, 3, 2, 0, 1, 0],
  'C7': [-1, 3, 2, 3, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'D7': [-1, -1, 0, 2, 1, 2],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'E': [0, 2, 2, 1, 0, 0],
  'E7': [0, 2, 0, 1, 0, 0],
  'Em': [0, 2, 2, 0, 0, 0],
  'G': [3, 2, 0, 0, 0, 3],
  'G7': [3, 2, 0, 0, 0, 1],
  'A': [-1, 0, 2, 2, 2, 0],
  'A7': [-1, 0, 2, 0, 2, 0],
  'Am': [-1, 0, 2, 2, 1, 0],
  'F': [1, 3, 3, 2, 1, 1], // Open F usually bar 1
};

// E-Shape Base (Root on 6th String)
const E_SHAPES: Record<string, number[]> = {
  '': [0, 2, 2, 1, 0, 0],        // Major
  'm': [0, 2, 2, 0, 0, 0],       // Minor
  '7': [0, 2, 0, 1, 0, 0],       // 7
  'm7': [0, 2, 0, 0, 0, 0],      // m7
  'maj7': [0, 2, 1, 1, 0, 0],    // maj7
};

// A-Shape Base (Root on 5th String)
const A_SHAPES: Record<string, number[]> = {
  '': [-1, 0, 2, 2, 2, 0],       // Major
  'm': [-1, 0, 2, 2, 1, 0],      // Minor
  '7': [-1, 0, 2, 0, 2, 0],      // 7
  'm7': [-1, 0, 2, 0, 1, 0],     // m7
  'maj7': [-1, 0, 2, 1, 2, 0],   // maj7
};

export const getGuitarFretting = (chordName: string): number[] => {
  const { root, quality } = parseChordParts(chordName);
  const rootIndex = NOTES.indexOf(root);
  const exactKey = `${root}${quality}`;

  // 1. Check for specific Open Chords first
  if (OPEN_CHORDS[exactKey]) return OPEN_CHORDS[exactKey];

  // 2. CAGED Logic
  // We determine which shape is best based on position.
  // E is index 4. A is index 9.

  let offsetE = (rootIndex - 4 + 12) % 12; // Distance from Open E (0)
  let offsetA = (rootIndex - 9 + 12) % 12; // Distance from Open A (0)

  // Determine base shapes
  // Simplify quality for shape matching (e.g. C#madd9 -> uses m shape)
  let shapeKey = '';
  if (quality.startsWith('m') && !quality.startsWith('maj')) shapeKey = 'm';
  if (quality.includes('7')) {
      if (quality.startsWith('maj7')) shapeKey = 'maj7';
      else if (quality.startsWith('m7')) shapeKey = 'm7';
      else shapeKey = '7';
  }

  const eTemplate = E_SHAPES[shapeKey] || E_SHAPES[quality] || E_SHAPES[''];
  const aTemplate = A_SHAPES[shapeKey] || A_SHAPES[quality] || A_SHAPES[''];

  // Prefer lower frets usually, but avoid open string mess if it's not a standard open chord.
  // E Shape Barre starts at offsetE.
  // A Shape Barre starts at offsetA.
  
  // Example: C (Index 0).
  // Offset E: (0-4+12)%12 = 8 (8th fret E shape)
  // Offset A: (0-9+12)%12 = 3 (3rd fret A shape) -> Preferred usually for C Major Barre.
  
  // Example: F (Index 5).
  // Offset E: 1 (1st Fret) -> Preferred.
  // Offset A: 8 (8th Fret).

  // Preference Logic:
  let finalShape: number[] = [-1,-1,-1,-1,-1,-1];
  
  // Heuristic: Prefer position between fret 1 and 8 if possible.
  if (offsetE <= 0) offsetE += 12; // E on 12th if 0
  if (offsetA <= 0) offsetA += 12; // A on 12th if 0

  // Adjust for "Open" check. If offset is 0, we already checked OPEN_CHORDS.
  // So we are looking for Barres.
  
  // F (1st fret E shape) vs F (8th fret A shape) -> Prefer E shape (1 < 8)
  // C (8th fret E shape) vs C (3rd fret A shape) -> Prefer A shape (3 < 8)
  
  const useEShape = offsetE < offsetA;

  if (useEShape && eTemplate) {
      finalShape = eTemplate.map(f => f === -1 ? -1 : f + offsetE);
  } else if (aTemplate) {
      finalShape = aTemplate.map(f => f === -1 ? -1 : f + offsetA);
  }

  // Sanity check: If fret > 15, wrap down or choose alternative?
  // For this simple logic, we keep it. The visualizer handles up to 15. 
  // If it goes > 15, we might subtract 12 if shape permits, but shapes usually rely on strings.
  
  return finalShape;
};
