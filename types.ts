
export interface Composition {
  title: string;
  genre: string;
  key: string;
  tempo: string;
  lyrics: string;
  chords: string[];
}

export interface SongStructure {
  verseCount: number;
  linesPerVerse: number;
  linesPerChorus: number;
  linesPerPreChorus: number;
  linesPerOutro: number;
  includePreChorus: boolean;
  includeOutro: boolean;
}

export enum NavItem {
  STUDIO = 'studio',
  DECODER = 'decoder',
  LUTHIER = 'luthier',
  PROFILE = 'profile',
}

export interface TunerData {
  note: string;
  frequency: number;
  cents: number; // Deviation from perfect pitch
}

export interface AudioAnalysis {
  key: string;
  bpm: string;
  chords: string[];
  progression: string; // Roman numerals
  notes: string;
}

export type Language = 'es' | 'en' | 'fr';

export type Instrument = 'guitar' | 'piano';