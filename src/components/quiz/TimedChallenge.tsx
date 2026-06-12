import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Trophy, RefreshCw, ChevronLeft, Award, HelpCircle, Check, X } from 'lucide-react';
import { TimedQuestion } from '../../data/interactiveQuizzes';

interface TimedChallengeProps {
  questions: TimedQuestion[];
  onComplete: (score: number, pointsEarned: number) => void;
}

export const TimedChallenge: React.FC<TimedChallengeProps> = ({ questions, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timedOutCount, setTimedOutCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = questions[currentIdx]?.timeLimit || 15;

  useEffect(() => {
    if (currentIdx < questions.length) {
      loadQuestion(currentIdx);
    }
    return () => stopTimer();
  }, [currentIdx, questions]);

  const loadQuestion = (idx: number) => {
    const q = questions[idx];
    setTimeLeft(q.timeLimit);
    setSelectedIdx(null);
    setIsAnswered(false);
    setShowHint(false);
    startTimer(q.timeLimit);
  };

  const startTimer = (initialSecs: number) => {
    stopTimer();
    
    let secondsLeft = initialSecs;
    timerRef.current = setInterval(() => {
      secondsLeft--;
      setTimeLeft(secondsLeft);
      
      if (secondsLeft <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeout = () => {
    setSelectedIdx(null);
    setIsAnswered(true);
    setTimedOutCount(prev => prev + 1);
    setStreak(0); // Break combo
  };

  const handleOptionSelect = (optIndex: number) => {
    if (isAnswered) return;
    stopTimer();
    setSelectedIdx(optIndex);
    setIsAnswered(true);

    const q = questions[currentIdx];
    if (optIndex === q.correctIndex) {
      setCorrectCount(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Calculate points: base 10 + speed bonus + combo multiplier!
      const speedBonus = Math.round(timeLeft * 1.5);
      const comboMultiplier = newStreak > 4 ? 2.0 : newStreak > 2 ? 1.5 : 1.0;
      const questionPoints = Math.round((10 + speedBonus) * comboMultiplier);
      
      setPoints(prev => prev + questionPoints);
    } else {
      setStreak(0); // Break combo
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      stopTimer();
      setQuizFinished(true);
      const percentage = Math.round((correctCount / questions.length) * 100);
      onComplete(percentage, points);
    }
  };

  const restartChallenge = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setIsAnswered(false);
    setStreak(0);
    setPoints(0);
    setCorrectCount(0);
    setTimedOutCount(0);
    setQuizFinished(false);
    setShowHint(false);
  };

  if (quizFinished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4">
          <Award size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-1">انتهى التحدي الموقّت!</h3>
        <p className="text-gray-500 text-xs mb-6">لقد صمدت وحصدت نتائج رائعة في اختبار السرعة.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
            <span className="text-emerald-800 text-[10px] font-bold block">معدل الإجابة</span>
            <span className="text-2xl font-black text-emerald-600">{percentage}%</span>
            <p className="text-[10px] text-emerald-500 mt-1">({correctCount} من أصل {questions.length})</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
            <span className="text-amber-800 text-[10px] font-bold block">النقاط الحليّة المحصلة</span>
            <span className="text-2xl font-black text-amber-600">{points} نقطة</span>
            <p className="text-[10px] text-amber-500 mt-1">({timedOutCount} أسئلة خارج وقتها)</p>
          </div>
        </div>

        <button 
          onClick={restartChallenge}
          className="btn-3d w-full flex items-center justify-center gap-2 text-xs"
        >
          <RefreshCw size={16} /> إعادة تحدي سباق الوقت
        </button>
      </motion.div>
    );
  }

  const q = questions[currentIdx];
  const progressRatio = timeLeft / startTime;

  // Determine indicator colors based on remaining time
  let timerColor = "text-emerald-500 bg-emerald-50 border-emerald-150";
  let barColor = "bg-emerald-500";
  if (timeLeft <= 4) {
    timerColor = "text-red-500 bg-red-50 border-red-150 animate-pulse";
    barColor = "bg-red-500";
  } else if (timeLeft <= 8) {
    timerColor = "text-orange-500 bg-orange-50 border-orange-150";
    barColor = "bg-orange-500";
  }

  return (
    <div className="text-right" style={{ direction: 'rtl' }}>
      {/* Header indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-black border px-3 py-1 rounded-full transition-colors ${timerColor}`}>
            <Timer size={14} className={timeLeft <= 4 ? "animate-spin" : ""} />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 border border-amber-150 px-3 py-1 rounded-full">
              <Zap size={12} fill="currentColor" className="animate-bounce" />
              <span>كومبو {streak}🔥</span>
            </span>
          )}
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400">
            سؤال {currentIdx + 1}/{questions.length} • النقاط: {points}
          </span>
        </div>
      </div>

      {/* Dynamic Time progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
        <motion.div 
          initial={false}
          animate={{ width: `${progressRatio * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          className={`h-full ${barColor}`}
        ></motion.div>
      </div>

      {/* Question container */}
      <h3 className="text-base font-black text-gray-900 mb-6 leading-relaxed">
        {q.question}
      </h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {q.options.map((opt, idx) => {
          let btnStyle = "bg-white border-gray-100 hover:border-emerald-200 active:bg-gray-50";
          if (isAnswered) {
            if (idx === q.correctIndex) {
              btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[0_3px_0_0_rgba(16,185,129,0.3)]";
            } else if (idx === selectedIdx) {
              btnStyle = "bg-red-50 border-red-500 text-red-800 shadow-[0_3px_0_0_rgba(239,68,68,0.3)]";
            } else {
              btnStyle = "bg-gray-50 border-gray-100/50 text-gray-400 grayscale pointer-events-none";
            }
          }

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect(idx)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-xl border text-right font-bold text-xs transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{opt}</span>
              {isAnswered && idx === q.correctIndex && <Check size={16} className="text-emerald-600 shrink-0" />}
              {isAnswered && idx === selectedIdx && idx !== q.correctIndex && <X size={16} className="text-red-600 shrink-0" />}
            </motion.button>
          );
        })}
      </div>

      {/* Hint & Helper */}
      {q.hint && !isAnswered && (
        <div className="mb-6">
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-1"
            >
              <HelpCircle size={12} />
              <span>إظهار تلميح للسؤال (يخصم 3 ثوانٍ)</span>
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-700 font-bold"
            >
              تلميح: {q.hint}
            </motion.div>
          )}
        </div>
      )}

      {/* Answer feedback and Next controls */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            {selectedIdx === null ? (
              <div className="p-3.5 bg-red-50 border border-red-105 rounded-xl text-red-700 text-xs font-black">
                ⏱️ انتهى وقت التفكير المتاح للسؤال!
              </div>
            ) : selectedIdx === q.correctIndex ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-black flex items-center gap-2">
                <Zap size={14} fill="currentColor" className="text-amber-500 animate-bounce" />
                <span>إجابة صحيحة خارقة! وقت قياسي: +{Math.round(timeLeft * 1.5)} نقطة مظهرة.</span>
              </div>
            ) : (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-black">
                ❌ زلة حظ! الإجابة الصحيحة هي: {q.options[q.correctIndex]}
              </div>
            )}
            
            <button
              onClick={handleNext}
              className="btn-3d w-full flex items-center justify-center gap-2"
            >
              السؤال التالي <ChevronLeft size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
