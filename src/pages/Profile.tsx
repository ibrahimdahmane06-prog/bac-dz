import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Award, Star, History, Bell, Shield, ChevronLeft, Camera, Edit3, GraduationCap, Target, School, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, signOut } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: profile?.displayName || '',
    branch: profile?.academicInfo?.branch || '',
    goal: profile?.academicInfo?.goal || '',
    school: profile?.academicInfo?.school || '',
    photoURL: profile?.photoURL || '',
    coverURL: profile?.coverURL || ''
  });

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilly',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Casper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Toby',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha'
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً (الأقصى 2 ميجا)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    await updateProfile({
      displayName: editForm.displayName,
      photoURL: editForm.photoURL,
      coverURL: editForm.coverURL,
      academicInfo: {
        branch: editForm.branch,
        goal: editForm.goal,
        school: editForm.school
      }
    });
    setIsEditing(false);
  };

  const menuItems = [
    ...(profile?.role === 'admin' ? [{ icon: <Shield className="text-emerald-500" />, label: "لوحة الإدارة", color: "bg-emerald-50", action: () => navigate('/admin') }] : []),
    { icon: <Bell className="text-blue-500" />, label: "الإشعارات", color: "bg-blue-50" },
    { icon: <Star className="text-amber-500" />, label: "النقاط والمكافآت", color: "bg-amber-50", action: () => setShowRewardsModal(true) },
    { icon: <History className="text-purple-500" />, label: "تاريخ المراجعة", color: "bg-purple-50" },
    { icon: <Shield className="text-emerald-500" />, label: "الأمان والخصوصية", color: "bg-emerald-50" },
    { icon: <Award className="text-orange-500" />, label: "شهاداتي", color: "bg-orange-50" },
  ];

  return (
    <div className="pb-24">
      {/* Cover and Header */}
      <div className="relative">
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={profile?.coverURL || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=2070&auto=format&fit=crop'} 
            className="w-full h-full object-cover"
            alt="cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
        </div>
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <ChevronLeft size={20} className="rotate-180" />
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md flex items-center gap-2 text-sm font-bold"
          >
            {isEditing ? <><X size={16} /> إلغاء</> : <><Edit3 size={16} /> تعديل الملف</>}
          </button>
        </div>

        <div className="absolute -bottom-12 left-0 right-0 px-8 flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-[32px] overflow-hidden border-4 border-white shadow-xl bg-white">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-4xl">
                  {profile?.displayName?.[0] || 'ت'}
                </div>
              )}
            </div>
            {profile?.isPremium && (
              <div className="absolute bottom-0 -right-2 bg-amber-400 text-white p-2 rounded-2xl border-4 border-white shadow-lg">
                <Star size={18} fill="currentColor" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-16 text-center px-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{profile?.displayName}</h1>
        <p className="text-gray-400 text-sm font-medium mb-4">{profile?.email}</p>
        
        <div className="flex justify-center gap-2">
          {profile?.isPremium && (
            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-100 uppercase tracking-widest">Premium Member</span>
          )}
          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-widest">BAC 2027</span>
        </div>
      </div>

      {/* Gamification Stats Grid */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-bold text-gray-400 mb-4 px-2 tracking-widest uppercase">النقاط والتقدم الدراسي</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-[32px] shadow-lg shadow-amber-100 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="text-3xl font-black">{profile?.points || 0}</div>
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-lg">⭐</div>
            </div>
            <div>
              <p className="text-[10px] text-white/70 uppercase font-black tracking-widest leading-none">مجموع النقاط</p>
              <p className="font-extrabold text-xs text-yellow-200 mt-1">بطل مجتهد 🚀</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-5 rounded-[32px] shadow-lg shadow-emerald-100 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="text-3xl font-black">{profile?.streakDays || 0}</div>
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-lg">🔥</div>
            </div>
            <div>
              <p className="text-[10px] text-white/70 uppercase font-black tracking-widest leading-none flex gap-1 items-center">سلسلة المذاكرة</p>
              <p className="font-extrabold text-xs text-emerald-200 mt-1">يوم متواصل ⚡</p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Info Bento */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-bold text-gray-400 mb-4 px-2 tracking-widest uppercase">المعلومات الأكاديمية</h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">الشعبة</p>
              <p className="font-bold text-gray-800">{profile?.academicInfo?.branch || 'غير محدد'}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Target size={24} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">الهدف (المعدل)</p>
              <p className="font-bold text-gray-800">{profile?.academicInfo?.goal || 'غير محدد'}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
              <School size={24} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">المؤسسة التعليمية</p>
              <p className="font-bold text-gray-800">{profile?.academicInfo?.school || 'غير محدد'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Form Overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900">تعديل الملف</h2>
                <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-2">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={editForm.displayName} 
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-emerald-500 transition-colors font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 mr-2">معدل الهدف</label>
                    <input 
                      type="text" 
                      value={editForm.goal} 
                      onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
                      placeholder="مثلاً: 18.50"
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-emerald-500 transition-colors font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 mr-2">الشعبة</label>
                    <input 
                      type="text" 
                      value={editForm.branch} 
                      onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                      placeholder="رياضيات، علوم..."
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-emerald-500 transition-colors font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-2">الثانوية / المدرسة</label>
                  <input 
                    type="text" 
                    value={editForm.school} 
                    onChange={(e) => setEditForm({...editForm, school: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-emerald-500 transition-colors font-bold"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 mr-2">الصورة الشخصية</label>
                  
                  <div className="flex flex-col items-center gap-6 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-[28px] overflow-hidden border-4 border-white shadow-lg bg-emerald-100">
                        {editForm.photoURL ? (
                          <img src={editForm.photoURL} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-600 font-black text-3xl">
                            {editForm.displayName?.[0] || 'ت'}
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                        <Camera size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>

                    <div className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">اختر من المعرض</span>
                        <button 
                          onClick={() => setShowAvatars(!showAvatars)}
                          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest"
                        >
                          {showAvatars ? 'إغلاق' : 'عرض الكل'}
                        </button>
                      </div>
                      
                      <div className={`grid grid-cols-4 gap-3 transition-all duration-500 overflow-hidden ${showAvatars ? 'max-h-48' : 'max-h-12'}`}>
                        {avatars.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setEditForm({...editForm, photoURL: url})}
                            className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                              editForm.photoURL === url ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`avatar-${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-2">رابط صورة الغلاف</label>
                  <input 
                    type="text" 
                    value={editForm.coverURL} 
                    onChange={(e) => setEditForm({...editForm, coverURL: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-100 mt-8 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Check size={24} /> حفظ التغييرات
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Mode Toggle */}
      <div className="px-6 mt-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-[32px] border border-gray-800 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield size={24} />
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">وضع الإدارة (التحكم الكامل)</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">تفعيل صلاحيات المشرف ولوحة التحكم</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const newRole = profile?.role === 'admin' ? 'student' : 'admin';
              await updateProfile({ role: newRole });
            }}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
              profile?.role === 'admin' ? 'bg-emerald-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${
                profile?.role === 'admin' ? 'left-1' : 'left-7'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-6 mt-12 space-y-3">
        <h2 className="text-sm font-bold text-gray-400 mb-4 px-2 tracking-widest uppercase">القائمة الرئيسية</h2>
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => (item as any).action ? (item as any).action() : null}
            className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                {item.icon}
              </div>
              <span className="font-bold text-gray-800">{item.label}</span>
            </div>
            <ChevronLeft className="text-gray-300" size={20} />
          </button>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-5 bg-red-50 rounded-3xl border border-red-100 hover:bg-red-100 transition-colors mt-8 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
              <LogOut size={24} />
            </div>
            <span className="font-bold text-red-700">تسجيل الخروج</span>
          </div>
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-16 mb-8 tracking-widest font-black opacity-50 uppercase">BAC PREP 2027 • VERSION 2.1.4</p>

      {/* Rewards Info Modal Overlay */}
      <AnimatePresence>
        {showRewardsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xl flex items-center justify-center p-6 rtl"
            style={{ direction: 'rtl' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              
              <div className="flex justify-between items-start mb-6 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl text-amber-500 shadow-inner">🏆</div>
                  <div className="text-right">
                    <h3 className="text-lg font-black text-gray-900 leading-tight">النقاط والمكافآت</h3>
                    <p className="text-xs text-gray-500">ادرس واجتهد واكسب جوائز مذهلة</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRewardsModal(false)}
                  className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Current Balance */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-[28px] text-white text-center mb-6 shadow-lg shadow-amber-100 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] text-yellow-100 uppercase tracking-widest font-black mb-1">رصيدك الحالي</p>
                  <p className="text-4xl font-extrabold flex items-center justify-center gap-2">
                    <span>{profile?.points || 0}</span>
                    <span className="text-2xl">⭐</span>
                  </p>
                  <p className="text-xs text-amber-100 mt-2">سلسلة المذاكرة النشطة: {profile?.streakDays || 1} أيام 🔥</p>
                </div>
                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </div>

              {/* How to Earn */}
              <div className="space-y-4 mb-8">
                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest px-1 text-right">طرق كسب النقاط</h4>
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔥</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-xs">سلسلة المذاكرة اليومية</p>
                        <p className="text-[10px] text-gray-400">حافظ على حضورك اليومي ومراجعتك</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 font-black text-xs px-2.5 py-1 rounded-lg shrink-0 select-none">+25 نقطة</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-xs">إكمال الدروس وحفظها</p>
                        <p className="text-[10px] text-gray-400">قراءة الملخص وتأكيد الحفظ</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 font-black text-xs px-2.5 py-1 rounded-lg shrink-0 select-none">+20 نقطة</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎯</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-xs">اجتياز الاختبار المرفق</p>
                        <p className="text-[10px] text-gray-400">مع نقاط إضافية على كل جواب صحيح</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 font-black text-xs px-2.5 py-1 rounded-lg shrink-0 select-none">+30 نقطة</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🧠</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-xs">حل تمارين ذكي بالـ AI</p>
                        <p className="text-[10px] text-gray-400">قم بتصوير فرضك أو تمرينك وحله</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 font-black text-xs px-2.5 py-1 rounded-lg shrink-0 select-none">+40 نقطة</span>
                  </div>
                </div>
              </div>

              {/* How to Spend */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 text-center">
                <p className="text-emerald-800 text-xs font-black mb-1">🎁 هدايا ومكافآت قادمة قريباً</p>
                <p className="text-[10px] text-emerald-600 leading-relaxed font-bold">
                  يمكنك قريباً استبدال نقاطك التراكمية لتفعيل العضوية الممتازة مجاناً، وتحميل الكتب وسلاسل التمارين الحصرية والجاهزة للطباعة!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
