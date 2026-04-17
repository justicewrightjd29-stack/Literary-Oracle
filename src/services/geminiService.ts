import { GoogleGenAI, Type } from "@google/genai";
import { TarotCard, ReadingScene, Interpretation } from "../types";

const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
               ((import.meta as any).env?.VITE_GEMINI_API_KEY) || 
               "";

const ai = new GoogleGenAI({ apiKey });

const INITIAL_SCENE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bookTitle: { type: Type.STRING },
    author: { type: Type.STRING },
    majorArcana: { type: Type.STRING, description: "The Major Arcana assigned to this book/theme" },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          quote: { type: Type.STRING, description: "A famous or evocative single sentence from the novel" },
          minorArcana: { type: Type.STRING, description: "The Minor Arcana representing the tone of this sentence" },
          paragraph: { type: Type.STRING, description: "The original 300-500 word context paragraph containing this quote" }
        },
        required: ["id", "quote", "minorArcana", "paragraph"]
      }
    }
  },
  required: ["bookTitle", "author", "majorArcana", "choices"]
};

const INTERPRETATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fortuneEn: { type: Type.STRING },
    fortuneZh: { type: Type.STRING },
  },
  required: ["fortuneEn", "fortuneZh"]
};

const TRANSLATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    translation: { type: Type.STRING },
    pinyin: { type: Type.STRING },
    explanation: { type: Type.STRING, description: "Short context-specific usage" }
  },
  required: ["translation", "explanation"]
};

const MAJOR_ARCANA_MAPPING: Record<string, { book: string; author: string }> = {
  [TarotCard.FOOL]: { book: "The Catcher in the Rye", author: "J.D. Salinger" },
  [TarotCard.MAGICIAN]: { book: "1984", author: "George Orwell" },
  [TarotCard.HIGH_PRIESTESS]: { book: "The Stranger", author: "Albert Camus" },
  [TarotCard.EMPRESS]: { book: "Little Women", author: "Louisa May Alcott" },
  [TarotCard.EMPEROR]: { book: "A Tale of Two Cities", author: "Charles Dickens" },
  [TarotCard.HIEROPHANT]: { book: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  [TarotCard.LOVERS]: { book: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  [TarotCard.CHARIOT]: { book: "The Old Man and the Sea", author: "Ernest Hemingway" },
  [TarotCard.STRENGTH]: { book: "Wuthering Heights", author: "Emily Brontë" },
  [TarotCard.HERMIT]: { book: "Siddhartha", author: "Hermann Hesse" },
  [TarotCard.WHEEL_OF_FORTUNE]: { book: "One Hundred Years of Solitude", author: "Gabriel García Márquez" },
  [TarotCard.JUSTICE]: { book: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  [TarotCard.HANGED_MAN]: { book: "The Metamorphosis", author: "Franz Kafka" },
  [TarotCard.DEATH]: { book: "1984", author: "George Orwell" },
  [TarotCard.TEMPERANCE]: { book: "The Little Prince", author: "Antoine de Saint-Exupéry" },
  [TarotCard.DEVIL]: { book: "Lolita", author: "Vladimir Nabokov" },
  [TarotCard.TOWER]: { book: "The Trial", author: "Franz Kafka" },
  [TarotCard.STAR]: { book: "The Little Prince", author: "Antoine de Saint-Exupéry" },
  [TarotCard.MOON]: { book: "One Hundred Years of Solitude", author: "Gabriel García Márquez" },
  [TarotCard.SUN]: { book: "The Old Man and the Sea", author: "Ernest Hemingway" },
  [TarotCard.JUDGEMENT]: { book: "Siddhartha", author: "Hermann Hesse" },
  [TarotCard.WORLD]: { book: "The Lord of the Rings", author: "J.R.R. Tolkien" }
};

export const geminiService = {
  async generateBookAndQuotes(): Promise<ReadingScene> {
    const arcanaKeys = Object.keys(MAJOR_ARCANA_MAPPING);
    const selectedArcanaKey = arcanaKeys[Math.floor(Math.random() * arcanaKeys.length)];
    const mapping = MAJOR_ARCANA_MAPPING[selectedArcanaKey];

    const prompt = `Act as a Literary Oracle. 
    1. The selected Major Tarot Arcana is "${selectedArcanaKey}".
    2. The corresponding book is "${mapping.book}" by ${mapping.author}.
    3. Task: Extract 3 evocatively different quotes from this specific book.
    4. For EACH quote:
       - Assign a matching Minor Tarot Arcana.
       - Provide the ORIGINAL full context paragraph (150-250 words) from the book containing it.
    IMPORTANT: Return EXACTLY 3 choices in the JSON array. Output MUST be valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: INITIAL_SCENE_SCHEMA as any,
      },
    });

    try {
      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("The Oracle returned no echoes. The void is silent.");
      }

      return {
        ...data,
        bookTitle: mapping.book,
        author: mapping.author,
        majorArcana: selectedArcanaKey as TarotCard,
      };
    } catch (parseError) {
      console.error("JSON Parse failed:", parseError, response.text);
      throw new Error("The Akashic Records are garbled. Please try again.");
    }
  },

  async getInterpretation(major: string, minor: string, book: string, quote: string): Promise<Interpretation> {
    const prompt = `Give me a daily life fortune (今日生活运势) based on:
    - Master Theme: ${major} (linked to book: "${book}")
    - Chosen Action/Sentence: "${quote}" (linked to Minor Arcana: ${minor})
    
    The fortune should be practical, grounded in daily life situations, and insightful. 
    Provide one sentence in English and its corresponding interpretation in Chinese. 
    The tone should be that of a mentor or a wise oracle giving practical advice for today.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: INTERPRETATION_SCHEMA as any,
      },
    });

    try {
      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Interpretation parse error:", e);
      throw new Error("Could not decipher the Oracle's prophecy.");
    }
  },

  async getTranslation(word: string, context: string) {
    const prompt = `Translate the English word "${word}" into Chinese based on its meaning in this paragraph: "${context.slice(0, 500)}". Provide pinyin and a very brief context note.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSLATION_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "{}");
  }
};
