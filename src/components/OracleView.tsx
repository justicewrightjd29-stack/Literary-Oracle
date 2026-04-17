import React from 'react';
import { motion } from 'motion/react';
import { ReadingScene, Interpretation } from '../types';
import { RotateCcw, Home } from 'lucide-react';

interface OracleViewProps {
  scene: ReadingScene;
  interpretation: Interpretation;
  onHome: () => void;
  onRestart: () => void;
}

export const OracleView: React.FC<OracleViewProps> = ({ scene, interpretation, onHome, onRestart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-8 text-center bg-paper relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="text-[40rem] font-serif italic"
        >
          {scene.majorArcana.slice(0,1)}
        </motion.div>
      </div>

      <div className="space-y-16 max-w-4xl relative z-10 w-full">
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.6em] text-gold font-bold">Daily Revelation • 今日神谕</h2>
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-olive font-bold">
            <span>{scene.majorArcana}</span>
            <div className="w-1 h-1 rounded-full bg-gold/40" />
            <span>{scene.selectedMinorArcana}</span>
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="space-y-12"
        >
          <div className="space-y-8 px-4">
            <p className="text-4xl md:text-5xl font-serif text-ink italic leading-tight">
              "{interpretation.fortuneEn}"
            </p>
            <div className="h-px w-24 bg-gold/20 mx-auto" />
            <p className="text-2xl md:text-3xl font-serif text-ink/80 leading-relaxed max-w-3xl mx-auto">
              {interpretation.fortuneZh}
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4 opacity-40 italic font-serif">
            <p className="text-sm">Inspired by {scene.bookTitle}</p>
            <div className="w-12 h-px bg-natural" />
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
          <button 
            onClick={onHome}
            className="px-10 py-4 border border-ink/20 text-ink rounded-full font-serif text-lg hover:bg-ink hover:text-paper transition-all flex items-center gap-3 cursor-pointer"
          >
            Terminal Return <Home size={18} />
          </button>
          <button 
            onClick={onRestart}
            className="px-12 py-4 bg-ink text-paper rounded-full font-serif text-lg hover:bg-ink/90 transition-all flex items-center gap-3 shadow-xl cursor-pointer"
          >
            New Inquiry <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
