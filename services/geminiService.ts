
import { GoogleGenAI, Type } from "@google/genai";
import { Composition, Language, SongStructure, AudioAnalysis } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLangName = (lang: Language) => {
  const langMap: Record<Language, string> = {
    es: "Spanish (Español)",
    en: "English",
    fr: "French"
  };
  return langMap[lang];
};

export const composeSong = async (
  topic: string, 
  mood: string, 
  language: Language,
  structure: SongStructure
): Promise<Composition | null> => {
  try {
    const targetLang = getLangName(language);

    const structureDetails = `
    Strictly follow this structure configuration:
    - Number of verses: ${structure.verseCount}
    - Lines per verse: Approx ${structure.linesPerVerse}
    - Lines per chorus: Approx ${structure.linesPerChorus}
    ${structure.includePreChorus ? `- Include Pre-Chorus: Yes (Approx ${structure.linesPerPreChorus} lines)` : "- Include Pre-Chorus: No"}
    ${structure.includeOutro ? `- Include Outro: Yes (Approx ${structure.linesPerOutro} lines)` : "- Include Outro: No"}
    
    CRITICAL FORMATTING INSTRUCTION:
    You MUST label every section clearly with parentheses, e.g., (Estrofa 1), (Coro), (Puente).
    Separate EACH section with a DOUBLE LINE BREAK (\n\n). 
    `;

    const prompt = `Act as a professional songwriter and composer.
    Create a song concept about: "${topic}" with a "${mood}" mood.
    
    IMPORTANT: The song lyrics and title must be written in ${targetLang}.
    
    ${structureDetails}
    
    Return a structured JSON object containing the title, estimated key, tempo (BPM), a verse-chorus structure of lyrics, and a progression of chords used.
    Keep the lyrics creative and poetic.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre: { type: Type.STRING },
            key: { type: Type.STRING },
            tempo: { type: Type.STRING },
            lyrics: { type: Type.STRING, description: "The full lyrics with section headers like (Chorus), (Verse 1)." },
            chords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of main chords used in the song"
            }
          },
          required: ["title", "genre", "key", "tempo", "lyrics", "chords"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Composition;
    }
    return null;

  } catch (error) {
    console.error("Error composing song:", error);
    return null;
  }
};

/**
 * Uses Gemini 2.5 Flash Native Audio to listen to a user's voice command
 * and apply it to the existing song structure.
 */
export const editSongWithVoice = async (
  currentSong: Composition,
  voiceCommandBase64: string,
  mimeType: string
): Promise<Composition | null> => {
  try {
    const prompt = `
    You are an expert Music Producer AI.
    
    CONTEXT:
    The user has a song titled "${currentSong.title}".
    Current Lyrics:
    """
    ${currentSong.lyrics}
    """
    
    TASK:
    Listen to the user's voice command. They might ask to:
    - Rewrite a specific section (e.g., "Change verse 2 to be about rain").
    - Change the mood.
    - Change specific words.
    
    ACTION:
    Apply the changes to the lyrics while keeping the rest of the song intact unless asked otherwise.
    Maintain the section headers like (Verse 1), (Chorus).
    
    Return the fully updated JSON object (Title, Lyrics, etc).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: mimeType, data: voiceCommandBase64 } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre: { type: Type.STRING },
            key: { type: Type.STRING },
            tempo: { type: Type.STRING },
            lyrics: { type: Type.STRING },
            chords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "genre", "key", "tempo", "lyrics", "chords"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Composition;
    }
    return null;

  } catch (error) {
    console.error("Error editing song with voice:", error);
    return null;
  }
};

export const refineLyrics = async (
  currentLyrics: string,
  action: 'complete' | 'rhyme' | 'enhance',
  language: Language
): Promise<string | null> => {
  try {
    const targetLang = getLangName(language);
    
    let instruction = "";
    if (action === 'complete') {
      instruction = "Complete the song. Add the missing verses or parts (like a bridge or a second verse) based on the context of the existing lyrics.";
    } else if (action === 'rhyme') {
      instruction = "Provide a list of good rhyming words and synonyms for the last words of the lines.";
    } else if (action === 'enhance') {
      instruction = "Rewrite the lyrics to be more poetic, rhythmic, and impactful. Fix any flow issues.";
    }

    const prompt = `Act as an expert lyricist in ${targetLang}.
    
    Here are the current lyrics:
    "${currentLyrics}"
    
    Instruction: ${instruction}
    
    Return ONLY the result. Ensure section headers like (Verse), (Chorus) are present.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || null;
  } catch (error) {
    console.error("Error refining lyrics:", error);
    return null;
  }
};

export const analyzeAudioForChords = async (
  input: { type: 'audio', data: string, mimeType: string } | { type: 'url', url: string }
): Promise<AudioAnalysis | null> => {
  try {
    let contents = [];
    const schema = {
      type: Type.OBJECT,
      properties: {
        key: { type: Type.STRING, description: "The musical key (e.g. Cm, F# Major)" },
        bpm: { type: Type.STRING },
        chords: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "An accurate list of ALL chords heard in the progression, in order." 
        },
        progression: { type: Type.STRING, description: "Roman numeral analysis" },
        notes: { type: Type.STRING, description: "Brief stylistic analysis" }
      },
      required: ["key", "bpm", "chords", "progression", "notes"]
    };

    if (input.type === 'audio') {
      // Multimodal Analysis
      const prompt = `Analyze this audio file musically with EXTREME PRECISION.
      
      OBJECTIVE: Identify the exact chords being played.
      1. Listen for the harmonic progression.
      2. Identify the specific chord quality (Major, Minor, 7th, maj7, dim).
      3. Return the main loop of chords found.
      4. Detect the Key and BPM accurately.
      
      Return JSON.`;
      
      contents = [
        { inlineData: { mimeType: input.mimeType, data: input.data } },
        { text: prompt }
      ];
    } else {
      // Text/Reasoning Analysis for YouTube
      const prompt = `I am providing a YouTube link: "${input.url}".
      
      Task: Identify the song.
      1. Provide the OFFICIAL studio recording Key and BPM.
      2. List the sequence of chords for the Verse and Chorus.
      3. Use standard notation (C, Am7, F#dim).
      
      Return valid JSON matching the schema.`;
      
      contents = [{ text: prompt }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Flash is excellent for audio understanding
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AudioAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Error analyzing audio:", error);
    return null;
  }
};
