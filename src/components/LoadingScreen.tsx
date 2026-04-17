import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen } from 'lucide-react';

const LOADING_VOCAB = [
  { en: "0. The Fool", zh: "愚者", detail: "New beginnings, optimism, and trust in life's journey." },
  { en: "I. The Magician", zh: "魔术师", detail: "Manifestation, inspired action, and resourcefulness." },
  { en: "II. The High Priestess", zh: "女祭司", detail: "Intuition, sacred knowledge, and the divine feminine." },
  { en: "III. The Empress", zh: "皇后", detail: "Fertility, nature, and abundance in all aspects of life." },
  { en: "IV. The Emperor", zh: "皇帝", detail: "Authority, structure, and a solid foundation." },
  { en: "V. The Hierophant", zh: "教皇", detail: "Tradition, religious beliefs, and spiritual wisdom." },
  { en: "VI. The Lovers", zh: "恋人", detail: "Love, harmony, partnerships, and alignment of values." },
  { en: "VII. The Chariot", zh: "战车", detail: "Control, willpower, victory, and determination." },
  { en: "VIII. Strength", zh: "力量", detail: "Courage, persuasion, and influence over raw forces." },
  { en: "IX. The Hermit", zh: "隐士", detail: "Soul-searching, introspection, and being alone." },
  { en: "X. Wheel of Fortune", zh: "命运之轮", detail: "Good luck, karma, life cycles, and turning points." },
  { en: "XI. Justice", zh: "正义", detail: "Justice, fairness, truth, and cause and effect." },
  { en: "XII. The Hanged Man", zh: "倒吊人", detail: "Pause, surrender, and letting go of control." },
  { en: "XIII. Death", zh: "死神", detail: "Endings, change, transformation, and transitions." },
  { en: "XIV. Temperance", zh: "节制", detail: "Balance, moderation, patience, and purpose." },
  { en: "XV. The Devil", zh: "恶魔", detail: "Shadow self, attachment, addiction, and restriction." },
  { en: "XVI. The Tower", zh: "高塔", detail: "Sudden change, upheaval, chaos, and revelation." },
  { en: "XVII. The Star", zh: "星星", detail: "Hope, faith, purpose, renewal, and spirituality." },
  { en: "XVIII. The Moon", zh: "月亮", detail: "Illusion, fear, anxiety, and the subconscious." },
  { en: "XIX. The Sun", zh: "太阳", detail: "Positivity, fun, warmth, success, and vitality." },
  { en: "XX. Judgement", zh: "审判", detail: "Judgement, rebirth, and inner calling." },
  { en: "XXI. The World", zh: "世界", detail: "Completion, integration, accomplishment, and travel." },
];

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const [progress, setProgress] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  // Simulated progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev; // Stay at 95% until finished
        const inc = Math.random() * 5;
        return Math.min(prev + inc, 95);
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  // Word rotation
  useEffect(() => {
    const wordTimer = setInterval(() => {
      setWordIdx(prev => (prev + 1) % LOADING_VOCAB.length);
    }, 4000);
    return () => clearInterval(wordTimer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-8 text-center bg-paper/50"
    >
      <div className="max-w-md w-full space-y-16">
        {/* Spinner & Progress */}
        <div className="space-y-6">
          <div className="relative w-32 h-32 mx-auto">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-t-2 border-r-2 border-gold rounded-full"
             />
             <div className="absolute inset-0 flex items-center justify-center text-xs font-serif text-gold font-bold">
               {Math.floor(progress)}%
             </div>
          </div>
          <div className="space-y-2">
            <p className="font-serif italic text-ink/40 tracking-[0.2em] uppercase text-xs animate-pulse">
              {message}
            </p>
            <div className="w-full h-[1px] bg-natural overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 className="h-full bg-gold"
               />
            </div>
          </div>
        </div>

        {/* Learning Card */}
        <div className="oracle-glass p-10 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gold/10" />
          <AnimatePresence mode="wait">
            <motion.div
              key={wordIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-olive font-bold opacity-40">
                <BookOpen size={12} /> While you wait
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-serif text-ink">{LOADING_VOCAB[wordIdx].en}</h3>
                <p className="text-xl font-serif text-gold italic">{LOADING_VOCAB[wordIdx].zh}</p>
              </div>
              <p className="text-xs text-ink/50 leading-relaxed max-w-[280px] mx-auto">
                {LOADING_VOCAB[wordIdx].detail}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-1">
            {LOADING_VOCAB.map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 rounded-full transition-all ${i === wordIdx ? 'bg-gold w-3' : 'bg-gold/20'}`} 
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gold opacity-30">
          <Sparkles size={16} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Constructing Destiny</span>
        </div>
      </div>
    </motion.div>
  );
};
