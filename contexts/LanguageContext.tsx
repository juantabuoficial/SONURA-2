
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language } from '../types';

interface Translations {
  nav: {
    studio: string;
    decoder: string;
    luthier: string;
    profile: string;
  };
  studio: {
    title: string;
    subtitle: string;
    modeNew: string;
    modeEdit: string;
    topicLabel: string;
    topicPlaceholder: string;
    moodLabel: string;
    moodPlaceholder: string;
    inputLyricsLabel: string;
    inputLyricsPlaceholder: string;
    aiActionsLabel: string;
    btnComplete: string;
    btnRhymes: string;
    btnEnhance: string;
    composeBtn: string;
    processing: string;
    lyricsHeader: string;
    chordsHeader: string;
    key: string;
    tempo: string;
    structureTitle: string;
    verseCount: string;
    linesPerVerse: string;
    linesPerChorus: string;
    linesPerPreChorus: string;
    linesPerOutro: string;
    includePreChorus: string;
    includeOutro: string;
    instrument: string;
    guitar: string;
    piano: string;
  };
  decoder: {
    title: string;
    subtitle: string;
    optionUpload: string;
    optionMic: string;
    optionYoutube: string;
    uploadLabel: string;
    recording: string;
    startRecord: string;
    stopRecord: string;
    youtubePlaceholder: string;
    analyzeBtn: string;
    analyzing: string;
    detectedKey: string;
    transposeLabel: string;
    original: string;
    chordsFound: string;
    instrument: string;
    instrumentView: string;
  };
  luthier: {
    startBtn: string;
    stopBtn: string;
    statusListening: string;
    statusStandby: string;
    calibration: string;
    transposition: string;
    semitones: string;
  };
  profile: {
    title: string;
    role: string;
    subscriptionLabel: string;
    compositionsLabel: string;
    serverStatusLabel: string;
    online: string;
    settingsHeader: string;
    languageLabel: string;
  };
}

const translations: Record<Language, Translations> = {
  es: {
    nav: {
      studio: 'Estudio',
      decoder: 'Decoder',
      luthier: 'Luthier',
      profile: 'Perfil',
    },
    studio: {
      title: 'STUDIO',
      subtitle: 'Genera letras o perfecciona tus creaciones.',
      modeNew: 'NUEVA CANCIÓN',
      modeEdit: 'CO-PILOTO IA',
      topicLabel: 'TEMA / CONCEPTO',
      topicPlaceholder: 'Ej. Lluvia de Neón, Amor Perdido',
      moodLabel: 'ESTILO / VIBRA',
      moodPlaceholder: 'Ej. Melancólico, Energético',
      inputLyricsLabel: 'TUS LETRAS (Pegar aquí)',
      inputLyricsPlaceholder: 'Escribe o pega tus versos incompletos aquí...',
      aiActionsLabel: 'HERRAMIENTAS IA',
      btnComplete: 'Completar',
      btnRhymes: 'Rimas',
      btnEnhance: 'Mejorar',
      composeBtn: 'COMPONER',
      processing: 'PROCESANDO',
      lyricsHeader: 'LETRAS',
      chordsHeader: 'ACORDES',
      key: 'TONO',
      tempo: 'BPM',
      structureTitle: 'ESTRUCTURA DE LA CANCIÓN',
      verseCount: 'Cantidad de Estrofas',
      linesPerVerse: 'Versos por Estrofa',
      linesPerChorus: 'Versos en Estribillo',
      linesPerPreChorus: 'Versos en Pre-Estribillo',
      linesPerOutro: 'Versos en Final',
      includePreChorus: 'Incluir Pre-Estribillo',
      includeOutro: 'Incluir Final',
      instrument: 'INSTRUMENTO',
      guitar: 'GUITARRA',
      piano: 'PIANO',
    },
    decoder: {
      title: 'DECODER',
      subtitle: 'Decodifica la armonía de cualquier fuente.',
      optionUpload: 'SUBIR ARCHIVO',
      optionMic: 'MICROFONO',
      optionYoutube: 'YOUTUBE',
      uploadLabel: 'ARRASTRA O CLIC',
      recording: 'GRABANDO...',
      startRecord: 'GRABAR',
      stopRecord: 'DETENER Y ANALIZAR',
      youtubePlaceholder: 'Enlace de YouTube...',
      analyzeBtn: 'ANALIZAR',
      analyzing: 'ESCUCHANDO Y DECODIFICANDO...',
      detectedKey: 'TONO DETECTADO',
      transposeLabel: 'TRANSPONER',
      original: 'ORIGINAL',
      chordsFound: 'ACORDES DETECTADOS',
      instrument: 'INSTRUMENTO',
      instrumentView: 'VISTA',
    },
    luthier: {
      startBtn: 'ACTIVAR LUTHIER',
      stopBtn: 'DETENER',
      statusListening: 'ESCUCHANDO...',
      statusStandby: 'EN ESPERA',
      calibration: 'CALIBRACIÓN A4',
      transposition: 'TRANSPOSICIÓN',
      semitones: 'Semitonos',
    },
    profile: {
      title: 'Músico Cyber',
      role: '@neo_virtuoso',
      subscriptionLabel: 'Suscripción',
      compositionsLabel: 'Composiciones',
      serverStatusLabel: 'Estado Servidor',
      online: 'En Línea',
      settingsHeader: 'CONFIGURACIÓN',
      languageLabel: 'IDIOMA',
    },
  },
  en: {
    nav: {
      studio: 'Studio',
      decoder: 'Decoder',
      luthier: 'Luthier',
      profile: 'Profile',
    },
    studio: {
      title: 'STUDIO',
      subtitle: 'Generate lyrics or refine your creations.',
      modeNew: 'NEW SONG',
      modeEdit: 'AI CO-PILOT',
      topicLabel: 'TOPIC / THEME',
      topicPlaceholder: 'e.g., Neon Rain, Lost Love',
      moodLabel: 'MOOD / VIBE',
      moodPlaceholder: 'e.g., Melancholic, Energetic',
      inputLyricsLabel: 'YOUR LYRICS (Paste here)',
      inputLyricsPlaceholder: 'Write or paste your incomplete verses here...',
      aiActionsLabel: 'AI TOOLS',
      btnComplete: 'Complete',
      btnRhymes: 'Rhymes',
      btnEnhance: 'Enhance',
      composeBtn: 'COMPOSE',
      processing: 'PROCESSING',
      lyricsHeader: 'LYRICS',
      chordsHeader: 'CHORDS',
      key: 'KEY',
      tempo: 'TEMPO',
      structureTitle: 'SONG STRUCTURE',
      verseCount: 'Verse Count',
      linesPerVerse: 'Lines per Verse',
      linesPerChorus: 'Lines per Chorus',
      linesPerPreChorus: 'Lines per Pre-Chorus',
      linesPerOutro: 'Lines per Outro',
      includePreChorus: 'Include Pre-Chorus',
      includeOutro: 'Include Outro',
      instrument: 'INSTRUMENT',
      guitar: 'GUITAR',
      piano: 'PIANO',
    },
    decoder: {
      title: 'DECODER',
      subtitle: 'Decode harmony from any source.',
      optionUpload: 'UPLOAD FILE',
      optionMic: 'MICROPHONE',
      optionYoutube: 'YOUTUBE',
      uploadLabel: 'DRAG OR CLICK',
      recording: 'RECORDING...',
      startRecord: 'RECORD',
      stopRecord: 'STOP & ANALYZE',
      youtubePlaceholder: 'YouTube Link...',
      analyzeBtn: 'ANALYZE',
      analyzing: 'LISTENING & DECODING...',
      detectedKey: 'DETECTED KEY',
      transposeLabel: 'TRANSPOSE',
      original: 'ORIGINAL',
      chordsFound: 'CHORDS FOUND',
      instrument: 'INSTRUMENT',
      instrumentView: 'VIEW',
    },
    luthier: {
      startBtn: 'ACTIVATE LUTHIER',
      stopBtn: 'STOP TUNER',
      statusListening: 'LISTENING...',
      statusStandby: 'STANDBY',
      calibration: 'A4 CALIBRATION',
      transposition: 'TRANSPOSITION',
      semitones: 'Semitones',
    },
    profile: {
      title: 'Cyber Musician',
      role: '@neo_virtuoso',
      subscriptionLabel: 'Subscription',
      compositionsLabel: 'Compositions',
      serverStatusLabel: 'Server Status',
      online: 'Online',
      settingsHeader: 'SETTINGS',
      languageLabel: 'LANGUAGE',
    },
  },
  fr: {
    nav: {
      studio: 'Studio',
      decoder: 'Décodeur',
      luthier: 'Luthier',
      profile: 'Profil',
    },
    studio: {
      title: 'STUDIO',
      subtitle: 'Générez des paroles ou affinez vos créations.',
      modeNew: 'NOUVELLE',
      modeEdit: 'CO-PILOTE IA',
      topicLabel: 'SUJET / THÈME',
      topicPlaceholder: 'ex. Pluie de Néon',
      moodLabel: 'AMBIANCE',
      moodPlaceholder: 'ex. Mélancolique, Énergique',
      inputLyricsLabel: 'VOS PAROLES',
      inputLyricsPlaceholder: 'Écrivez ou collez vos vers incomplets...',
      aiActionsLabel: 'OUTILS IA',
      btnComplete: 'Compléter',
      btnRhymes: 'Rimes',
      btnEnhance: 'Améliorer',
      composeBtn: 'COMPOSER',
      processing: 'TRAITEMENT',
      lyricsHeader: 'PAROLES',
      chordsHeader: 'ACCORDS',
      key: 'TONALITÉ',
      tempo: 'BPM',
      structureTitle: 'STRUCTURE DE LA CHANSON',
      verseCount: 'Nombre de Couplets',
      linesPerVerse: 'Lignes par Couplet',
      linesPerChorus: 'Lignes par Refrain',
      linesPerPreChorus: 'Lignes par Pré-Refrain',
      linesPerOutro: 'Lignes par Outro',
      includePreChorus: 'Inclure Pré-Refrain',
      includeOutro: 'Inclure Outro',
      instrument: 'INSTRUMENT',
      guitar: 'GUITARE',
      piano: 'PIANO',
    },
    decoder: {
      title: 'DÉCODEUR',
      subtitle: 'Analysez audio ou vidéo pour les accords.',
      optionUpload: 'FICHIER',
      optionMic: 'MICRO',
      optionYoutube: 'YOUTUBE',
      uploadLabel: 'GLISSER / CLIQUER',
      recording: 'ENREGISTREMENT...',
      startRecord: 'ENREGISTRER',
      stopRecord: 'STOP & ANALYSER',
      youtubePlaceholder: 'Lien YouTube...',
      analyzeBtn: 'ANALYSER',
      analyzing: 'DÉCODAGE...',
      detectedKey: 'TONALITÉ',
      transposeLabel: 'TRANSPOSER',
      original: 'ORIGINAL',
      chordsFound: 'ACCORDS DÉTECTÉS',
      instrument: 'INSTRUMENT',
      instrumentView: 'VUE',
    },
    luthier: {
      startBtn: 'ACTIVER LUTHIER',
      stopBtn: 'ARRÊTER',
      statusListening: 'ÉCOUTE...',
      statusStandby: 'EN ATTENTE',
      calibration: 'CALIBRAGE A4',
      transposition: 'TRANSPOSITION',
      semitones: 'Demi-tons',
    },
    profile: {
      title: 'Musicien Cyber',
      role: '@neo_virtuoso',
      subscriptionLabel: 'Abonnement',
      compositionsLabel: 'Compositions',
      serverStatusLabel: 'État du Serveur',
      online: 'En Ligne',
      settingsHeader: 'PARAMÈTRES',
      languageLabel: 'LANGUE',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es'); 

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
