import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  AlertTriangle, 
  Heart, 
  Plus, 
  X, 
  Clock, 
  User, 
  Search, 
  Grid,
  MapPin,
  ChevronLeft,
  Filter,
  CheckCircle,
  Flag,
  Sparkles
} from 'lucide-react';
import { 
  db,
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment,
  arrayUnion,
  arrayRemove
} from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: any;
  likes: string[]; // Keep for backwards compatibility
  reactions?: Record<string, string>; // userId -> custom reaction ID (like, love, etc.)
  reportsCount: number;
}

interface ForumComment {
  id: string;
  postId: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: any;
  reportsCount: number;
}

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'philosophy', label: 'فلسفة' },
  { id: 'math', label: 'رياضيات' },
  { id: 'physics', label: 'فيزياء' },
  { id: 'science', label: 'علوم طبيعية' },
  { id: 'history', label: 'تاريخ وجغرافيا' },
  { id: 'languages', label: 'اللغات' },
  { id: 'general', label: 'عام ونصائح' }
];

const REACTION_TYPES = [
  { id: 'like', emoji: '👍', label: 'أعجبني' },
  { id: 'love', emoji: '❤️', label: 'أحببته' },
  { id: 'smart', emoji: '💡', label: 'ذكي' },
  { id: 'study', emoji: '🎓', label: 'مفيد جداً' },
  { id: 'clap', emoji: '👏', label: 'ممتاز' },
  { id: 'think', emoji: '🤔', label: 'للمناقشة' }
];

const detectCategory = (title: string, content: string): string => {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('فلسفة') || text.includes('فيلسوف') || text.includes('مقالة') || text.includes('أطروحة') || text.includes('استقصاء') || text.includes('جدل') || text.includes('موقف') || text.includes('الغزالي') || text.includes('ابن رشد') || text.includes('ديكارت') || text.includes('سقراط')) {
    return 'philosophy';
  }
  if (text.includes('رياضيات') || text.includes('حساب') || text.includes('دوال') || text.includes('متتاليات') || text.includes('مسألة') || text.includes('هندسة') || text.includes('احتمالات') || text.includes('جبر')) {
    return 'math';
  }
  if (text.includes('فيزياء') || text.includes('قيمة') || text.includes('ميكانيك') || text.includes('سرعة') || text.includes('كهرباء') || text.includes('كيمياء') || text.includes('نووي') || text.includes('طاقة') || text.includes('جدول دوري') || text.includes('حركة')) {
    return 'physics';
  }
  if (text.includes('علوم') || text.includes('علمية') || text.includes('بيولوجيا') || text.includes('جيولوجيا') || text.includes('تنفس') || text.includes('تركيب ضوئي') || text.includes('خلية') || text.includes('مناعة') || text.includes('عصبية') || text.includes('بروتين')) {
    return 'science';
  }
  if (text.includes('تاريخ') || text.includes('جغرافيا') || text.includes('خرائط') || text.includes('ثورة') || text.includes('حرب') || text.includes('استعمار') || text.includes('احتلال') || text.includes('الاتحاد السوفياتي') || text.includes('الجزائر') || text.includes('حلف')) {
    return 'history';
  }
  if (text.includes('لغة') || text.includes('إنجليزية') || text.includes('فرنسية') || text.includes('عربية') || text.includes('أدب') || text.includes('شعر') || text.includes('بلاغة') || text.includes('إعراب') || text.includes('نحو') || text.includes('قواعد') || text.includes('نثر')) {
    return 'languages';
  }
  return 'general';
};

const Forum: React.FC = () => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  
  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

  const inlineTitleInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect category based on title and content keywords
  useEffect(() => {
    if (!isManualCategory) {
      const detected = detectCategory(newTitle, newContent);
      setNewCategory(detected);
    }
  }, [newTitle, newContent, isManualCategory]);

  // Comments Input State
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Filtering / Search States
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Feedback states
  const [reportedPrompt, setReportedPrompt] = useState<{ type: 'post' | 'comment', id: string } | null>(null);
  
  // Active picker Post ID state for reaction popover
  const [activePickerPostId, setActivePickerPostId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const postsCol = collection(db, 'forum_posts');
      // Sort in-memory to prevent complex missing index errors online
      const snapshot = await getDocs(postsCol);
      const postsList: ForumPost[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        postsList.push({
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'general',
          userId: data.userId || '',
          userName: data.userName || 'مستعمل مجهول',
          userEmail: data.userEmail || '',
          createdAt: data.createdAt,
          likes: Array.isArray(data.likes) ? data.likes : [],
          reactions: data.reactions || {},
          reportsCount: typeof data.reportsCount === 'number' ? data.reportsCount : 0
        });
      });
      
      // Sort by creation date descending
      postsList.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return timeB - timeA;
      });

      setPosts(postsList);
    } catch (err) {
      console.error("Error fetching posts: ", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const q = query(collection(db, 'forum_comments'), where('postId', '==', postId));
      const snapshot = await getDocs(q);
      const commentsList: ForumComment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        commentsList.push({
          id: doc.id,
          postId: data.postId || '',
          content: data.content || '',
          userId: data.userId || '',
          userName: data.userName || 'مستعمل مجهول',
          userEmail: data.userEmail || '',
          createdAt: data.createdAt,
          reportsCount: typeof data.reportsCount === 'number' ? data.reportsCount : 0
        });
      });

      // Sort comments ascending
      commentsList.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return timeA - timeB;
      });

      setComments(commentsList);
    } catch (err) {
      console.error("Error fetching comments: ", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmittingPost(true);
    try {
      const postPayload = {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        userId: user?.uid || 'anonymous',
        userName: profile?.displayName || user?.displayName || 'طالب بكالوريا',
        userEmail: user?.email || '',
        createdAt: serverTimestamp(),
        likes: [],
        reactions: {},
        reportsCount: 0
      };

      await addDoc(collection(db, 'forum_posts'), postPayload);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setIsManualCategory(false);
      fetchPosts();
    } catch (err) {
      console.error("Error creating post: ", err);
      alert("تعذر تفريغ المنشور، الرجاء التحقق من البيانات والمحاولة مجدداً.");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newCommentText.trim()) return;
    setSubmittingComment(true);
    try {
      const commentPayload = {
        postId: selectedPost.id,
        content: newCommentText.trim(),
        userId: user?.uid || 'anonymous',
        userName: profile?.displayName || user?.displayName || 'طالب بكالوريا',
        userEmail: user?.email || '',
        createdAt: serverTimestamp(),
        reportsCount: 0
      };

      await addDoc(collection(db, 'forum_comments'), commentPayload);
      setNewCommentText('');
      fetchComments(selectedPost.id);
    } catch (err) {
      console.error("Error creating comment: ", err);
      alert("تعذر نشر التعليق.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReactToPost = async (postId: string, reactionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentReactions = post.reactions || {};
    const previousReaction = currentReactions[user.uid];

    const updatedReactions = { ...currentReactions };
    let updatedLikes = [...post.likes];

    if (previousReaction === reactionId) {
      // Toggle off
      delete updatedReactions[user.uid];
      updatedLikes = updatedLikes.filter(id => id !== user.uid);
    } else {
      // Set new reaction
      updatedReactions[user.uid] = reactionId;
      if (!updatedLikes.includes(user.uid)) {
        updatedLikes.push(user.uid);
      }
    }

    // Optimistically update
    const updatedPostFields = {
      likes: updatedLikes,
      reactions: updatedReactions
    };

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedPostFields } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, ...updatedPostFields } : null);
    }

    try {
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, {
        reactions: updatedReactions,
        likes: updatedLikes
      });
    } catch (err) {
      console.error("Error reacting to post: ", err);
      // Revert if error
      fetchPosts();
    }
  };

  const handleDefaultLikeClick = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentReactions = post.reactions || {};
    const previousReaction = currentReactions[user.uid];

    if (previousReaction) {
      handleReactToPost(postId, previousReaction);
    } else {
      handleReactToPost(postId, 'like');
    }
  };

  const getReactionsSummary = (post: ForumPost) => {
    const summary: Record<string, number> = {};
    const userReactions = post.reactions || {};
    
    Object.values(userReactions).forEach((type) => {
      summary[type] = (summary[type] || 0) + 1;
    });
    
    return Object.entries(summary)
      .map(([id, count]) => {
        const typeInfo = REACTION_TYPES.find(r => r.id === id);
        return {
          id,
          count,
          emoji: typeInfo?.emoji || '👍',
          label: typeInfo?.label || ''
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  // Report function
  const handleReportPost = async (postId: string) => {
    const confirmReport = window.confirm("هل أنت متأكد من التبليغ عن هذا المنشور لإدارته؟");
    if (!confirmReport) return;

    try {
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, {
        reportsCount: increment(1)
      });
      alert("شكراً لك! تم إرسال التبليغ وسيتعامل المشرفون معه في أقرب وقت.");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("فشل الإرسال.");
    }
  };

  const handleReportComment = async (commentId: string) => {
    const confirmReport = window.confirm("هل تريد التبليغ عن هذا التعليق كغير لائق؟");
    if (!confirmReport) return;

    try {
      const commentRef = doc(db, 'forum_comments', commentId);
      await updateDoc(commentRef, {
        reportsCount: increment(1)
      });
      alert("تم إرسال بلاغك.");
      if (selectedPost) {
        fetchComments(selectedPost.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Direct delete functions for Admin
  const handleDeletePost = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmDelete = window.confirm("هل أنت متأكد (ببصفتك مسؤول) من حذف هذا المنشور نهائياً؟");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
      alert("تم حذف المنشور بنجاح.");
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا التعليق كلياً؟");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'forum_comments', commentId));
      alert("تم حذف التعليق.");
      if (selectedPost) {
        fetchComments(selectedPost.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered list computed
  const filteredPosts = posts.filter(post => {
    const matchCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        post.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const focusInlineCreator = () => {
    setIsComposerExpanded(true);
    setTimeout(() => {
      inlineTitleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inlineTitleInputRef.current?.focus();
    }, 120);
  };

  return (
    <div className="p-4 md:p-8 pb-32 bg-gray-50/60 min-h-screen font-sans" dir="rtl">
      
      {/* Header Banner */}
      <header className="mb-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 rounded-[28px] shadow-xl shadow-emerald-500/10 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <MessageSquare size={26} className="text-emerald-100" />
            منتدى الطلاب الأحرار والنظاميين
          </h1>
          <p className="text-emerald-100 text-xs mt-1 font-medium">مساحة تفاعلية لمشاركة الأسئلة، الحلول، وتبادل النصائح البيداغوجية</p>
        </div>

        <button
          onClick={focusInlineCreator}
          className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-3 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          أنشئ منشوراً سريعاً
        </button>
      </header>

      {/* Main Container Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Category Filters Right Rail */}
        <aside className="w-full lg:w-64 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm shrink-0">
          <h3 className="text-xs font-black text-gray-400 mb-3 px-1 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Filter size={12} />
            تصنيفات المنشورات
          </h3>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  activeCategory === cat.id 
                    ? 'bg-emerald-600 text-white shadow-md font-extrabold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{cat.label}</span>
                {activeCategory === cat.id && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
              </button>
            ))}
          </div>
        </aside>

        {/* Central Feed */}
        <div className="flex-1 w-full space-y-4">

          {/* Expanding Post Composer (محرر منشوري) */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden transition-all duration-300 hover:border-emerald-200">
            <AnimatePresence mode="wait">
              {!isComposerExpanded ? (
                // Collapsed state
                <motion.div
                  key="collapsed-composer"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={() => {
                    setIsComposerExpanded(true);
                    setTimeout(() => {
                      inlineTitleInputRef.current?.focus();
                    }, 100);
                  }}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50/55 transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0 shadow-sm border border-emerald-100">
                    {profile?.displayName?.[0] || user?.displayName?.[0] || 'ط'}
                  </div>
                  <div className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-400 flex items-center justify-between transition-colors hover:border-gray-200">
                    <span>بماذا تفكر؟ اطرح سؤالك لزملائك مباشرة هنا دون اختيار المادة...</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Sparkles size={11} className="animate-pulse" /> ذكي تلقائي
                    </span>
                  </div>
                </motion.div>
              ) : (
                // Expanded state
                <motion.div
                  key="expanded-composer"
                  initial={{ opacity: 0, height: 'auto' }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                        {profile?.displayName?.[0] || user?.displayName?.[0] || 'ط'}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-gray-800">محرر المنشورات التفاعلي</h3>
                        <p className="text-[10px] text-gray-400 font-bold">أفكارك وسئلتك تتم أرشفتها وتنظيمها تلقائياً</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsComposerExpanded(false);
                        setNewTitle('');
                        setNewContent('');
                        setIsManualCategory(false);
                        setNewCategory('general');
                      }}
                      className="p-1.5 hover:bg-gray-100 text-gray-450 hover:text-gray-700 rounded-xl transition-all"
                      title="إغلاق وتراجع"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Title Input */}
                    <div>
                      <input
                        ref={inlineTitleInputRef}
                        type="text"
                        required
                        maxLength={100}
                        placeholder="عنوان منشورك أو موضوع سؤالك..."
                        className="w-full bg-gray-50/50 p-3 rounded-xl text-xs font-bold border border-gray-100 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    {/* Content Input */}
                    <div>
                      <textarea
                        required
                        rows={3}
                        maxLength={2000}
                        placeholder="تفاصيل السؤال أو الشيء الذي ترغب في مشاركته بالتفصيل..."
                        className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                      />
                    </div>

                    {/* Auto Detection indicator & optional manual selection */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-gray-50/30 p-2.5 rounded-xl border border-gray-100/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-bold">المادة المحددة تلقائياً:</span>
                        <span className="bg-emerald-50/80 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-100/60 flex items-center gap-1 shadow-2xs">
                          <Sparkles size={10} className="text-emerald-500" />
                          {CATEGORIES.find(c => c.id === newCategory)?.label || 'عام ونصائح'}
                        </span>
                        
                        <span className="text-[10px] text-gray-300">|</span>
                        
                        {/* Optional manual override select */}
                        <div className="flex items-center gap-1">
                          <label className="text-[9px] text-gray-400 font-bold">تعديل يدوياً (اختياري):</label>
                          <select
                            value={newCategory}
                            onChange={(e) => {
                              setNewCategory(e.target.value);
                              setIsManualCategory(true);
                            }}
                            className="bg-white border border-gray-150 text-[10px] font-bold text-gray-600 px-2.5 py-1 rounded-lg outline-none focus:border-emerald-400 cursor-pointer shadow-3xs"
                          >
                            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label} {cat.id === (isManualCategory ? '' : detectCategory(newTitle, newContent)) ? '(تلقائي)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsComposerExpanded(false);
                            setNewTitle('');
                            setNewContent('');
                            setIsManualCategory(false);
                            setNewCategory('general');
                          }}
                          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all"
                        >
                          إلغاء التعديل
                        </button>

                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            if (!newTitle.trim() || !newContent.trim()) return;
                            setSubmittingPost(true);
                            try {
                              const postPayload = {
                                title: newTitle.trim(),
                                content: newContent.trim(),
                                category: newCategory,
                                userId: user?.uid || 'anonymous',
                                userName: profile?.displayName || user?.displayName || 'طالب بكالوريا',
                                userEmail: user?.email || '',
                                createdAt: serverTimestamp(),
                                likes: [],
                                reactions: {},
                                reportsCount: 0
                              };

                              await addDoc(collection(db, 'forum_posts'), postPayload);
                              setNewTitle('');
                              setNewContent('');
                              setIsManualCategory(false);
                              setNewCategory('general');
                              setIsComposerExpanded(false);
                              fetchPosts();
                            } catch (err) {
                              console.error("Error creating post inline: ", err);
                              alert("تعذر نشر المنشور، الرجاء المحاولة مجدداً.");
                            } finally {
                              setSubmittingPost(false);
                            }
                          }}
                          type="button"
                          disabled={submittingPost || !newTitle.trim() || !newContent.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/15 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                        >
                          {submittingPost ? "جاري النشر..." : "نشر بالمنتدى"}
                          <Send size={11} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full bg-white p-2 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-2">
            <div className="absolute right-5 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="ابحث عن مواضيع، ملخصات، أو أسئلة زملاء الدراسة..."
              className="w-full bg-gray-50/60 p-3 pr-11 rounded-xl text-xs font-bold border border-transparent focus:border-emerald-500 focus:bg-white transition-colors outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="text-center py-20 bg-white border border-gray-150 rounded-2xl shadow-sm">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-xs font-bold">جاري تحميل المنشورات والمناقشات...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-gray-400 text-sm font-bold">لم نجد أي منشورات مطابقة لبحثك.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} 
                className="text-emerald-600 text-xs font-black mt-2 underline"
              >
                المسح العودة للكل
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isLiked = post.likes.includes(user?.uid || '');
                const postCategory = CATEGORIES.find(c => c.id === post.category)?.label || post.category;
                const userReaction = post.reactions ? post.reactions[user?.uid || ''] : undefined;
                const userReactionInfo = userReaction ? REACTION_TYPES.find(r => r.id === userReaction) : null;
                
                return (
                  <motion.article
                    key={post.id}
                    id={`forum-post-card-${post.id}`}
                    layoutId={`post-card-${post.id}`}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white p-5 rounded-2xl border border-gray-150 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                  >
                    {/* Category pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-lg">
                        {postCategory}
                      </span>
                      <div className="flex items-center gap-2 text-gray-450 text-[10px]">
                        <Clock size={11} />
                        <span>{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString('ar-DZ', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن'}</span>
                      </div>
                    </div>

                    <h2 className="text-sm font-extrabold text-gray-900 mb-2 leading-relaxed">
                      {post.title}
                    </h2>

                    <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Reactions Summary list */}
                    {post.likes && post.likes.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-4">
                        {getReactionsSummary(post).map((summary) => (
                          <div 
                            key={summary.id}
                            className="flex items-center gap-1 bg-gray-50 hover:bg-emerald-50 border border-gray-100 rounded-lg px-2 py-0.5 text-[9px] font-black text-gray-650 hover:text-emerald-800 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReactToPost(post.id, summary.id);
                            }}
                            title={summary.label}
                          >
                            <span>{summary.emoji}</span>
                            <span>{summary.count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata strip */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-bold shrink-0">
                          {post.userName?.[0] || 'U'}
                        </div>
                        <span className="text-[10px] font-bold text-gray-600">{post.userName}</span>
                        {post.userId === user?.uid && (
                          <span className="text-[8px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">منشوري</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Interactive Reaction Button with Selector */}
                        <div 
                          className="flex items-center bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-150 p-0.5 relative"
                          onMouseEnter={() => setActivePickerPostId(post.id)}
                          onMouseLeave={() => setActivePickerPostId(null)}
                        >
                          <button
                            type="button"
                            id={`react-btn-${post.id}`}
                            onClick={(e) => handleDefaultLikeClick(post.id, e)}
                            className={`flex items-center gap-1 text-[11px] font-bold transition-all px-2 py-1 rounded-lg active:scale-90 ${
                              userReactionInfo 
                                ? 'text-emerald-700 font-extrabold' 
                                : 'text-gray-400 hover:text-emerald-600'
                            }`}
                          >
                            <span>{userReactionInfo ? userReactionInfo.emoji : '👍'}</span>
                            <span className="hidden sm:inline">{userReactionInfo ? userReactionInfo.label : 'أعجبني'}</span>
                            {post.likes.length > 0 && (
                              <span className="bg-white/80 border border-gray-150 text-gray-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md min-w-[15px] text-center ml-0.5">
                                {post.likes.length}
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            id={`picker-trigger-${post.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePickerPostId(activePickerPostId === post.id ? null : post.id);
                            }}
                            className="p-1 hover:bg-gray-200/60 rounded-lg text-[10px] font-black border-r border-gray-150/60 leading-none"
                            title="اختر تعبيراً تفاعلياً"
                          >
                            ➕
                          </button>

                          {/* Float Emoji Panel */}
                          <AnimatePresence>
                            {activePickerPostId === post.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: -4, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute bottom-full mb-1 right-0 bg-white border border-gray-150 p-1 rounded-2xl shadow-xl z-20 flex items-center gap-1"
                                style={{ direction: 'rtl' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {REACTION_TYPES.map((react) => (
                                  <button
                                    key={react.id}
                                    type="button"
                                    onClick={(e) => {
                                      handleReactToPost(post.id, react.id, e);
                                      setActivePickerPostId(null);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded-xl text-base transition-all hover:scale-130 active:scale-95 duration-100 flex flex-col items-center gap-0.5"
                                    title={react.label}
                                  >
                                    <span>{react.emoji}</span>
                                    <span className="text-[7px] text-gray-500 font-extrabold whitespace-nowrap leading-none px-1">{react.label}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportPost(post.id);
                          }}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-amber-50"
                          title="تبليغ عن محتوى غير لائق"
                        >
                          <Flag size={13} />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl transition-all"
                            title="حذف المنشور فوراً (مسؤول)"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <Plus size={20} className="text-emerald-600" />
                <h3 className="font-extrabold text-gray-900 text-sm">كتابة منشور تفاعلي جديد</h3>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                
                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase">اختر تصنيف المنشور الملائم</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewCategory(cat.id)}
                        className={`py-2 rounded-xl text-[10px] font-black border transition-all ${
                          newCategory === cat.id
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-gray-500 border-gray-150 hover:bg-gray-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Title */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1">موضوع المنشور / سؤال سريع</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="مثال: من فضلكم هل لديكم ملخص مميز للفلسفة Dialectique ؟"
                    className="w-full bg-gray-50 border border-gray-150 p-3 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {/* Post Content */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1">تفاصيل ومحتوى المشكلة أو المنشور</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={2000}
                    placeholder="اكتب بالتفصيل ما تريده أو شارك نصيحة مفيدة لزملائك الطلاب..."
                    className="w-full bg-gray-50 border border-gray-150 p-3 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-4">
                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingPost ? "جاري تدوين المنشور..." : "نشر بالمنتدى الآن"}
                    <Send size={12} className="-rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="py-3 px-6 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl"
                  >
                    تراجع
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READ POST DETAIL & COMMENTS IN MODAL */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              layoutId={`post-card-${selectedPost.id}`}
              className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="overflow-y-auto pr-1 flex-1 space-y-4 no-scrollbar">
                
                {/* Post Body info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg">
                      {CATEGORIES.find(c => c.id === selectedPost.category)?.label || selectedPost.category}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {selectedPost.createdAt ? new Date(selectedPost.createdAt.seconds * 1000).toLocaleString('ar-DZ') : 'الآن'}
                    </span>
                  </div>

                  <h2 className="text-base font-black text-gray-900 mb-2 leading-relaxed">
                    {selectedPost.title}
                  </h2>

                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed pb-3">
                    {selectedPost.content}
                  </p>

                  {/* Summary of other reactions in modal */}
                  {selectedPost.likes && selectedPost.likes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pb-3 hover:opacity-90 border-b border-gray-100 mb-2">
                      {getReactionsSummary(selectedPost).map((summary) => (
                        <div 
                          key={summary.id}
                          className="flex items-center gap-1 bg-gray-50 hover:bg-emerald-50 border border-gray-150 rounded-lg px-2 py-0.5 text-[10px] font-bold text-gray-650 hover:text-emerald-800 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReactToPost(selectedPost.id, summary.id);
                          }}
                          title={summary.label}
                        >
                          <span>{summary.emoji}</span>
                          <span>{summary.count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 text-xs text-gray-400 relative">
                    <span className="font-bold text-gray-500">منشور بواسطة: {selectedPost.userName}</span>
                    
                    {/* Interactive picker inside detailed post view */}
                    {(() => {
                      const spUserReaction = selectedPost.reactions ? selectedPost.reactions[user?.uid || ''] : undefined;
                      const spUserReactionInfo = spUserReaction ? REACTION_TYPES.find(r => r.id === spUserReaction) : null;
                      
                      return (
                        <div 
                          className="flex items-center bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-150 p-0.5 relative"
                          onMouseEnter={() => setActivePickerPostId(selectedPost.id)}
                          onMouseLeave={() => setActivePickerPostId(null)}
                        >
                          <button
                            type="button"
                            id={`modal-react-btn-${selectedPost.id}`}
                            onClick={(e) => handleDefaultLikeClick(selectedPost.id, e)}
                            className={`flex items-center gap-1.5 text-xs font-black transition-all px-3 py-1.5 rounded-lg active:scale-90 ${
                              spUserReactionInfo 
                                ? 'text-emerald-700 font-extrabold' 
                                : 'text-gray-400 hover:text-emerald-600'
                            }`}
                          >
                            <span>{spUserReactionInfo ? spUserReactionInfo.emoji : '👍'}</span>
                            <span>{spUserReactionInfo ? spUserReactionInfo.label : 'أعجبني'}</span>
                            {selectedPost.likes.length > 0 && (
                              <span className="bg-white/85 border border-gray-150 text-gray-700 font-extrabold text-[10px] px-1.5 py-0.5 rounded-md min-w-[15px] text-center ml-0.5">
                                {selectedPost.likes.length}
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            id={`modal-picker-trigger-${selectedPost.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePickerPostId(activePickerPostId === selectedPost.id ? null : selectedPost.id);
                            }}
                            className="px-2 py-1 hover:bg-gray-200 rounded-lg text-xs font-bold border-r border-gray-150"
                            title="اختر تعبيراً تفاعلياً"
                          >
                            ➕
                          </button>

                          {/* Float Emoji Panel */}
                          <AnimatePresence>
                            {activePickerPostId === selectedPost.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: -4, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute bottom-full mb-1 left-0 bg-white border border-gray-150 p-1 rounded-2xl shadow-xl z-20 flex items-center gap-1"
                                style={{ direction: 'rtl' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {REACTION_TYPES.map((react) => (
                                  <button
                                    key={react.id}
                                    type="button"
                                    onClick={(e) => {
                                      handleReactToPost(selectedPost.id, react.id, e);
                                      setActivePickerPostId(null);
                                    }}
                                    className="p-1.5 hover:bg-gray-50 rounded-xl text-base transition-all hover:scale-130 active:scale-95 duration-100 flex flex-col items-center gap-0.5"
                                    title={react.label}
                                  >
                                    <span>{react.emoji}</span>
                                    <span className="text-[7px] text-gray-500 font-extrabold whitespace-nowrap leading-none px-1">{react.label}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Comments Forum List */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black text-gray-900 mb-4">التعليقات والمناقشات المباشرة ({comments.length})</h3>

                  <div className="space-y-3 mb-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex flex-col relative group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-extrabold text-gray-800">{comment.userName}</span>
                          <span className="text-[9px] text-gray-400">
                            {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString('ar-DZ', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                        <div className="flex items-center justify-end gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReportComment(comment.id)}
                            className="text-[9px] text-gray-400 hover:text-amber-600 font-bold flex items-center gap-1"
                            title="تبليغ عن تعليق مسيء"
                          >
                            <Flag size={9} /> تبليغ
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[9px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 border-r border-gray-200 pr-2"
                              title="حذف التعليق"
                            >
                              <Trash2 size={9} /> حذف
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <p className="text-center py-6 text-gray-400 text-xs italic">لا توجد ردود بعد. كن أول من يجيب على هذا الطالب!</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-150 flex items-stretch gap-2 bg-white mt-auto">
                <input
                  type="text"
                  required
                  maxLength={500}
                  placeholder="اكتب ردك أو تعليقك البناء هنا زمليك بانتظارك..."
                  className="flex-1 bg-gray-50 border border-gray-150 p-3 rounded-2xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95"
                >
                  <Send size={15} className="-rotate-90" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Forum;
