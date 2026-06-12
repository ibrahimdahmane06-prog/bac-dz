import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Info, Download, BookOpen, Volume2, VolumeX, 
  Copy, Check, X, Sparkles, Loader2, RefreshCw, 
  GitBranch, Compass, Trophy, BrainCircuit, Columns, Sparkle,
  Layers, ArrowRightLeft, BookOpenCheck, HelpCircle, Eye,
  Maximize2, Minimize2, Upload, Image, Trash2, Star
} from 'lucide-react';
import { getLessonVideoMetadata, VideoMetadata } from '../../utils/videoLinks';

interface MindMapNode {
  topic: string;
  subtopics: string[];
}

interface LessonMindMapProps {
  data: MindMapNode[];
  lessonTitle?: string;
  subjectName?: string;
  lessonId?: string;
}

// Complete Subject Aesthetic configurations
const SUBJECT_THEMES = {
  philosophy: {
    name: 'الفلسفة والعلوم الإنسانية',
    primaryBg: 'from-amber-50/70 via-white to-orange-50/40',
    border: 'border-amber-200/80',
    accentText: 'text-rose-800',
    lineGradient: ['#f59e0b', '#b91c1c'], // amber to rose
    description: 'تم حصر النظريات والجدليات الكبرى لمساعدتك على تفكيك المشكلة وتأسيس مقالة فلسفية رصينة وممتازة.',
    academicLayoutName: 'ميزان الجدل الفلسفي (مقاربة الأطروحة ونقيضها)',
    nodeBgClass: 'bg-amber-605 bg-gradient-to-r from-amber-600 to-amber-700 border-amber-700 shadow-amber-600/10 text-white',
    nodeHoverClass: 'hover:border-amber-400 hover:bg-amber-50/50',
    itemActiveBgClass: 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/10 text-amber-950 font-black',
    accentBadgeClass: 'bg-amber-100 text-amber-900 border-amber-250',
    iconClass: 'text-amber-600',
    categoryLabels: ['الموقف والأطروحة الأولى', 'موقف الخصوم والنقود', 'التركيب المنهجي وحل المشكلة']
  },
  'history-geo': {
    name: 'التاريخ والجغرافيا',
    primaryBg: 'from-orange-50/60 via-white to-blue-50/30',
    border: 'border-orange-200/80',
    accentText: 'text-blue-900',
    lineGradient: ['#ea580c', '#1e293b'], // orange to slate
    description: 'تلخيص المسار الكرونولوجي والتطور الجيوسياسي لتعزيز الحفظ البصري للخرائط والأحداث المتتالية.',
    academicLayoutName: 'المخطط الزمني والجيوسياسي الكرونولوجي المطور',
    nodeBgClass: 'bg-gradient-to-r from-orange-600 to-orange-700 border-orange-700 shadow-orange-600/10 text-white',
    nodeHoverClass: 'hover:border-orange-400 hover:bg-orange-50/50',
    itemActiveBgClass: 'bg-orange-50/50 border-orange-500 shadow-md ring-2 ring-orange-500/10 text-orange-950 font-black',
    accentBadgeClass: 'bg-orange-100 text-orange-900 border-orange-250',
    iconClass: 'text-orange-600',
    categoryLabels: ['المنطلقات والأسباب والظروف', 'سيرورة وتطوير الأحداث الكبرى', 'النتائج والانعكاسات الاستراتيجية']
  },
  islamic: {
    name: 'العلوم الإسلامية',
    primaryBg: 'from-emerald-50/50 via-white to-teal-50/30',
    border: 'border-emerald-200/85',
    accentText: 'text-emerald-900',
    lineGradient: ['#059669', '#d97706'], // emerald to amber/gold
    description: 'مخطط شرعي متدرج يضم الآثار والمقاصد والأحكام والفوائد وفق الصياغة الوزارية النموذجية.',
    academicLayoutName: 'شجرة الأحكام ومقاصد الشريعة (أدلة وقيم)',
    nodeBgClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-700 shadow-emerald-600/10 text-white',
    nodeHoverClass: 'hover:border-emerald-400 hover:bg-emerald-50/50',
    itemActiveBgClass: 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/10 text-emerald-950 font-black',
    accentBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-250',
    iconClass: 'text-emerald-600',
    categoryLabels: ['شاهد الدليل والبيان الشرعي', 'مقاصد ومحاور الشريعة الكبرى', 'التوجيه السلوكي والأحكام والفوائد']
  },
  math: {
    name: 'الرياضيات',
    primaryBg: 'from-blue-50/50 via-white to-cyan-50/30',
    border: 'border-blue-200/80',
    accentText: 'text-blue-900',
    lineGradient: ['#2563eb', '#06b6d4'], // blue to cyan
    description: 'خرائط استدلال برهانية تفكك القوانين وطرق تطبيقها السليم لحصد النقاط دون أخطاء حسابية.',
    academicLayoutName: 'خوارزمية الاستدلال والتأصيل (قاعدة وحل)',
    nodeBgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-700 shadow-blue-600/10 text-white',
    nodeHoverClass: 'hover:border-blue-400 hover:bg-blue-50/50',
    itemActiveBgClass: 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/10 text-blue-950 font-black',
    accentBadgeClass: 'bg-blue-100 text-blue-900 border-blue-250',
    iconClass: 'text-blue-600',
    categoryLabels: ['الشروط والمعادلات الأساسية', 'منهجية البرهنة والاستنتاج', 'الكمائن والحلول والتحقق السريع']
  },
  arabic: {
    name: 'اللغة العربية وآدابها',
    primaryBg: 'from-teal-50/50 via-white to-indigo-50/30',
    border: 'border-teal-200/80',
    accentText: 'text-teal-900',
    lineGradient: ['#0d9488', '#4f46e5'], // teal to indigo
    description: 'تفكيك شامل للشعر والنثر من حيث القواعد والبلاغة والنزعات الفكرية والمدارس الأدبية المترابطة.',
    academicLayoutName: 'البنية البلاغية واللغوية والنقدية للقصيدة والمقال',
    nodeBgClass: 'bg-gradient-to-r from-teal-600 to-emerald-600 border-teal-700 shadow-teal-600/10 text-white',
    nodeHoverClass: 'hover:border-teal-400 hover:bg-teal-50/50',
    itemActiveBgClass: 'bg-teal-50/50 border-teal-500 shadow-md ring-2 ring-teal-500/10 text-teal-950 font-black',
    accentBadgeClass: 'bg-teal-100 text-teal-900 border-teal-250',
    iconClass: 'text-teal-600',
    categoryLabels: ['بنية الدلالة والنزعة والخصائص', 'البلاغة والصور والمحسنات البديعية', 'قواعد الإعراب والروابط اللغوية']
  },
  languages: {
    name: 'اللغات الأجنبية',
    primaryBg: 'from-violet-50/50 via-white to-pink-50/30',
    border: 'border-violet-200/80',
    accentText: 'text-violet-900',
    lineGradient: ['#7c3aed', '#db2777'], // violet to pink
    description: 'Visual map focusing on textual cohesion, core syntax grammar rules, and text structures for BAC.',
    academicLayoutName: 'Cohesive Syntax & Grammar Framework (خريطة البناء التعبيري)',
    nodeBgClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-700 shadow-violet-600/10 text-white',
    nodeHoverClass: 'hover:border-violet-400 hover:bg-violet-50/50',
    itemActiveBgClass: 'bg-violet-50/50 border-violet-500 shadow-md ring-2 ring-violet-500/10 text-violet-950 font-black',
    accentBadgeClass: 'bg-violet-100 text-violet-900 border-violet-250',
    iconClass: 'text-violet-600',
    categoryLabels: ['Text Comprehension & Context', 'Grammar Structures & Rules', 'Written Expression & Vocabulary']
  }
};

type SubjectKey = keyof typeof SUBJECT_THEMES;

// Static Mind Maps Presets representing high school units for Algerian pupils
const SUBJECT_STATIC_MAPS: Record<SubjectKey, {
  title: string;
  url: string;
  source: string;
  description: string;
}[]> = {
  philosophy: [
    {
      title: 'مخطط المنهجية الفلسفية وجدول تفكيك المشكل والإشكال',
      url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
      source: 'حقيبة الأستاذ الفلسفية المعتمدة',
      description: 'هيكل متكامل يربط بين السؤال الفلسفي العادي والدهشة الفلسفية التي تصنع الإشكالية الكبرى في مقال البكالوريا.'
    },
    {
      title: 'خريطة تفرعات المذاهب المعرفية (العقلاني، التجريبي، البراغماتي)',
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
      source: 'سلسلة تبسيط الفلسفة للبكالوريا',
      description: 'مخططات توضيحية لحصر حجج وأنصار كل مذهب فلسفي للتوظيف الفوري.'
    }
  ],
  'history-geo': [
    {
      title: 'خريطة بصرية شاملة لاستراتيجيات الحرب الباردة والمصطلحات',
      url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop',
      source: 'مذكرة الأستاذ المتميز في التاريخ والجغرافيا',
      description: 'تعتمد هذه الخريطة على ترميز الألوان لترسيخ الأحداث التاريخية الكبرى كالمنظمات والاتفاقيات الدولية بين المعسكرين.'
    },
    {
      title: 'المخطط الذهني للثورة التحريرية الجزائرية (مراحل الثورة الكبرى)',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      source: 'الأرشيف الوطني لدراسات البكالوريا',
      description: 'تلخيص هيكلي للعمل المسلح والمفاوضات السياسية من 1954 إلى الاستقلال.'
    }
  ],
  islamic: [
    {
      title: 'شجرة مقاصد الشريعة الإسلامية التفصيلية المعتمدة',
      url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=1200&auto=format&fit=crop',
      source: 'حقيبة الشريعة والعلوم الإسلامية المصورة',
      description: 'توزيع فروع المقاصد الضرورية، الحاجية، والتحسينية مع أمثلتها وشواهدها الشرعية من القرآن والسنة.'
    },
    {
      title: 'مخطط مصادر التشريع الإسلامي المتفق عليها والمختلف فيها',
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
      source: 'كتاب التبيان الميسر لطلبة البكالوريا',
      description: 'خارطة شجرية تلخص القياس، المصلحة المرسلة، والاستصحاب وأركان كل مصدر لسرعة الاسترجاع.'
    }
  ],
  math: [
    {
      title: 'لوحة دراسة الدوال الأسية واللوغاريتمية الشاملة والقوانين',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop',
      source: 'حقيبة المهندسين للرياضيات الوزارية',
      description: 'خريطة شاملة تجمع القوانين، النهايات الشهيرة، الخواص الجبرية، ومشتقات الدوال الأسية مع مخططات الرسم البياني.'
    },
    {
      title: 'خريطة تدفق حل مسائل المتتاليات والمجاميع المعقدة',
      url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop',
      source: 'مذكرة المراجعة النهائية للرياضيات',
      description: 'دليل اتخاذ القرارات لكشف الطبيعة وحساب المجموع والبرهان بالتراجع خطوة بخطوة.'
    }
  ],
  arabic: [
    {
      title: 'المفاتيح الذهبية لإعراب المفردات والجمل المكررة في البكالوريا',
      url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop',
      source: 'ديوان الأدب والبلاغة التعليمي',
      description: 'خريطة مفاهيمية تلخص القواعد الأكثر شيوعاً كلو، لولا، إعراب إذا وإذ، وجمل المضاف إليه والخبر المتكررة.'
    },
    {
      title: 'مخطط أنماط النصوص وخصائصها ومؤشراتها الدقيقة في الاختبار',
      url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200&auto=format&fit=crop',
      source: 'سلسلة العلامة الكاملة في اللغة العربية',
      description: 'تلخيص بصري يربط نمط النص (حجاجي، إرشادي، تفسيري، وصفي) بصيغ الأسئلة النموذجية للامتحان المكتوب.'
    }
  ],
  languages: [
    {
      title: 'Master Mind Map of Active vs Passive Voice & Conditional Rules',
      url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200&auto=format&fit=crop',
      source: 'English for BAC Blueprint Book',
      description: 'Interactive grammar flow diagram grouping structure shifts, tenses mappings, and key exceptions for high-school students.'
    }
  ]
};

export const LessonMindMap: React.FC<LessonMindMapProps> = ({ 
  data, 
  lessonTitle = 'الدرس المنهجي', 
  subjectName = 'المادة الثانوية',
  lessonId = 'phil-1'
}) => {
  // Detect Subject Theme Category based on ID or Name
  const subjectKey = useMemo<SubjectKey>(() => {
    const normId = lessonId.toLowerCase();
    if (normId.startsWith('phil-')) return 'philosophy';
    if (normId.startsWith('his-') || normId.startsWith('geo-')) return 'history-geo';
    if (normId.startsWith('isl-')) return 'islamic';
    if (normId.startsWith('mat-')) return 'math';
    if (normId.startsWith('ara-')) return 'arabic';
    if (normId.startsWith('eng-') || normId.startsWith('fre-')) return 'languages';

    // Fast backup based on keyword checking
    const name = subjectName || '';
    if (name.includes('فلسفة')) return 'philosophy';
    if (name.includes('تاريخ') || name.includes('جغرافيا')) return 'history-geo';
    if (name.includes('إسلامية') || name.includes('أثر') || name.includes('شرعية')) return 'islamic';
    if (name.includes('رياضيات') || name.includes('حساب')) return 'math';
    if (name.includes('عربية') || name.includes('أدب')) return 'arabic';
    if (name.includes('إنجليزية') || name.includes('فرنسية') || name.includes('لغة')) return 'languages';

    return 'philosophy'; // default fallback is rich amber philosophy
  }, [lessonId, subjectName]);

  const activeTheme = SUBJECT_THEMES[subjectKey];

  // Mind map layout modes:
  // - 'web': Radial/mesh interactive dynamic branching map with SVG curved connection paths
  // - 'academic': Subject-specific customized blueprint (debate balance, chronological timelines, math algorithm pipelines)
  // - 'bento': High-density revision bento sheets
  // - 'static': Curated visual graphics and custom student upload zone
  const [layoutMode, setLayoutMode] = useState<'web' | 'academic' | 'bento' | 'static'>('web');

  // Static mind map states and handlers
  const [selectedStaticIndex, setSelectedStaticIndex] = useState<number>(0);
  const [uploadedMaps, setUploadedMaps] = useState<{ id: string; title: string; url: string; date: string }[]>([]);
  const [activeStaticSource, setActiveStaticSource] = useState<'preset' | 'upload'>('preset');
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  
  // Image viewer zoom & full-screen states
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(`user_uploaded_mindmaps_${lessonId}`);
    if (saved) {
      try {
        setUploadedMaps(JSON.parse(saved));
      } catch (err) {
        console.error("Error loading uploaded mindmaps:", err);
      }
    }
  }, [lessonId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً! يرجى رفع صورة أصغر من 5 ميغابايت للحفاظ على كفاءة تخزين المتصفح.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (!base64Url) return;

      const newUploadedMap = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, "") || "خريطة مخصصة مرفوعة",
        url: base64Url,
        date: new Date().toLocaleDateString('ar-DZ')
      };

      const updated = [newUploadedMap, ...uploadedMaps];
      setUploadedMaps(updated);
      localStorage.setItem(`user_uploaded_mindmaps_${lessonId}`, JSON.stringify(updated));
      
      // Auto switch to newly uploaded image
      setActiveStaticSource('upload');
      setSelectedUploadId(newUploadedMap.id);
      setZoomScale(1);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteUploadedMap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذه الخارطة المرفوعة؟")) return;

    const updated = uploadedMaps.filter(item => item.id !== id);
    setUploadedMaps(updated);
    localStorage.setItem(`user_uploaded_mindmaps_${lessonId}`, JSON.stringify(updated));

    if (selectedUploadId === id) {
      if (updated.length > 0) {
        setSelectedUploadId(updated[0].id);
      } else {
        setActiveStaticSource('preset');
        setSelectedStaticIndex(0);
      }
    }
  };
  
  const [selectedNode, setSelectedNode] = useState<{ topic: string; subtopic: string } | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, string>>({});
  
  // Ref for the capturing area and coordinate matching
  const canvasZoneRef = useRef<HTMLDivElement>(null);
  const [svgConnections, setSvgConnections] = useState<Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    colorIndex: number;
    pathId: string;
  }>>([]);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Check mobile size to toggle path connection drawings
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recalculate node coordinates relative to container to draw the custom SVG bezier curves
  const updateSVGLines = () => {
    if (layoutMode !== 'web' || isMobile || !canvasZoneRef.current) {
      setSvgConnections([]);
      return;
    }

    try {
      const container = canvasZoneRef.current;
      const containerRect = container.getBoundingClientRect();

      // Find the absolute center of the main central-node
      const centralNodeEl = container.querySelector('[data-node-id="central-node"]');
      if (!centralNodeEl) return;
      const centralRect = centralNodeEl.getBoundingClientRect();
      
      const centralPoint = {
        x: (centralRect.left + centralRect.width / 2) - containerRect.left,
        y: (centralRect.top + centralRect.height / 2) - containerRect.top
      };

      const connections: typeof svgConnections = [];

      // Trace: Central node => Topic nodes
      data.forEach((node, topicIdx) => {
        const topicNodeEl = container.querySelector(`[data-node-id="topic-${topicIdx}"]`);
        if (!topicNodeEl) return;
        const topicRect = topicNodeEl.getBoundingClientRect();

        const topicPoint = {
          // Since RTL flows, the central node is typically right, topics are mid, subtopics are left
          x: (topicRect.left + topicRect.width / 2) - containerRect.left,
          y: (topicRect.top + topicRect.height / 2) - containerRect.top
        };

        connections.push({
          from: centralPoint,
          to: topicPoint,
          colorIndex: topicIdx % 3,
          pathId: `c-root-to-t-${topicIdx}`
        });

        // Trace: Topic node => corresponding Subtopic nodes
        node.subtopics.forEach((sub, subIdx) => {
          const subNodeEl = container.querySelector(`[data-node-id="subtopic-${topicIdx}-${subIdx}"]`);
          if (!subNodeEl) return;
          const subRect = subNodeEl.getBoundingClientRect();

          const subPoint = {
            x: (subRect.left + subRect.width / 2) - containerRect.left,
            y: (subRect.top + subRect.height / 2) - containerRect.top
          };

          connections.push({
            from: topicPoint,
            to: subPoint,
            colorIndex: topicIdx % 3,
            pathId: `c-t-${topicIdx}-to-s-${subIdx}`
          });
        });
      });

      setSvgConnections(connections);
    } catch (err) {
      console.warn("Failed to update mind map SVG wiring branches:", err);
    }
  };

  // Trigger recalculations on mode, resize or selections
  useEffect(() => {
    // Add minor timeout to ensure DOM finishes reflowing layout before measuring Coordinates
    const t = setTimeout(updateSVGLines, 120);
    window.addEventListener('resize', updateSVGLines);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateSVGLines);
    };
  }, [layoutMode, selectedNode, isMobile, data]);

  // Clean speaking syntheses on destroy
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const getFallbackExplanation = (topic: string, subtopic: string) => {
    return `تحليل مفهوم "${subtopic}" كعنصر هام ضمن محور "${topic}":\nهذا المبحث يُعتبر حجر أساس في أسئلة البكالوريا لهذه المادة. يهدف إلى بناء روابط تحليلية عميقة وتأصيل الفتح الفكري للتلميذ لبلورة إجابات مفصلة وممنهجة تتفق مع المعايير الوزارية الرسمية.`;
  };

  // Fetch or trigger subtopic AI explanatory card
  const handleSubtopicClick = async (topic: string, subtopic: string) => {
    if (selectedNode?.topic === topic && selectedNode?.subtopic === subtopic) {
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setSelectedNode({ topic, subtopic });
    setExplanation('');
    setCopied(false);

    const cacheKey = `${topic}-${subtopic}`;
    if (cache[cacheKey]) {
      setExplanation(cache[cacheKey]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/explain-subtopic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          subtopic,
          subjectName: activeTheme.name,
          lessonTitle,
        }),
      });

      if (!response.ok) throw new Error();

      const resData = await response.json();
      if (resData.explanation) {
        const text = resData.explanation.trim();
        setExplanation(text);
        setCache(prev => ({ ...prev, [cacheKey]: text }));
      } else {
        throw new Error();
      }
    } catch {
      const fallback = getFallbackExplanation(topic, subtopic);
      setExplanation(fallback);
      setCache(prev => ({ ...prev, [cacheKey]: fallback }));
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = () => {
    if (!explanation) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterances = window.speechSynthesis;
    utterances.cancel();

    const cleanText = explanation.replace(/[#*`_]/g, '');
    const speakUtterance = new SpeechSynthesisUtterance(cleanText);
    speakUtterance.lang = 'ar-SA';
    speakUtterance.rate = 0.95;
    
    speakUtterance.onend = () => setIsSpeaking(false);
    speakUtterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    utterances.speak(speakUtterance);
  };

  const copyToClipboard = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // High quality printing/revision guide export
  const downloadAsImage = async () => {
    if (!canvasZoneRef.current) return;
    setIsDownloading(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasZoneRef.current, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2.5, // 2.5x sharp resolution
        logging: false,
        onclone: (clonedDoc) => {
          const els = clonedDoc.querySelectorAll('.no-export');
          els.forEach(el => (el as HTMLElement).style.display = 'none');
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `خارطة_شرفية_ذكية_${lessonTitle.replace(/\s+/g, '_')}.png`;
      downloadLink.click();
    } catch (error) {
      console.error('Image Export failed:', error);
      alert('تعذر تحميل الصورة بسبب لوائح الخصوصية للمتصفح.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate curved SVG S-curve links for the mesh web layout
  const computeBezierPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    // Smooth horizontal S-Curve suited for Arabic-RTL reading directions (flowing right to left)
    const dx = end.x - start.x;
    const ctrl1 = start.x + dx * 0.45;
    const ctrl2 = start.x + dx * 0.55;
    return `M ${start.x} ${start.y} C ${ctrl1} ${start.y}, ${ctrl2} ${end.y}, ${end.x} ${end.y}`;
  };

  // Categorize subtopics for subject-specific specialized templates
  const categorizedAcademicCategories = useMemo(() => {
    const categories: Array<{ name: string; items: Array<{ topic: string; sub: string }> }> = [
      { name: activeTheme.categoryLabels[0], items: [] },
      { name: activeTheme.categoryLabels[1], items: [] },
      { name: activeTheme.categoryLabels[2], items: [] }
    ];

    let i = 0;
    data.forEach(node => {
      node.subtopics.forEach(sub => {
        const destCatIdx = i % 3;
        categories[destCatIdx].items.push({ topic: node.topic, sub });
        i++;
      });
    });

    return categories;
  }, [data, activeTheme]);

  return (
    <div className="relative space-y-6">
      
      {/* 1. Styled Tab Menu & Description Header */}
      <div className={`p-6 bg-gradient-to-r ${activeTheme.primaryBg} rounded-[32px] border ${activeTheme.border} relative overflow-hidden shadow-xs`}>
        
        {/* Sparkle background details for authenticity */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${activeTheme.accentBadgeClass}`}>
                منهج البكالوريا: {subjectName}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-full">
                <Sparkle size={10} className="animate-spin-slow text-emerald-600 fill-emerald-500" />
                تطوير تفاعلي خاص
              </span>
            </div>
            
            <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
              خرائط الذاكرة والربط التحليلي لدرس <span className={activeTheme.accentText}>[{lessonTitle}]</span>
            </h3>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed font-medium">
              {activeTheme.description} اضغط للتفاعل واستخراج التفاصيل المفتاحية للدرس لترسيخ الذاكرة البصرية والحقائق الوزارية.
            </p>
          </div>

          {/* Controls switcher */}
          <div className="flex flex-wrap bg-white/95 p-1.5 rounded-3xl border border-gray-100 shadow-sm self-start lg:self-center gap-1">
            
            <button
              onClick={() => setLayoutMode('web')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all cursor-pointer ${
                layoutMode === 'web'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <GitBranch size={13} />
              شجرة التشعب التفاعلي (رسم بياني مدمج)
            </button>
            
            <button
              onClick={() => setLayoutMode('academic')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all cursor-pointer ${
                layoutMode === 'academic'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Columns size={13} />
              منظور التحليل المادي المطور
            </button>
            
            <button
              onClick={() => setLayoutMode('bento')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all cursor-pointer ${
                layoutMode === 'bento'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Layers size={13} />
              المذكرة الوجيزة (كروت المراجعة)
            </button>

            <button
              onClick={() => {
                setLayoutMode('static');
                setSelectedStaticIndex(0);
                setZoomScale(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all cursor-pointer ${
                layoutMode === 'static'
                  ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md shadow-emerald-600/10 text-white'
                  : 'text-indigo-650 hover:text-indigo-900 hover:bg-indigo-50/50'
              }`}
            >
              <Image size={13} />
              الخرائط الجامدة (صورة توضيحية)
            </button>
          </div>
        </div>

      </div>

      {/* 2. Main View Grid Holding Canvas Area & Sidebar Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Canvas Area (Left on desktop, covers 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div 
            ref={canvasZoneRef}
            className={`p-6 md:p-8 bg-white rounded-[32px] border border-gray-150 shadow-inner relative overflow-hidden transition-all duration-300 ${
              layoutMode === 'web' ? 'min-h-[500px]' : ''
            }`}
            id="mind-map-capture-zone"
          >
            {/* SVG Overlay Network Lines (Only rendered in web view on desktop for stability) */}
            {layoutMode === 'web' && !isMobile && svgConnections.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  {/* Linear gradient mapping per topic line to look exceptionally futuristic */}
                  {data.map((_, idx) => {
                    // Cyclic gradients matching the active theme
                    const col1 = activeTheme.lineGradient[0];
                    const col2 = activeTheme.lineGradient[1] || '#b91c1c';
                    return (
                      <linearGradient key={idx} id={`line-grad-${idx}`} x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={col1} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={col2} stopOpacity="0.3" />
                      </linearGradient>
                    );
                  })}
                  {/* Glow filter */}
                  <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* SVG Branches connection traces */}
                {svgConnections.map((conn, cIdx) => {
                  const bezierD = computeBezierPath(conn.from, conn.to);
                  return (
                    <g key={conn.pathId || cIdx}>
                      {/* Thick background connector trace */}
                      <path 
                        d={bezierD} 
                        stroke={activeTheme.lineGradient[0]} 
                        strokeWidth="3.5" 
                        fill="none" 
                        opacity="0.08" 
                        className="transition-all duration-300"
                      />
                      {/* Animated information stream moving along the branch */}
                      <path 
                        d={bezierD} 
                        stroke={`url(#line-grad-${conn.colorIndex})`} 
                        strokeWidth="2" 
                        fill="none" 
                        strokeDasharray="6 14"
                        className="animate-flowing-pulse"
                        filter="url(#glow-light)"
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Injected style block for SVG line flow */}
            <style>{`
              @keyframes flowsig {
                to {
                  stroke-dashoffset: -32;
                }
              }
              .animate-flowing-pulse {
                animation: flowsig 1.8s linear infinite;
              }
            `}</style>

            <AnimatePresence mode="wait">
              
              {/* === LAYOUT A: RADIAL/MESH SCHEMATIC VIEW === */}
              {layoutMode === 'web' && (
                <motion.div
                  key="web-layout"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-12 relative z-10"
                >
                  
                  {/* Central Node Display at top on mobile, right on desktop */}
                  <div className="flex flex-col md:flex-row items-stretch gap-6">
                    
                    {/* Centered Focus Point anchor */}
                    <div className="md:w-[28%] flex items-center justify-center">
                      <div 
                        data-node-id="central-node"
                        className="bg-slate-900 text-white p-5 rounded-[24px] shadow-[0_12px_24px_rgba(15,23,42,0.15)] border border-slate-700/50 text-center w-full max-w-[220px]"
                      >
                        <BrainCircuit className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce-slow" />
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">المحور المركزي</span>
                        <h4 className="text-xs font-black leading-relaxed">{lessonTitle}</h4>
                      </div>
                    </div>

                    {/* Sequential lists and subtopics cascade structure (md and up) */}
                    <div className="md:w-[72%] space-y-8">
                      {data.map((node, idx) => (
                        <div key={idx} className="flex flex-col space-y-3 p-4 bg-gray-50/40 rounded-3xl border border-gray-100">
                          
                          {/* Major Topic Nodes Banners */}
                          <div className="flex items-center justify-start">
                            <div 
                              data-node-id={`topic-${idx}`}
                              className={`px-5 py-3 rounded-2xl font-black text-[11px] border shadow-xs leading-none ${activeTheme.nodeBgClass}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] pb-0.5">
                                  {idx + 1}
                                </span>
                                <span>{node.topic}</span>
                              </div>
                            </div>
                          </div>

                          {/* Subtopic box links (grid mapping) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 mr-2">
                            {node.subtopics.map((sub, sIdx) => {
                              const isSelected = selectedNode?.topic === node.topic && selectedNode?.subtopic === sub;
                              return (
                                <div
                                  key={sIdx}
                                  data-node-id={`subtopic-${idx}-${sIdx}`}
                                  onClick={() => handleSubtopicClick(node.topic, sub)}
                                  className={`p-3 rounded-xl border text-right cursor-pointer select-none transition-all duration-200 hover:scale-101 relative group ${
                                    isSelected 
                                      ? activeTheme.itemActiveBgClass 
                                      : 'bg-white border-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 shadow-3xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full ${
                                        isSelected 
                                          ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' 
                                          : 'bg-gray-300 group-hover:bg-emerald-400'
                                      }`} />
                                      <span className="text-[10px] text-gray-400 font-bold font-mono">#{idx+1}.{sIdx+1}</span>
                                    </div>
                                    <span className="text-xs font-black">{sub}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>

                </motion.div>
              )}

              {/* === LAYOUT B: SUBJECT-SPECIFIC ACADEMIC ANALYTICAL TEMPLATES === */}
              {layoutMode === 'academic' && (
                <motion.div
                  key="academic-layout"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className={`w-5 h-5 ${activeTheme.iconClass}`} />
                      <h4 className="font-black text-sm text-gray-900">{activeTheme.academicLayoutName}</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">نموذج تفصيل المنهج الرسمي</span>
                  </div>

                  {/* High capacity Columns layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categorizedAcademicCategories.map((column, colIdx) => (
                      <div key={colIdx} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex flex-col justify-between">
                        
                        <div>
                          {/* Column Title */}
                          <div className={`p-3 rounded-2xl flex items-center gap-2 border mb-4 bg-white shadow-xs`}>
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-xs font-black text-slate-850">{column.name}</span>
                          </div>

                          {/* List of elements inside this column */}
                          <div className="space-y-2.5">
                            {column.items.length > 0 ? (
                              column.items.map((item, itemIdx) => {
                                const isSelected = selectedNode?.topic === item.topic && selectedNode?.subtopic === item.sub;
                                return (
                                  <motion.div
                                    key={itemIdx}
                                    whileHover={{ x: -2 }}
                                    onClick={() => handleSubtopicClick(item.topic, item.sub)}
                                    className={`p-3.5 rounded-xl border text-right cursor-pointer shadow-3xs transition-all ${
                                      isSelected
                                        ? activeTheme.itemActiveBgClass
                                        : 'bg-white border-gray-150 text-gray-700 hover:border-gray-200'
                                    }`}
                                  >
                                    <span className="text-[9px] text-gray-400 font-bold block mb-1">المحور: {item.topic}</span>
                                    <span className="text-xs font-black leading-relaxed block">{item.sub}</span>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8 text-gray-300 text-xs font-bold">لا توجد عناصر مبرهنة في هذا الجانب.</div>
                            )}
                          </div>
                        </div>

                        {/* Aesthetic base detail */}
                        <div className="text-[9px] font-bold text-gray-300 mt-6 border-t border-gray-100 pt-2 text-center">
                          بكالوريا الجزائر دورة التميز
                        </div>

                      </div>
                    ))}
                  </div>

                </motion.div>
              )}

              {/* === LAYOUT C: BENTO CARDS REVISION SHEETS === */}
              {layoutMode === 'bento' && (
                <motion.div
                  key="bento-layout"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {data.map((node, idx) => (
                    <div 
                      key={idx}
                      className="bg-gray-50/30 p-5 rounded-3xl border border-gray-150 flex flex-col justify-between"
                    >
                      <div>
                        {/* Title of Bento Group */}
                        <span className="text-[9.5px] text-emerald-600 font-bold uppercase tracking-wide block mb-1">المفاهيم الشرفية لـ:</span>
                        <h4 className="font-black text-gray-900 text-sm mb-4 pb-2 border-b border-gray-100">
                          {idx + 1}. {node.topic}
                        </h4>

                        {/* List items to revise */}
                        <div className="flex flex-col gap-2">
                          {node.subtopics.map((sub, sIdx) => {
                            const isSelected = selectedNode?.topic === node.topic && selectedNode?.subtopic === sub;
                            return (
                              <div
                                key={sIdx}
                                onClick={() => handleSubtopicClick(node.topic, sub)}
                                className={`p-3 rounded-xl border text-right cursor-pointer shadow-3xs flex items-center justify-between transition-all ${
                                  isSelected ? activeTheme.itemActiveBgClass : 'bg-white border-gray-100 hover:border-gray-250 text-gray-700'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">انقر للشرح</span>
                                <span className="text-xs font-bold">{sub}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary indicator */}
                      <div className="mt-6 flex items-center justify-between text-[10px] text-gray-400 font-bold border-t border-gray-100 pt-3">
                        <span>مجموع المفاهيم: {node.subtopics.length}</span>
                        <span>بطاقة رقم #{idx+1}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* === LAYOUT D: STATIC MAPS / REFERENCE IMAGES GALLERY === */}
              {layoutMode === 'static' && (
                <motion.div
                  key="static-layout"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6 text-right"
                  style={{ direction: 'rtl' }}
                >
                  {/* Sources selection tab bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex bg-gray-100/85 p-1 rounded-2xl border border-gray-150 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStaticSource('preset');
                          setZoomScale(1);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          activeStaticSource === 'preset'
                            ? 'bg-white shadow-sm text-emerald-700 font-bold'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        الرسومات والخرائط المعتمدة (الرسمية)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveStaticSource('upload');
                          setZoomScale(1);
                          if (uploadedMaps.length > 0 && !selectedUploadId) {
                            setSelectedUploadId(uploadedMaps[0].id);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                          activeStaticSource === 'upload'
                            ? 'bg-white shadow-sm text-emerald-700 font-bold'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        خرائطي المرفوعة ({uploadedMaps.length})
                      </button>
                    </div>

                    {/* File uploading action */}
                    <div>
                      <input
                        type="file"
                        id="user-map-uploader"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="user-map-uploader"
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-colors w-full sm:w-auto justify-center"
                      >
                        <Upload size={13} />
                        رفع مصوراتك الخاصة (من الكشكول أو الهاتف)
                      </label>
                    </div>
                  </div>

                  {/* List of sub-items selector based on selection source */}
                  {activeStaticSource === 'preset' ? (
                    <div className="flex flex-wrap gap-2">
                      {(SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy).map((map, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setSelectedStaticIndex(pIdx);
                            setZoomScale(1);
                          }}
                          className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all border text-right cursor-pointer flex items-center gap-2 ${
                            selectedStaticIndex === pIdx
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                              : 'bg-white border-gray-150 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Star size={11} className={selectedStaticIndex === pIdx ? "fill-white text-white animate-pulse" : "text-emerald-500"} />
                          <span>خريطة بصرية نموذجية {pIdx + 1}: {map.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {uploadedMaps.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {uploadedMaps.map((map) => (
                            <div
                              key={map.id}
                              onClick={() => {
                                setSelectedUploadId(map.id);
                                setZoomScale(1);
                              }}
                              className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all border cursor-pointer flex items-center justify-between gap-3 ${
                                selectedUploadId === map.id
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                                  : 'bg-white border-gray-150 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Image size={12} className={selectedUploadId === map.id ? "text-white" : "text-emerald-600"} />
                                <span>{map.title} ({map.date})</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteUploadedMap(map.id, e)}
                                className={`p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer ${
                                  selectedUploadId === map.id ? 'text-white/80 hover:bg-emerald-700' : 'text-gray-400'
                                }`}
                                title="حذف الخريطة"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center text-gray-400 space-y-2">
                          <Image size={32} className="mx-auto text-gray-300 opacity-60" />
                          <p className="text-xs font-black text-gray-600">مستودع خرائطك المخصصة فارغ حالياً.</p>
                          <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed">
                            التقط صورًا للسبورة بصفّك، أو خرائط الأستاذ المنشورة بالفيسبوك/تليجرام، وارفعها هنا لتكون محفوظة داخل هذا الدرس مباشرة طوال العام!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* High fidelity Interactive Image Sandbox Canvas View */}
                  <div className="bg-gray-100/95 rounded-3xl border border-gray-200 p-4 space-y-3 relative overflow-hidden shadow-xs">
                    
                    {/* Frame context and Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200/80 gap-3">
                      <div>
                        {activeStaticSource === 'preset' ? (
                          (() => {
                            const apMaps = SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy;
                            const curMap = apMaps[selectedStaticIndex];
                            return (
                              <div className="space-y-1">
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-150">
                                  {curMap?.source}
                                </span>
                                <h5 className="text-xs font-black text-gray-900 leading-tight mt-1">{curMap?.title}</h5>
                                <p className="text-[10px] text-gray-400 font-bold leading-normal">{curMap?.description}</p>
                              </div>
                            );
                          })()
                        ) : (
                          (() => {
                            const curUploaded = uploadedMaps.find(m => m.id === selectedUploadId);
                            if (!curUploaded) return <span className="text-[10px] text-gray-400">لم يتم اختيار أي خريطة مخصصة بعد.</span>;
                            return (
                              <div className="space-y-1">
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-150">
                                  خريطة مخصصة محملة
                                </span>
                                <h5 className="text-xs font-black text-gray-900 leading-tight mt-1">{curUploaded.title}</h5>
                                <p className="text-[10px] text-gray-400 font-bold">تم الرفع في: {curUploaded.date} | تحفظ محلياً على جهازك</p>
                              </div>
                            );
                          })()
                        )}
                      </div>

                      {/* Zoom controls */}
                      {((activeStaticSource === 'preset' && (SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy)[selectedStaticIndex]) || 
                        (activeStaticSource === 'upload' && uploadedMaps.find(m => m.id === selectedUploadId))) && (
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => setZoomScale(p => Math.max(0.6, p - 0.2))}
                            className="w-8 h-8 bg-white rounded-xl border border-gray-250 text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer font-black text-sm transition-all shadow-3xs"
                            title="تصغير (-)"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-black text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-200 min-w-[50px] text-center font-mono shadow-3xs">
                            {Math.round(zoomScale * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => setZoomScale(p => Math.min(3.5, p + 0.2))}
                            className="w-8 h-8 bg-white rounded-xl border border-gray-250 text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer font-black text-sm transition-all shadow-3xs"
                            title="تكبير (+)"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomScale(1)}
                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-250 rounded-xl text-[10px] font-black text-gray-500 cursor-pointer shadow-3xs"
                          >
                            إعادة تعيين
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFullscreen(true)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 rounded-xl text-emerald-700 cursor-pointer flex items-center justify-center shadow-3xs"
                            title="عرض مكبر بكامل الشاشة"
                          >
                            <Maximize2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Canvas viewport container with scroll constraints */}
                    <div className="bg-slate-900 border border-slate-950 rounded-2xl relative overflow-auto min-h-[350px] max-h-[500px] flex items-center justify-center p-4 shadow-inner group">
                      
                      {/* Guidance banner overlay */}
                      <div className="absolute top-3 left-3 bg-slate-950/75 backdrop-blur-md text-[9px] text-slate-300 font-black px-2.5 py-1.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-15">
                        <Compass className="animate-spin-slow text-emerald-400" size={11} />
                        <span>اسحب/مرر لتكبير أو تصغير أي فرع من ركائن الصورة</span>
                      </div>

                      {/* Display image element */}
                      {(() => {
                        const activePresetList = SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy;
                        const activeImageSourceUrl = activeStaticSource === 'preset'
                          ? activePresetList[selectedStaticIndex]?.url
                          : (uploadedMaps.find(m => m.id === selectedUploadId)?.url);

                        if (!activeImageSourceUrl) {
                          return (
                            <div className="text-center p-12 text-slate-400 space-y-3 z-10">
                              <Image size={40} className="mx-auto opacity-35 animate-bounce-slow" />
                              <h4 className="text-xs font-black text-slate-200">لا يوجد رسم توضيحي متاح لعرضه</h4>
                              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">مع خرائط الذاكرة المصوّرة، يمكنك الاستفادة من التصاميم الوزارية المحددة أو رفع صور كراسك الشخصي ومراجعتها بدقة متناهية.</p>
                            </div>
                          );
                        }

                        return (
                          <div 
                            className="transition-transform duration-200 transform-gpu cursor-grab active:cursor-grabbing origin-center"
                            style={{ transform: `scale(${zoomScale})` }}
                          >
                            <img
                              src={activeImageSourceUrl}
                              alt="خريطة ذهنية جامدة"
                              referrerPolicy="no-referrer"
                              className="max-h-[72vh] w-auto max-w-full rounded-lg shadow-2xl bg-white select-none relative z-10"
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Quick export or download info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <p className="text-[9.5px] text-gray-500 font-bold">
                        💡 تذكير بصري: حفظ الصورة كمرجع سريع يساعدك على استدعاء الكلمات والمحطات الرئيسية كروكيًا في مسوّدة الاختبار.
                      </p>

                      {(() => {
                        const activePresetList = SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy;
                        const activeImageSourceUrl = activeStaticSource === 'preset'
                          ? activePresetList[selectedStaticIndex]?.url
                          : (uploadedMaps.find(m => m.id === selectedUploadId)?.url);

                        if (!activeImageSourceUrl) return null;

                        return (
                          <a
                            href={activeImageSourceUrl}
                            download={`حقيبة_مراجعة_ذهنية_جامدة_${lessonTitle}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 px-3.5 py-1.8 rounded-xl font-black text-[10px] flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all self-end"
                          >
                            <Download size={11} />
                            <span>فتح الصورة بالمصدر الأصلي وبدقة كاملة</span>
                          </a>
                        );
                      })()}
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Canvas bottom hint helper */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 no-export">
              <Compass size={13} className="text-emerald-600 animate-spin-slow" />
              <span>تصفح الأنماط للحصول على منظور المراجعة البصري الأفضل لديك. انقر على أي مفهوم لاستعراض الشروح المنهجية.</span>
            </div>

          </div>

        </div>

        {/* Dynamic AI Assistant Panel (Right on desktop) */}
        <div className="lg:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`bg-white border-2 ${activeTheme.border} rounded-[28px] p-6 shadow-md space-y-5 sticky top-6 overflow-hidden`}
              >
                {/* Decorative visual glow */}
                <div className="absolute -right-20 -top-20 w-44 h-44 bg-emerald-50/50 rounded-full blur-2xl -z-10" />

                {/* Back / Close navigation */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100/50 rounded-lg text-emerald-700">
                      <BookOpen size={14} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">الشرح الذكي للمراجعة الفعالة</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                      setSelectedNode(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-gray-400 block ml-auto text-right">المحور: {selectedNode.topic}</span>
                  <h4 className="text-sm font-black text-gray-900 leading-tight text-right">
                    {selectedNode.subtopic}
                  </h4>
                </div>

                {/* AI Text container */}
                <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl min-h-[160px] flex flex-col justify-between">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3 flex-grow">
                      <Loader2 className="animate-spin text-emerald-600" size={24} />
                      <span className="text-[10px] font-black text-emerald-600 animate-pulse text-center">أستاذ المادة الذكي يصيغ لك الفهم النموذجي...</span>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-grow flex flex-col justify-between">
                      <p className="text-xs text-slate-800 leading-relaxed font-bold text-right whitespace-pre-line py-1">
                        {explanation}
                      </p>
                      
                      {/* Audio reading control + Clipboard actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100/65">
                        <button
                          onClick={speakText}
                          type="button"
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all ${
                            isSpeaking 
                              ? 'bg-rose-50 text-rose-600 border border-rose-150' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-100/80 hover:bg-emerald-100'
                          }`}
                        >
                          {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          {isSpeaking ? 'كتم القراءة' : 'استمع للتعريف'}
                        </button>

                        <button
                          onClick={copyToClipboard}
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-white border border-gray-100 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1 mr-auto"
                        >
                          {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          {copied ? 'تم النسخ' : 'نسخ النص'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 flex gap-2 text-right">
                  <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                    حفظ هذه التعاريف والمحاور البصرية يُعادل 40% من البناء الفكري ونظام استرداد النقاط في البكالوريا.
                  </p>
                </div>

              </motion.div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-[32px] p-8 text-center bg-gray-50/25 h-full flex flex-col items-center justify-center text-gray-400 space-y-4 min-h-[350px]">
                <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-full text-emerald-500 shadow-sm animate-bounce-slow">
                  <Sparkles size={22} className="fill-emerald-50" />
                </div>
                <div>
                  <h5 className="font-black text-xs text-gray-800 mt-1">المستشار التربوي الذكي للخرائط</h5>
                  <p className="text-[10px] text-gray-400 max-w-[220px] leading-relaxed mx-auto font-bold mt-1">
                    اختر أي فرع من فروع الدرس أو بطاقات بانتو، وسيظهر لك التفسير النموذجي مع المنهجية الصحيحة للأوراق الوزارية وقراءة صوتية مباشرة.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 3. Export Capabilities */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4.5 px-6 bg-slate-50 border border-slate-100 rounded-2xl no-export shadow-3xs">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold text-right sm:text-left">
          <Trophy size={14} className="text-amber-500 animate-pulse fill-amber-300" />
          <span>هذه الخارطة مهيأة للتصدير المباشر كصورة ملخصة فائقة الدقة جاهزة للطباعة والتعليق في مكتبتك.</span>
        </div>
        
        <button 
          onClick={downloadAsImage}
          disabled={isDownloading}
          className="text-xs font-black text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 h-11 px-6 rounded-xl cursor-pointer w-full sm:w-auto justify-center"
        >
          {isDownloading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري توليد ملف الحفظ عالي الدقة...
            </>
          ) : (
            <>
              <Download size={14} />
              حفظ الخارطة الذهنية مراجعة ورقية (PNG)
            </>
          )}
        </button>
      </div>

      {/* 4. Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4"
            style={{ direction: 'rtl' }}
          >
            {/* Header with name and controls */}
            <div className="w-full max-w-7xl flex items-center justify-between border-b border-slate-800/80 pb-4 text-white">
              <div className="text-right">
                <span className="text-[10px] bg-emerald-600 px-2.5 py-1 rounded-full font-black text-white">
                  معاينة كامل الشاشة المضمونة
                </span>
                <h4 className="text-sm font-black mt-2">
                  {activeStaticSource === 'preset' 
                    ? (SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy)[selectedStaticIndex]?.title 
                    : (uploadedMaps.find(m => m.id === selectedUploadId)?.title || "خريطتي المخصصة")
                  }
                </h4>
              </div>

              {/* Closer */}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X size={16} />
                <span className="text-xs font-black">إغلاق المعاينة</span>
              </button>
            </div>

            {/* Viewport with image */}
            <div className="flex-grow w-full overflow-auto flex items-center justify-center p-6 relative group select-none">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="transition-transform duration-100 transform-gpu cursor-grab active:cursor-grabbing"
                style={{ transform: `scale(${zoomScale})` }}
              >
                <img
                  src={activeStaticSource === 'preset'
                    ? (SUBJECT_STATIC_MAPS[subjectKey] || SUBJECT_STATIC_MAPS.philosophy)[selectedStaticIndex]?.url
                    : (uploadedMaps.find(m => m.id === selectedUploadId)?.url)
                  }
                  alt="معاينة كامل الشاشة"
                  referrerPolicy="no-referrer"
                  className="max-h-[85vh] w-auto max-w-full rounded-xl shadow-2xl bg-white select-none pointer-events-auto border-2 border-slate-800"
                />
              </motion.div>
            </div>

            {/* Footer with Scale Slider Control */}
            <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between gap-4 text-white mb-2">
              <span className="text-[11px] font-black text-gray-400">مستوى التقريب:</span>
              <div className="flex-grow flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoomScale(p => Math.max(0.6, p - 0.25))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 flex items-center justify-center border border-slate-700 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.6"
                  max="4"
                  step="0.1"
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  className="flex-grow h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setZoomScale(p => Math.min(4, p + 0.25))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 flex items-center justify-center border border-slate-700 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex gap-2 shrink-0">
                <span className="text-xs font-mono font-black border border-slate-850 bg-slate-950 px-2.5 py-1 rounded-lg">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-750 rounded-lg text-xs font-black text-gray-300 transition-colors cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
