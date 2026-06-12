import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronLeft, 
  Play, 
  FileText, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Archive, 
  Search, 
  Compass, 
  Languages, 
  Award, 
  User, 
  Check, 
  Download, 
  Info, 
  Sparkles, 
  Loader2,
  Calendar,
  Star,
  Bookmark,
  SlidersHorizontal,
  ExternalLink,
  AlertCircle,
  ThumbsUp,
  X
} from 'lucide-react';
import { SUBJECTS_CONTENT, BAC_ARCHIVE } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const Subject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const subjectId = id || '';
  const subjectData = SUBJECTS_CONTENT[subjectId] || null;

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [lessonQuery, setLessonQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'lessons' | 'methodologies' | 'schools' | 'terms' | 'archive'>('lessons');
  const [downloadingYear, setDownloadingYear] = useState<string | null>(null);
  const [downloadedYears, setDownloadedYears] = useState<string[]>([]);
  const [termTypeFilter, setTermTypeFilter] = useState<'all' | 'term' | 'figure' | 'date'>('all');

  // New BAC Archive states for tracking and filtering
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<'all' | 'scientific' | 'literary' | 'languages'>('all');
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [archiveStats, setArchiveStats] = useState<Record<string, {
    status: 'none' | 'pending' | 'mastered';
    score?: number;
    notes?: string;
    isFavorite?: boolean;
    solvedDate?: string;
  }>>({});

  useEffect(() => {
    // Load local archive practice stats
    const saved = localStorage.getItem(`bac_archive_progress_${subjectId}`);
    if (saved) {
      try {
        setArchiveStats(JSON.parse(saved));
      } catch (err) {
        console.error("Error parsing archive progress:", err);
      }
    }
  }, [subjectId]);

  const updateArchiveStat = (year: string, updates: Partial<{
    status: 'none' | 'pending' | 'mastered';
    score: number | undefined;
    notes: string;
    isFavorite: boolean;
    solvedDate: string;
  }>) => {
    setArchiveStats(prev => {
      const current = prev[year] || { status: 'none', isFavorite: false };
      const updated = {
        ...prev,
        [year]: {
          ...current,
          ...updates,
          solvedDate: updates.status && updates.status !== 'none' && !current.solvedDate 
            ? new Date().toLocaleDateString('ar-DZ') 
            : current.solvedDate || updates.solvedDate
        }
      };
      
      localStorage.setItem(`bac_archive_progress_${subjectId}`, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!profile?.uid) return;
    
    // In a real app we'd fetch from Firestore
    setLoadingProgress(false);
  }, [profile?.uid, subjectId]);

  if (!subjectData) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
          <BookOpen size={32} />
        </div>
        <h2 className="font-bold text-gray-900 mb-2">المادة غير متوفرة حالياً</h2>
        <p className="text-gray-500 text-sm mb-6">نحن نعمل على إضافة هذا المحتوى قريباً.</p>
        <Link to="/" className="btn-3d bg-emerald-600 text-white px-8">العودة للرئيسية</Link>
      </div>
    );
  }

  const allLessons = subjectData.units.flatMap(u => u.lessons);
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0;

  const filteredUnits = subjectData.units.map(unit => ({
    ...unit,
    lessons: unit.lessons.filter(l => l.title.toLowerCase().includes(lessonQuery.toLowerCase()))
  })).filter(unit => unit.lessons.length > 0);

  const showSchools = !!(subjectData.schoolsAndTrends && subjectData.schoolsAndTrends.length > 0);
  const showTerms = !!(subjectData.termsAndFigures && subjectData.termsAndFigures.length > 0);

  const handleDownload = (year: string, url: string) => {
    setDownloadingYear(year);
    setTimeout(() => {
      setDownloadingYear(null);
      setDownloadedYears(prev => [...prev, year]);
      window.open(url, '_blank');
    }, 1200);
  };

  return (
    <div className="pb-24">
      <header className="bg-emerald-600 text-white p-8 rounded-b-[40px] shadow-lg shadow-emerald-100 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft size={24} className="rotate-180" />
          </Link>
          <h1 className="text-xl font-bold">{subjectData.title}</h1>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs mb-1">نسبة إنجاز الدروس</p>
            <p className="text-2xl font-bold">{progressPercent}%</p>
          </div>
          <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Navigation Tabs - Scrollable on mobile */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar py-1.5 px-2">
          <button 
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'lessons' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <BookOpen size={14} />
            الدروس والوحدات
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('methodologies')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'methodologies' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <FileText size={14} />
            منهجية الإجابة
          </button>
          {showSchools && (
            <button 
              type="button"
              onClick={() => setActiveTab('schools')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'schools' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Compass size={14} />
              المدارس والنزعات
            </button>
          )}
          {showTerms && (
            <button 
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'terms' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Languages size={14} />
              المصطلحات والشخصيات
            </button>
          )}
          <button 
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'archive' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Archive size={14} />
            أرشيف البكالوريا
          </button>
        </div>

        {/* Dynamic Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'lessons' && (
            <motion.div 
              key="lessons-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Search within subject */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن درس في هذه المادة..."
                  className="w-full bg-white border border-gray-100 p-4 rounded-2xl outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/5 text-sm"
                  value={lessonQuery}
                  onChange={(e) => setLessonQuery(e.target.value)}
                />
              </div>

              {filteredUnits.map((unit, unitIdx) => (
                <section key={unitIdx} className="space-y-4">
                  <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px]">
                      {unitIdx + 1}
                    </span>
                    {unit.title}
                  </h2>
                  <div className="grid gap-3">
                    {unit.lessons.map((lesson, i) => {
                      const isLocked = !lesson.isFree && !profile?.isPremium;
                      return (
                        <div key={lesson.id} className="relative">
                          <Link 
                            to={isLocked ? '/payment' : `/lesson/${lesson.id}`}
                            className={`card-3d p-4 flex items-center justify-between group bg-white border border-gray-100 rounded-2xl ${isLocked ? 'bg-gray-50 border-gray-200' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isLocked ? 'bg-gray-200 text-gray-400' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                <Play size={16} fill={isLocked ? "none" : "currentColor"} />
                              </div>
                              <div>
                                <h3 className={`font-bold text-xs mb-1 transition-colors ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{lesson.title}</h3>
                                <div className="flex items-center gap-2 text-[9px] text-gray-400 font-medium">
                                  <span className="flex items-center gap-0.5"><Clock size={10} /> {lesson.duration}</span>
                                  <span className="flex items-center gap-0.5"><FileText size={10} /> ملخص + كويز</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.isFree && !profile?.isPremium && (
                                <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase">مجاني</span>
                              )}
                              {isLocked ? (
                                <Lock size={14} className="text-amber-500" />
                              ) : (
                                <ChevronLeft size={16} className="text-gray-300 group-hover:text-emerald-500 transition-transform group-hover:-translate-x-1" />
                              )}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}

              {filteredUnits.length === 0 && (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                    <Search size={24} />
                  </div>
                  <p className="text-gray-500 font-bold text-sm">لا يوجد دروس تطابق بحثك</p>
                  <button onClick={() => setLessonQuery('')} className="text-emerald-600 text-xs mt-2 underline">إلغاء البحث</button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'methodologies' && (
            <motion.div 
              key="methodologies-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-3 text-emerald-800 items-start">
                <Info size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs mb-1">سر التفوق والحصول على العلامة الكاملة</h4>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">تطبيق المنهجية الرسمية في البكالوريا يضمن لك التقييم العادل والمثالي من المصححين. اتبع هذه القوانين والخطوات بدقة في كل إجابة.</p>
                </div>
              </div>

              {subjectData.methodologies && subjectData.methodologies.length > 0 ? (
                subjectData.methodologies.map((method, idx) => (
                  <div key={idx} className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                      <h3 className="font-extrabold text-sm text-gray-900">{method.title}</h3>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-relaxed">{method.description}</p>
                    <div className="space-y-3 pt-2">
                      {method.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-3 items-start">
                          <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <p className="text-gray-700 text-xs leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 bg-white rounded-3xl p-6 border border-gray-100">
                  <FileText size={40} className="mx-auto mb-3 opacity-30 text-emerald-600" />
                  <p className="text-xs font-bold">منهجية الإجابة لهذه المادة يتم تحديثها قريباً.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'schools' && showSchools && (
            <motion.div 
              key="schools-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {subjectData.schoolsAndTrends?.map((school, idx) => (
                <div key={idx} className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                      {school.type === 'literary' ? 'مدرسة أدبية' : school.type === 'critical' ? 'مدرسة نقدية' : school.type === 'philosophical' ? 'مذهب فلسفي' : 'نزعة فكرية'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-900">{school.name}</h3>
                  <p className="text-gray-600 text-[11px] leading-relaxed">{school.description}</p>
                  
                  {school.characteristics && school.characteristics.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-gray-900 flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" />
                        الخصائص والسمات الفنية:
                      </h4>
                      <div className="grid gap-1.5">
                        {school.characteristics.map((char, cIdx) => (
                          <div key={cIdx} className="flex gap-2 items-start text-[10px] text-gray-600">
                            <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{char}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {school.leaders && school.leaders.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <h4 className="font-bold text-[10px] text-gray-900 mb-2 flex items-center gap-1">
                        <User size={12} className="text-emerald-600" />
                        أبرز الرواد والممثلين:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {school.leaders.map((leader, lIdx) => (
                          <span key={lIdx} className="bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-lg text-[10px] text-gray-700 font-medium">
                            {leader}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'terms' && showTerms && (
            <motion.div 
              key="terms-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Languages className="text-emerald-600" size={16} />
                    <h3 className="font-bold text-xs text-gray-900">المصطلحات، الشخصيات والتواريخ الهامة</h3>
                  </div>
                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 w-fit">
                    <button
                      type="button"
                      onClick={() => setTermTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${termTypeFilter === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setTermTypeFilter('term')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${termTypeFilter === 'term' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      المصطلحات
                    </button>
                    {subjectData.termsAndFigures?.some(t => t.type === 'figure') && (
                      <button
                        type="button"
                        onClick={() => setTermTypeFilter('figure')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${termTypeFilter === 'figure' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        الشخصيات
                      </button>
                    )}
                    {subjectData.termsAndFigures?.some(t => t.type === 'date') && (
                      <button
                        type="button"
                        onClick={() => setTermTypeFilter('date')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${termTypeFilter === 'date' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        التواريخ
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {subjectData.termsAndFigures
                    ?.filter(item => termTypeFilter === 'all' || item.type === termTypeFilter)
                    ?.map((item, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                              item.type === 'term' 
                                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                : item.type === 'date'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-purple-50 text-purple-600 border-purple-100'
                            }`}>
                              {item.type === 'term' 
                                ? (subjectId === 'arabic' ? 'مصطلح أدبي' : 'مصطلح دراسي') 
                                : item.type === 'date'
                                ? 'تاريخ معلمي هام'
                                : 'شخصية هامة'}
                            </span>
                            {item.context && (
                              <span className="text-[9px] text-gray-400 font-medium flex items-center gap-1">
                                <Calendar size={10} />
                                {item.context}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-emerald-800">{item.name}</h4>
                          {item.type === 'term' && item.shortDefinition && (
                            <div className="bg-emerald-50/40 text-emerald-800 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-100/40 leading-relaxed">
                              <span className="text-emerald-600 font-extrabold text-[8px] block mb-0.5">فكرة موجزة:</span>
                              {item.shortDefinition}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-650 leading-relaxed font-medium">
                            {item.type === 'term' && item.shortDefinition && (
                              <span className="text-gray-400 font-extrabold text-[8px] block mb-0.5">التعريف التفصيلي الكامل:</span>
                            )}
                            {item.definition}
                          </p>
                        </div>
                        {item.type === 'figure' && item.work && (
                          <div className="mt-2 pt-2 border-t border-gray-200 text-[9px] text-gray-500 bg-white/50 p-2 rounded-lg">
                            <span className="font-bold text-emerald-700 block mb-0.5">● أبرز الأعمال والمنجزات:</span>
                            <p className="leading-relaxed leading-normal">{item.work}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'archive' && (
            <motion.div 
              key="archive-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 animate-in fade-in text-right"
              style={{ direction: 'rtl' }}
            >
              {/* Quick Metrics display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="text-[9px] text-gray-400 font-extrabold uppercase">إجمالي الدورات المتاحة</h5>
                    <p className="text-2xl font-black text-emerald-800 mt-1">{BAC_ARCHIVE.length} دورات</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">من سنة {BAC_ARCHIVE[BAC_ARCHIVE.length - 1]?.year} إلى {BAC_ARCHIVE[0]?.year}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl text-emerald-600 flex items-center justify-center shrink-0">
                    <Archive size={20} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="text-[9px] text-gray-400 font-extrabold uppercase">دورات تم حلها / إتقانها</h5>
                    <p className="text-2xl font-black text-indigo-800 mt-1">
                      {Object.values(archiveStats).filter(s => s.status && s.status !== 'none').length} دورات
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                      {Object.values(archiveStats).filter(s => s.status === 'mastered').length} متمكن منها بالكامل
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="text-[9px] text-gray-400 font-extrabold uppercase">متوسط نقاط التمارين</h5>
                    <p className="text-2xl font-black text-amber-600 mt-1">
                      {(() => {
                        const scoreEntries = Object.values(archiveStats).filter(s => s.score !== undefined);
                        return scoreEntries.length > 0
                          ? `${Math.round(scoreEntries.reduce((sum, s) => sum + (s.score || 0), 0) / scoreEntries.length * 10) / 10} / 20`
                          : "--- / 20";
                      })()}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">سلم تصحيح البكالوريا الجزائري</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-xl text-amber-500 flex items-center justify-center shrink-0">
                    <Award size={20} />
                  </div>
                </div>
              </div>

              {/* Subject Guidelines Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/55 rounded-2xl border border-emerald-100/70 flex items-start gap-3">
                <Info size={16} className="text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-800">توجيهات فريضة ومناهج التدرب لشهادة البكالوريا:</h4>
                  <p className="text-[10px] text-emerald-950 font-bold leading-normal">
                    {subjectId === 'philosophy' && "تنبيه: مقالات البكالوريا تتطلب ضبط الحجج والأمثلة الدقيقة، والأقوال الفلسفية الموثقة مع الالتزام التام بالمنهجية الجدلية أو مقارنة أو استقصاء بالوضع لربح 20/20."}
                    {subjectId === 'arabic' && "تنبيه: احرص على دراسة النمط السائد في النص، العلاقات والقرائن اللغوية، وعلاقات المجاز بالبناء الفكري واللغوي وكذا قواعد النحو المقررة."}
                    {subjectId === 'history-geo' && "تنبيه: اعتادت البكالوريا على طرح خرائط صماء وتواريخ معلمية حاسمة كحرب باردة وثورة جزائرية، بالإضافة إلى استقراء وتحليل الرسوم والمنحنيات البيانية."}
                    {subjectId === 'islamic' && "تنبيه: انتبه لاستخراج الفوائد والأحكام بدقة تامة من الآيات الكريمة، وربطها بالمقاصد كحفظ العقل والمال والنفس وأصول التشريع المستهدفة."}
                    {subjectId === 'math' && "تنبيه: التحكم يكمن في ممارسة المسائل الشاملة كدراسة الدوال لاسيما اللوغاريتمية والأسية، المتتاليات، والاحتمالات مع تدوين الحيل الحسابية والأسئلة لضمان العلامة الكاملة."}
                    {!['philosophy', 'arabic', 'history-geo', 'islamic', 'math'].includes(subjectId) && "تنبيه: التدريب المكثف على المواضيع السابقة هو أقصر طريق لبناء ثقة الامتحان، وفهم طريقة صياغة الأسئلة ومقاييس وضع العلامات النموذجية."}
                  </p>
                </div>
              </div>

              {/* Search, Filter & Controls bar */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {/* Search input */}
                  <div className="relative w-full sm:flex-1">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200/85 rounded-xl p-2.5 pr-9 text-xs font-bold outline-none text-right placeholder-gray-400 focus:border-emerald-500 transition-colors"
                      placeholder="ابحث عن دورة بكالوريا (مثال: 2024)..."
                      value={archiveSearchQuery}
                      onChange={(e) => setArchiveSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Favorite toggle button */}
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        // Toggle logic using boolean stats
                        setArchiveSearchQuery('');
                        // Clear queries or just filter
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // Trigger local check
                        const savedFavs = Object.values(archiveStats).some(x => x.isFavorite);
                        if (!savedFavs && !archiveSearchQuery) {
                          // No favorites currently but toggled, give placeholder friendly tip or just toggle
                        }
                        // Toggle query state logic
                        // We will check we have another variable
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Quick Subject Division filter tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] font-black text-gray-450 shrink-0 flex items-center gap-1">
                    <SlidersHorizontal size={11} className="text-gray-400" />
                    فلترة مخصصة حسب الشعبة:
                  </span>
                  {(['all', 'scientific', 'literary', 'languages'] as const).map(div => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => setDivisionFilter(div)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap border transition-all cursor-pointer ${
                        divisionFilter === div
                          ? 'bg-emerald-50 border-emerald-150 text-emerald-700 font-black'
                          : 'bg-white border-gray-150 text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {div === 'all' && 'كل الشعب'}
                      {div === 'scientific' && 'شعب علمية / تقنية'}
                      {div === 'literary' && 'شعبة آداب وفلسفة'}
                      {div === 'languages' && 'شعبة لغات أجنبية'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Archive Items Grid */}
              <div className="space-y-3">
                {(() => {
                  const filtered = BAC_ARCHIVE.filter(bac => {
                    const matchesSearch = bac.year.includes(archiveSearchQuery) || (bac.title && bac.title.includes(archiveSearchQuery));
                    
                    // Match Division filter
                    let matchesDivision = true;
                    if (divisionFilter === 'scientific') {
                      // Logic checks based on specific subjects or keywords if any
                      // We keep it inclusive or custom
                    } else if (divisionFilter === 'literary') {
                      //
                    }
                    
                    return matchesSearch && matchesDivision;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white p-12 text-center rounded-[32px] border border-gray-100 flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="text-gray-300" size={32} />
                        <h4 className="text-xs font-black text-gray-800 font-sans">لم يتم العثور على أي دورات تطابق معايير التصفية والبحث الحالية</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setArchiveSearchQuery('');
                            setDivisionFilter('all');
                          }}
                          className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-150 cursor-pointer"
                        >
                          تصفير معايير البحث
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((bac, idx) => {
                    const isDownloading = downloadingYear === bac.year;
                    const isDownloaded = downloadedYears.includes(bac.year);
                    const isExpanded = expandedYear === bac.year;
                    const stat = archiveStats[bac.year] || { status: 'none', isFavorite: false };

                    return (
                      <div 
                        key={bac.year}
                        className={`bg-white border transition-all rounded-[24px] overflow-hidden ${
                          isExpanded ? 'border-emerald-250 shadow-md ring-4 ring-emerald-500/5' : 'border-gray-100 shadow-xs hover:border-gray-200'
                        }`}
                      >
                        {/* Summary Header */}
                        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                          <div className="flex-1 flex gap-3.5 items-center">
                            {/* Year Number Badge */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/60 flex flex-col items-center justify-center shrink-0 border border-gray-105">
                              <span className="text-[9px] text-gray-400 font-extrabold leading-none -mb-0.5">BAC</span>
                              <span className="text-[16px] font-black text-gray-800 leading-none">{bac.year}</span>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-xs text-gray-900">{bac.title || `دورة بكالوريا ${bac.year}`}</h4>
                                {stat.isFavorite && (
                                  <Star size={11} className="fill-amber-500 text-amber-500" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                                <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                  امتحان رسمي مصحح ومقنن بالكامل
                                </span>
                                {stat.status === 'mastered' && (
                                  <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                    <CheckCircle2 size={8} className="text-emerald-500" /> تم التمكن بنجاح ومراجعته
                                  </span>
                                )}
                                {stat.status === 'pending' && (
                                  <span className="text-[8px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-0.5">
                                    <Clock size={8} className="text-indigo-400" /> قيد المراجعة وكتابة الحل
                                  </span>
                                )}
                                {stat.score !== undefined && (
                                  <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    علامة تدوين التدريب: {stat.score} / 20
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:w-auto justify-end shrink-0 border-t sm:border-0 pt-2 sm:pt-0 border-gray-100">
                            {/* Expand toggle */}
                            <button
                              type="button"
                              onClick={() => setExpandedYear(isExpanded ? null : bac.year)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                isExpanded 
                                  ? 'bg-emerald-50/50 text-emerald-700 border-emerald-150' 
                                  : 'bg-gray-50 text-gray-600 border-gray-200/80 hover:bg-gray-100'
                              }`}
                            >
                              <span>{isExpanded ? 'إخفاء لوحة التقييم' : 'تدريب وتقييم ذاتي'}</span>
                            </button>

                            {/* Main Subject Link */}
                            <button 
                              type="button"
                              disabled={isDownloading}
                              onClick={() => handleDownload(bac.year, bac.url)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                                isDownloaded 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              }`}
                            >
                              {isDownloading ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : isDownloaded ? (
                                <Check size={11} />
                              ) : (
                                <Download size={11} />
                              )}
                              <span>تحميل الموضوع</span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded details view */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-50/50 border-t border-gray-100 overflow-hidden"
                            >
                              <div className="p-4 space-y-4 text-xs font-medium">
                                {/* Downloads options */}
                                <div className="space-y-2">
                                  <p className="text-[9px] font-extrabold text-gray-400 uppercase">روابط تنزيل شعب هذه المادة وأجوبتها المنهجية المعتمدة:</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <a
                                      href={bac.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2.5 bg-white border border-gray-150 hover:border-emerald-250 rounded-xl flex items-center justify-between font-bold text-gray-700 transition-all hover:bg-emerald-50/30"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-[9px]">PDF</div>
                                        <span>الموضوع الأول والثاني الرسمي</span>
                                      </div>
                                      <ExternalLink size={12} className="text-gray-400" />
                                    </a>

                                    <a
                                      href={bac.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2.5 bg-white border border-gray-150 hover:border-amber-250 rounded-xl flex items-center justify-between font-bold text-gray-700 transition-all hover:bg-amber-50/30"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-amber-55 text-amber-700 flex items-center justify-center font-bold text-[9px]">SOL</div>
                                        <span>التصحيح النموذجي الوزاري</span>
                                      </div>
                                      <ExternalLink size={12} className="text-gray-400" />
                                    </a>

                                    <a
                                      href="https://www.dzexams.com/ar/3as/bac"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2.5 bg-white border border-gray-150 hover:border-indigo-250 rounded-xl flex items-center justify-between font-bold text-gray-700 transition-all hover:bg-indigo-50/30"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-55 text-indigo-700 flex items-center justify-center font-bold text-[9px]">BAC</div>
                                        <span>المصادر المساعدة والاختبارات</span>
                                      </div>
                                      <ExternalLink size={12} className="text-gray-400" />
                                    </a>
                                  </div>
                                </div>

                                <hr className="border-gray-200/80" />

                                {/* Interactive Practice Panel */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Right: solved Status & mock score */}
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-[10px] text-gray-400 font-extrabold block mb-1.5">حدد حالتك مع هذه الدورة السنوية:</label>
                                      <div className="grid grid-cols-3 gap-2">
                                        {(['none', 'pending', 'mastered'] as const).map((statusValue) => (
                                          <button
                                            key={statusValue}
                                            type="button"
                                            onClick={() => updateArchiveStat(bac.year, { status: statusValue })}
                                            className={`py-2 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                                              stat.status === statusValue
                                                ? statusValue === 'mastered'
                                                  ? 'bg-emerald-600 text-white border-emerald-600 font-black'
                                                  : statusValue === 'pending'
                                                  ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                                                  : 'bg-gray-800 text-white border-gray-800 font-black'
                                                : 'bg-white border-gray-150 text-gray-500 hover:text-gray-800'
                                            }`}
                                          >
                                            {statusValue === 'none' && 'لم أبدأ حلها'}
                                            {statusValue === 'pending' && 'بدأت بالتدرب'}
                                            {statusValue === 'mastered' && 'تم الاجتياز بنجاح'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Mock Score self assessment */}
                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] text-gray-400 font-extrabold">منحت لنفسي نقطة تقديرية (على 20):</label>
                                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                          {stat.score !== undefined ? `${stat.score} / 20` : 'لم أسجل علامة'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="range"
                                          min="0"
                                          max="20"
                                          step="0.5"
                                          value={stat.score || 0}
                                          onChange={(e) => updateArchiveStat(bac.year, { score: parseFloat(e.target.value) })}
                                          className="flex-1 accent-emerald-600 h-2 bg-gray-200 rounded-full cursor-pointer"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateArchiveStat(bac.year, { score: undefined })}
                                          className="text-[9px] font-bold text-gray-400 hover:text-rose-600 bg-white border border-gray-150 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                        >
                                          مسح العلامة
                                        </button>
                                      </div>
                                      <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal">
                                        ● اسحب المنزلقة لتدوين علامتك التقريبية بعد حل الامتحان ومطابقة إجاباتك مع الحل الرسمي الممنوح بالأعلى.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Left: Notes & Bookmark */}
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-[10px] text-gray-400 font-extrabold block mb-1">تدوين ملاحظاتك، الصعوبات والأمور الواجب استدراكها:</label>
                                      <textarea
                                        rows={3}
                                        value={stat.notes || ''}
                                        onChange={(e) => updateArchiveStat(bac.year, { notes: e.target.value })}
                                        className="w-full bg-white border border-gray-150 rounded-xl p-2.5 text-[10px] font-bold outline-none resize-none leading-relaxed text-right placeholder-gray-400 focus:border-indigo-300 transition-colors"
                                        placeholder="مثال: أخطأت في إعراب الجملة الفرعية أو المقالة تتطلب ضبط حجة الواقع..."
                                      />
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <div className="text-[9px] text-gray-400 font-bold">
                                        {stat.solvedDate ? `سجل التعديل: ${stat.solvedDate}` : 'بانتظار تدوين نشاطك'}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => updateArchiveStat(bac.year, { isFavorite: !stat.isFavorite })}
                                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                          stat.isFavorite 
                                            ? 'bg-amber-50 border-amber-250 text-amber-700 font-black shadow-xs' 
                                            : 'bg-white border-gray-250 text-gray-500 hover:text-gray-800'
                                        }`}
                                      >
                                        <Star size={11} className={stat.isFavorite ? "fill-amber-500 text-amber-500" : "text-gray-400"} />
                                        <span>{stat.isFavorite ? 'مسجل بالمفضلة' : 'تفضيل هذه الدورة'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Subject;
