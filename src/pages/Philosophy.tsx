import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, FileText, HelpCircle, PenTool, Brain, Search, CheckCircle, Sparkles, Quote, BookOpen, Stars } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Philosophy: React.FC = () => {
  const [essay, setEssay] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [essayType, setEssayType] = useState('جدلية');

  const handleCheck = async () => {
    if (!essay.trim()) return;
    setLoading(true);
    setAnalysis(''); // Clear previous analysis
    try {
      const response = await fetch('/api/gemini/essay-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay, essayType }),
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const methodologies: any = {
    'jadli': {
      title: 'الطريقة الجدلية',
      example: 'هل الشعور كافٍ لتفسير كل حياتنا النفسية؟',
      steps: [
        { name: 'طرح المشكلة (المقدمة)', hint: 'تمهيد للموضوع، تعريف بالمصطلحات، عرض العناد الفلسفي، وطرح السؤال.' },
        { name: 'الأطروحة الأولى', hint: 'عرض الموقف الأول مع ذكر أنصاره، حججهم، وأمثلة واقعية تدعمهم.' },
        { name: 'نقد الأطروحة الأولى', hint: 'رغم منطقية الحجج إلا أنها بالغت في... (ذكر العيوب ونقاط الضعف).' },
        { name: 'الأطروحة الثانية', hint: 'عرض الموقف المعارض (النقيض) مع أنصاره وحججهم وبراهينهم.' },
        { name: 'نقد الأطروحة الثانية', hint: 'تبيان ثغرات الموقف الثاني وما غفل عنه هؤلاء الفلاسفة.' },
        { name: 'التركيب / التجاوز', hint: 'محاولة الجمع بين الموقفين أو تجاوز هما بموقف ثالث أعمق.' },
        { name: 'حل المشكلة (الخاتمة)', hint: 'خلاصة منسجمة مع التحليل تجيب بوضوح على الإشكال المطروح.' }
      ],
      description: 'تستخدم عندما نكون أمام موقفين متعارضين حول قضية واحدة.'
    },
    'wad3': {
      title: 'استقصاء بالوضع',
      example: 'دافِع عن الأطروحة القائلة: "إن اللاشعور حقيقة علمية لا يمكن إنكارها"',
      steps: [
        { name: 'طرح المشكلة', hint: 'التمهيد، الفكرة الشائعة (نقيض الأطروحة)، طرح التساؤل حول كيفية الدفاع.' },
        { name: 'عرض منطق الأطروحة', hint: 'شرح الأطروحة المراد إثباتها وذكر أدلتها القوية.' },
        { name: 'الدفاع عنها بحجج شخصية', hint: 'إضافة براهين وأمثلة من الواقع أو تجارب شخصية تؤيد الموقف.' },
        { name: 'نقد خصوم الأطروحة', hint: 'عرض موقف المعارضين وتفنيد براهينهم لإظهار تهافتهم.' },
        { name: 'حل المشكلة', hint: 'تأكيد مشروعية الدفاع عن الأطروحة وصلاحيتها للأخذ بها.' }
      ],
      description: 'تستخدم للدفاع عن أطروحة تبدو غير صحيحة أو غير شائعة.'
    },
    'moqaran': {
      title: 'طريقة المقارنة',
      example: 'قارن بين المشكلة العلمية والإشكالية الفلسفية.',
      steps: [
        { name: 'طرح المشكلة', hint: 'التمهيد للموضوع والإشارة إلى وجود علاقة بين المفهومين، وطرح السؤال.' },
        { name: 'أوجه الاختلاف', hint: 'ذكر نقاط التباين بين المفهومين من حيث الطبيعة والمجال والهدف.' },
        { name: 'أوجه التشابه', hint: 'البحث عن نقاط اللقاء والتقاطع الخفية بين المفهومين.' },
        { name: 'أوجه التداخل', hint: 'شرح كيف يؤثر أحدهما في الآخر وضرورة أحدهما للآخر.' },
        { name: 'حل المشكلة', hint: 'تحديد طبيعة العلاقة النهائية (تكامل، تباين، أو تداخل).' }
      ],
      description: 'تستخدم للمقارنة بين مفهومين متداخلين (مثل العلم والفلسفة).'
    },
    'nass': {
      title: 'تحليل نص فلسفي',
      example: 'تحليل نص لابن رشد حول علاقة الفلسفة بالدين (فصل المقال).',
      steps: [
        { name: 'طرح المشكلة', hint: 'التعريف بصاحب النص، سياق النص، والإشكال الذي يجيب عنه.' },
        { name: 'موقف صاحب النص', hint: 'استخراج الأطروحة الصريحة أو الضمنية التي يدافع عنها الفيلسوف.' },
        { name: 'الحجج المعتمدة', hint: 'تفكيك الأدلة المنطقية واللغوية التي استعملها الكاتب في نصه.' },
        { name: 'النقد والتقييم', hint: 'تبيان قيمة النص الفلسفية ونقد مواطن الضعف فيه.' },
        { name: 'حل المشكلة', hint: 'الخروج بنتيجة حول مدى توفيق الكاتب في حل إشكالية موضوعه.' }
      ],
      description: 'تستخدم لاستخراج أفكار فيلسوف من نص قصير.'
    }
  };

  const suggestedArticles = [
    { title: "المشكلة والاشكالية", tags: ["مهم جداً", "عتبة"], difficulty: "سهل" },
    { title: "العلم والفلسفة", tags: ["مقترح قوة"], difficulty: "متوسط" },
    { title: "في قيمة الفلسفة", tags: ["وارد جداً"], difficulty: "سهل" },
    { title: "المنطق الصوري", tags: ["لغات/آداب"], difficulty: "صعب" }
  ];

  return (
    <div className="p-6 pb-24 min-h-screen bg-gray-50/50">
      <header className="mb-10 text-center relative overflow-hidden pt-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald-600 rounded-[24px] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-100 rotate-3"
        >
          <Feather size={36} />
        </motion.div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">ركن الفلسفة</h1>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
          <Quote size={14} className="flex-shrink-0 self-start mt-1 opacity-30" />
          <p className="italic font-medium">الفلسفة ليست تعلم الأفكار، بل تعلم التفكير باحترافية</p>
          <Quote size={14} className="flex-shrink-0 self-end mb-1 opacity-30 rotate-180" />
        </div>
      </header>

      {/* Methodology Hub */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
             نادي المناهج
          </h2>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">كيف تكتب مقالاً؟</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'jadli', title: 'جدلية', icon: <Brain className="text-blue-500" size={24} />, color: 'blue' },
            { id: 'wad3', title: 'الاستقصاء', icon: <Search className="text-orange-500" size={24} />, color: 'orange' },
            { id: 'moqaran', title: 'مقارنة', icon: <FileText className="text-purple-500" size={24} />, color: 'purple' },
            { id: 'nass', title: 'تحليل نص', icon: <HelpCircle className="text-amber-500" size={24} />, color: 'amber' },
          ].map((item) => (
            <motion.button 
              key={item.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMethod(selectedMethod === item.id ? null : item.id)}
              className={`bg-white p-5 rounded-[28px] border shadow-sm flex flex-col items-center text-center gap-3 active:shadow-none transition-all group ${
                selectedMethod === item.id ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-gray-100'
              }`}
            >
              <div className={`w-14 h-14 bg-${item.color}-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <span className="text-sm font-black text-gray-800 tracking-tight">{item.title}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 bg-emerald-600 rounded-[32px] p-8 text-white">
                <h3 className="text-xl font-black mb-2">{methodologies[selectedMethod].title}</h3>
                
                {methodologies[selectedMethod].example && (
                  <div className="bg-emerald-900/40 p-4 rounded-2xl mb-6 border border-emerald-500/30">
                    <p className="text-[10px] text-emerald-300 font-bold uppercase mb-1 flex items-center gap-1">
                      <Sparkles size={12} /> مثال تطبيقي مقترح:
                    </p>
                    <p className="text-sm font-bold leading-relaxed">"{methodologies[selectedMethod].example}"</p>
                  </div>
                )}

                <p className="text-sm text-emerald-100 mb-6 opacity-80">{methodologies[selectedMethod].description}</p>
                
                <div className="space-y-4">
                  {methodologies[selectedMethod].steps.map((step: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: -8 }}
                      className="group relative bg-white/10 p-5 rounded-[24px] border border-white/5 hover:bg-white/20 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-sm tracking-tight">{step.name}</span>
                      </div>
                      
                      {/* Hint Tooltip-like expansion */}
                      <div className="max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-300 overflow-hidden pr-12">
                        <p className="text-[11px] text-emerald-100 mt-2 font-medium leading-relaxed">
                          {step.hint}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* AI correction Bento */}
      <section className="mb-12">
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Stars size={80} className="text-emerald-600" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 leading-none mb-1">المصحح المنهجي الذكي</h3>
                <p className="text-[10px] text-gray-500">من تطوير الأستاذ (الذكاء الاصطناعي)</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {Object.keys(methodologies).map(id => (
                  <button
                    key={id}
                    onClick={() => setEssayType(methodologies[id].title)}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                      essayType === methodologies[id].title ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    {methodologies[id].title}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 italic px-1">
                {(Object.values(methodologies).find((m: any) => m.title === essayType) as any)?.description || ''}
              </p>
            </div>

            <div className="relative mb-6">
              <textarea
                className="w-full h-56 bg-gray-50/50 border border-gray-100 p-5 rounded-[24px] outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm leading-relaxed"
                placeholder="ألصق مقالتك هنا ليحللها الأستاذ..."
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
              />
              <div className="absolute bottom-4 left-4 text-[10px] font-mono text-gray-300">
                {essay.length} حرف
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={loading || !essay.trim()}
              className="w-full btn-3d bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:shadow-none h-14"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><PenTool size={20} /> حلل مقالتي الآن</>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 bg-white border border-emerald-100 p-8 rounded-[32px] shadow-2xl shadow-emerald-100/50"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-50 text-emerald-800">
                <CheckCircle size={24} className="text-emerald-600" />
                <h3 className="font-black text-lg">تقرير التحليل النهائي</h3>
              </div>
              <div className="prose prose-sm prose-emerald max-w-none arabic-text leading-relaxed">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Suggested Themes List */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-black text-gray-900">ترشيحات البكالوريا</h2>
           <BookOpen size={20} className="text-emerald-500" />
        </div>

        <div className="space-y-4">
          {suggestedArticles.map((article, i) => (
            <motion.div 
              key={i} 
              whileHover={{ x: -4 }}
              className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm group hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <span className="font-black text-sm">{i + 1}</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-800 mb-1">{article.title}</h4>
                  <div className="flex gap-2">
                    {article.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md">
                        {tag}
                      </span>
                    ))}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      article.difficulty === 'سهل' ? 'text-blue-600 bg-blue-50' : 
                      article.difficulty === 'متوسط' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
                    }`}>
                      صعوبة: {article.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <Search size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Philosophy;

