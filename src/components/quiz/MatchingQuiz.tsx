import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { MatchingItem } from '../../data/interactiveQuizzes';

interface MatchingQuizProps {
  items: MatchingItem[];
  onComplete: (score: number) => void;
}

export const MatchingQuiz: React.FC<MatchingQuizProps> = ({ items, onComplete }) => {
  const [shuffledTerms, setShuffledTerms] = useState<{ id: string; term: string }[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<{ id: string; definition: string }[]>([]);
  
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [failedPair, setFailedPair] = useState<{ termId: string; defId: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    initializeQuiz();
  }, [items]);

  const initializeQuiz = () => {
    const terms = items.map(x => ({ id: x.id, term: x.term }));
    const defs = items.map(x => ({ id: x.id, definition: x.definition }));
    
    // Shuffle helper
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    
    setShuffledTerms(shuffle(terms));
    setShuffledDefs(shuffle(defs));
    setMatchedIds(new Set());
    setSelectedTermId(null);
    setSelectedDefId(null);
    setFailedPair(null);
    setAttempts(0);
    setIsFinished(false);
  };

  const handleTermClick = (id: string) => {
    if (matchedIds.has(id)) return;
    if (failedPair) return;
    
    setSelectedTermId(id);
    
    // If a definition was already selected, check match
    if (selectedDefId) {
      checkMatch(id, selectedDefId);
    }
  };

  const handleDefClick = (id: string) => {
    if (matchedIds.has(id)) return;
    if (failedPair) return;
    
    setSelectedDefId(id);
    
    // If a term was already selected, check match
    if (selectedTermId) {
      checkMatch(selectedTermId, id);
    }
  };

  const checkMatch = (termId: string, defId: string) => {
    setAttempts(prev => prev + 1);
    
    if (termId === defId) {
      // Success Match
      const newMatched = new Set(matchedIds);
      newMatched.add(termId);
      setMatchedIds(newMatched);
      setSelectedTermId(null);
      setSelectedDefId(null);
      
      if (newMatched.size === items.length) {
        setIsFinished(true);
        // Calculate dynamic score, maximum 100%, subtract small penalty per extra mistakes
        const extraAttempts = attempts + 1 - items.length;
        const finalScore = Math.max(50, 100 - (extraAttempts > 0 ? extraAttempts * 10 : 0));
        onComplete(finalScore);
      }
    } else {
      // Failed Match
      setFailedPair({ termId, defId });
      setTimeout(() => {
        setSelectedTermId(null);
        setSelectedDefId(null);
        setFailedPair(null);
      }, 1000);
    }
  };

  const percentageMatched = Math.round((matchedIds.size / items.length) * 100);

  if (isFinished) {
    const extraAttempts = attempts - items.length;
    const finalScore = Math.max(50, 100 - (extraAttempts > 0 ? extraAttempts * 10 : 0));
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <Trophy size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-1">تطابق مذهل!</h3>
        <p className="text-gray-500 text-xs mb-4">لقد نجحت في مطابقة كافة المصطلحات والمفاهيم بنجاح</p>
        
        <div className="bg-emerald-50 p-5 rounded-2xl mb-6">
          <span className="text-emerald-800 text-xs font-bold block mb-1">النتيجة المحصلة</span>
          <span className="text-3xl font-black text-emerald-600">{finalScore}%</span>
          <p className="text-[10px] text-emerald-600 mt-1">({attempts} محاولات جرت خلال النشاط)</p>
        </div>

        <button 
          onClick={initializeQuiz}
          className="btn-3d w-full flex items-center justify-center gap-2 text-xs"
        >
          <RefreshCw size={16} /> إعادة محاولة مطابقة المصطلحات
        </button>
      </motion.div>
    );
  }

  return (
    <div className="text-right" style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          ربط المفاهيم والمصطلحات
        </span>
        <span className="text-xs font-bold text-gray-400">
          نسبة التقدم: {percentageMatched}%
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
        انقر على المصطلح في العمود الأيمن، ثم انقر على شرحه الصحيح في العمود الأيسر ليتم ربطهما معاً.
      </p>

      {/* Grid containing terms and definitions columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Terms Column */}
        <div className="md:col-span-5 space-y-3">
          <h4 className="text-xs font-black text-gray-400 mb-2 border-r-2 border-emerald-500 pr-2">المصطلحات</h4>
          {shuffledTerms.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedTermId === item.id;
            const isFailed = failedPair?.termId === item.id;
            
            let btnClass = "border-gray-100 bg-white hover:border-emerald-200";
            if (isMatched) {
              btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_3px_0_0_rgba(16,185,129,0.3)] pointer-events-none";
            } else if (isFailed) {
              btnClass = "border-red-500 bg-red-50 text-red-700 animate-shake";
            } else if (isSelected) {
              btnClass = "border-emerald-500 bg-emerald-500/5 text-emerald-600 scale-[1.02] shadow-sm";
            }

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTermClick(item.id)}
                className={`w-full p-4 rounded-xl border text-right font-extrabold text-xs transition-all flex items-center justify-between min-h-[56px] ${btnClass}`}
              >
                <span>{item.term}</span>
                {isMatched && <Check size={14} className="text-emerald-600 shrink-0" />}
                {isFailed && <AlertCircle size={14} className="text-red-650 shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Separator / Match Indicator for aesthetics */}
        <div className="hidden md:flex md:col-span-2 items-center justify-center opacity-30 text-gray-300">
          <div className="h-full w-0.5 bg-dashed bg-gray-200"></div>
        </div>

        {/* Definitions Column */}
        <div className="md:col-span-5 space-y-3">
          <h4 className="text-xs font-black text-gray-400 mb-2 border-r-2 border-blue-500 pr-2">التعريفات</h4>
          {shuffledDefs.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedDefId === item.id;
            const isFailed = failedPair?.defId === item.id;
            
            let btnClass = "border-gray-100 bg-white hover:border-blue-200";
            if (isMatched) {
              btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700 pointer-events-none";
            } else if (isFailed) {
              btnClass = "border-red-500 bg-red-100/50 text-red-700 animate-shake";
            } else if (isSelected) {
              btnClass = "border-blue-500 bg-blue-500/5 text-blue-600 scale-[1.01] shadow-sm";
            }

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDefClick(item.id)}
                className={`w-full p-4 rounded-xl border text-right text-xs transition-all leading-relaxed flex items-center justify-between min-h-[56px] text-gray-700 font-medium ${btnClass}`}
              >
                <span>{item.definition}</span>
                {isMatched && <Check size={14} className="text-emerald-550 shrink-0" />}
                {isFailed && <AlertCircle size={14} className="text-red-500 shrink-0 animate-pulse" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
