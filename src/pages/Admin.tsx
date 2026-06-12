import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search, 
  Mail, 
  Calendar, 
  Star, 
  ChevronLeft, 
  Crown, 
  Eye, 
  X, 
  Clock, 
  ArrowUpRight, 
  UserCheck, 
  RefreshCw,
  Award,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { db, collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS_CONTENT } from '../constants';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  role: string;
  points: number;
  streakDays: number;
  lastActive?: any;
  progressList?: {
    id: string;
    lessonId: string;
    status: string;
    score: number;
    updatedAt: Date | null;
  }[];
}

interface PaymentReceipt {
  id: string;
  userId: string;
  userEmail: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  rejectionReason?: string;
}

interface PaymentMessage {
  id: string;
  userId: string;
  userEmail: string;
  senderName: string;
  senderPhone: string;
  messageText: string;
  status: 'read' | 'unread';
  createdAt: any;
}

interface ReportedPost {
  id: string;
  title: string;
  content: string;
  userName: string;
  userEmail: string;
  reportsCount: number;
}

interface ReportedComment {
  id: string;
  postId: string;
  content: string;
  userName: string;
  userEmail: string;
  reportsCount: number;
}

const Admin: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [paymentMessages, setPaymentMessages] = useState<PaymentMessage[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'pending_receipts' | 'archived_receipts' | 'payment_messages' | 'reported_items' | 'stats'>('stats');
  const [userFilter, setUserFilter] = useState<'all' | 'premium' | 'free' | 'admin'>('all');
  
  // Selected student for progress report popup
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<UserProfile | null>(null);

  // Selected Receipt for Image Lightbox Model
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  
  // Quick Edit user modal or popover states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newPoints, setNewPoints] = useState<number>(0);
  const [newRole, setNewRole] = useState<string>('student');
  const [updatingUserStatus, setUpdatingUserStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  const fetchAdminData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      // Fetch users (safely query collection directly to avoid non-indexed order-by triggers online)
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCol);
      const usersList: UserProfile[] = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        usersList.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || 'مستخدم غير معروف',
          isPremium: !!data.isPremium,
          role: data.role || 'student',
          points: typeof data.points === 'number' ? data.points : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          lastActive: data.lastActive || null
        });
      });

      // Synchronously map over usersList and asynchronously fetch their progress list concurrently
      const progressPromises = usersList.map(async (u) => {
        try {
          const progressCol = collection(db, `users/${u.uid}/progress`);
          const progressSnapshot = await getDocs(progressCol);
          const uProgress: any[] = [];
          progressSnapshot.forEach((pDoc) => {
            const data = pDoc.data() as any;
            uProgress.push({
              id: pDoc.id,
              lessonId: data.lessonId || pDoc.id,
              status: data.status || 'started',
              score: typeof data.score === 'number' ? data.score : 0,
              updatedAt: data.updatedAt ? (data.updatedAt.seconds ? new Date(data.updatedAt.seconds * 1005) : null) : null
            });
          });
          return {
            ...u,
            progressList: uProgress
          };
        } catch (err) {
          console.error(`Error fetching progress for user ${u.uid}:`, err);
          return {
            ...u,
            progressList: []
          };
        }
      });

      const populatedUsersList = await Promise.all(progressPromises);
      // Sort in-memory client-side to ensure index-free reliability
      populatedUsersList.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ar'));
      setUsers(populatedUsersList);

      // Fetch payment receipts
      const receiptsCol = collection(db, 'payment_receipts');
      const receiptsSnapshot = await getDocs(receiptsCol);
      const receiptsList: PaymentReceipt[] = [];
      receiptsSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        receiptsList.push({
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          receiptUrl: data.receiptUrl || '',
          status: data.status || 'pending',
          createdAt: data.createdAt,
          rejectionReason: data.rejectionReason || ''
        });
      });
      setReceipts(receiptsList);

      // Fetch payment messages
      try {
        const msgsCol = collection(db, 'payment_messages');
        const msgsSnapshot = await getDocs(msgsCol);
        const msgsList: PaymentMessage[] = [];
        msgsSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          msgsList.push({
            id: doc.id,
            userId: data.userId || 'anonymous',
            userEmail: data.userEmail || '',
            senderName: data.senderName || 'طالب',
            senderPhone: data.senderPhone || '',
            messageText: data.messageText || '',
            status: data.status || 'unread',
            createdAt: data.createdAt
          });
        });
        msgsList.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setPaymentMessages(msgsList);
      } catch (err) {
        console.error("No payment messages table or permissions yet: ", err);
      }

      // Fetch reported forum posts
      try {
        const postsCol = collection(db, 'forum_posts');
        const postsSnapshot = await getDocs(postsCol);
        const rPostsList: ReportedPost[] = [];
        postsSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          if (typeof data.reportsCount === 'number' && data.reportsCount > 0) {
            rPostsList.push({
              id: doc.id,
              title: data.title || '',
              content: data.content || '',
              userName: data.userName || '',
              userEmail: data.userEmail || '',
              reportsCount: data.reportsCount
            });
          }
        });
        setReportedPosts(rPostsList);
      } catch (err) {
        console.error("Forum posts can be missing, that's fine");
      }

      // Fetch reported forum comments
      try {
        const commentsCol = collection(db, 'forum_comments');
        const commentsSnapshot = await getDocs(commentsCol);
        const rCommentsList: ReportedComment[] = [];
        commentsSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          if (typeof data.reportsCount === 'number' && data.reportsCount > 0) {
            rCommentsList.push({
              id: doc.id,
              postId: data.postId || '',
              content: data.content || '',
              userName: data.userName || '',
              userEmail: data.userEmail || '',
              reportsCount: data.reportsCount
            });
          }
        });
        setReportedComments(rCommentsList);
      } catch (err) {
        console.error("Forum comments can be missing, that's fine");
      }

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkMessageRead = async (msgId: string) => {
    try {
      const msgRef = doc(db, 'payment_messages', msgId);
      await updateDoc(msgRef, { status: 'read' });
      setPaymentMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'read' } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReportPost = async (postId: string) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, { reportsCount: 0 });
      setReportedPosts(prev => prev.filter(p => p.id !== postId));
      alert("تم تجاهل التبليغات وإعادة عداد التبليغات للصفر بنجاح.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReportComment = async (commentId: string) => {
    try {
      const commentRef = doc(db, 'forum_comments', commentId);
      await updateDoc(commentRef, { reportsCount: 0 });
      setReportedComments(prev => prev.filter(c => c.id !== commentId));
      alert("تم تجاهل التبليغات وتبرئة التعليق.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReportedPost = async (postId: string) => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا المنشور التخريبي نهائياً؟");
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
      setReportedPosts(prev => prev.filter(p => p.id !== postId));
      alert("تم حذف المنشور المعني بنجاح!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReportedComment = async (commentId: string) => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا التعليق البليد نهائياً؟");
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_comments', commentId));
      setReportedComments(prev => prev.filter(c => c.id !== commentId));
      alert("تم حذف التعليق بنجاح!");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserStatus(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPremium: !currentStatus
      });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isPremium: !currentStatus } : u));
    } catch (error) {
      alert("فشل في تحديث حالة الاشتراك المدفوع");
    } finally {
      setUpdatingUserStatus(null);
    }
  };

  const handleUpdatePointsRole = async () => {
    if (!editingUser) return;
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        points: Number(newPoints),
        role: newRole
      });
      setUsers(prev => prev.map(u => u.uid === editingUser.uid ? { ...u, points: Number(newPoints), role: newRole } : u));
      setEditingUser(null);
    } catch (error) {
      alert("تعذر حفظ معلومات العضو الفنية");
    }
  };

  const handleApproveReceipt = async (receipt: PaymentReceipt) => {
    const confirmApprove = window.confirm(`هل أنت متأكد من تفعيل الاشتراك لـ ${receipt.userEmail}؟`);
    if (!confirmApprove) return;

    try {
      // 1. Update user profile to Premium
      const userRef = doc(db, 'users', receipt.userId);
      await updateDoc(userRef, {
        isPremium: true
      });

      // 2. Update receipt status to approved
      const receiptRef = doc(db, 'payment_receipts', receipt.id);
      await updateDoc(receiptRef, {
        status: 'approved'
      });

      // Update local state
      setUsers(prev => prev.map(u => u.uid === receipt.userId ? { ...u, isPremium: true } : u));
      setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'approved' } : r));
      setSelectedReceipt(null);
      alert("تم تفعيل الاشتراك المميز وإقرار الوصل بنجاح! 🎉");
    } catch (error) {
      console.error(error);
      alert("فشل تفعيل الاشتراك، الرجاء التحقق من الصلاحيات والاتصال بالخادم.");
    }
  };

  const handleRejectReceipt = async (receipt: PaymentReceipt) => {
    const reason = window.prompt("تفاصيل الرفض (اختياري - سيظهر للمستخدم):", "الوصل غير واضح أو قديم أو رقم المعاملة غير متطابق.");
    if (reason === null) return; // Cancelled

    try {
      const receiptRef = doc(db, 'payment_receipts', receipt.id);
      await updateDoc(receiptRef, {
        status: 'rejected',
        rejectionReason: reason
      });

      setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'rejected', rejectionReason: reason } : r));
      setSelectedReceipt(null);
      alert("تم رفض طلب التفعيل وتعيين السبب.");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الرفض.");
    }
  };

  // Performance and Quiz Engagement Stats Generator
  const stats = React.useMemo(() => {
    let totalQuizzesSolved = 0;
    let quizScoreSum = 0;
    let totalLessonsRead = 0;
    
    // Score buckets for quizzes (for any attempt where score > 0)
    let excellentCount = 0; // 85 - 100
    let veryGoodCount = 0;  // 70 - 84
    let goodCount = 0;      // 50 - 69
    let weakCount = 0;      // < 50
    
    const subjectMetrics: Record<string, { readCount: number; quizCount: number; scoreSum: number; title: string; color: string; bgLight: string; textCol: string }> = {
      'philosophy': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'الفلسفة', color: 'bg-indigo-600', bgLight: 'bg-indigo-50/50', textCol: 'text-indigo-700' },
      'arabic': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'اللغة العربية', color: 'bg-emerald-600', bgLight: 'bg-emerald-50/50', textCol: 'text-emerald-700' },
      'history-geo': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'التاريخ والجغرافيا', color: 'bg-amber-600', bgLight: 'bg-amber-50/50', textCol: 'text-amber-700' },
      'islamic': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'العلوم الإسلامية', color: 'bg-teal-600', bgLight: 'bg-teal-50/50', textCol: 'text-teal-700' },
      'math': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'الرياضيات', color: 'bg-rose-600', bgLight: 'bg-rose-50/50', textCol: 'text-rose-700' },
      'french': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'اللغة الفرنسية', color: 'bg-sky-600', bgLight: 'bg-sky-50/50', textCol: 'text-sky-700' },
      'english': { readCount: 0, quizCount: 0, scoreSum: 0, title: 'اللغة الإنجليزية', color: 'bg-purple-600', bgLight: 'bg-purple-50/50', textCol: 'text-purple-700' },
    };

    // Keep track of lesson completions count
    const lessonCompletionCounts: Record<string, { title: string; count: number; subjectId: string }> = {};
    
    // Recent activities: list of recently completed lessons/quizzes
    const recentActivities: Array<{
      userName: string;
      userEmail: string;
      lessonId: string;
      lessonTitle: string;
      subjectId: string;
      status: string;
      score: number;
      updatedAt: Date;
    }> = [];

    // Map lessons content from SUBJECTS_CONTENT to get titles
    const lessonTitleMap: Record<string, { title: string; subjectId: string }> = {};
    Object.keys(SUBJECTS_CONTENT).forEach((subKey) => {
      const sub = SUBJECTS_CONTENT[subKey];
      sub.units?.forEach((unit) => {
        unit.lessons?.forEach((lesson) => {
          lessonTitleMap[lesson.id] = { title: lesson.title, subjectId: subKey };
        });
      });
    });

    users.forEach((u) => {
      if (!u.progressList) return;
      u.progressList.forEach((p) => {
        // Find subject key
        let subKey = 'other';
        if (p.lessonId.startsWith('phil')) subKey = 'philosophy';
        else if (p.lessonId.startsWith('ara')) subKey = 'arabic';
        else if (p.lessonId.startsWith('his') || p.lessonId.startsWith('geo')) subKey = 'history-geo';
        else if (p.lessonId.startsWith('isl')) subKey = 'islamic';
        else if (p.lessonId.startsWith('mat')) subKey = 'math';
        else if (p.lessonId.startsWith('fre')) subKey = 'french';
        else if (p.lessonId.startsWith('eng')) subKey = 'english';

        const info = lessonTitleMap[p.lessonId] || { title: p.lessonId, subjectId: subKey };

        // count reading / progress
        if (p.status === 'completed') {
          totalLessonsRead++;
          if (subjectMetrics[subKey]) {
            subjectMetrics[subKey].readCount++;
          }
        }

        // Check if there is an attempted quiz (score > 0 indicates a real quiz result)
        if (typeof p.score === 'number' && p.score > 0) {
          totalQuizzesSolved++;
          quizScoreSum += p.score;
          if (subjectMetrics[subKey]) {
            subjectMetrics[subKey].quizCount++;
            subjectMetrics[subKey].scoreSum += p.score;
          }

          // Buckets
          if (p.score >= 85) excellentCount++;
          else if (p.score >= 70) veryGoodCount++;
          else if (p.score >= 50) goodCount++;
          else weakCount++;
        }

        // Lesson specific count
        if (p.status === 'completed') {
          if (!lessonCompletionCounts[p.lessonId]) {
            lessonCompletionCounts[p.lessonId] = { title: info.title, count: 0, subjectId: subKey };
          }
          lessonCompletionCounts[p.lessonId].count++;
        }

        // Recent activity build
        if (p.updatedAt) {
          recentActivities.push({
            userName: u.displayName,
            userEmail: u.email,
            lessonId: p.lessonId,
            lessonTitle: info.title,
            subjectId: subKey,
            status: p.status,
            score: p.score,
            updatedAt: p.updatedAt
          });
        }
      });
    });

    // Sort recent activities by date descending
    recentActivities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Sort lesson completions to find top active lessons
    const topLessons = Object.keys(lessonCompletionCounts)
      .map((k) => ({ id: k, ...lessonCompletionCounts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averageQuizScore = totalQuizzesSolved > 0 ? Math.round(quizScoreSum / totalQuizzesSolved) : 0;

    return {
      totalQuizzesSolved,
      averageQuizScore,
      totalLessonsRead,
      buckets: {
        excellent: excellentCount,
        veryGood: veryGoodCount,
        good: goodCount,
        weak: weakCount
      },
      subjectMetrics,
      topLessons,
      recentActivities: recentActivities.slice(0, 10)
    };
  }, [users]);

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const queryStr = searchQuery.toLowerCase();
    const matchesSearch = u.displayName.toLowerCase().includes(queryStr) || 
                          u.email.toLowerCase().includes(queryStr);
    
    if (!matchesSearch) return false;
    
    if (userFilter === 'premium') return u.isPremium;
    if (userFilter === 'free') return !u.isPremium;
    if (userFilter === 'admin') return u.role === 'admin';
    return true;
  });

  const pendingReceipts = receipts.filter(r => r.status === 'pending');
  const archivedReceipts = receipts.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-xs font-black">جاري تحميل بيانات الإدارة والمستخدمين...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 bg-gray-50/70 min-h-screen font-sans" dir="rtl">
      {/* Header Banner */}
      <header className="mb-8 bg-gradient-to-l from-emerald-600 to-teal-700 text-white p-6 rounded-[32px] shadow-xl shadow-emerald-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
            <Shield size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">لوحة التحكم والإشراف</h1>
            <p className="text-emerald-100 text-xs mt-1">عرض الأعضاء، تحرير النقاط والألقاب وتسهيل تأكيد طلبات الدفع يدوياً</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchAdminData(true)} 
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5 active:scale-95 disabled:opacity-55"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "تحديث..." : "تحديث فوري"}
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95"
          >
            الرجوع للرئيسية
          </button>
        </div>
      </header>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">إجمالي الطلاب المسجلين</p>
            <p className="text-lg font-black text-gray-900">{users.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold animate-pulse">
            <Crown size={18} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">المشتركون بالباقة الفائقة</p>
            <p className="text-lg font-black text-amber-600">{users.filter(u => u.isPremium).length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">طلبات تفعيل قيد المراجعة</p>
            <p className="text-lg font-black text-red-600">{pendingReceipts.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">الاشتراكات المفعلة يدوياً</p>
            <p className="text-lg font-black text-emerald-600">{receipts.filter(r => r.status === 'approved').length}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex gap-2 bg-gray-200/60 p-1 rounded-2xl overflow-x-auto no-scrollbar py-2 px-2 shadow-inner mb-6">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
            activeTab === 'stats' 
              ? 'bg-white text-emerald-800 border-gray-100 shadow-sm font-black' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          <BarChart2 size={14} className="text-emerald-650" />
          تحليلات الأداء والتفاعل
        </button>

        <button 
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
            activeTab === 'users' 
              ? 'bg-white text-emerald-800 border-gray-100 shadow-sm font-black' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          <Users size={14} />
          قائمة المستخدمين والمسجلين
        </button>

        <button 
          onClick={() => setActiveTab('pending_receipts')}
          className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border relative ${
            activeTab === 'pending_receipts' 
              ? 'bg-white text-emerald-800 border-gray-100 shadow-sm font-black' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          <Clock size={14} className="text-amber-500" />
          طلبات التفعيل الجديدة
          {pendingReceipts.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-2 py-0.5 animate-bounce">
              {pendingReceipts.length}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('archived_receipts')}
          className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
            activeTab === 'archived_receipts' 
              ? 'bg-white text-emerald-800 border-gray-100 shadow-sm font-black' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          <CheckCircle size={14} className="text-emerald-500" />
          أرشيف طلبات المعالجة
        </button>

        <button 
          onClick={() => setActiveTab('payment_messages')}
          className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border relative ${
            activeTab === 'payment_messages' 
              ? 'bg-white text-emerald-800 border-gray-100 shadow-sm font-black' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          <MessageSquare size={14} className="text-blue-500" />
          رسائل الدفع والتواصل
          {paymentMessages.filter(m => m.status === 'unread').length > 0 && (
            <span className="bg-blue-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">
              {paymentMessages.filter(m => m.status === 'unread').length}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('reported_items')}
          className={`px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border relative ${
            activeTab === 'reported_items' 
              ? 'bg-white text-rose-800 border-gray-100 shadow-sm font-black' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          <AlertTriangle size={14} className="text-rose-500" />
          بلاغات منتدى الطلبة
          {(reportedPosts.length + reportedComments.length) > 0 && (
            <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">
              {reportedPosts.length + reportedComments.length}
            </span>
          )}
        </button>
      </div>

      {/* Screen Views */}
      <AnimatePresence mode="wait">

        {/* DETAILED ACADEMIC STATISTICS PORTAL */}
        {activeTab === 'stats' && (
          <motion.div 
            key="stats-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-8 text-right bg-transparent"
          >
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">متوسط التحصيل في التمارين</p>
                  <p className="text-3xl font-black text-emerald-600">% {stats.averageQuizScore}</p>
                  <p className="text-[10px] text-gray-450 font-bold mt-1">معدل الإجابات الصحيحة للطلاب</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">الامتحانات والتمارين المنجزة</p>
                  <p className="text-3xl font-black text-indigo-650">{stats.totalQuizzesSolved}</p>
                  <p className="text-[10px] text-gray-450 font-bold mt-1">تم حلهم بالكامل وتقييمهم</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BarChart2 size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">إجمالي الحصص والدروس المقروءة</p>
                  <p className="text-3xl font-black text-amber-600">{stats.totalLessonsRead}</p>
                  <p className="text-[10px] text-gray-450 font-bold mt-1">إعلانات الإكمال بنجاح من الطلاب</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <BookOpen size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">معدل الالتزام والدراسة اليومية</p>
                  <p className="text-3xl font-black text-rose-600">
                    {users.length > 0 ? Math.round(users.reduce((acc, u) => acc + (u.streakDays || 0), 0) / users.length) : 0} يوماً
                  </p>
                  <p className="text-[10px] text-gray-450 font-bold mt-1">متوسط سلسلة الأيام المتتالية للطلاب</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Activity size={28} />
                </div>
              </div>
            </div>

            {/* Visual Bento Analytics row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution of Score Levels */}
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-950 mb-1 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    توزيع نتائج ومستويات الطلاب في الاختبارات
                  </h3>
                  <p className="text-gray-400 text-[10px] font-bold mb-6">النسبة المئوية لعدد المحاولات حسب جودة نقاط التحصيل الفكري</p>
                </div>

                <div className="space-y-4">
                  {/* Excellent Bucket */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.2 flex-row-reverse" dir="ltr">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        ممتاز (85% وأعلى) - طلاب متفوقون
                      </span>
                      <span className="text-[11px] font-black">{stats.buckets.excellent} محاولة</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.totalQuizzesSolved > 0 ? (stats.buckets.excellent / stats.totalQuizzesSolved) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Very Good Bucket */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.2 flex-row-reverse" dir="ltr">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        جيد جداً (70% - 84%) - تحصيل رائع
                      </span>
                      <span className="text-[11px] font-black">{stats.buckets.veryGood} محاولة</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.totalQuizzesSolved > 0 ? (stats.buckets.veryGood / stats.totalQuizzesSolved) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Good Bucket */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.2 flex-row-reverse" dir="ltr">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        مقبول (50% - 69%) - يحتاج لتركيز إضافي
                      </span>
                      <span className="text-[11px] font-black">{stats.buckets.good} محاولة</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.totalQuizzesSolved > 0 ? (stats.buckets.good / stats.totalQuizzesSolved) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Weak Bucket */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.2 flex-row-reverse" dir="ltr">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        ضعيف (تحت 50%) - إعادة قراءة وتوجيه
                      </span>
                      <span className="text-[11px] font-black">{stats.buckets.weak} محاولة</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.totalQuizzesSolved > 0 ? (stats.buckets.weak / stats.totalQuizzesSolved) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject metrics breakdown */}
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-right">
                <div>
                  <h3 className="text-sm font-black text-gray-950 mb-1 flex items-center gap-2 justify-start">
                    <BookOpen size={16} className="text-indigo-500" />
                    مؤشرات التفاعل والتحصيل الدراسي حسب المادة
                  </h3>
                  <p className="text-gray-400 text-[10px] font-bold mb-4">يعرض النشاط القرائي للدروس وتدريبات المواد المبرمجة بالشهادة</p>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {Object.keys(stats.subjectMetrics).map((subKey) => {
                    const sub = stats.subjectMetrics[subKey];
                    const avgScore = sub.quizCount > 0 ? Math.round(sub.scoreSum / sub.quizCount) : 0;
                    return (
                      <div key={subKey} className="p-3 border border-gray-100 rounded-2xl flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs font-extrabold mb-1.5 text-gray-800">
                            <span>{sub.title}</span>
                            <span className="text-[10px] text-gray-400">معدل التحصيل: {avgScore > 0 ? `${avgScore}%` : 'لا نتائج'}</span>
                          </div>
                          
                          {/* Progress bar representing readCount & quizCount combined activity */}
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${sub.color} rounded-full`}
                              style={{ width: `${Math.min(100, (sub.readCount + sub.quizCount) * 10)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-left shrink-0">
                          <div className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold ${sub.bgLight} ${sub.textCol}`}>
                            {sub.readCount} قراءة
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold bg-gray-100 text-gray-650">
                            {sub.quizCount} حل
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Popular Lessons and Recent Dynamic Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Lessons */}
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-right">
                <h3 className="text-sm font-black text-gray-900 mb-1">الدروس الأكثر قراءة وتفاعلاً بالمنصة</h3>
                <p className="text-gray-400 text-[10px] font-bold mb-4">الدروس الخمس المتربعة على تفاعل إكمال الطلاب لنسب الفهم والأداء</p>

                {stats.topLessons.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs text-center">لا يوجد قراءات مسجلة بعد.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {stats.topLessons.map((l, index) => (
                      <div key={l.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${
                            index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-gray-150 text-gray-650' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-xs font-extrabold text-gray-800">{l.title}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-black">
                          {l.count} طلاب أتموا الدرس
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity stream */}
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-right">
                <h3 className="text-sm font-black text-gray-900 mb-1">تدفق النشاط الفوري والأخير للطلاب</h3>
                <p className="text-gray-400 text-[10px] font-bold mb-4">إشعارات عمليات التحصيل الفكري وإنهائهم الواجبات بالاختبارات السريعة</p>

                {stats.recentActivities.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs text-center">لا توجد تفاعلات متبعة بالأيام الماضية.</div>
                ) : (
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {stats.recentActivities.map((act, i) => (
                      <div key={i} className="flex gap-3 text-xs leading-relaxed border-r-2 border-emerald-500 pr-3 py-1 bg-gray-50/40 p-2.5 rounded-xl border border-gray-100">
                        <div className="flex-1 text-right">
                          <p className="font-bold text-gray-800">
                            انتهى الطالب <span className="font-extrabold text-gray-950 underline">{act.userName}</span> من {act.score > 0 ? "حل تمرين" : "قراءة درس"}: <span className="text-indigo-700 font-extrabold">{act.lessonTitle}</span>
                          </p>
                          <div className="flex gap-2 items-center text-[9px] text-gray-400 mt-1 font-semibold justify-start">
                            <span>البريد الإلكتروني: {act.userEmail}</span>
                            <span>•</span>
                            <span>{act.updatedAt ? new Date(act.updatedAt).toLocaleDateString() : 'الآن'}</span>
                          </div>
                        </div>
                        {act.score > 0 && (
                          <div className="shrink-0 flex flex-col justify-center items-end">
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-250">
                              % {act.score}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Students overall results table card */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-right">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-gray-950">لوحة تقصي ومتابعة مستويات الطلاب الكلية</h3>
                  <p className="text-gray-400 text-[10px] font-bold mt-0.5">دراسة نقاط ومعدلات كل تلميذ على حدة لكشف الالتزام وسرعة تحصيله المعرفي</p>
                </div>

                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-450">
                    <Search size={14} className="text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث عن طالب بالاسم أو البريد..."
                    className="w-full bg-gray-50 border border-gray-200/80 p-2.5 pr-10 rounded-xl outline-none text-xs font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-150 text-gray-500 font-extrabold">
                    <tr>
                      <th className="p-4 rounded-r-xl">اسم الطالب</th>
                      <th className="p-4">نوع الرتبة</th>
                      <th className="p-4 text-center">النقاط</th>
                      <th className="p-4 text-center">المتتالية اليومية</th>
                      <th className="p-4 text-center">الدروس المقروءة</th>
                      <th className="p-4 text-center">التمارين المحلولة</th>
                      <th className="p-4 text-center">معدل الاختبارات</th>
                      <th className="p-4 text-left rounded-l-xl">تقارير مفصلة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 leading-normal">
                    {filteredUsers.filter(u => u.role !== 'admin').map((std) => {
                      const completedCount = std.progressList ? std.progressList.filter(p => p.status === 'completed').length : 0;
                      const quizAttempts = std.progressList ? std.progressList.filter(p => typeof p.score === 'number' && p.score > 0) : [];
                      const solvedCount = quizAttempts.length;
                      const averageQuizScoreSum = solvedCount > 0 ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / solvedCount) : 0;

                      return (
                        <tr key={std.uid} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-extrabold text-gray-900 text-sm">{std.displayName}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{std.email}</p>
                          </td>
                          <td className="p-4">
                            {std.isPremium ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-250 text-[9px] font-black rounded px-2.5 py-0.5 inline-flex items-center gap-1">
                                <Crown size={9} fill="currentColor" /> Premium
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-500 text-[9px] font-black rounded px-2.5 py-0.5 inline-block">
                                مجاني
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-emerald-600">{std.points} ن</td>
                          <td className="p-4 text-center font-bold text-amber-600">{std.streakDays} يوماً</td>
                          <td className="p-4 text-center font-extrabold text-gray-700">{completedCount} حصص</td>
                          <td className="p-4 text-center font-extrabold text-gray-700">{solvedCount} امتحانات</td>
                          <td className="p-4 text-center">
                            {solvedCount > 0 ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                averageQuizScoreSum >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 
                                averageQuizScoreSum >= 70 ? 'bg-blue-50 text-blue-700 border border-blue-150' : 
                                averageQuizScoreSum >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-150' : 
                                'bg-rose-50 text-rose-700 border border-rose-150'
                              }`}>
                                % {averageQuizScoreSum}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">لا توجد علامات</span>
                            )}
                          </td>
                          <td className="p-4 text-left">
                            <button
                              onClick={() => setSelectedStudentForProgress(std)}
                              className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-black cursor-pointer px-3 py-1.5 rounded-xl text-[10px] transition-all"
                            >
                              تقرير السجلات
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS ACCCOUNTS PAGE */}
        {activeTab === 'users' && (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Filtering Tools container */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-450">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="البحث بالاسم الكلي أو البريد الإلكتروني..."
                  className="w-full bg-gray-50/60 border border-gray-200/80 p-3.5 pr-11 rounded-xl outline-none text-xs font-bold focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sub filters */}
              <div className="flex gap-1.5 shrink-0 bg-gray-100 p-1 rounded-xl">
                {(['all', 'premium', 'free', 'admin'] as const).map((filterOpt) => (
                  <button
                    key={filterOpt}
                    onClick={() => setUserFilter(filterOpt)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      userFilter === filterOpt 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-250'
                    }`}
                  >
                    {filterOpt === 'all' && 'الكل'}
                    {filterOpt === 'premium' && 'المميز'}
                    {filterOpt === 'free' && 'المجاني'}
                    {filterOpt === 'admin' && 'المشرفين'}
                  </button>
                ))}
              </div>
            </div>

            {/* Display list of users */}
            <div className="grid gap-3">
              {filteredUsers.map((user) => (
                <div 
                  key={user.uid} 
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 text-emerald-600 font-black text-sm border border-gray-150 flex items-center justify-center shrink-0">
                      {user.displayName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-extrabold text-gray-900 text-sm">{user.displayName}</h4>
                        {user.isPremium && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black rounded px-2 py-0.5 flex items-center gap-1">
                            <Crown size={10} fill="currentColor" /> Premium
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[8px] font-black rounded px-2 py-0.5">
                            مسؤول النظام
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-semibold md:gap-4">
                        <span className="flex items-center gap-1"><Mail size={11} /> {user.email}</span>
                        <span className="flex items-center gap-1"><Award size={11} className="text-emerald-500" /> {user.points} نقطة</span>
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-500" /> {user.streakDays} يوم متتالي</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {/* Toggle premium quickly */}
                    <button
                      disabled={updatingUserStatus === user.uid}
                      onClick={() => togglePremium(user.uid, user.isPremium)}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-black inline-flex items-center gap-1.5 transition-all w-32 justify-center ${
                        user.isPremium 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100/70 border border-red-200' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/70 border border-emerald-250'
                      }`}
                    >
                      {updatingUserStatus === user.uid ? (
                        "جاري..."
                      ) : user.isPremium ? (
                        <>
                          <XCircle size={12} />
                          إلغاء التفعيل
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} />
                          تفعيل ممتاز
                        </>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setNewPoints(user.points);
                        setNewRole(user.role);
                      }}
                      className="p-2 h-9 w-9 bg-gray-100 text-gray-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 transition-colors flex items-center justify-center"
                      title="تعديل الرتبة والجوائز"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="py-20 text-center bg-white border border-gray-100 rounded-2xl p-8">
                  <p className="text-gray-400 text-sm font-bold">لا توجد حسابات تلائم محددات البحث الخاصة بك</p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-emerald-600 text-xs font-extrabold mt-2 underline">
                      إلغاء محددات البحث
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PENDING RECEIPTS PORTAL */}
        {activeTab === 'pending_receipts' && (
          <motion.div 
            key="pending-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {pendingReceipts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm mb-1">كل شيء نظيف وموافق عليه!</h3>
                <p className="text-gray-400 text-xs">لا يوجد أي طلبات اشتراك قيد الانتظار حالياً.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingReceipts.map((receipt) => (
                  <div key={receipt.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">طلب تفعيل معلق</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{receipt.userEmail}</h4>
                        <p className="text-[10px] text-gray-400">تاريخ الإرسال: {receipt.createdAt ? new Date(receipt.createdAt.seconds * 1000).toLocaleString('ar-DZ') : 'غير متوفر'}</p>
                      </div>

                      {/* Display receipt image snippet */}
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group cursor-pointer"
                      >
                        {receipt.receiptUrl ? (
                          <img src={receipt.receiptUrl} alt="Receipt Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Eye size={16} /></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={14} />
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleApproveReceipt(receipt)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle size={12} />
                        تفعيل وتأكيد
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectReceipt(receipt)}
                        className="bg-gray-100 hover:bg-gray-200 text-red-600 font-black text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <XCircle size={12} />
                        رفض وتمرير
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ARCHIVED RECEIPTS PAGE */}
        {activeTab === 'archived_receipts' && (
          <motion.div 
            key="archived-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {archivedReceipts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl text-gray-400 text-xs">
                لا توجد معاملات مكتملة بالأرشيف بعد.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-50 border-b border-gray-150 text-gray-500 font-extrabold">
                      <tr>
                        <th className="p-4">البريد الإلكتروني</th>
                        <th className="p-4">تاريخ المعاملة</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">صورة الوصل</th>
                        <th className="p-4">السبب/التعليق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {archivedReceipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{receipt.userEmail}</td>
                          <td className="p-4 text-gray-400 text-[11px]">
                            {receipt.createdAt ? new Date(receipt.createdAt.seconds * 1000).toLocaleDateString('ar-DZ') : 'غير متوفر'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              receipt.status === 'approved' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                : 'bg-red-50 text-red-700 border border-red-150'
                            }`}>
                              {receipt.status === 'approved' ? 'مقبول ومفعل' : 'مرفوض'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedReceipt(receipt)}
                              className="text-emerald-600 hover:text-emerald-700 font-black cursor-pointer flex items-center gap-1 hover:underline"
                            >
                              <Eye size={12} /> معاينة الوصل
                            </button>
                          </td>
                          <td className="p-4 text-gray-400 italic text-[11px] max-w-[200px] truncate">
                            {receipt.rejectionReason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* PAYMENT MESSAGES PORTAL */}
        {activeTab === 'payment_messages' && (
          <motion.div 
            key="messages-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {paymentMessages.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl text-gray-400 text-xs shadow-sm">
                لا توجد رسائل دفع أو استفسارات واردة من المشتركين حالياً.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {paymentMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-5 rounded-3xl border transition-all duration-300 ${
                      msg.status === 'unread' 
                        ? 'bg-blue-50/40 border-blue-200 shadow-xs' 
                        : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-extrabold text-gray-900 text-sm">{msg.senderName}</h4>
                          {msg.status === 'unread' && (
                            <span className="bg-blue-600 text-white text-[9px] font-black rounded px-1.5 py-0.5">جديد</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">البريد: {msg.userEmail}</p>
                        {msg.senderPhone && (
                          <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">الهاتف: {msg.senderPhone}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleString('ar-DZ', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 font-medium bg-gray-50/50 border border-gray-100 p-3 rounded-xl mb-4 leading-relaxed whitespace-pre-wrap">
                      {msg.messageText}
                    </p>

                    {msg.status === 'unread' && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleMarkMessageRead(msg.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-[10px] font-black shadow-md shadow-blue-550/10 transition-all flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle size={11} />
                          تحديد كمقروءة
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* REPORTED FORUM ITEMS */}
        {activeTab === 'reported_items' && (
          <motion.div 
            key="reported-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Reported Posts */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-rose-700 flex items-center gap-2 px-1">
                <AlertTriangle size={14} />
                المنشورات المبلغ عنها ({reportedPosts.length})
              </h3>
              {reportedPosts.length === 0 ? (
                <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl text-gray-400 text-xs shadow-sm">
                  لا توجد منشورات مبلغ عنها. ممتاز!
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {reportedPosts.map((post) => (
                    <div key={post.id} className="bg-red-50/10 border border-red-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-black px-2 py-0.5 rounded">
                            عدد التبليغات: {post.reportsCount}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">{post.userName}</span>
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-sm mb-1 leading-normal">{post.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">{post.content}</p>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-red-150 mt-auto">
                        <button
                          onClick={() => handleDeleteReportedPost(post.id)}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black shadow-md"
                        >
                          حذف المنشور نهائياً
                        </button>
                        <button
                          onClick={() => handleDismissReportPost(post.id)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-xl text-[10px] font-black"
                        >
                          تجاهل التبليغ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reported Comments */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-rose-700 flex items-center gap-2 px-1">
                <AlertTriangle size={14} />
                التعليقات المبلغ عنها ({reportedComments.length})
              </h3>
              {reportedComments.length === 0 ? (
                <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl text-gray-400 text-xs shadow-sm">
                  لا توجد تعليقات مبلغ عنها.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {reportedComments.map((comment) => (
                    <div key={comment.id} className="bg-red-50/10 border border-red-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-black px-2 py-0.5 rounded">
                            عدد التبليغات: {comment.reportsCount}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">{comment.userName}</span>
                        </div>
                        <p className="text-xs text-gray-700 font-semibold leading-relaxed mb-4">{comment.content}</p>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-red-150 mt-auto">
                        <button
                          onClick={() => handleDeleteReportedComment(comment.id)}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black shadow-md"
                        >
                          حذف التعليق نهائياً
                        </button>
                        <button
                          onClick={() => handleDismissReportComment(comment.id)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-xl text-[10px] font-black"
                        >
                          تجاهل وتبرئة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* USER METADATA EDITOR POPUP */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">تعديل معلومات وتفاصيل العضو</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">{editingUser.displayName}</p>
                </div>
                <button 
                  onClick={() => setEditingUser(null)} 
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2">جهة الرتبة والصلاحية</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRole('student')}
                      className={`py-3 rounded-xl text-xs font-black border transition-all ${
                        newRole === 'student' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      طالب (Student)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('admin')}
                      className={`py-3 rounded-xl text-xs font-black border transition-all ${
                        newRole === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-300' 
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      مسؤول (Admin)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2">نقاط الطالب الحالية (تحفيز)</label>
                  <input
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleUpdatePointsRole}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md"
                >
                  تأكيد وحفظ
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-3 rounded-xl transition-all"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL RECEIPT LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-200 text-right font-sans flex flex-col gap-4 max-h-[90vh]"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">معاينة وصل تسديد الاشتراك المميز</h3>
                  <p className="text-gray-450 text-[10px]">{selectedReceipt.userEmail}</p>
                </div>
                <button 
                  onClick={() => setSelectedReceipt(null)} 
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Picture view */}
              <div className="flex-1 overflow-auto bg-gray-950 rounded-2xl p-2 flex items-center justify-center min-h-[250px] relative max-h-[50vh]">
                {selectedReceipt.receiptUrl ? (
                  <img 
                    src={selectedReceipt.receiptUrl} 
                    alt="Receipt Invoice Slip" 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-gray-500 italic text-xs">لا توجد صورة للوصل متوفرة أو أن الصيغة غير معترف بها.</div>
                )}
              </div>

              {/* Status information */}
              <div className="bg-gray-50 p-3.5 rounded-xl text-[11px] leading-normal text-gray-600">
                <span className="font-bold text-gray-800">بيانات المعاملة الإضافية:</span>
                <div className="mt-1.5 space-y-1">
                  <p>البريد الإلكتروني للعميل: {selectedReceipt.userEmail}</p>
                  <p>رقم تعريف العضو (UID): {selectedReceipt.userId}</p>
                  <p>حالة التفعيل الحالية: <span className="font-bold">{selectedReceipt.status === 'pending' ? 'بقيد المراجعة' : selectedReceipt.status === 'approved' ? 'موافق ومعتمد' : 'مرفوض'}</span></p>
                  {selectedReceipt.rejectionReason && <p className="text-red-500">سبب الرفض: {selectedReceipt.rejectionReason}</p>}
                </div>
              </div>

              {/* Quick actions inside the lightbox if it is pending */}
              {selectedReceipt.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleApproveReceipt(selectedReceipt)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    تفعيل واقرار العضوية
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectReceipt(selectedReceipt)}
                    className="bg-red-50 hover:bg-red-100/85 text-red-600 font-extrabold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} />
                    رفض الطلب
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED STUDENT PROGRESS popup MODAL */}
      <AnimatePresence>
        {selectedStudentForProgress && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] text-right"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-950 text-sm flex items-center gap-2">
                    <Award size={16} className="text-emerald-500" />
                    كشف تفاعل الطالب الأكاديمي
                  </h3>
                  <p className="text-gray-400 text-[10px] mt-0.5 font-bold">
                    سجلات الطالب: {selectedStudentForProgress.displayName} ({selectedStudentForProgress.email})
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStudentForProgress(null)} 
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Student overview metrics inside model */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-bold">إجمالي النقاط</p>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{selectedStudentForProgress.points} ن</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-bold">الدروس المنجزة</p>
                  <p className="text-sm font-black text-indigo-650 mt-0.5">
                    {selectedStudentForProgress.progressList ? selectedStudentForProgress.progressList.filter(p => p.status === 'completed').length : 0} حصص
                  </p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-bold">التمارين المحلولة</p>
                  <p className="text-sm font-black text-amber-650 mt-0.5">
                    {selectedStudentForProgress.progressList ? selectedStudentForProgress.progressList.filter(p => typeof p.score === 'number' && p.score > 0).length : 0} امتحانات
                  </p>
                </div>
              </div>

              {/* List of lessons / quizzes progress status */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[150px]">
                <h4 className="text-xs font-black text-gray-900 border-r-2 border-emerald-500 pr-2 mb-3">تفاصيل الحصص والاختبارات الفردية:</h4>
                
                {!selectedStudentForProgress.progressList || selectedStudentForProgress.progressList.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs italic">
                    لا توجد دروس أو علامات مسجلة لهذا الطالب في الوقت الحالي.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStudentForProgress.progressList.map((p) => {
                      // Lookup title or material from SUBJECTS_CONTENT map dynamically
                      let lessonTitle = p.lessonId;
                      let subjectName = 'مادة أخرى';
                      let labelColor = 'text-gray-500 bg-gray-100';

                      Object.keys(SUBJECTS_CONTENT).forEach((subKey) => {
                        const sub = SUBJECTS_CONTENT[subKey];
                        sub.units?.forEach((unit) => {
                          unit.lessons?.forEach((lesson) => {
                            if (lesson.id === p.lessonId) {
                              lessonTitle = lesson.title;
                              subjectName = subKey === 'philosophy' ? 'الفلسفة' :
                                            subKey === 'arabic' ? 'اللغة العربية' :
                                            subKey === 'history-geo' ? 'التاريخ والجغرافيا' :
                                            subKey === 'islamic' ? 'العلوم الإسلامية' :
                                            subKey === 'math' ? 'الرياضيات' :
                                            subKey === 'french' ? 'اللغة الفرنسية' :
                                            subKey === 'english' ? 'اللغة الإنجليزية' : 'مادة أخرى';
                              
                              labelColor = subKey === 'philosophy' ? 'text-indigo-750 bg-indigo-50 border border-indigo-150' :
                                           subKey === 'arabic' ? 'text-emerald-750 bg-emerald-50 border border-emerald-150' :
                                           subKey === 'history-geo' ? 'text-amber-750 bg-amber-50 border border-amber-150' :
                                           subKey === 'islamic' ? 'text-teal-750 bg-teal-50 border border-teal-150' :
                                           subKey === 'math' ? 'text-rose-750 bg-rose-50 border border-rose-150' :
                                           'text-sky-750 bg-sky-50 border border-sky-150';
                            }
                          });
                        });
                      });

                      return (
                        <div key={p.id} className="p-3.5 bg-gray-50 border border-gray-150/60 rounded-2xl flex items-center justify-between gap-4">
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black inline-block ${labelColor}`}>
                              {subjectName}
                            </span>
                            <h5 className="font-extrabold text-xs text-gray-800 mt-1">{lessonTitle}</h5>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                              حالة القراءة: {p.status === 'completed' ? 'تم قراءة الحصة واستيعابها' : 'قيد المتابعة'}
                            </p>
                          </div>

                          <div className="text-left shrink-0">
                            {typeof p.score === 'number' && p.score > 0 ? (
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold ml-1.5">علامة التمرين:</span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-block ${
                                  p.score >= 85 ? 'bg-emerald-100 text-emerald-700' :
                                  p.score >= 70 ? 'bg-blue-100 text-blue-700' :
                                  p.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  % {p.score}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-400 font-bold italic bg-gray-100 px-2 py-1 rounded-md">
                                أتم القراءة فقط
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForProgress(null)}
                  className="bg-gray-900 hover:bg-gray-850 text-white font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  إغلاق السجل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
