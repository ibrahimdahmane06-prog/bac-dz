import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { FillBlankQuestion } from '../../data/interactiveQuizzes';

interface FillBlanksQuizProps {
  questions: FillBlankQuestion[];
  onComplete: (score: number) => void;
}

interface BlankState {
  index: number;
  correctAnswer: string;
  userAnswer: string;
}

export const FillBlanksQuiz: React.FC<FillBlanksQuizProps> = ({ questions, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [segments, setSegments] = useState<({ type: 'text'; content: string } | { type: 'blank'; index: number; correct: string })[]>([]);
  const [blanks, setBlanks] = useState<Record<number, string>>({}); // index -> selectedWord
  const [selectedBlankIdx, setSelectedBlankIdx] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    if (currentIdx < questions.length) {
      loadQuestion(currentIdx);
    }
  }, [currentIdx, questions]);

  const loadQuestion = (qIndex: number) => {
    const q = questions[qIndex];
    const para = q.paragraph;
    
    // Parse the paragraph into segments of text and blanks.
    // E.g., "A [B] C" -> text B, blank at B, text C.
    const result: ({ type: 'text'; content: string } | { type: 'blank'; index: number; correct: string })[] = [];
    const regex = /\[(.*?)\]/g;
    
    let lastIndex = 0;
    let match;
    let blankCounter = 0;
    
    while ((match = regex.exec(para)) !== null) {
      const textBefore = para.substring(lastIndex, match.index);
      if (textBefore) {
        result.push({ type: 'text', content: textBefore });
      }
      
      result.push({
        type: 'blank',
        index: blankCounter,
        correct: match[1]
      });
      
      blankCounter++;
      lastIndex = regex.lastIndex;
    }
    
    const textAfter = para.substring(lastIndex);
    if (textAfter) {
      result.push({ type: 'text', content: textAfter });
    }
    
    setSegments(result);
    setBlanks({});
    setSelectedBlankIdx(blankCounter > 0 ? 0 : null);
    setIsChecked(false);
    setIsCorrect(false);
  };

  const handlePoolWordClick = (word: string) => {
    if (isChecked) return;
    if (selectedBlankIdx === null) return;
    
    // Fill the currently selected blank index with the word
    setBlanks(prev => ({
      ...prev,
      [selectedBlankIdx]: word
    }));

    // Find next unfilled blank
    const blankSegments = segments.filter(s => s.type === 'blank') as { type: 'blank'; index: number; correct: string }[];
    const nextUnfilled = blankSegments.find(b => b.index > selectedBlankIdx && !blanks[b.index]);
    
    if (nextUnfilled) {
      setSelectedBlankIdx(nextUnfilled.index);
    } else {
      // Look from the start
      const firstUnfilled = blankSegments.find(b => !blanks[b.index] && b.index !== selectedBlankIdx);
      if (firstUnfilled) {
        setSelectedBlankIdx(firstUnfilled.index);
      }
    }
  };

  const handleBlankClick = (idx: number) => {
    if (isChecked) return;
    setSelectedBlankIdx(idx);
  };

  const handleClearBlank = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isChecked) return;
    setBlanks(prev => {
      const clone = { ...prev };
      delete clone[idx];
      return clone;
    });
    setSelectedBlankIdx(idx);
  };

  const checkAnswers = () => {
    const blankSegments = segments.filter(s => s.type === 'blank') as { type: 'blank'; index: number; correct: string }[];
    const allFilled = blankSegments.every(b => blanks[b.index]);
    if (!allFilled) return; // Must fill all to check
    
    const correct = blankSegments.every(b => blanks[b.index] === b.correct);
    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
      const percentage = Math.round((score / questions.length) * 100);
      onComplete(percentage);
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setQuizFinished(false);
    loadQuestion(0);
  };

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <Trophy size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-1">تحدي الفراغات مكتمل!</h3>
        <p className="text-gray-500 text-xs mb-6">لقد أحسنت سد الثغرات للمفاهيم بنجاح.</p>
        
        <div className="bg-emerald-50 p-5 rounded-2xl mb-6">
          <span className="text-emerald-800 text-xs font-bold block mb-1">النتيجة النهائية</span>
          <span className="text-4xl font-extrabold text-emerald-600">{percentage}%</span>
          <p className="text-xs text-emerald-600 mt-2">({score} من أصل {questions.length} فقرات صحيحة)</p>
        </div>

        <button 
          onClick={restartQuiz}
          className="btn-3d w-full flex items-center justify-center gap-2 text-xs"
        >
          <RefreshCw size={16} /> إعادة تحدي سد الفراغات
        </button>
      </motion.div>
    );
  }

  const q = questions[currentIdx];
  const blankSegments = segments.filter(s => s.type === 'blank') as { type: 'blank'; index: number; correct: string }[];
  const isAllFilled = blankSegments.every(b => blanks[b.index]);

  return (
    <div className="text-right" style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          سد الفراغات والمفاهيم
        </span>
        <span className="text-xs font-bold text-gray-400">
          الفقرة {currentIdx + 1} من {questions.length}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
        حدد مكان الفراغ المطلوب في الفقرة أدناه، ثم اختر الكلمة المناسبة له من بنك الكلمات المتاح بالأسفل.
      </p>

      {/* Paragraph card */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl mb-6 leading-[2.5] text-gray-800 font-medium text-sm text-right leading-relaxed select-none">
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i} className="align-middle text-gray-800 font-bold">{seg.content}</span>;
          } else {
            const hasValue = !!blanks[seg.index];
            const isSelected = selectedBlankIdx === seg.index;
            const userVal = blanks[seg.index];
            const isWordCorrect = isChecked && userVal === seg.correct;
            
            let blankClass = "border-gray-300 bg-gray-50 hover:bg-gray-100/50";
            if (isSelected && !isChecked) {
              blankClass = "border-emerald-500 bg-emerald-50/40 text-emerald-600 ring-2 ring-emerald-400/20";
            } else if (isChecked) {
              blankClass = isWordCorrect 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold" 
                : "border-red-400 bg-red-50 text-red-700 font-extrabold";
            }

            return (
              <span
                key={i}
                onClick={() => handleBlankClick(seg.index)}
                className={`inline-flex items-center justify-between px-3 h-8 mx-1 my-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer align-middle min-w-[70px] ${blankClass}`}
              >
                <span>{hasValue ? userVal : '.....'}</span>
                {hasValue && !isChecked && (
                  <button 
                    onClick={(e) => handleClearBlank(seg.index, e)}
                    className="mr-1.5 w-4 h-4 rounded-full bg-gray-200/50 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-[9px] font-black"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          }
        })}
      </div>

      {/* Word Pool */}
      {!isChecked && (
        <div className="mb-8">
          <span className="block text-xs font-black text-gray-400 mb-3 border-r-2 border-emerald-500 pr-2">بنك الكلمات المتاحة</span>
          <div className="flex flex-wrap gap-2">
            {q.pool.map((word, i) => {
              // Check if word is already placed in any blank
              const isUsed = Object.values(blanks).includes(word);
              
              return (
                <button
                  key={i}
                  disabled={isUsed}
                  onClick={() => handlePoolWordClick(word)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    isUsed 
                      ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed scale-95 opacity-50' 
                      : 'bg-white border-gray-150 hover:border-emerald-500 hover:text-emerald-600 active:scale-95 shadow-sm'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {!isChecked ? (
          <button
            onClick={checkAnswers}
            disabled={!isAllFilled}
            className={`w-full py-4 rounded-2xl font-black text-sm text-center shadow-md transition-all ${
              isAllFilled 
                ? 'btn-3d w-full' 
                : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
            }`}
          >
            تأكيد الإجابات وسد الفراغات
          </button>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
              isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {isCorrect ? <Check size={20} className="text-emerald-550 shrink-0" /> : <AlertCircle size={20} className="text-red-500 shrink-0" />}
              <div>
                <p className="text-xs font-black">{isCorrect ? 'إجابات نموذجية ممتازة!' : 'هناك بعض الفراغات الخاطئة.'}</p>
                <p className="text-[10px] opacity-90 mt-0.5">
                  {isCorrect ? 'أحسنت تعريص المفاهيم باحترافية وتناسق تام.' : 'راجع المصطلحات بالدرس مجدداً لتثبيت المعرفة.'}
                </p>
              </div>
            </div>
            
            <button
              onClick={nextQuestion}
              className="btn-3d w-full"
            >
              {currentIdx + 1 < questions.length ? 'الفقرة التالية' : 'إنهاء النشاط وعرض النتيجة'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
