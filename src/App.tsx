import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReadingScene, UserState, VocabularyWord, SentenceChoice, Interpretation } from './types';
import { geminiService } from './services/geminiService';
import { AtmosphericBackground } from './components/AtmosphericBackground';
import { ArcanaDraw } from './components/ArcanaDraw';
import { SentencePick } from './components/SentencePick';
import { ReadingView } from './components/ReadingView';
import { OracleView } from './components/OracleView';
import { LoadingScreen } from './components/LoadingScreen';
import { Sparkles, Globe, Library, BookOpen, Trash2, Home } from 'lucide-react';

type AppState = 'HOME' | 'MAJOR_DRAW' | 'SENTENCE_PICK' | 'READING' | 'ORACLE' | 'WORDBANK' | 'LOADING';

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [loadingMsg, setLoadingMsg] = useState('Consulting the Oracle...');
  const [userState, setUserState] = useState<UserState>({
    currentScene: null,
    history: [],
    wordBank: [],
  });
  const [lastOracle, setLastOracle] = useState<Interpretation | null>(null);

  const initiateJourney = async () => {
    setAppState('LOADING');
    setLoadingMsg('Drawing from the Akashic Records...');
    try {
      const sceneData = await geminiService.generateBookAndQuotes();
      setUserState(prev => ({
        ...prev,
        currentScene: sceneData
      }));
      setAppState('MAJOR_DRAW');
    } catch (err: any) {
      console.error("Initiation failed:", err);
      
      let friendlyMsg = "连接虚空失败，请稍后再试。";
      if (err.message?.includes("429") || err.message?.includes("QUOTA") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        friendlyMsg = "神谕今日过于繁忙（请求频率过高），请耐心等待 1 分钟后再试。";
      } else {
        friendlyMsg = `虚空门扉紧闭：${err instanceof Error ? err.message : '未知错误'}。请检查 API Key 配置。`;
      }
      
      alert(friendlyMsg);
      setAppState('HOME');
    }
  };

  const handleSentenceChoice = (choice: SentenceChoice) => {
    if (!userState.currentScene) return;
    
    setUserState(prev => ({
      ...prev,
      currentScene: prev.currentScene ? {
        ...prev.currentScene,
        selectedSentence: choice.quote,
        selectedMinorArcana: choice.minorArcana,
        fullParagraph: choice.paragraph
      } : null
    }));
    setAppState('READING');
  };

  const fetchInterpretation = async () => {
    if (!userState.currentScene) return;
    setAppState('LOADING');
    setLoadingMsg('Merging Arcanas into a single truth...');
    
    try {
      const result = await geminiService.getInterpretation(
        userState.currentScene.majorArcana,
        userState.currentScene.selectedMinorArcana || "Unknown",
        userState.currentScene.bookTitle,
        userState.currentScene.selectedSentence || ""
      );
      
      setLastOracle(result);
      // Save to history
      setUserState(prev => ({
        ...prev,
        history: [{
          bookTitle: prev.currentScene!.bookTitle,
          majorArcana: prev.currentScene!.majorArcana,
          minorArcana: prev.currentScene!.selectedMinorArcana!,
          quote: prev.currentScene!.selectedSentence!,
          oracle: result.fortuneZh
        }, ...prev.history]
      }));
      setAppState('ORACLE');
    } catch (err) {
      console.error("Interpretation failed:", err);
      setAppState('READING');
    }
  };

  const addWord = (word: VocabularyWord) => {
    if (userState.wordBank.some(w => w.word.toLowerCase() === word.word.toLowerCase())) return;
    setUserState(prev => ({
      ...prev,
      wordBank: [word, ...prev.wordBank]
    }));
  };

  const removeWord = (wordStr: string) => {
    setUserState(prev => ({
      ...prev,
      wordBank: prev.wordBank.filter(w => w.word !== wordStr)
    }));
  };

  const reset = () => {
    setAppState('HOME');
    setUserState(prev => ({ ...prev, currentScene: null }));
    setLastOracle(null);
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-paper text-ink font-sans">
      <AtmosphericBackground />
      
      <header className="h-[80px] border-b border-natural flex items-center justify-between px-10 relative z-20 shrink-0 bg-paper/80 backdrop-blur-md">
        <button 
          onClick={reset}
          className="logo font-serif italic text-2xl tracking-tighter cursor-pointer hover:text-gold transition-colors flex items-center gap-2 group"
        >
          <Home className="opacity-40 group-hover:opacity-100 transition-opacity" size={20} />
          Literary Oracle
        </button>
        <div className="status-bar flex gap-8 text-[11px] uppercase tracking-[0.2em] text-olive font-bold items-center">
          <button onClick={() => setAppState('WORDBANK')} className="hover:text-gold transition-colors flex items-center gap-2">
            <BookOpen size={14} /> Repository ({userState.wordBank.length})
          </button>
          <div className="w-1 h-1 rounded-full bg-gold/40" />
          <span>{appState.replace('_', ' ')}</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-hidden h-full">
        <AnimatePresence mode="wait">
          
          {appState === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full grid grid-cols-1 lg:grid-cols-[1fr_400px]"
            >
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-12">
                <div className="space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 mx-auto border border-gold/20 rounded-full flex items-center justify-center p-12 mb-8 bg-white/30 backdrop-blur-sm"
                  >
                    <Sparkles className="text-gold w-full h-full" strokeWidth={1} />
                  </motion.div>
                  <h1 className="text-[120px] leading-tight font-serif tracking-tighter text-ink">Literary Oracle</h1>
                  <p className="text-2xl font-serif text-ink/40 max-w-xl mx-auto leading-relaxed italic">
                    "Seek your truth in the lexicon of eternity."
                  </p>
                </div>

                <button 
                  onClick={initiateJourney}
                  className="px-16 py-6 bg-ink text-paper rounded-full font-serif text-2xl hover:bg-ink/90 transition-all flex items-center gap-4 shadow-2xl cursor-pointer group"
                >
                  Enter the Void <Globe size={28} className="group-hover:rotate-180 transition-transform duration-1000" />
                </button>
              </div>

              <div className="border-l border-natural bg-white/10 backdrop-blur-sm p-10 overflow-y-auto">
                <h3 className="text-lg font-serif mb-8 flex gap-2 items-center"><Library className="text-gold" /> Memory Vault</h3>
                {userState.wordBank.length === 0 ? (
                  <p className="opacity-20 italic font-serif text-sm">No echoes collected yet. Drag words to store them.</p>
                ) : (
                  <div className="space-y-6">
                    {userState.wordBank.map((word, i) => (
                      <div key={i} className="oracle-glass p-6 group relative border-gold/10">
                        <button onClick={() => removeWord(word.word)} className="absolute top-4 right-4 text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                        <h4 className="font-serif font-bold text-ink">{word.word}</h4>
                        <p className="text-sm italic text-gold">{word.meaning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {appState === 'MAJOR_DRAW' && userState.currentScene && (
            <div key="major-draw" className="h-full">
              <ArcanaDraw 
                card={userState.currentScene.majorArcana}
                bookTitle={userState.currentScene.bookTitle}
                author={userState.currentScene.author}
                onContinue={() => setAppState('SENTENCE_PICK')}
              />
            </div>
          )}

          {appState === 'SENTENCE_PICK' && userState.currentScene && (
            <div key="sentence-pick" className="h-full">
              <SentencePick 
                choices={userState.currentScene.choices || []}
                onSelect={handleSentenceChoice}
              />
            </div>
          )}

          {appState === 'READING' && userState.currentScene && (
            <div key="reading" className="h-full">
              <ReadingView 
                scene={userState.currentScene}
                wordBank={userState.wordBank}
                onAddWord={addWord}
                onRemoveWord={removeWord}
                onContinue={fetchInterpretation}
              />
            </div>
          )}

          {appState === 'ORACLE' && userState.currentScene && lastOracle && (
            <div key="oracle" className="h-full">
              <OracleView 
                scene={userState.currentScene}
                interpretation={lastOracle}
                onHome={reset}
                onRestart={initiateJourney}
              />
            </div>
          )}

          {appState === 'LOADING' && (
            <LoadingScreen key="loading" message={loadingMsg} />
          )}

          {appState === 'WORDBANK' && (
            <motion.div 
              key="wordbank"
              className="h-full max-w-4xl mx-auto p-12 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-serif flex items-center gap-4"><BookOpen className="text-gold" /> Lexicon Repository</h2>
                <button onClick={() => setAppState('HOME')} className="text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100">Return</button>
              </div>
              <div className="grid gap-6">
                {userState.wordBank.map((word, i) => (
                  <div key={i} className="oracle-glass p-8 flex justify-between items-start border-natural group">
                    <div className="space-y-2">
                       <h3 className="text-2xl font-serif font-bold">{word.word}</h3>
                       <p className="text-lg italic text-gold">{word.meaning}</p>
                       <p className="text-sm text-ink/60">{word.explanation}</p>
                    </div>
                    <button onClick={() => removeWord(word.word)} className="p-2 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={24} /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
