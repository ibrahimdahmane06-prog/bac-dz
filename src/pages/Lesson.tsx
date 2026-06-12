import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Play, FileText, Headphones, Download, CheckCircle, ArrowLeft, ArrowRight, BookOpen, BrainCircuit, Volume2, Info, History, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { QuizComponent } from '../components/quiz/QuizComponent';
import { CollapsibleSection } from '../components/lesson/CollapsibleSection';
import { ConceptDiagram } from '../components/lesson/ConceptDiagram';
import { VideoPlayer } from '../components/lesson/VideoPlayer';
import { LessonMindMap } from '../components/lesson/LessonMindMap';
import { HistoryGeoTables } from '../components/lesson/HistoryGeoTables';
import { generateMindMapFromContent } from '../utils/mindMapGenerator';
import { getLessonVideoUrl } from '../utils/videoLinks';
import { getLessonBacQuestions } from '../utils/bacQuestions';
import { getQuizForLesson } from '../utils/quizLoader';
import { doc, setDoc, getDoc, serverTimestamp, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS_CONTENT } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

const Lesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, awardPoints } = useAuth();
  const { getFontSizeClass, fontSize, updateFontSize } = useSettings();
  const [activeTab, setActiveTab] = useState('content');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speakingTerm, setSpeakingTerm] = useState<number | null>(null);
  const [isReadingLesson, setIsReadingLesson] = useState(false);
  const [dbProgress, setDbProgress] = useState<{ status: string; score: number } | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    
    const fetchProgress = async () => {
      try {
        const progressRef = doc(db, `users/${user.uid}/progress`, id);
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          setDbProgress({ status: data.status, score: data.score || 0 });
        } else {
          setDbProgress(null);
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    };
    
    fetchProgress();
  }, [user, id]);

  const handleCompleteLesson = async () => {
    if (!user || !id) return;
    if (dbProgress?.status === 'completed') return;
    
    try {
      const progressRef = doc(db, `users/${user.uid}/progress`, id);
      await setDoc(progressRef, {
        userId: user.uid,
        lessonId: id,
        status: 'completed',
        score: dbProgress?.score || 0,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setDbProgress(prev => ({ status: 'completed', score: prev?.score || 0 }));
      await awardPoints(20, `إكمال قراءة وفهم درس: ${lessonData?.title || 'درس جديد'} 📖`);
    } catch (err) {
      console.error('Error completing lesson:', err);
    }
  };

  const handleSpeak = (text: string, lang: string = 'ar-SA', index: number | 'lesson') => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    
    // Clean text from markdown characters for better reading
    const cleanText = text.replace(/[#*`_]/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a better Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('ar') || v.lang.includes('SA'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.lang = lang;
    utterance.pitch = 1;
    utterance.rate = 0.9; // Slightly slower for better clarity
    
    if (index === 'lesson') {
      utterance.onstart = () => {
        setIsReadingLesson(true);
        setIsPlaying(true);
      };
      utterance.onend = () => {
        setIsReadingLesson(false);
        setIsPlaying(false);
      };
      utterance.onpause = () => setIsPlaying(false);
      utterance.onresume = () => setIsPlaying(true);
    } else {
      utterance.onstart = () => setSpeakingTerm(index);
      utterance.onend = () => setSpeakingTerm(null);
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsReadingLesson(false);
      setIsPlaying(false);
      setSpeakingTerm(null);
    }
  };

  // Sync isPlaying with TTS
  const togglePlayLesson = () => {
    if (isReadingLesson) {
      if (window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          window.speechSynthesis.pause();
          setIsPlaying(false);
        }
      }
    } else {
      handleSpeak(lessonData.content, 'ar-SA', 'lesson');
    }
  };

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalScroll > 0) {
        setScrollProgress((currentScroll / totalScroll) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Find lesson in constants
  let lessonData: any = null;
  let nextLessonId: string | null = null;
  const lessonId = id || '';

  useEffect(() => {
    if (lessonId) {
      localStorage.setItem('last_visited_lesson', lessonId);
    }
  }, [lessonId]);
  
  const allLessons: any[] = [];
  let subjectName = "المادة";
  let subjectId = "";
  Object.entries(SUBJECTS_CONTENT).forEach(([key, subject]: [string, any]) => {
    const containsLesson = subject.units.some((unit: any) => 
      unit.lessons.some((l: any) => l.id === lessonId)
    );
    if (containsLesson) {
      subjectName = subject.title;
      subjectId = key;
    }
    subject.units.forEach((unit: any) => {
      unit.lessons.forEach((l: any) => allLessons.push(l));
    });
  });

  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  if (currentIndex !== -1) {
    lessonData = allLessons[currentIndex];
    if (currentIndex < allLessons.length - 1) {
      nextLessonId = allLessons[currentIndex + 1].id;
    }
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 mb-6">
          <BookOpen size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">عذراً، الدرس غير موجود</h2>
        <p className="text-gray-500 mb-8 max-w-[280px]">يبدو أن الرابط الذي اتبعته غير صحيح أو أن الدرس قد تم نقله.</p>
        <button 
          onClick={() => navigate('/')}
          className="btn-3d bg-emerald-600 text-white px-10"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const lessonMindMapData = React.useMemo(() => {
    if (lessonData.mindMap && lessonData.mindMap.length > 0) {
      return lessonData.mindMap;
    }
    return generateMindMapFromContent(lessonData.content, lessonData.title);
  }, [lessonData]);

  const lessonVideoUrl = React.useMemo(() => {
    if (!lessonData) return '';
    if (lessonData.videoUrl) return lessonData.videoUrl;
    return getLessonVideoUrl(lessonData.id);
  }, [lessonData]);

  const lessonBacQuestions = React.useMemo(() => {
    if (!lessonData) return [];
    if (lessonData.frequentQuestions && lessonData.frequentQuestions.length > 0) {
      return lessonData.frequentQuestions;
    }
    return getLessonBacQuestions(lessonData.id, lessonData.title);
  }, [lessonData]);

  const lessonQuizQuestions = React.useMemo(() => {
    if (!lessonData) return [];
    if (lessonData.quiz && lessonData.quiz.length > 0) {
      return lessonData.quiz;
    }
    return getQuizForLesson(lessonData.id, lessonData.title, lessonData.content);
  }, [lessonData]);

  const handleQuizComplete = async (score: number, correctCount?: number, totalCount?: number) => {
    if (!user || !id) return;
    
    try {
      const progressRef = doc(db, `users/${user.uid}/progress`, id);
      await setDoc(progressRef, {
        userId: user.uid,
        lessonId: id,
        status: 'completed',
        score: score,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const isFirstTimeCompletion = dbProgress?.status !== 'completed';
      setDbProgress({ status: 'completed', score: score });

      let pts = 0;
      if (isFirstTimeCompletion) {
        pts += 20; // 20 pts for lesson completion
      }
      
      let quizPts = 15; // standard quiz reward
      let correctBonus = 0;
      if (correctCount !== undefined) {
        correctBonus = correctCount * 5; // +5 points per correct answer
      } else {
        correctBonus = Math.round((score / 100) * 5 * 5);
      }
      
      pts += quizPts + correctBonus;
      
      let reason = '';
      if (score === 100) {
        pts += 15; // Perfect score bonus
        reason = `درجة كاملة (100%) في اختبار درس: ${lessonData?.title || 'درس جديد'}! 🏆`;
      } else {
        reason = `إكمال اختبار درس: ${lessonData?.title || 'درس متميز'} بنجاح (${score}%) 🎯`;
      }

      await awardPoints(pts, reason);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-600">
          <ChevronRight size={24} />
        </button>
        <h2 className="font-extrabold text-gray-950 truncate px-4 flex-1 text-right">{lessonData.title}</h2>
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-150">
          {(['sm', 'md', 'lg', 'xl'] as const).map(sz => (
            <button
              key={sz}
              onClick={() => updateFontSize(sz)}
              className={`px-2.5 py-1 text-xs font-black rounded-full transition-all ${
                fontSize === sz 
                  ? 'bg-emerald-600 text-white shadow-sm scale-105' 
                  : 'text-gray-400 hover:text-gray-900'
              }`}
              title={sz === 'sm' ? 'خط صغير' : sz === 'md' ? 'خط متوسط' : sz === 'lg' ? 'خط كبير' : 'خط كبير جداً'}
            >
              {sz === 'sm' ? 'أ' : sz === 'md' ? 'أ+' : sz === 'lg' ? 'أ++' : 'أ+++'}
            </button>
          ))}
        </div>
        {/* Scroll Progress Bar Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-50">
          <motion.div 
            className="h-full bg-emerald-500" 
            style={{ width: `${scrollProgress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 sticky top-[57px] bg-white z-20 overflow-x-auto no-scrollbar">
        {[
          { id: 'content', icon: <FileText size={18} />, label: 'الدرس' },
          { id: 'mindmap', icon: <BrainCircuit size={18} />, label: 'خارطة' },
          { id: 'video', icon: <Play size={18} />, label: 'فيديو' },
          { id: 'questions', icon: <History size={18} />, label: 'أسئلة' },
          { id: 'quiz', icon: <BrainCircuit size={18} />, label: 'اختبار' },
          { id: 'summary', icon: <Download size={18} />, label: 'ملخص' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[70px] py-4 flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-gray-400'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6 pb-32">
        {activeTab === 'content' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Action Completion Card */}
            <div className="mb-6 p-4 rounded-[24px] border border-gray-100 flex items-center justify-between bg-gray-50/50 hover:bg-white transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  dbProgress?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  <CheckCircle size={20} />
                </div>
                <div className="text-right">
                  <h4 className="font-extrabold text-xs text-gray-800">حالة تقدم الدرس</h4>
                  <p className="text-[10px] text-gray-400">
                    {dbProgress?.status === 'completed' 
                      ? 'تم إكمال هذا الدرس بنجاح وبقيمة مرتفعة! ✨' 
                      : 'اضغط لتأكيد فهم الدرس وكسب النقاط'}
                  </p>
                </div>
              </div>
              
              {dbProgress?.status === 'completed' ? (
                <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1">
                  <span>تم الإكمال</span>
                  <span>🏆</span>
                </div>
              ) : (
                <button
                  onClick={handleCompleteLesson}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-100 active:scale-95 cursor-pointer shrink-0"
                >
                  إكمال الآن (+20)
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mb-6 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  <Headphones size={18} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">شرح صوتي آلي</h4>
                  <p className="text-[10px] text-emerald-500">استمع لمتن الدرس كاملاً</p>
                </div>
              </div>
              <button 
                onClick={() => isReadingLesson ? stopSpeaking() : handleSpeak(lessonData.content.replace(/[#*`]/g, ''), 'ar-SA', 'lesson')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isReadingLesson ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isReadingLesson ? (
                  <><div className="flex gap-0.5"><div className="w-0.5 h-3 bg-white"></div><div className="w-0.5 h-3 bg-white"></div></div> إيقاف</>
                ) : (
                  <><Volume2 size={16} /> قراءة الدرس</>
                )}
              </button>
            </div>

            <div className={`prose prose-emerald arabic-text max-w-none mb-8 ${getFontSizeClass('body')}`}>
              <ReactMarkdown>{lessonData.content}</ReactMarkdown>
            </div>

            {/* Terms with Pronunciation */}
            {lessonData.terms && lessonData.terms.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Volume2 size={18} className="text-emerald-500" /> مفاهيم أساسية بالصوت
                </h3>
                <div className="space-y-3">
                  {lessonData.terms.map((term: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{term.name}</h4>
                        <p className="text-[10px] text-gray-500">{term.pronunciation}</p>
                      </div>
                      <button 
                        onClick={() => handleSpeak(term.name, 'ar-SA', i)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all ${
                          speakingTerm === i ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white text-emerald-600'
                        }`}
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Diagram (Show only for Philosophy for demo) */}
            {id?.startsWith('phil') && <ConceptDiagram />}
            
            {/* Collapsible Sections */}
            {lessonData.detailedSections && lessonData.detailedSections.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info size={18} className="text-emerald-500" /> تفاصيل معمقة
                </h3>
                {lessonData.detailedSections.map((section: any, i: number) => (
                  <CollapsibleSection key={i} title={section.title}>
                    {section.content}
                  </CollapsibleSection>
                ))}
              </div>
            )}

            <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                <Headphones size={20} /> شرح صوتي للدرس
              </h3>
              <p className="text-sm text-emerald-600 mb-4">استمع لشرح الأستاذ الآلي لهذا الدرس بالتفصيل من خلال تقنية قراءة النصوص.</p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlayLesson}
                  className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 shadow-lg transition-all active:scale-90"
                >
                  {isPlaying ? (
                    <div className="flex gap-1">
                      <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white" />
                      <motion.div animate={{ height: [12, 4, 12] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white" />
                      <motion.div animate={{ height: [6, 14, 6] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white" />
                    </div>
                  ) : <Play size={20} fill="currentColor" />}
                </button>
                <div className="flex-1 h-1.5 bg-emerald-200 rounded-full relative overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: isPlaying ? '100%' : '0%' }} 
                    transition={{ duration: isPlaying ? 120 : 0, ease: "linear" }} 
                    className="absolute top-0 left-0 h-full bg-emerald-500" 
                  />
                </div>
                <button onClick={stopSpeaking} className="text-[10px] font-bold text-emerald-700 underline px-2">إيقاف كلي</button>
              </div>
            </div>

            {/* Custom Interactive History & Geography Tables */}
            <HistoryGeoTables subjectId={subjectId} />
          </motion.div>
        )}

        {activeTab === 'mindmap' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {lessonMindMapData && lessonMindMapData.length > 0 ? (
              <LessonMindMap 
                data={lessonMindMapData} 
                lessonTitle={lessonData.title} 
                subjectName={subjectName} 
                lessonId={lessonData.id}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-4">
                  <BrainCircuit size={40} />
                </div>
                <h4 className="font-bold text-gray-400">لا توجد خارطة ذهنية لهذا الدرس</h4>
                <p className="text-xs text-gray-300">سيتم إضافتها قريباً.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'video' && (
          <VideoPlayer 
            url={lessonVideoUrl} 
            lessonId={lessonData.id}
            lessonTitle={lessonData.title}
            poster={lessonData.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"} 
          />
        )}
        
        {activeTab === 'questions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 mb-8">
              <h3 className="text-lg font-black text-amber-800 mb-2 flex items-center gap-2">
                <History size={24} /> الأسئلة الأكثر وروداً في البكالوريا
              </h3>
              <p className="text-sm text-amber-700">هذه الأسئلة تم جمعها من دورات البكالوريا السابقة لمساعدتك على فهم نمط الاختبار وكيفية طرح الأسئلة الوزارية.</p>
            </div>

            {lessonBacQuestions && lessonBacQuestions.length > 0 ? (
              <div className="space-y-4">
                {lessonBacQuestions.map((item: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        {item.year || 'دورة سابقة'}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                    <h4 className="font-black text-gray-900 mb-3 text-sm leading-relaxed">
                      {item.question}
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-50 group-hover:border-amber-100 transition-all">
                      <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                        <span className="text-amber-700 font-bold block mb-1">الإجابة النموذجية الوزارية:</span>
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-4">
                  <History size={40} />
                </div>
                <h4 className="font-bold text-gray-400">لا توجد أسئلة مكررة لهذا الدرس حالياً</h4>
                <p className="text-xs text-gray-300">سيتم إضافة الأسئلة فور توفرها.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'quiz' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {lessonQuizQuestions && lessonQuizQuestions.length > 0 ? (
              <QuizComponent questions={lessonQuizQuestions} onComplete={handleQuizComplete} />
            ) : (
              <div className="p-10 text-center text-gray-400">الاختبار غير متوفر حالياً لهذا الدرس.</div>
            )}
          </motion.div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100"
            >
              <h3 className="text-xl font-black text-emerald-800 mb-4 flex items-center gap-2">
                <FileText size={24} /> ملخص الدرس المكتوب
              </h3>
              <p className={`text-emerald-900 leading-relaxed arabic-text whitespace-pre-wrap ${getFontSizeClass('body')}`}>
                {lessonData.summary}
              </p>
            </motion.div>

            <div className="bg-white p-8 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                <Download size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">تحميل النسخة الجاهزة للطباعة</h3>
              <p className="text-xs text-gray-500 mb-8 max-w-[200px]">ملخص شامل ومنظم وجاهز للطباعة والمراجعة السريعة في ملف PDF.</p>
              <button className="btn-3d w-full flex items-center justify-center gap-2">
                <Download size={20} /> تحميل PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-4 z-30">
        <button onClick={() => navigate(-1)} className="flex-1 btn-3d-secondary flex items-center justify-center gap-2">
           <ArrowRight size={20} /> السابق 
        </button>
        <button 
          onClick={() => {
            if (activeTab !== 'quiz' && lessonQuizQuestions && lessonQuizQuestions.length > 0) {
              setActiveTab('quiz');
            } else if (nextLessonId) {
              navigate(`/lesson/${nextLessonId}`);
              setActiveTab('content');
              window.scrollTo(0, 0);
            } else {
              navigate('/');
            }
          }}
          className="flex-[2] btn-3d flex items-center justify-center gap-2"
        >
          {activeTab === 'quiz' ? (nextLessonId ? 'الدرس التالي' : 'إنهاء الدرس') : 'بدء الاختبار'} <CheckCircle size={20} />
        </button>
      </div>
    </div>
  );
};

export default Lesson;

