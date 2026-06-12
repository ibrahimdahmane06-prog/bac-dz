import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ExternalLink, 
  Youtube, 
  Clock, 
  Check, 
  Copy, 
  BookOpen, 
  Sparkles, 
  Tv, 
  Award,
  AlertTriangle,
  FileText,
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLessonVideoMetadata, VideoMetadata } from '../../utils/videoLinks';

interface VideoPlayerProps {
  url: string;
  lessonId?: string;
  lessonTitle?: string;
  poster?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  url: propUrl, 
  lessonId = 'mat-1', 
  lessonTitle = 'رياضيات البكالوريا',
  poster 
}) => {
  // Get rich metadata for the current lesson video
  const meta: VideoMetadata = React.useMemo(() => {
    return getLessonVideoMetadata(lessonId, lessonTitle);
  }, [lessonId, lessonTitle]);

  const [viewMode, setViewMode] = useState<'embed' | 'external'>('embed');
  const [completedTopics, setCompletedTopics] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [showIframeHint, setShowIframeHint] = useState(true);

  // Handle link copying with a brief visual success checkmark
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meta.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(meta.url, '_blank', 'noopener,noreferrer');
  };

  // Toggle checklist item for active study tracking
  const toggleTopic = (index: number) => {
    setCompletedTopics(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Compute completed percentage
  const totalTopics = meta.topics.length;
  const completedCount = Object.values(completedTopics).filter(Boolean).length;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <div id="video-hub-container" className="space-y-6">
      
      {/* Dual mode Header selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-905 border border-gray-100 p-4 rounded-3xl bg-gray-50/50">
        <div>
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <Youtube className="text-red-600 w-6 h-6 animate-pulse" /> 
            منصة دروس البكالوريا التفاعلية
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            اختر أسلوب المشاهدة المفضل لديك. وفرنا لك خيارات بث متعددة لضمان اشتغال الفيديوهات 100% دون أي قيود متصفح.
          </p>
        </div>
        
        {/* Toggle Mode Selector Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 self-start sm:self-center shadow-sm">
          <button
            onClick={() => setViewMode('embed')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'embed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Tv size={14} />
            بث مدمج بالمنصة
          </button>
          
          <button
            onClick={() => setViewMode('external')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'external'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Youtube size={14} />
            مشاهدة خارجية (يوتيوب)
          </button>
        </div>
      </div>

      {/* Main Grid Layout containing Player and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Video stream container (Left) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl border border-gray-900 relative group">
            <AnimatePresence mode="wait">
              
              {viewMode === 'embed' ? (
                <motion.div
                  key="embed-player"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full relative"
                >
                  <iframe 
                    src={meta.embedUrl} 
                    className="w-full h-full border-0 absolute inset-0 z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                  
                  {/* Subtle Background loading state */}
                  <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center p-8 text-center text-white/50">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4"></div>
                    <p className="text-xs">جاري تجهيز البث الآمن من خوادم YouTube...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="external-player"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onClick={handleOpenExternal}
                  className="w-full h-full relative flex flex-col items-center justify-center cursor-pointer p-6 text-center select-none overflow-hidden"
                >
                  {/* Styled Backdrop Thumbnail */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-sm brightness-[0.25] scale-105 transition-all group-hover:scale-110 duration-700"
                    style={{ backgroundImage: `url(${poster || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'})` }}
                  ></div>
                  
                  {/* Tech-glow overlay */}
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-red-950/40 to-transparent z-0"></div>

                  <div className="relative z-10 space-y-6 max-w-md px-4">
                    
                    {/* Pulsing play icon */}
                    <div className="inline-flex relative">
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-red-600 rounded-full filter blur-md opacity-50"
                      ></motion.div>
                      <div className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all border-4 border-white/25 relative z-10">
                        <Play size={36} className="ml-1 fill-white" />
                      </div>
                    </div>

                    <div>
                      <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-red-500/30">
                        خط تشغيل يوتيوب المباشر
                      </span>
                      <h4 className="text-white text-lg font-black mt-3">تشغيل فوري في تطبيق يوتيوب</h4>
                      <p className="text-white/60 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                        اضغط لفتح المحاضرة مباشرة على تطبيق يوتيوب بملء الشاشة، وبجودات متعددة وسرعات تشغيل عالية تناسب باقة الإنترنت الخاصة بك.
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-red-700/20 transition-all"
                    >
                      شغل الدرس الآن <ExternalLink size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Notice Helper (If Iframe didn't load due to school computer/firewall/sandboxing) */}
          {viewMode === 'embed' && showIframeHint && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-sky-50/75 border border-sky-100 rounded-2xl p-4 flex items-start gap-3 relative"
            >
              <Info className="text-sky-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-right">
                <p className="text-xs text-sky-800 font-bold leading-relaxed">
                  هل الشاشة بيضاء أو يرفض الفيديو التشغيل؟
                </p>
                <p className="text-[11px] text-sky-700 mt-1 leading-relaxed">
                  تفرض بعض المتصفحات والإعدادات الأمنية قيوداً على تشغيل يوتيوب داخل الإطارات المدمجة بالمنصة. إذا حدث ذلك معك، اضغط على زر <button onClick={() => setViewMode('external')} className="text-red-700 font-black hover:underline inline-flex items-center gap-0.5">"مشاهدة خارجية يوتيوب"</button> للبدء السريع وبدقة عالية دون قيود.
                </p>
              </div>
              <button 
                onClick={() => setShowIframeHint(false)} 
                className="absolute top-3 left-3 text-sky-400 hover:text-sky-600 text-xs font-bold font-mono"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Teacher Credentials & Video details card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              {/* Teacher Avatar Initials circle */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-md border border-white/20">
                {meta.teacherName.split(' ')[1]?.[0] || 'أ'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-gray-900 text-base">{meta.teacherName}</h4>
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">أستاذ معتمد</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{meta.channelName}</p>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              
              <button
                onClick={handleOpenExternal}
                className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black h-11 px-5 rounded-xl transition-all active:scale-95"
              >
                <Youtube size={16} />
                افتح في التطبيق
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-black h-11 px-5 rounded-xl transition-all active:scale-95 border border-gray-100"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copied ? 'تم نسخ الرابط' : 'مشاركة الرابط'}
              </button>
            </div>

          </div>

        </div>

        {/* Sidebar interactive study planner (Right) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress & Checklist card */}
          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-6">
            
            <div className="border-b border-gray-50 pb-4">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider block w-max mb-2">
                مفكرة المتابعة الفعالة
              </span>
              <h4 className="font-black text-gray-900 text-lg">محتويات المحاضرة للتدوين</h4>
              <p className="text-xs text-gray-400 mt-1">ضع علامة صح على الأفكار التي فهمتها مع الفيديو لترسيخها بدفترك.</p>
            </div>

            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-gray-500">مستوى فهم الدرس:</span>
                <span className="font-mono font-black text-emerald-600">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* Checkbox Items */}
            <div className="space-y-3">
              {meta.topics.map((topic, idx) => {
                const isDone = completedTopics[idx];
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ x: -2 }}
                    onClick={() => toggleTopic(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 text-right group select-none ${
                      isDone 
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800' 
                        : 'bg-gray-50/20 border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all border ${
                        isDone 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-gray-300 bg-white group-hover:border-emerald-500'
                      }`}>
                        {isDone && <Check size={12} />}
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs font-bold leading-relaxed ${isDone ? 'line-through text-emerald-600/70' : ''}`}>
                        {topic}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>

          {/* Exam Focus Advice Bubble */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-[32px] p-6 border border-amber-100 shadow-sm relative overflow-hidden group">
            
            {/* Sparkle Glow abstract graphic element */}
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/0 rounded-br-full"></div>
            
            <div className="flex items-center gap-2 text-amber-800 font-black text-xs mb-3">
              <Sparkles size={16} className="text-amber-600 animate-spin-slow" />
              <span>محور الفهم في امتحانات البكالوريا:</span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed font-semibold">
              {meta.examFocus}
            </p>

            <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-700/80 bg-white/60 border border-amber-100 p-2.5 rounded-xl">
              <Award size={14} className="text-amber-600" />
              <span>هذه النصيحة مبنية على تحليل أوراق الإجابات النموذجية الرسمية.</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
