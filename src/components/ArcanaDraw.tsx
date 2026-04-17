import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard } from '../types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ArcanaDrawProps {
  card: TarotCard;
  bookTitle: string;
  author: string;
  onContinue: () => void;
}

export const ArcanaDraw: React.FC<ArcanaDrawProps> = ({ card, bookTitle, author, onContinue }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="space-y-8 max-w-2xl">
        <h2 className="text-xs uppercase tracking-[0.4em] text-gold font-bold">Divine Archetype</h2>
        
        <motion.div 
          initial={{ scale: 0.8, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="tarot-card-natural mx-auto w-64 h-96 flex flex-col items-center justify-between p-8 border-gold shadow-2xl bg-white/50"
        >
          <div className="text-xs uppercase tracking-widest text-gold font-bold">The Oracle</div>
          <div className="text-8xl my-8 drop-shadow-lg">✨</div>
          <div className="text-xl uppercase tracking-[0.2em] font-bold text-gold text-center leading-tight">
            {card}
          </div>
        </motion.div>

        <div className="space-y-4">
          <p className="font-serif italic text-ink/60 text-lg">"Your path today is paved with the echoes of..."</p>
          <h1 className="text-4xl font-serif text-ink">{bookTitle}</h1>
          <p className="text-xs uppercase tracking-widest font-bold text-olive">{author}</p>
        </div>

        <button 
          onClick={onContinue}
          className="px-12 py-4 bg-ink text-paper rounded-full font-serif text-lg hover:bg-ink/90 transition-all flex items-center gap-3 mx-auto shadow-xl group"
        >
          Next Voyage <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
