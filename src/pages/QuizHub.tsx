import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, BrainCircuit, Zap, CheckCircle2, ChevronRight, 
  BookOpen, Layers, Timer, Sparkles, HelpCircle, GraduationCap, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { INTERACTIVE_QUIZZES, SubjectQuizConfig } from '../data/interactiveQuizzes';
import { MatchingQuiz } from '../components/quiz/MatchingQuiz';
import { FillBlanksQuiz } from '../components/quiz/FillBlanksQuiz';
import { TimedChallenge } from '../components/quiz/TimedChallenge';

const subjectLabels: Record<string, { title: string; desc: string; color: string; bg: string; icon: string }> = {
  philosophy: { title: 'الفلسفة والمناهج', desc: 'صراع المذاهب والأطروحات الفكرية', color: 'text-blue-600 border-blue-100', bg: 'bg-blue-50', icon: '🧠' },
  arabic: { title: 'اللغة العربية وآدابها', desc: 'الصور البيانية والقواعد والنزعات الأدبية', color: 'text-emerald-600 border-emerald-100', bg: 'bg-emerald-50', icon: '📝' },
  math: { title: 'الرياضيات والمنطق', desc: 'الدوال واللوغاريتمات والأعداد المركبة والأسس', color: 'text-orange-600 border-orange-100', bg: 'bg-orange-50', icon: '📐' },
  'history-geo': { title: 'التاريخ والجغرافيا', desc: 'الحرب الباردة، الثورة التحريرية والجغرافيا العالمية', color: 'text-indigo-600 border-indigo-100', bg: 'bg-indigo-50', icon: '🌍' },
  islamic: { title: 'العلوم الإسلامية', desc: 'مقاصد الشريعة، الربا والعقائد والأحكام الفقهية', color: 'text-amber-600 border-amber-100', bg: 'bg-amber-50', icon: '🕌' },
};

const modeLabels = {
  matching: { title: 'وصل المصطلحات (Matching)', desc: 'ربط الفلاسفة أو القواعد بتفاسيرها الصحيحة', icon: <Layers size={22} />, color: 'emerald' },
  fillBlanks: { title: 'سد الفراغات (Fill-in-Blanks)', desc: 'إملاء الثغرات لتشكيل مقولة فلسفية متماسكة', icon: <GraduationCap size={22} />, color: 'blue' },
  timed: { title: 'تحدي سباق الوقت (Speed Run)', desc: 'إجابات خاطفة تحت ضغط ثواني التوقيت', icon: <Timer size={22} />, color: 'amber' },
};

export default function QuizHub() {
  const { profile, awardPoints } = useAuth();
  const { theme, themeColors } = useSettings();
  
  const [selectedSubject, setSelectedSubject] = useState<string>('philosophy');
  const [selectedMode, setSelectedMode] = useState<'matching' | 'fillBlanks' | 'timed'>('matching');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [sessionPoints, setSessionPoints] = useState<number>(0);

  const startQuiz = () => {
    setIsPlaying(true);
    setSessionScore(null);
    setSessionPoints(0);
  };

  const quitQuiz = () => {
    setIsPlaying(false);
    setSessionScore(null);
    setSessionPoints(0);
  };

  const handleQuizComplete = (accuracyScore: number, pointBonus: number = 25) => {
    // Determine points rewards based on performance
    const pointsRewarded = Math.round((accuracyScore / 100) * pointBonus);
    setSessionScore(accuracyScore);
    setSessionPoints(pointsRewarded);
    
    // Add points to user account profile!
    if (awardPoints && pointsRewarded > 0) {
      awardPoints(pointsRewarded, `تحدي تفاعلي: ${subjectLabels[selectedSubject]?.title} (${modeLabels[selectedMode]?.title}) بنسبة نجاح ${accuracyScore}% 🧩`);
    }
  };

  const currentConfig: SubjectQuizConfig = INTERACTIVE_QUIZZES[selectedSubject] || INTERACTIVE_QUIZZES.philosophy;

  return (
    <div className="p-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Upper Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="w-10 h-10 rounded-xl bg-white border border-gray-150 flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm"
          >
            <ChevronRight size={20} />
          </Link>
          <h1 className="text-xl font-black text-gray-900">الفضاء التفاعلي للاختبارات</h1>
        </div>
        
        {/* Points Display */}
        <div className="bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-100 flex items-center gap-1.5 text-amber-600">
          <Zap size={14} fill="currentColor" className="animate-pulse" />
          <span className="text-xs font-black">{profile?.points || 0} نقطة زاد</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isPlaying ? (
          <motion.div
            key="hub-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Introductory Card */}
            <div className={`bg-gradient-to-l ${themeColors[theme].gradient} p-5 rounded-3xl text-white shadow-lg relative overflow-hidden text-right`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit size={20} className="animate-bounce" />
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">نادي التحديات</span>
                </div>
                <h3 className="text-lg font-black mb-1">العب وتعلم لتنال الامتياز! 🏆</h3>
                <p className="text-emerald-50 text-xs opacity-90 leading-relaxed">
                  اختبر سرعة استرجاعك للمعلومات وربط المصطلحات لحصد النقاط وتعزيز جاهزيتك الذهنية للبكالوريا.
                </p>
              </div>
              <div className="absolute -left-4 bottom-0 opacity-10">
                <Trophy size={140} />
              </div>
            </div>

            {/* Step 1: Choose Subject */}
            <div>
              <h3 className="text-xs font-black text-gray-400 mb-3 border-r-2 border-emerald-500 pr-2">أولاً: اختر المادة الدراسية</h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.keys(subjectLabels).map((subKey) => {
                  const sub = subjectLabels[subKey];
                  const isSelected = selectedSubject === subKey;
                  
                  return (
                    <button
                      key={subKey}
                      onClick={() => setSelectedSubject(subKey)}
                      className={`card-3d p-4 flex items-center justify-between transition-all ${
                        isSelected 
                          ? `border-2 border-${themeColors[theme].primary} bg-white shadow-md scale-[1.01]` 
                          : 'border border-gray-100 bg-white/80 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.icon}</span>
                        <div className="text-right">
                          <h4 className="font-extrabold text-sm text-gray-900">{sub.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">{sub.desc}</p>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? `border-${themeColors[theme].primary} bg-${themeColors[theme].primary}/10` : 'border-gray-200'
                      }`}>
                        {isSelected && <div className={`w-2.5 h-2.5 rounded-full bg-${themeColors[theme].primary}`} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Game Mode */}
            <div>
              <h3 className="text-xs font-black text-gray-400 mb-3 border-r-2 border-emerald-500 pr-2">ثانياً: اختر نمط التحدي التفاعلي</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.keys(modeLabels).map((modeKey) => {
                  const mode = modeLabels[modeKey as keyof typeof modeLabels];
                  const isSelected = selectedMode === modeKey;
                  
                  return (
                    <button
                      key={modeKey}
                      onClick={() => setSelectedMode(modeKey as any)}
                      className={`card-3d p-4 flex flex-col items-start gap-2.5 text-right transition-all ${
                        isSelected 
                          ? `border-2 border-${themeColors[theme].primary} bg-white shadow-md scale-[1.01]` 
                          : 'border border-gray-100 bg-white/85 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${
                        isSelected ? `bg-${themeColors[theme].primary}/10 text-${themeColors[theme].primary}` : 'bg-gray-50 text-gray-400'
                      }`}>
                        {mode.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-gray-800">{mode.title}</h4>
                        <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">{mode.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Action */}
            <button
              onClick={startQuiz}
              className="btn-3d w-full py-4 font-black text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles size={18} />
              <span>انطلاق إلى التحدي الآن</span>
            </button>

          </motion.div>
        ) : (
          <motion.div
            key="game-arena"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl relative text-right"
          >
            {/* Quit Header button */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">{subjectLabels[selectedSubject]?.icon}</span>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-950">{subjectLabels[selectedSubject]?.title}</h3>
                  <p className="text-[10px] text-gray-400">{modeLabels[selectedMode]?.title}</p>
                </div>
              </div>
              <button 
                onClick={quitQuiz}
                className="px-3 py-1.5 text-xs font-black text-gray-650 hover:text-rose-650 bg-gray-50 hover:bg-rose-50 rounded-xl transition-all"
              >
                إنهاء التحدي والخروج
              </button>
            </div>

            {/* Render Component based on chosen selection */}
            {sessionScore === null ? (
              <div className="min-h-[300px] flex flex-col justify-center">
                {selectedMode === 'matching' && (
                  <MatchingQuiz 
                    items={currentConfig.matching} 
                    onComplete={(score) => handleQuizComplete(score, 50)} 
                  />
                )}
                {selectedMode === 'fillBlanks' && (
                  <FillBlanksQuiz 
                    questions={currentConfig.fillBlanks} 
                    onComplete={(score) => handleQuizComplete(score, 60)} 
                  />
                )}
                {selectedMode === 'timed' && (
                  <TimedChallenge 
                    questions={currentConfig.timed} 
                    onComplete={(score, points) => handleQuizComplete(score, points)} 
                  />
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
                  <Trophy size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">تحدي رائع، بطل!</h3>
                <p className="text-gray-500 text-xs mb-6">لقد أكملت المهمة وحصلت على العلامة التالية.</p>
                
                <div className="bg-emerald-50 p-6 rounded-2xl mb-8 max-w-sm mx-auto">
                  <p className="text-emerald-850 text-xs font-bold mb-1">معدل الإجابات الإجمالية</p>
                  <p className="text-4xl font-black text-emerald-600 mb-2">{sessionScore}%</p>
                  <p className="text-[11px] text-emerald-600">
                    🏆 نقاط زاد المضافة: <span className="font-black">+{sessionPoints} نقطة</span>
                  </p>
                </div>

                <div className="flex gap-3 max-w-sm mx-auto">
                  <button 
                    onClick={startQuiz}
                    className="btn-3d flex-1 flex items-center justify-center gap-2 text-xs"
                  >
                    <RefreshCw size={14} /> العب مجدداً
                  </button>
                  <button 
                    onClick={quitQuiz}
                    className="btn-3d-secondary flex-1 flex items-center justify-center gap-1.5 text-xs"
                  >
                    رجوع للرئيسية
                  </button>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
