import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronLeft, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Phone, 
  User, 
  Sparkles, 
  DollarSign, 
  Trash2, 
  AlertCircle,
  Video,
  ExternalLink,
  Hourglass,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface BookingRequest {
  id: string;
  grade: string;
  subject: string;
  dayName: string;
  dateStr: string;
  timeSlot: string;
  duration: string;
  price: number;
  studentName: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

const GRADES = [
  'السنة الثالثة ثانوي - شعبة علوم تجريبية',
  'السنة الثالثة ثانوي - شعبة رياضيات',
  'السنة الثالثة ثانوي - شعبة تقني رياضي',
  'السنة الثالثة ثانوي - شعبة تسيير واقتصاد',
  'السنة الثالثة ثانوي - شعبة آداب وفلسفة',
  'السنة الثالثة ثانوي - شعبة لغات أجنبية',
  'السنة الثانية ثانوي - شعب علمية',
  'السنة الثانية ثانوي - شعب أدبية',
  'السنة الأولى ثانوي - جذع مشترك'
];

const SUBJECTS = [
  { id: 'math', name: 'الرياضيات 📐' },
  { id: 'philosophy', name: 'الفلسفة 🧠' },
  { id: 'arabic', name: 'الأدب العربي ✍️' },
  { id: 'history-geo', name: 'التاريخ والجغرافيا 🌍' },
  { id: 'islamic', name: 'العلوم الإسلامية 🕌' },
  { id: 'physics', name: 'العلوم الفيزيائية ⚡' },
  { id: 'science', name: 'علوم الطبيعة والحياة 🧬' },
  { id: 'english', name: 'اللغة الإنجليزية 🇬🇧' },
  { id: 'french', name: 'اللغة الفرنسية 🇫🇷' }
];

const TIME_SLOTS = [
  { time: '09:00 - 10:00', label: 'صباحاً' },
  { time: '10:30 - 11:30', label: 'صباحاً' },
  { time: '14:00 - 15:00', label: 'مساءً' },
  { time: '16:00 - 17:00', label: 'مساءً' },
  { time: '18:00 - 19:00', label: 'مساءً' },
  { time: '20:00 - 21:00', label: 'ليلاً' },
  { time: '21:30 - 22:30', label: 'ليلاً' }
];

const DURATIONS = [
  { id: '1hour', name: 'ساعة واحدة', value: '1 ساعة' },
  { id: '2hours', name: 'ساعتين', value: '2 ساعة' }
];

// Helper to get next 7 days starting from today in Arabic formatted text
const getNext7Days = () => {
  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  const days = [];
  const start = new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    
    const dayName = arabicDays[d.getDay()];
    const dateNum = d.getDate();
    const monthName = arabicMonths[d.getMonth()];
    
    days.push({
      dayName,
      dateNum,
      monthName,
      fullDateString: `${dateNum} ${monthName}`,
      isoDate: d.toISOString().split('T')[0]
    });
  }
  return days;
};

const PrivateRequest: React.FC = () => {
  const { profile } = useAuth();
  const { theme, themeColors } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');
  
  // Form States
  const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].name);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0].time);
  const [selectedDuration, setSelectedDuration] = useState('1hour');
  const [studentName, setStudentName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState('');
  
  // Validation / Message States
  const [errorMsg, setErrorMsg] = useState('');
  const [successBooking, setSuccessBooking] = useState<BookingRequest | null>(null);
  
  const upcomingDays = useMemo(() => getNext7Days(), []);
  
  // Load saved bookings
  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    try {
      const saved = localStorage.getItem('private_class_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field Validation
    if (!studentName.trim()) {
      setErrorMsg('فضلاً، يرجى كتابة اسمك الكامل.');
      return;
    }
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setErrorMsg('فضلاً، يرجى كتابة رقم هاتفك للتواصل.');
      return;
    }
    // Check Algerian phone length (usually 10 digits starting with 0, or 9 digits, or country code)
    if (cleanPhone.length < 9 || cleanPhone.length > 14) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح (مثال: 0555123456 أو 0666123456).');
      return;
    }

    const currentDay = upcomingDays[selectedDayIdx];
    const durationLabel = DURATIONS.find(d => d.id === selectedDuration)?.name || 'ساعة واحدة';
    
    const newBooking: BookingRequest = {
      id: `PRV-${Math.floor(100000 + Math.random() * 900000)}`,
      grade: selectedGrade,
      subject: selectedSubject,
      dayName: currentDay.dayName,
      dateStr: currentDay.fullDateString,
      timeSlot: selectedTimeSlot,
      duration: durationLabel,
      price: 2000,
      studentName: studentName.trim(),
      phone: cleanPhone,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Store Booking
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    localStorage.setItem('private_class_bookings', JSON.stringify(updatedBookings));

    // Show Success screen
    setSuccessBooking(newBooking);
  };

  const handleCancelBooking = (id: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    setBookings(updated);
    localStorage.setItem('private_class_bookings', JSON.stringify(updated));
  };

  const handleDeleteHistory = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      localStorage.setItem('private_class_bookings', JSON.stringify(updated));
    }
  };

  return (
    <div className="pb-24 text-right" style={{ direction: 'rtl' }}>
      {/* Premium Header */}
      <header className={`bg-gradient-to-l ${themeColors[theme].gradient} text-white p-6 rounded-b-[36px] shadow-lg mb-6 relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="rotate-180" />
          </Link>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
             اطلب حصة خصوصية (فردي)
          </h1>
          <div className="w-9"></div> {/* spacing helper */}
        </div>
        
        <p className="text-white/80 text-xs text-center max-w-md mx-auto leading-relaxed">
          احجز حصة مباشرة فردية ومكثفة (1-on-1) مع باقة من نخبة الأساتذة لشرح وتبسيط وحل جميع تساؤلاتك بدقة عالية.
        </p>

        {/* Floating Icons Background */}
        <div className="absolute -left-6 -bottom-6 opacity-10 pointer-events-none">
          <Hourglass size={120} />
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap size={120} />
        </div>
      </header>

      <div className="px-6 max-w-2xl mx-auto">
        {/* Modern Switch Tabs */}
        {!successBooking && (
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all ${
                activeTab === 'book'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              اطلب حصة جديدة 👨‍🏫
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              طلباتي السابقة ({bookings.length})
            </button>
          </div>
        )}

        {/* SUCCESS PANEL */}
        {successBooking ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl text-center"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-inner">
              <CheckCircle2 size={36} className="animate-bounce" />
            </div>
            
            <h2 className="text-xl font-black text-gray-900 mb-1">تم إرسال طلبك بنجاح!</h2>
            <p className="text-xs text-gray-500 mb-6">
              سيتصل بك منسق المادة لتأكيد حجز الحصة الخصوصية الفردية وإرسال رابط اللقاء.
            </p>

            {/* Custom Interactive Invoice Ticket */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200 text-right mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500"></div>
              
              <div className="flex justify-between border-b border-gray-200 pb-3 mb-3 items-center">
                <span className="text-gray-400 text-[10px] font-mono">رقم الطلب: {successBooking.id}</span>
                <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md text-[9px]">قيد المراجعة</span>
              </div>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">الطالب:</span>
                  <span className="font-bold text-gray-950">{successBooking.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الطبقة/الشعبة:</span>
                  <span className="font-bold text-gray-950 truncate max-w-[180px]">{successBooking.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">المادة الدراسية:</span>
                  <span className="font-bold text-gray-950">{successBooking.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">توقيت الحصة:</span>
                  <span className="font-bold text-gray-950">{successBooking.dayName}، {successBooking.dateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الساعة المقترحة:</span>
                  <span className="font-bold text-emerald-600 font-mono">{successBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">مدة الحصة:</span>
                  <span className="font-bold text-gray-950">{successBooking.duration}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                  <span className="font-bold text-gray-900">ثمن الحصة الإجمالي:</span>
                  <span className="text-lg font-black text-emerald-600">{successBooking.price} دج</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 text-right text-[11px] text-blue-700 flex gap-2 mb-6">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>
                <strong>ملاحظة:</strong> سيتم سداد ثمن الحصة (2000دج) عبر بريديباك أو الرصيد بعد تأكيد الأستاذ للموعد بنجاح.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSuccessBooking(null);
                  setActiveTab('history');
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                عرض في الحجوزات
              </button>
              
              <Link
                to="/"
                className={`flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-xs shadow-md transition-all`}
              >
                العودة للرئيسية
              </Link>
            </div>
          </motion.div>
        ) : activeTab === 'book' ? (
          /* FORM PANEL */
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            
            {/* Subject Price Alert Pin */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-105 flex items-center justify-center text-amber-600">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-900">ثمن الحصة ثابت لجميع المستويات والمدد</h4>
                  <p className="text-amber-700 text-[10px] mt-0.5">الحصة الفردية (ساعة أو ساعتين) بسعر ثابت لا يتغير</p>
                </div>
              </div>
              <div className="bg-amber-600 text-white font-black px-3 py-1.5 rounded-xl text-sm shadow-sm shrink-0">
                2000 دج
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs flex gap-2 items-center"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* 1. Grade/Class Level */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-black text-gray-900 flex items-center gap-1.5">
                <GraduationCap size={16} className="text-gray-400" />
                شعبتك ومستواك الدراسي:
              </label>
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-3 pr-4 rounded-xl text-xs font-bold text-gray-850 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
                >
                  {GRADES.map((gIdx) => (
                    <option key={gIdx} value={gIdx}>{gIdx}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ◀
                </div>
              </div>
            </div>

            {/* 2. Subject Selector */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-black text-gray-900 flex items-center gap-1.5">
                <BookOpen size={16} className="text-gray-400" />
                اختر المادة المراد شرحها في الحصة:
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {SUBJECTS.map((sub) => {
                  const isSel = selectedSubject === sub.name;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubject(sub.name)}
                      className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                        isSel 
                          ? 'bg-emerald-550 border-emerald-600 text-white shadow-md shadow-emerald-50' 
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Upcoming Days Selector */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Calendar size={16} className="text-gray-400" />
                اختر اليوم المناسب للحصة:
              </label>

              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:flex-wrap">
                {upcomingDays.map((day, dIdx) => {
                  const isSel = selectedDayIdx === dIdx;
                  return (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => setSelectedDayIdx(dIdx)}
                      className={`flex-1 min-w-[76px] py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0 ${
                        isSel 
                          ? 'bg-emerald-550 border-emerald-600 text-white shadow-md shadow-emerald-50' 
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">{day.dayName}</span>
                      <span className="font-extrabold text-xs">{day.fullDateString}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Time Slots */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Clock size={16} className="text-gray-400" />
                اختر توقيت الحصة المقترح (مواقيت الجزائر):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSel = selectedTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot.time)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-0.5 ${
                        isSel 
                          ? 'bg-emerald-550 border-emerald-600 text-white shadow-sm' 
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-bold text-[11px] font-mono">{slot.time}</span>
                      <span className="text-[9px] opacity-80">{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Class Duration */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-black text-gray-950 flex items-center gap-1.5">
                <Clock size={16} className="text-gray-405" />
                حدد مدة الحصة المطلوبة:
              </label>

              <div className="flex gap-3">
                {DURATIONS.map((dur) => {
                  const isSel = selectedDuration === dur.id;
                  return (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setSelectedDuration(dur.id)}
                      className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${
                        isSel 
                          ? 'bg-emerald-550 border-emerald-600 text-white shadow-md' 
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Hourglass size={14} />
                      <span>{dur.name} (ثابت بـ 2000دج)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Contact Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2">بيانات التواصل لتلقي رابط القاعة:</h3>
              
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-500">اسم الطالب الكامل:</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="اكتب اسمك ولقبك..."
                    className="w-full bg-gray-50 border border-gray-100 p-3 pr-10 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-500">رقم الهاتف (الواتساب أو عادي):</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 0555123456 للتأكيد"
                    className="w-full bg-gray-50 border border-gray-100 p-3 pr-10 rounded-xl text-xs text-left outline-none font-mono focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    style={{ direction: 'ltr' }}
                  />
                </div>
              </div>
            </div>

            {/* Checkout Pricing Card Footer */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400">ملخص التكاليف</p>
                <p className="font-extrabold text-emerald-600 text-lg">2000 دج <span className="text-[10px] text-gray-400 font-normal">/ لكل حصة</span></p>
              </div>

              <button
                type="submit"
                className={`py-3.5 px-6 font-extrabold text-white text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-700`}
              >
                <Sparkles size={16} />
                تأكيد حجز الحصة الخصوصية
              </button>
            </div>
          </form>
        ) : (
          /* PAST BOOKINGS HISTORY PANEL */
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="font-extrabold text-xs text-gray-500">قائمة الطلبات المسجلة برقم هاتفك</h3>
              {bookings.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('هل ترغب في مسح كل سجلات الحجز من المتصفح؟')) {
                      setBookings([]);
                      localStorage.removeItem('private_class_bookings');
                    }
                  }} 
                  className="text-rose-500 hover:text-rose-700 text-[10px] font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md"
                >
                  <Trash2 size={12} /> مسح السجل بالكامل
                </button>
              )}
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white border border-gray-100 p-10 rounded-3xl text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3">
                  <Calendar size={24} />
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm mb-1">لا يوجد أي حجز سابق</h4>
                <p className="text-[11px] text-gray-400 max-w-xs leading-normal">
                  لم تقم بحجز أي حصة فردية بعد. يمكنك تقديم طلب حصة خصوصية الآن للبدء بلقاء الأساتذة!
                </p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors"
                >
                  اطلب حصتك الأولى الآن
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                    
                    <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-gray-900 text-sm">{b.subject}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">#{b.id}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{b.grade}</p>
                      </div>

                      <div>
                        {b.status === 'pending' && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-150">قيد المراجعة</span>
                        )}
                        {b.status === 'confirmed' && (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-150">مؤكدة ✅</span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="bg-rose-50 text-rose-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-rose-150">ملغية ❌</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-650">
                      <div className="flex justify-between">
                        <span className="text-gray-400">الموعد:</span>
                        <span className="font-bold text-gray-850">{b.dayName}، {b.dateStr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">التوقيت:</span>
                        <span className="font-bold text-emerald-600 font-mono">{b.timeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">مدة الحصة:</span>
                        <span className="font-bold text-gray-850">{b.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">السعر:</span>
                        <span className="font-black text-gray-900">{b.price} دج</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">رقم الاتصال:</span>
                        <span className="font-mono text-gray-700 text-left" style={{ direction: 'ltr' }}>{b.phone}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="text-rose-500 font-bold text-[10px] bg-rose-50 py-1.5 px-3 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteHistory(b.id)}
                        className="text-gray-400 hover:text-rose-500 font-bold p-1 rounded transition-colors"
                        title="حذف من السجل المحلي"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRequest;
