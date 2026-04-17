import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReadingScene, VocabularyWord } from '../types';
import { geminiService } from '../services/geminiService';
import { Library, BookMarked, X, Plus, Sparkles, MousePointer2, Trash2 } from 'lucide-react';

interface ReadingViewProps {
  scene: ReadingScene;
  wordBank: VocabularyWord[];
  onAddWord: (word: VocabularyWord) => void;
  onRemoveWord: (wordStr: string) => void;
  onContinue: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ scene, wordBank, onAddWord, onRemoveWord, onContinue }) => {
  const [translation, setTranslation] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  const words = scene.fullParagraph ? scene.fullParagraph.split(/\s+/) : [];

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    if (cleanWord.length < 2) return;
    
    setIsTranslating(true);
    try {
      const data = await geminiService.getTranslation(cleanWord, scene.fullParagraph || "");
      setTranslation({ word: cleanWord, ...data });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const onDragStart = (e: React.DragEvent, word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    e.dataTransfer.setData("text/plain", cleanWord);
    setDraggedWord(cleanWord);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    if (!word) return;

    // Check if already in bank
    if (wordBank.some(w => w.word.toLowerCase() === word.toLowerCase())) return;

    try {
      const data = await geminiService.getTranslation(word, scene.fullParagraph || "");
      onAddWord({
        word,
        meaning: data.translation,
        explanation: data.explanation,
        pinyin: data.pinyin,
        context: scene.selectedSentence || scene.bookTitle,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Drag add failed:", err);
    }
    setDraggedWord(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden"
    >
      {/* Main Text Content */}
      <div className="relative overflow-y-auto p-8 md:p-16 lg:p-24 border-r border-natural bg-white/20 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.4em] text-gold font-bold">The Narrative</h2>
            <div className="flex items-center gap-4 font-serif italic text-ink/60">
              <span className="text-sm">{scene.bookTitle}</span>
              <div className="w-1 h-1 rounded-full bg-gold" />
              <span className="text-sm">{scene.author}</span>
            </div>
          </div>

          <div className="relative">
            <p className="literary-text text-ink text-2xl md:text-3xl leading-[1.8] font-serif select-none">
              {words.map((word, i) => (
                <span 
                  key={i}
                  draggable
                  onDragStart={(e) => onDragStart(e, word)}
                  onClick={() => handleWordClick(word)}
                  className={`cursor-pointer hover:bg-gold/10 transition-colors inline-block px-1 rounded active:scale-95 ${scene.selectedSentence?.includes(word) ? 'border-b-2 border-gold/30' : ''}`}
                >
                  {word}{' '}
                </span>
              ))}
            </p>

            <AnimatePresence>
              {translation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm"
                  onClick={() => setTranslation(null)}
                >
                  <motion.div 
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-md p-8 oracle-glass shadow-2xl relative bg-white border-gold/30"
                  >
                    <button 
                      onClick={() => setTranslation(null)}
                      className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full"
                    >
                      <X size={20} />
                    </button>
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-widest text-gold font-bold">Lexicon</span>
                        <h4 className="text-3xl font-serif text-ink">{translation.word}</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-serif text-gold flex items-center gap-2">
                          {translation.translation}
                          {translation.pinyin && <span className="text-sm text-olive">[{translation.pinyin}]</span>}
                        </div>
                        <p className="text-sm text-ink/60 leading-relaxed italic">{translation.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-12 text-center">
            <button 
              onClick={onContinue}
              className="px-12 py-5 bg-ink text-paper rounded-full font-serif text-lg hover:bg-ink/90 transition-all flex items-center gap-3 mx-auto shadow-xl group"
            >
              Consult the Oracle <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Word Bank Area */}
      <div 
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="sidebar-natural flex flex-col h-full bg-paper/50"
      >
        <div className="p-8 border-b border-natural">
          <h2 className="text-lg font-serif flex items-center gap-3">
            <Library className="text-gold" size={24} /> Word Bank
          </h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-olive opacity-40 mt-1 flex items-center gap-2">
            <MousePointer2 size={12} /> Drag unknown words here
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {wordBank.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4 grayscale">
              <BookMarked size={64} strokeWidth={1} />
              <p className="font-serif italic text-sm">Drop words to build your lexicon...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {wordBank.map((word, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="oracle-glass p-6 group relative border-gold/10 hover:border-gold/30 transition-all"
                >
                  <button 
                    onClick={() => onRemoveWord(word.word)}
                    className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-2">
                    <h5 className="font-serif font-bold text-lg text-ink">{word.word}</h5>
                    <p className="text-sm font-serif italic text-gold">{word.meaning}</p>
                    <p className="text-[10px] text-ink/40 line-clamp-2">{word.explanation}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {draggedWord && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gold/10 border-t border-gold text-center"
          >
            <p className="text-xs uppercase tracking-widest font-bold text-gold">Drop "{draggedWord}"</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
