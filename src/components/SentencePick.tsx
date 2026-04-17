import React from 'react';
import { motion } from 'motion/react';
import { SentenceChoice } from '../types';
import { Sparkles } from 'lucide-react';

interface SentencePickProps {
  choices: SentenceChoice[];
  onSelect: (choice: SentenceChoice) => void;
  isLoading?: boolean;
}

export const SentencePick: React.FC<SentencePickProps> = ({ choices, onSelect, isLoading }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-8 max-w-5xl mx-auto"
    >
      <div className="text-center space-y-16 w-full">
        <div className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">The Echoes</h2>
          <p className="font-serif italic text-ink/40 text-sm">Choose the sentence that resonates with your current spirit...</p>
        </div>

        <div className="grid gap-8 w-full">
          {choices.map((choice, idx) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelect(choice)}
              disabled={isLoading}
              className="p-8 md:p-12 text-left border-b border-natural hover:bg-gold/5 transition-all group flex items-center justify-between gap-8 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
              <div className="space-y-4 flex-1">
                <span className="text-[9px] uppercase tracking-widest text-olive font-bold opacity-40">Entry point 0{idx + 1}</span>
                <p className="text-2xl md:text-3xl font-serif text-ink leading-relaxed italic group-hover:text-gold transition-colors">
                  "{choice.quote}"
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gold opacity-30 mb-1">Arcana</div>
                <div className="text-xs font-serif text-olive">{choice.minorArcana}</div>
              </div>
            </motion.button>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-3 text-gold animate-pulse justify-center">
            <Sparkles size={20} />
            <span className="text-xs uppercase tracking-widest font-bold">Unfolding the Narrative...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
