import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy, RotateCcw } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizProps {
  questions: Question[];
  onComplete: (score: number, correctCount?: number, totalCount?: number) => void;
}

export const QuizComponent: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === questions[currentQuestion].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      onComplete(Math.round((score / questions.length) * 100), score, questions.length);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10"
      >
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">أحسنت القول!</h3>
        <p className="text-gray-500 mb-6">لقد أكملت الاختبار بنجاح</p>
        
        <div className="bg-emerald-50 p-6 rounded-2xl mb-8">
          <p className="text-emerald-800 text-sm mb-1">نتيجتك النهائية</p>
          <p className="text-4xl font-black text-emerald-600">{percentage}%</p>
          <p className="text-xs text-emerald-600 mt-2">({score} من أصل {questions.length} إجابات صحيحة)</p>
        </div>

        <button 
          onClick={restartQuiz}
          className="btn-3d-secondary w-full mb-4 flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} /> إعادة المحاولة
        </button>
      </motion.div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          السؤال {currentQuestion + 1} من {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 w-6 rounded-full transition-all ${
                i === currentQuestion ? 'bg-emerald-500' : i < currentQuestion ? 'bg-emerald-200' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-8 leading-relaxed">
        {question.question}
      </h3>

      <div className="space-y-4 mb-10">
        {question.options.map((option, index) => {
          let stateClass = "bg-white border-gray-100 hover:border-emerald-200 active:bg-gray-50";
          if (isAnswered) {
            if (index === question.correctIndex) {
              stateClass = "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_4px_0_0_rgba(16,185,129,1)]";
            } else if (index === selectedOption) {
              stateClass = "bg-red-50 border-red-500 text-red-700 shadow-[0_4px_0_0_rgba(239,68,68,1)]";
            } else {
              stateClass = "bg-gray-50 border-gray-100 text-gray-400 grayscale";
            }
          }

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
              className={`w-full p-5 rounded-2xl border text-right font-bold text-sm transition-all flex items-center justify-between ${stateClass}`}
            >
              <span>{option}</span>
              {isAnswered && index === question.correctIndex && <CheckCircle2 size={20} className="text-emerald-600" />}
              {isAnswered && index === selectedOption && index !== question.correctIndex && <XCircle size={20} className="text-red-600" />}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button 
              onClick={nextQuestion}
              className="btn-3d w-full flex items-center justify-center gap-2"
            >
              التالي <ChevronLeft size={20} />
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-4">
              {selectedOption === question.correctIndex ? 'إجابة صحيحة! استمر في التقدم.' : 'لا تقلق، تعلم من خطئك وواصل المراجعة.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
