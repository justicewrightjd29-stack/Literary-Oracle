export enum TarotCard {
  FOOL = "0. The Fool",
  MAGICIAN = "I. The Magician",
  HIGH_PRIESTESS = "II. The High Priestess",
  EMPRESS = "III. The Empress",
  EMPEROR = "IV. The Emperor",
  HIEROPHANT = "V. The Hierophant",
  LOVERS = "VI. The Lovers",
  CHARIOT = "VII. The Chariot",
  STRENGTH = "VIII. Strength",
  HERMIT = "IX. The Hermit",
  WHEEL_OF_FORTUNE = "X. Wheel of Fortune",
  JUSTICE = "XI. Justice",
  HANGED_MAN = "XII. The Hanged Man",
  DEATH = "XIII. Death",
  TEMPERANCE = "XIV. Temperance",
  DEVIL = "XV. The Devil",
  TOWER = "XVI. The Tower",
  STAR = "XVII. The Star",
  MOON = "XVIII. The Moon",
  SUN = "XIX. The Sun",
  JUDGEMENT = "XX. Judgment",
  WORLD = "XXI. The World"
}

export enum MinorArcana {
  CUPS = "Suit of Cups",
  WANDS = "Suit of Wands",
  SWORDS = "Suit of Swords",
  PENTACLES = "Suit of Pentacles"
}

export interface VocabularyWord {
  word: string;
  meaning: string;
  pinyin?: string;
  explanation: string;
  context: string;
  timestamp: number;
}

export interface SentenceChoice {
  id: string;
  quote: string;
  minorArcana: string;
  paragraph?: string;
}

export interface ReadingScene {
  bookTitle: string;
  author: string;
  majorArcana: TarotCard;
  choices: SentenceChoice[];
  // The selected paragraph text and current sentence for the reading view
  selectedSentence?: string;
  selectedMinorArcana?: string;
  fullParagraph?: string;
}

export interface Interpretation {
  fortuneEn: string;
  fortuneZh: string;
}

export interface UserState {
  currentScene: ReadingScene | null;
  history: {
    bookTitle: string;
    majorArcana: TarotCard;
    minorArcana: string;
    quote: string;
    oracle: string;
  }[];
  wordBank: VocabularyWord[];
}
