import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { TarotCard, ReadingScene, Interpretation } from "../types";

const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY || "";
  } catch {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const INITIAL_SCENE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bookTitle: { type: Type.STRING },
    author: { type: Type.STRING },
    majorArcana: { type: Type.STRING, description: "Major Arcana card name" },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          quote: { type: Type.STRING, description: "Single evocative quote" },
          minorArcana: { type: Type.STRING, description: "Matching Minor Arcana" },
          paragraph: { type: Type.STRING, description: "Context paragraph (150-250 words)" }
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
  [TarotCard.FOOL]: { book: "The Adventures of Huckleberry Finn", author: "Mark Twain" },
  [TarotCard.MAGICIAN]: { book: "Frankenstein", author: "Mary Shelley" },
  [TarotCard.HIGH_PRIESTESS]: { book: "Pride and Prejudice", author: "Jane Austen" },
  [TarotCard.EMPRESS]: { book: "Sense and Sensibility", author: "Jane Austen" },
  [TarotCard.EMPEROR]: { book: "A Tale of Two Cities", author: "Charles Dickens" },
  [TarotCard.HIEROPHANT]: { book: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  [TarotCard.LOVERS]: { book: "Romeo and Juliet", author: "William Shakespeare" },
  [TarotCard.CHARIOT]: { book: "Moby-Dick", author: "Herman Melville" },
  [TarotCard.STRENGTH]: { book: "Jane Eyre", author: "Charlotte Brontë" },
  [TarotCard.HERMIT]: { book: "Walden", author: "Henry David Thoreau" },
  [TarotCard.WHEEL_OF_FORTUNE]: { book: "Great Expectations", author: "Charles Dickens" },
  [TarotCard.JUSTICE]: { book: "The Brothers Karamazov", author: "Fyodor Dostoevsky" },
  [TarotCard.HANGED_MAN]: { book: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  [TarotCard.DEATH]: { book: "Hamlet", author: "William Shakespeare" },
  [TarotCard.TEMPERANCE]: { book: "The Secret Garden", author: "Frances Hodgson Burnett" },
  [TarotCard.DEVIL]: { book: "Dracula", author: "Bram Stoker" },
  [TarotCard.TOWER]: { book: "Paradise Lost", author: "John Milton" },
  [TarotCard.STAR]: { book: "Treasure Island", author: "Robert Louis Stevenson" },
  [TarotCard.MOON]: { book: "Alice in Wonderland", author: "Lewis Carroll" },
  [TarotCard.SUN]: { book: "The Odyssey", author: "Homer" },
  [TarotCard.JUDGEMENT]: { book: "War and Peace", author: "Leo Tolstoy" },
  [TarotCard.WORLD]: { book: "Around the World in Eighty Days", author: "Jules Verne" }
};

export const geminiService = {
  async generateBookAndQuotes(): Promise<ReadingScene> {
    const arcanaKeys = Object.keys(MAJOR_ARCANA_MAPPING);
    const selectedArcanaKey = arcanaKeys[Math.floor(Math.random() * arcanaKeys.length)];
    const mapping = MAJOR_ARCANA_MAPPING[selectedArcanaKey];

    const prompt = `Act as a Tarot-Bound Literary Oracle. 
    BOOK: "${mapping.book}" by ${mapping.author}.
    MAJOR THEME: "${selectedArcanaKey}".
    
    INSTRUCTIONS:
    1. Identify 3 poetic and evocative "echoes" (quotes or reconstructed sentences) from this book.
    2. For each echo, assign a matching Minor Arcana and a unique ID.
    3. For each, describe/reconstruct a vivid context scene (max 200 words) in the author's voice that features the quote. Focus on atmosphere and theme. 
    4. Keep output concise and structured. Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: INITIAL_SCENE_SCHEMA as any,
      },
    });

    if (!response.text) {
      const reason = (response as any).candidates?.[0]?.finishReason;
      console.error("AI Response blocked or empty. Reason:", reason);
      throw new Error(`The Oracle is silent (Reason: ${reason || 'Unknown'}). Please try again.`);
    }

    const rawText = response.text;
    try {
      // More robust JSON cleaning: Find the first '{' and last '}'
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      const cleanJson = (start !== -1 && end !== -1) 
        ? rawText.substring(start, end + 1) 
        : rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const data = JSON.parse(cleanJson);
      
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error("Empty choices array from model");
      }

      return {
        ...data,
        bookTitle: mapping.book,
        author: mapping.author,
        majorArcana: selectedArcanaKey as TarotCard,
      };
    } catch (parseError) {
      console.error("Deep JSON Parse Failure:", {
        error: parseError,
        rawResponse: rawText,
        book: mapping.book
      });
      throw new Error("The Akashic Records are garbled. The threads of destiny are tangled.");
    }
  },

  async getInterpretation(major: string, minor: string, book: string, quote: string): Promise<Interpretation> {
    const prompt = `Give me a daily life fortune (今日生活运势) based on:
    - Master Theme: ${major} (linked to book: "${book}")
    - Chosen Action/Sentence: "${quote}" (linked to Minor Arcana: ${minor})
    
    The fortune should be practical, grounded in daily life situations, and insightful. 
    Provide one sentence in English and its corresponding interpretation in Chinese. 
    The tone should be that of a mentor or a wise oracle giving practical advice for today.
    Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: INTERPRETATION_SCHEMA as any,
      },
    });

    const rawText = response.text || "";
    try {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      const cleanJson = (start !== -1 && end !== -1) 
        ? rawText.substring(start, end + 1) 
        : rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Interpretation parse error:", e, rawText);
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
