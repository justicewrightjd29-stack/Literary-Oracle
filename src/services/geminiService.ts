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
    BOOK: "${mapping.book}" by ${mapping.author}.
    ARCANA: "${selectedArcanaKey}".
    
    TASK:
    1. Extract 3 evocative quotes from this book.
    2. For each, assign a Minor Arcana.
    3. Provide the original context paragraph (150-250 words) for each quote.
    4. Return ONLY the JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: "LOW" as any },
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
    The tone should be that of a mentor or a wise oracle giving practical advice for today.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: "LOW" as any },
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
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSLATION_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "{}");
  }
};
