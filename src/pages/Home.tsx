import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, BookOpen, Feather, History, Globe, Sparkles, Clock, Star, Lightbulb, MessageSquareQuote, Search, Settings, Check, Palette, Play, ChevronLeft, Camera, FileText, Eye, EyeOff, Grid, List, ArrowUp, ArrowDown, RotateCcw, Trophy, BrainCircuit, GraduationCap, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

import { SUBJECTS_CONTENT } from '../constants';

const lucideIcons: any = {
  Book, BookOpen, Feather, History, Globe, Sparkles, Clock, Star, FileText, Lightbulb
};

const defaultColorMap: any = {
  'arabic': 'emerald',
  'philosophy': 'blue',
  'history-geo': 'orange',
  'math': 'blue',
  'french': 'indigo',
  'english': 'purple',
  'islamic': 'amber',
};

const colorClasses: any = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-100' },
  red: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-500', border: 'border-cyan-100' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const Home: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const isSubjectsPage = location.pathname === '/subjects';
  const { 
    fontSize, 
    theme, 
    homeLayout, 
    updateFontSize, 
    updateTheme, 
    updateHomeLayout, 
    resetAllSettings, 
    getFontSizeClass, 
    themeColors 
  } = useSettings();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCustomizer, setShowCustomizer] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [customColors, setCustomColors] = React.useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('subject_colors');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Error parsing subject colors:", e);
      return {};
    }
  });

  const subjects = React.useMemo(() => {
    const order = homeLayout.subjectsOrder || ['philosophy', 'arabic', 'history-geo', 'islamic', 'english', 'french', 'math'];
    const sortedSubjects = [...Object.values(SUBJECTS_CONTENT)].sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sortedSubjects.map(sub => {
      const colorName = customColors[sub.id] || defaultColorMap[sub.id] || 'emerald';
      const classes = colorClasses[colorName] || colorClasses.emerald;
      const lessonCount = sub.units.reduce((acc, unit) => acc + unit.lessons.length, 0);

      return {
        id: sub.id,
        title: sub.title,
        icon: React.createElement(lucideIcons[sub.icon as keyof typeof lucideIcons] || Book, { 
          className: classes.text,
          size: 20
        }),
        colorClass: classes.bg,
        borderClass: classes.border,
        colorName: colorName,
        count: `${lessonCount} درس`
      };
    });
  }, [customColors, homeLayout.subjectsOrder]);

  const handleUpdateColor = (subjectId: string, color: string) => {
    const newColors = { ...customColors, [subjectId]: color };
    setCustomColors(newColors);
    localStorage.setItem('subject_colors', JSON.stringify(newColors));
  };

  const filteredSubjects = React.useMemo(() => {
    return subjects.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, subjects]);

  const allLessons = React.useMemo(() => {
    const list: any[] = [];
    Object.values(SUBJECTS_CONTENT).forEach(sub => {
      sub.units.forEach(unit => {
        unit.lessons.forEach(l => {
          list.push({ ...l, subjectTitle: sub.title });
        });
      });
    });
    return list;
  }, []);

  const filteredLessons = React.useMemo(() => {
    if (!searchQuery) return [];
    return allLessons.filter(l => 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.summary && l.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, allLessons]);

  const lastVisitedLessonId = React.useMemo(() => localStorage.getItem('last_visited_lesson'), []);
  const lastVisitedLesson = React.useMemo(() => {
    if (!lastVisitedLessonId) return null;
    let found: any = null;
    Object.values(SUBJECTS_CONTENT).forEach(sub => {
      sub.units.forEach(unit => {
        const l = unit.lessons.find((les: any) => les.id === lastVisitedLessonId);
        if (l) found = { ...l, subjectId: sub.id };
      });
    });
    return found;
  }, [lastVisitedLessonId]);

  const [copied, setCopied] = React.useState(false);
  const [tipIndex, setTipIndex] = React.useState(() => {
    return new Date().getDate();
  });

  const tipsList = React.useMemo(() => [
    { id: 1, icon: <Lightbulb className="text-amber-500" size={20} />, text: "ابدأ بأصعب مادة وعالج المفاهيم المعقدة عندما يكون ذهنك في قمة نشاطه (عادة بعد صلاة الفجر).", type: "نصيحة دراسية" },
    { id: 2, icon: <Clock className="text-blue-500" size={20} />, text: "استخدم تقنية البومودورو (25 دقيقة مراجعة جادة تلحقها 5 دقائق استراحة) لتجديد طاقتك العقلية.", type: "تنظيم الوقت" },
    { id: 3, icon: <Star className="text-yellow-500" size={20} />, text: "تخيل فرحة والديك وعائلتك الكريمة يوم ظهور نتائج البكالوريا بمعدل ممتاز.. اجعل تلك اللحظة وقودك وعزيمتك!", type: "جرعة تحفيزية" },
    { id: 4, icon: <Book className="text-purple-500" size={20} />, text: "التلخيص الفردي وبخط يدك هو بمثابة ترسيخ نصف الفهم وتسهيل الاسترجاع الذكي للمصطلحات والدروس.", type: "منهجية المراجعة" },
    { id: 5, icon: <MessageSquareQuote className="text-orange-500" size={20} />, text: "قليل دائم خير وباقٍ من تراكم كبير منقطع. خصص وردًا يوميًا ثابتًا وراجع بانتظام وبخطوات مستمرة.", type: "تنظيم وقتك" },
    { id: 6, icon: <Sparkles className="text-pink-500" size={20} />, text: "النجاح ليس ضربة حظ، بل هو نتيجة تراكم الساعات والمجهود الصبر والاجتهاد المستمر والمقاومة اليومية.", type: "عزيمة وإصرار" },
    { id: 7, icon: <FileText className="text-indigo-500" size={20} />, text: "حل مواضيع البكالوريا الرسمية السابقة (من 2020 إلى 2024) يكسبك ثقة بالنفس وفهماً دقيقاً لطبيعة أسئلة اللجان.", type: "منهجية المراجعة" },
    { id: 8, icon: <Clock className="text-emerald-500" size={20} />, text: "تنظيم موعد النوم المريح والاستيقاظ مبكراً يعالج الكفاءة الدماغية في حفظ واسترجاع المعلومات بنسبة كبيرة.", type: "نصيحة صحية" },
    { id: 9, icon: <Sparkles className="text-amber-500" size={20} />, text: "ابتعد تماماً عن الأصوات السلبية والمثبطة التي تقيدك. أنت تملك من العزيمة ما يكفي لنيل تذكرة الامتياز في الباك!", type: "جرعة تحفيزية" },
    { id: 10, icon: <Lightbulb className="text-blue-500" size={20} />, text: "في العلوم والفيزياء والرياضيات، تأتي مرحلة تطبيق القوانين وحل المسائل لتدعيم الأسس التي تحفظها.", type: "منهجية المراجعة" },
    { id: 11, icon: <Book className="text-emerald-500" size={20} />, text: "في الفلسفة، تجنب الحفظ الأعمى للمقالات الجاهزة، وافهم المناهج وصراع المواقف المتضاربة لتبرز تماسك فكرك.", type: "نصيحة دراسية" },
    { id: 12, icon: <Star className="text-rose-500" size={20} />, text: "الخطأ الذي ترتكبه أثناء حل تمرين منزلي اليوم هو هدية مجانية تحميك من ارتكابه يوم الامتحان المصيري.", type: "عزيمة وإصرار" },
    { id: 13, icon: <MessageSquareQuote className="text-indigo-500" size={20} />, text: "خصص نصف ساعة نهاية كل أسبوع لمراجعة وحصر العناوين التي أكملتها لتثبيت خلايا حفظك في الذاكرة بعيدة المدى.", type: "تنظيم الوقت" },
    { id: 14, icon: <Lightbulb className="text-pink-500" size={20} />, text: "نصف العلامة يكمن في تنظيم ورقة الامتحان والكتابة بخط واضح مفهوم يعطي المصحح راحة في مراجعة مجهودك الأكاديمي.", type: "منهجية المراجعة" },
  ], []);

  const currentTip = React.useMemo(() => {
    return tipsList[tipIndex % tipsList.length];
  }, [tipIndex, tipsList]);

  const handleNextTip = () => {
    setTipIndex(prev => prev + 1);
  };

  const handleCopyTip = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`نصيحة اليوم من زاد البكالوريا 🏆: "${currentTip.text}"`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      {!searchQuery && (
        <>
          {isSubjectsPage ? (
            <header className="mb-6 mt-4 text-right" style={{ direction: 'rtl' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-black text-gray-950 mb-1">المواد الدراسية 📚</h1>
                  <p className="text-gray-500 text-xs">تصفّح وراجع المقررات الرسمية لشعبة الآداب والفلسفة بكالوريا 2027</p>
                </div>
                <button
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center ${
                    showCustomizer 
                      ? `bg-${themeColors[theme].primary} border-${themeColors[theme].primary} text-white shadow-lg` 
                      : `bg-white border-gray-150 text-gray-650 hover:text-${themeColors[theme].primary} shadow-sm hover:scale-105`
                  }`}
                  title="تخصيص مظهر التطبيق والخط والتخطيط"
                >
                  <Palette size={20} className={showCustomizer ? 'animate-pulse' : ''} />
                </button>
              </div>
            </header>
          ) : (
            <header className="mb-8 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-950 mb-1">أهلاً بك، {profile?.displayName?.split(' ')[0]} 👋</h1>
                  <p className="text-gray-500 text-sm">استعد لبكالوريا 2027 بكل ثقة!</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCustomizer(!showCustomizer)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                      showCustomizer 
                        ? `bg-${themeColors[theme].primary} border-${themeColors[theme].primary} text-white shadow-lg` 
                        : `bg-white border-gray-150 text-gray-650 hover:text-${themeColors[theme].primary} shadow-sm hover:scale-105`
                    }`}
                    title="تخصيص مظهر التطبيق والخط والتخطيط"
                  >
                    <Palette size={20} className={showCustomizer ? 'animate-pulse' : ''} />
                  </button>
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-${themeColors[theme].primary}/30 shrink-0 shadow-sm`}>
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                        {profile?.displayName?.[0] || 'ت'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Level Stats */}
              {homeLayout.showStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm hover:scale-[1.01] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">نقاطك</p>
                      <p className="font-extrabold text-gray-950 text-sm">{profile?.points || 0}</p>
                    </div>
                  </div>
                  <div className={`bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm hover:scale-[1.01] transition-all`}>
                    <div className={`w-10 h-10 rounded-xl bg-${themeColors[theme].primary}/10 flex items-center justify-center text-${themeColors[theme].primary}`}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">أيام المداومة</p>
                      <p className="font-extrabold text-gray-950 text-sm">{profile?.streakDays || 1}</p>
                    </div>
                  </div>
                </div>
              )}
            </header>
          )}

          {/* Customizer Control Center Drawer */}
          <AnimatePresence>
            {showCustomizer && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`mb-8 bg-white border-2 border-${themeColors[theme].primary}/20 p-5 rounded-[28px] shadow-xl overflow-hidden`}
                style={{ direction: 'rtl' }}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${themeColors[theme].primary} animate-pulse`}></span>
                    <h3 className="font-extrabold text-base text-gray-900">تخصيص مظهر وتخطيط التطبيق 🌌</h3>
                  </div>
                  <button 
                    onClick={resetAllSettings}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold transition-all"
                    title="إعادة التعيين الافتراضي بكبسة واحدة"
                  >
                    <RotateCcw size={12} />
                    <span>إعادة الضبط</span>
                  </button>
                </div>

                {/* 1. Select Color Theme */}
                <div className="mb-5">
                  <h4 className="text-xs font-black text-gray-500 mb-2.5">اختر سمة ومظهر الألوان 🎨</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: 'emerald', name: 'الزمرد الأخضر', accent: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-200' },
                      { value: 'sapphire', name: 'الياقوت الأزرق', accent: 'bg-blue-500 hover:bg-blue-600 border-blue-200' },
                      { value: 'violet', name: 'الأرجوان البنفسجي', accent: 'bg-purple-500 hover:bg-purple-600 border-purple-200' },
                      { value: 'bronze', name: 'البرونز الدافئ', accent: 'bg-amber-600 hover:bg-amber-700 border-amber-250' },
                      { value: 'charcoal', name: 'الفحم المعتم', accent: 'bg-slate-800 hover:bg-slate-900 border-slate-350' }
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => updateTheme(t.value as any)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                          theme === t.value 
                            ? 'border-gray-900 bg-white shadow-md scale-105' 
                            : 'border-gray-100 bg-gray-50/50 hover:bg-white'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full ${t.accent} shadow-sm border flex items-center justify-center text-white`}>
                          {theme === t.value && <Check size={12} />}
                        </div>
                        <span className="text-[10px] font-black text-gray-700">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Select Font Size with Interactive Live Preview */}
                <div className="mb-5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-500 mb-2">حجم خط مراجعة الدروس والملخصات 📏</h4>
                  <div className="flex gap-2 mb-3">
                    {[
                      { value: 'sm', name: 'خط صغير' },
                      { value: 'md', name: 'خط متوسط' },
                      { value: 'lg', name: 'خط كبير' },
                      { value: 'xl', name: 'كبير جداً' }
                    ].map(sz => (
                      <button
                        key={sz.value}
                        onClick={() => updateFontSize(sz.value as any)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all ${
                          fontSize === sz.value 
                            ? `bg-${themeColors[theme].primary} text-white shadow-md scale-105` 
                            : 'bg-white border border-gray-150 text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {sz.name}
                      </button>
                    ))}
                  </div>
                  {/* Live preview paragraph */}
                  <div className="bg-white p-3 rounded-xl border border-gray-100 min-h-[50px] flex items-center justify-center">
                    <p className={`text-gray-800 font-bold text-center leading-relaxed transition-all ${getFontSizeClass('body')}`}>
                      📖 "العلم صيدٌ والكتابة قيدُه، فقيّد صيودك بالحبال الواثقة."
                    </p>
                  </div>
                </div>

                {/* 3. Toggle Homepage Elements (Show/Hide) */}
                <div className="mb-5">
                  <h4 className="text-xs font-black text-gray-500 mb-2">مكونات الصفحة الرئيسية (إظهار أو إخفاء) 👁️</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      onClick={() => updateHomeLayout({ showStats: !homeLayout.showStats })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        homeLayout.showStats ? `bg-${themeColors[theme].primary}/5 border-${themeColors[theme].primary}/20 text-${themeColors[theme].primary}` : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {homeLayout.showStats ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>عداد نقاطي والنشاط اليومي</span>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${homeLayout.showStats ? `bg-${themeColors[theme].primary}` : 'bg-gray-300'}`}></div>
                    </button>

                    <button
                      onClick={() => updateHomeLayout({ showTip: !homeLayout.showTip })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        homeLayout.showTip ? `bg-${themeColors[theme].primary}/5 border-${themeColors[theme].primary}/20 text-${themeColors[theme].primary}` : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {homeLayout.showTip ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>نصائح المذاكرة اليومية والتحفيز</span>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${homeLayout.showTip ? `bg-${themeColors[theme].primary}` : 'bg-gray-300'}`}></div>
                    </button>

                    <button
                      onClick={() => updateHomeLayout({ showSolver: !homeLayout.showSolver })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        homeLayout.showSolver ? `bg-${themeColors[theme].primary}/5 border-${themeColors[theme].primary}/20 text-${themeColors[theme].primary}` : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {homeLayout.showSolver ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>مساعد وحلال التمارين بالصور 📸</span>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${homeLayout.showSolver ? `bg-${themeColors[theme].primary}` : 'bg-gray-300'}`}></div>
                    </button>

                    <button
                      onClick={() => updateHomeLayout({ showPhilosophyCard: !homeLayout.showPhilosophyCard })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        homeLayout.showPhilosophyCard ? `bg-${themeColors[theme].primary}/5 border-${themeColors[theme].primary}/20 text-${themeColors[theme].primary}` : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {homeLayout.showPhilosophyCard ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>ركن الفلسفة الذكي التفاعلي ✍️</span>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${homeLayout.showPhilosophyCard ? `bg-${themeColors[theme].primary}` : 'bg-gray-300'}`}></div>
                    </button>
                  </div>
                </div>

                {/* 4. Choice of Grid vs Detailed List */}
                <div className="mb-5 bg-gray-50/30 p-3 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-500 mb-2">تخصيص نمط عرض وقوالب المواد الدراسية 📐</h4>
                  <div className="flex gap-2 text-right">
                    <button
                      onClick={() => updateHomeLayout({ isGridLayout: true })}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        homeLayout.isGridLayout 
                          ? `bg-${themeColors[theme].primary}/10 border-${themeColors[theme].primary}/30 text-${themeColors[theme].primary} font-extrabold shadow-sm` 
                          : 'bg-white border-gray-150 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid size={14} />
                      <span>تخطيط شبكي مدمج (Grid)</span>
                    </button>
                    <button
                      onClick={() => updateHomeLayout({ isGridLayout: false })}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        !homeLayout.isGridLayout 
                          ? `bg-${themeColors[theme].primary}/10 border-${themeColors[theme].primary}/30 text-${themeColors[theme].primary} font-extrabold shadow-sm` 
                          : 'bg-white border-gray-150 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <List size={14} />
                      <span>جدول طولي مفصل (List Layout)</span>
                    </button>
                  </div>
                </div>

                {/* 5. Drag-free subject prioritization / sorting */}
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100/30">
                    <h4 className="text-xs font-black text-gray-500">ترتيب تسلسل عرض المواد الدراسية 🚀</h4>
                    <span className="text-[10px] text-gray-400 font-bold">رتب المواد الدراسية بنقرة واحدة</span>
                  </div>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                    {(() => {
                      const order = homeLayout.subjectsOrder || ['philosophy', 'arabic', 'history-geo', 'islamic', 'english', 'french', 'math'];
                      return order.map((subId, index) => {
                        const subRaw = SUBJECTS_CONTENT[subId];
                        if (!subRaw) return null;
                        
                        // Functions to move items up/down
                        const moveUp = () => {
                          if (index === 0) return;
                          const newOrder = [...order];
                          const temp = newOrder[index];
                          newOrder[index] = newOrder[index - 1];
                          newOrder[index - 1] = temp;
                          updateHomeLayout({ subjectsOrder: newOrder });
                        };

                        const moveDown = () => {
                          if (index === order.length - 1) return;
                          const newOrder = [...order];
                          const temp = newOrder[index];
                          newOrder[index] = newOrder[index + 1];
                          newOrder[index + 1] = temp;
                          updateHomeLayout({ subjectsOrder: newOrder });
                        };

                        return (
                          <div key={subId} className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-black text-gray-400 w-4 text-center">#{index + 1}</span>
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-${themeColors[theme].primary}/5 text-${themeColors[theme].primary}`}>
                                {React.createElement(lucideIcons[subRaw.icon] || Book, { size: 13 })}
                              </div>
                               <span className="text-xs font-extrabold text-gray-800">{subRaw.title}</span>
                             </div>
                             
                             <div className="flex items-center gap-1.5">
                               <button
                                 onClick={moveUp}
                                 disabled={index === 0}
                                 className={`p-1 rounded-md transition-all ${
                                   index === 0 ? 'text-gray-200 cursor-not-allowed' : `text-gray-450 hover:text-white hover:bg-${themeColors[theme].primary}`
                                 }`}
                                 title="تحريك لأعلى"
                               >
                                 <ArrowUp size={13} />
                               </button>
                               <button
                                 onClick={moveDown}
                                 disabled={index === order.length - 1}
                                 className={`p-1 rounded-md transition-all ${
                                   index === order.length - 1 ? 'text-gray-200 cursor-not-allowed' : `text-gray-450 hover:text-white hover:bg-${themeColors[theme].primary}`
                                 }`}
                                 title="تحريك لأسفل"
                               >
                                 <ArrowDown size={13} />
                               </button>
                             </div>
                           </div>
                         );
                       });
                     })()}
                   </div>
                 </div>

               </motion.div>
             )}
           </AnimatePresence>

          {/* Daily Tip/Motivation */}
          {!isSubjectsPage && homeLayout.showTip && (
            <motion.div 
              key={tipIndex}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-8 bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden text-right"
              style={{ direction: 'rtl' }}
            >
              <div className={`absolute top-0 right-0 w-1.5 h-full bg-${themeColors[theme].primary}`}></div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                  {currentTip.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black text-${themeColors[theme].primary} bg-${themeColors[theme].primary}/5 px-2 py-0.5 rounded-md uppercase tracking-wider`}>{currentTip.type}</span>
                      <span className="text-[10px] font-medium text-gray-400">نصيحة وعِبرة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopyTip}
                        className={`p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-${themeColors[theme].primary} transition-colors`}
                        title="نسخ النصيحة"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <FileText size={14} />}
                      </button>
                      <button 
                        onClick={handleNextTip}
                        className={`text-[10px] font-bold text-gray-400 hover:text-${themeColors[theme].primary} transition-colors px-2 py-1 rounded-md hover:bg-gray-50 flex items-center gap-0.5`}
                      >
                        <span>💡 نصيحة أخرى</span>
                        <ChevronLeft size={10} className="transform rotate-180" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed italic pr-1">
                    "{currentTip.text}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Search Bar */}
      <div className="mb-8 relative group" style={{ direction: 'rtl' }}>
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-${themeColors[theme].primary} transition-colors`}>
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="ابحث عن مادة أو درس..."
          className={`w-full bg-white border border-gray-100 p-4 pr-12 rounded-[24px] outline-none shadow-sm focus:border-${themeColors[theme].primary} focus:ring-4 focus:ring-${themeColors[theme].primary}/5 transition-all text-sm`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 p-1"
          >
            ×
          </button>
        )}
      </div>

      {!searchQuery ? (
        <>
          {/* Exercise Solver Section */}
          {!isSubjectsPage && homeLayout.showSolver && (
            <Link to="/solve" className="block mb-8 text-right" style={{ direction: 'rtl' }}>
              <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group active:scale-95 transition-all">
                <div className={`absolute top-0 right-0 w-2 h-full bg-${themeColors[theme].primary}`}></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900">حل التمرين بالصورة 📸</h3>
                      <p className="text-gray-400 text-[10px]">صور تمرينك الآن واحصل على الحل فوراً</p>
                    </div>
                  </div>
                  <div className="bg-amber-100/50 p-2 rounded-xl text-amber-600">
                    <Sparkles size={16} />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Philosophy Special Section */}
          {!isSubjectsPage && homeLayout.showPhilosophyCard && (
            <Link to="/philosophy" className="block mb-8 text-right" style={{ direction: 'rtl' }}>
              <div className={`bg-gradient-to-l ${themeColors[theme].gradient} p-5 rounded-2xl text-white relative overflow-hidden shadow-lg ${themeColors[theme].shadow}`}>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-1">ركن الفلسفة الذكي ✍️</h3>
                  <p className="text-emerald-50 text-sm opacity-90">تعلم منهجية تحليل المقالات وصحح إنتاجك بالذكاء الاصطناعي.</p>
                </div>
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-20">
                  <Feather size={100} />
                </div>
              </div>
            </Link>
          )}

          {/* Quiz Hub Special Section */}
          {!isSubjectsPage && (
            <Link to="/quiz-hub" className="block mb-8 text-right bg-white rounded-3xl" style={{ direction: 'rtl' }}>
              <div className="bg-gradient-to-l from-orange-500 to-amber-500 p-5 rounded-[24px] text-white relative overflow-hidden shadow-lg hover:scale-[1.01] transition-all">
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                      <span className="text-[9px] font-black uppercase tracking-wider">نادي التحدي التفاعلي ✨</span>
                    </div>
                    <h3 className="text-lg font-black leading-tight">الفضاء التفاعلي للاختبارات 🧩</h3>
                    <p className="text-amber-50 text-[11px] opacity-90 leading-relaxed mt-1">
                      تربيط المصطلحات والمطابقة، سد الفراغات، وتحديات الأسئلة السريعة الموقوتة!
                    </p>
                  </div>
                  <div className="bg-white/15 p-2.5 rounded-2xl text-white shrink-0">
                    <BrainCircuit size={28} className="animate-pulse" />
                  </div>
                </div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-15">
                  <Trophy size={100} />
                </div>
              </div>
            </Link>
          )}

          {/* Private Class Request Section */}
          {!isSubjectsPage && (
            <Link to="/private-session" className="block mb-8 text-right bg-white rounded-3xl" style={{ direction: 'rtl' }}>
              <div className="bg-gradient-to-l from-emerald-600 to-teal-600 p-5 rounded-[24px] text-white relative overflow-hidden shadow-lg hover:scale-[1.01] transition-all">
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                      <span className="text-[9px] font-black uppercase tracking-wider">التعليم الفردي المباشر 🧑‍🏫</span>
                    </div>
                    <h3 className="text-lg font-black leading-tight">اطلب حصة خصوصية (فردي) 🎯</h3>
                    <p className="text-emerald-50 text-[11px] opacity-90 leading-relaxed mt-1">
                      اختر مادتك، يومك وتوقيتك المناسب للمراجعة الفردية المركزة مع أكفأ الأساتذة بـ 2000دج فقط!
                    </p>
                  </div>
                  <div className="bg-white/15 p-2.5 rounded-2xl text-white shrink-0">
                    <GraduationCap size={28} className="animate-pulse" />
                  </div>
                </div>
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-15">
                  <Video size={100} />
                </div>
              </div>
            </Link>
          )}

          {/* Subjects Grid Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-gray-900">المواد الدراسية</h2>
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                isEditMode ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isEditMode ? <><Check size={12} /> حفظ</> : <><Palette size={12} /> تخصيص</>}
            </button>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className={homeLayout.isGridLayout ? "grid grid-cols-2 gap-4" : "space-y-4"}
          >
            {filteredSubjects.map((sub) => (
              <motion.div key={sub.id} variants={item}>
                <div className={`relative h-full ${isEditMode ? 'animate-pulse' : ''}`} style={{ direction: 'rtl' }}>
                  <Link 
                    to={isEditMode ? '#' : `/subject/${sub.id}`} 
                    className={`card-3d block h-full transition-all ${
                      homeLayout.isGridLayout 
                        ? 'p-4' 
                        : 'p-5 flex items-center justify-between text-right gap-4'
                    } ${isEditMode ? 'border-dashed border-gray-300 pointer-events-none opacity-80' : ''}`}
                  >
                    <div className={homeLayout.isGridLayout ? "" : "flex items-center gap-4"}>
                      <div className={`rounded-xl ${sub.colorClass} flex items-center justify-center ${
                        homeLayout.isGridLayout ? 'w-12 h-12 mb-3' : 'w-14 h-14 shrink-0'
                      }`}>
                        {sub.icon}
                      </div>
                      <div className="text-right">
                        <h3 className="font-extrabold text-gray-900 text-sm mb-1 leading-tight">{sub.title}</h3>
                        <p className="text-xs text-gray-500">{sub.count}</p>
                      </div>
                    </div>
                    
                    {!homeLayout.isGridLayout && (
                      <div className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm bg-${themeColors[theme].primary}/5 text-${themeColors[theme].primary} hover:bg-${themeColors[theme].primary} hover:text-white transition-colors flex items-center gap-1 shrink-0`}>
                        <span>مراجعة المادة</span>
                        <ChevronLeft size={14} />
                      </div>
                    )}
                  </Link>

                  {isEditMode && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-100 z-10 w-[calc(100%-16px)]">
                      {Object.keys(colorClasses).map(c => (
                        <button
                          key={c}
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateColor(sub.id, c);
                          }}
                          className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${colorClasses[c].bg} ${sub.colorName === c ? 'border-gray-900 scale-110' : 'border-gray-200'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      ) : (
        <div className="space-y-6">
          {filteredLessons.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-400 mb-3 px-1">الدروس المطابقة ({filteredLessons.length})</h2>
              <div className="space-y-3">
                {filteredLessons.map((lesson) => (
                  <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="card-3d p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Play size={18} fill="currentColor" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">{lesson.title}</h3>
                        <p className="text-[10px] text-gray-400">{lesson.subjectTitle}</p>
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-gray-300 group-hover:text-emerald-500 transition-transform group-hover:-translate-x-1" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {filteredSubjects.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-400 mb-3 px-1">المواد المطابقة ({filteredSubjects.length})</h2>
              <div className="grid grid-cols-2 gap-4">
                {filteredSubjects.map((sub) => (
                  <Link key={sub.id} to={`/subject/${sub.id}`} className="card-3d p-4 block">
                    <div className={`w-10 h-10 rounded-xl ${sub.colorClass} flex items-center justify-center mb-2`}>
                      {React.cloneElement(sub.icon, { size: 18 })}
                    </div>
                    <h3 className="font-bold text-gray-800 text-xs truncate">{sub.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {filteredLessons.length === 0 && filteredSubjects.length === 0 && (
            <div className="py-12 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                <Search size={32} />
              </div>
              <p className="text-gray-500 font-bold mb-1">عذراً، لم نجد أي نتائج لـ "{searchQuery}"</p>
              <p className="text-xs text-gray-400">جرب البحث بكلمات أبسط أو بمادة أخرى.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
