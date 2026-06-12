import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Sparkles, Send, ChevronRight, X, Loader2, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ExerciseSolver: React.FC = () => {
  const navigate = useNavigate();
  const { awardPoints } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setSolution(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const solveExercise = async () => {
    if (!image) return;

    setLoading(true);
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64Data = image.split(',')[1];
      
      const response = await fetch('/api/gemini/solve-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
        }),
      });

      if (!response.ok) throw new Error('فشل في حل التمرين');
      
      const data = await response.json();
      setSolution(data.solution);
      await awardPoints(40, "حل تمرين بنجاح باستخدام مصحح الأستاذ الذكي! 🧠");
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء محاولة حل التمرين. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-gray-50">
      <header className="flex items-center gap-4 mb-8 pt-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-900 shadow-sm border border-gray-100"
        >
          <ChevronRight size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">حل تمارين ذكي</h1>
          <p className="text-xs text-gray-500">صور تمرينك واحصل على الحل فوراً</p>
        </div>
      </header>

      {!solution && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-emerald-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100 italic">
            <div className="relative z-10">
              <BrainCircuit className="mb-4 opacity-50" size={32} />
              <h2 className="text-xl font-bold mb-2 leading-tight">صور التمرين بوضوح تام للحصول على أدق النتائج.</h2>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                يقوم محرك الذكاء الاصطناعي (الأستاذ) بتحليل السؤال وتقديم حل نموذجي يتوافق مع المنهاج الجزائري.
              </p>
            </div>
            <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            {image ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                <img src={image} alt="Exercise" className="w-full h-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-2 left-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-gray-50/50 hover:border-emerald-300 transition-colors cursor-pointer group"
              >
                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-700">اضغط لالتقاط أو اختيار صورة</p>
                  <p className="text-xs text-gray-400">يمكنك تصوير التمرين من الكراس أو الكتاب</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  capture="environment"
                />
              </div>
            )}

            <div className="mt-6">
              <button
                disabled={!image}
                onClick={solveExercise}
                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${
                  image 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={20} />
                ابدأ الحل فوراً
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-amber-400 animate-pulse" size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">جاري تحليل التمرين..</h3>
            <p className="text-gray-500 text-sm">يقوم "الأستاذ" بدراسة المعطيات وصياغة الحل الأمثل</p>
          </div>
          
          <div className="w-full max-w-xs bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "90%" }}
              transition={{ duration: 15, ease: "linear" }}
              className="bg-emerald-500 h-full"
            />
          </div>
        </div>
      )}

      {solution && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-extrabold text-gray-900">الحل النموذجي</h3>
              </div>
              <button 
                onClick={() => { setSolution(null); setImage(null); }}
                className="text-gray-400 font-bold text-xs"
              >
                تمرين جديد
              </button>
            </div>

            <div className="prose prose-emerald arabic-text max-w-none">
              <ReactMarkdown>{solution}</ReactMarkdown>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold font-sm">
              حفظ الحل
            </button>
            <button className="flex-1 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-bold font-sm">
              اطلب شرحاً مفصلاً
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExerciseSolver;
