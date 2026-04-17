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
          minorArcana: { type: Type.STRING, description: "The Minor Arcana representing the tone of this sentence" }
        },
        required: ["id", "quote", "minorArcana"]
      }
    }
  },
  required: ["bookTitle", "author", "majorArcana", "choices"]
};

const PARAGRAPH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fullParagraph: { type: Type.STRING, description: "A 300-500 word narrative chunk from the book that includes the selected quote" },
  },
  required: ["fullParagraph"]
};

const INTERPRETATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fortuneEn: { type: Type.STRING, description: "A practical daily life fortune in English (1 sentence)" },
    fortuneZh: { type: Type.STRING, description: "A practical daily life fortune in Chinese (1 sentence)" },
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
    3. Extract exactly 3 different evocative single sentences (quotes) from this specific book that represent different Minor Tarot Arcana vibes.
    4. For each quote, assign a Minor Tarot Arcana (Suit + Rank) that matches its emotional core.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: INITIAL_SCENE_SCHEMA as any,
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      bookTitle: mapping.book,
      author: mapping.author,
      majorArcana: selectedArcanaKey as TarotCard,
    };
  },

  async fetchParagraph(bookTitle: string, author: string, quote: string): Promise<string> {
    const prompt = `Provide the context paragraph (300-500 words) from "${bookTitle}" by ${author} that contains the sentence: "${quote}". 
    The text must be the original English text from the book.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PARAGRAPH_SCHEMA as any,
      },
    });

    const data = JSON.parse(response.text || "{}");
    return data.fullParagraph;
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

    return JSON.parse(response.text || "{}");
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
