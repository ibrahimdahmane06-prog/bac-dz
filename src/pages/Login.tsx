import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Chrome, User, Check, X, KeySquare } from 'lucide-react';
import { signInWithGoogle, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showAuthNoAllowedHelp, setShowAuthNoAllowedHelp] = useState(false);

  // Password Reset Modal states
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name.trim()) {
        setError('الرجاء إدخال الاسم الكامل');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين');
        return;
      }
      if (password.length < 6) {
        setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        return;
      }
    }

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setShowAuthNoAllowedHelp(true);
        setError('طريقة تسجيل الدخول بالبريد الإلكتروني مغلَقة حالياً في مشروع Firebase.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مستخدم بالفعل');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً');
      } else if (err.code === 'auth/invalid-email') {
        setError('بريد إلكتروني غير صالح');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        setError('حدث خطأ أثناء المحاولة، يرجى إعادة التأكد ومحاولة تسجيل الدخول مجدداً');
      }
    }
  };

  const [googleIframeNotice, setGoogleIframeNotice] = useState(false);

  const handleGuestLogin = () => {
    const randId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      uid: randId,
      displayName: 'زائر البكالوريا',
      email: 'guest@bacdz.net',
      isAnonymous: true,
      photoURL: ''
    };
    localStorage.setItem('bac_2027_local_guest', JSON.stringify(guestUser));
    window.location.href = '/';
  };

  const handleGoogle = async () => {
    try {
      setError('');
      setGoogleIframeNotice(false);
      await signInWithGoogle();
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setGoogleIframeNotice(true);
      setError('تعذر إكمال تسجيل الدخول عبر Google. هذا السلوك شائع داخل بيئة المطورين (iFrame preview).');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md"
        style={{ direction: 'rtl' }}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
            <LogIn size={40} className="transform rotate-180" />
          </div>
          <h1 className="text-2xl font-black text-gray-950">BAC 2027</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister ? 'سجّل الآن وابدأ رحلة التميز والتفوق!' : 'ادخل لحسابك لتبدأ المراجعة والتحضير'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-4 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {showAuthNoAllowedHelp && (
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl mb-6 text-right text-xs leading-relaxed">
            <h3 className="font-extrabold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
              💡 كيفية تفعيل تسجيل الدخول بالبريد الإلكتروني:
            </h3>
            <p className="text-blue-800 mb-3">
              لتتمكن من إنشاء حساب جديد أو تسجيل الدخول بالبريد الإلكتروني، يجب تمكين هذا الخيار في لوحة تحكم Firebase لمشروعك أولاً:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-blue-800 font-medium mb-4">
              <li>
                افتح{' '}
                <a
                  href="https://console.firebase.google.com/project/xenon-aria-007pf/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
                >
                  لوحة تحكم Firebase لمشروعك ↗
                </a>
              </li>
              <li>انتقل إلى تـبويب <b>Sign-in method</b> (طريقة تسجيل الدخول).</li>
              <li>اختر <b>Email/Password</b> من القائمة.</li>
              <li>قم بالضغط على تفعيل <b>Enable</b> ثم اضغط حفظ <b>Save</b>.</li>
            </ol>
            <p className="text-blue-700 text-[11px] border-t border-blue-100/60 pt-2.5">
              <b>💡 حل بديل فوري:</b> يمكنك تسجيل الدخول بدفعة واحدة دون إعدادات عبر خيار <b>"دخول سريع بواسطة حساب Google"</b> في الأسفل! 👇
            </p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 mb-6">
          {isRegister && (
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="الاسم الكامل"
                className="w-full bg-gray-50 border border-gray-150 p-4 pr-12 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-colors text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني"
              className="w-full bg-gray-50 border border-gray-150 p-4 pr-12 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-colors text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="كلمة المرور"
              className="w-full bg-gray-50 border border-gray-150 p-4 pr-12 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-colors text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="تأكيد كلمة المرور"
                className="w-full bg-gray-50 border border-gray-150 p-4 pr-12 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-colors text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {!isRegister && (
            <div className="text-left mt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetSuccess('');
                  setResetError('');
                  setShowResetModal(true);
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-colors"
              >
                هل نسيت كلمة المرور؟
              </button>
            </div>
          )}

          <button 
            type="submit"
            className="w-full btn-3d mt-2 font-black text-sm py-4"
          >
            {isRegister ? 'أنشئ حساب' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400 font-bold">أو التوصيل عبر</span>
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <button 
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-150 p-4 rounded-2xl bg-white hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <Chrome size={20} className="text-red-500" />
            <span className="text-sm font-extrabold text-gray-700">دخول سريع بواسطة حساب Google</span>
          </button>

          <button 
            type="button"
            onClick={handleGuestLogin}
            className="w-full flex items-center justify-center gap-2.5 border border-dashed border-emerald-250 p-4 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 active:scale-95 transition-all shadow-sm"
          >
            <User size={20} className="text-emerald-600 animate-pulse" />
            <span className="text-sm font-black text-emerald-800">تصفّح فوراً كـزائر (بدون حساب) 🔑</span>
          </button>

          {googleIframeNotice && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50/80 border border-amber-100 p-4 rounded-2xl text-right text-xs leading-relaxed space-y-2 mt-4"
            >
              <h4 className="font-extrabold text-amber-900">⚠️ مشكلة تسجيل الدخول عبر Google؟</h4>
              <p className="text-amber-800">
                داخل بيئة التطوير (iFrame)، يمنع المتصفح فتح النوافذ المنبثقة التابعة لـ Google للحماية. لتخطي هذا السلوك:
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-800 font-medium">
                <li>اضغط على زر <b>"تصفّح فوراً كـزائر"</b> بالأعلى للدخول دون حساب والحصول على وصول كامل وفوري ومحاكاة للمنتدى!</li>
                <li>أو افتح التطبيق في نافذة/علامة تبويب جديدة للمتصفح عبر زر فتح التطبيق الخارجي.</li>
              </ul>
            </motion.div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          {isRegister ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-emerald-600 font-extrabold hover:underline"
          >
            {isRegister ? 'سجل دخولك' : 'أنشئ حساب'}
          </button>
        </p>
      </motion.div>

      {/* Forgot Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" style={{ direction: 'rtl' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-gray-100 relative text-right"
            >
              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
                type="button"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <KeySquare size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">استعادة كلمة المرور</h3>
                  <p className="text-[10px] text-gray-400">سنرسل لك رابطاً لإعادة تعيين كلمتك</p>
                </div>
              </div>

              {resetError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-3 text-xs font-bold text-center">
                  {resetError}
                </div>
              )}

              {resetSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center">
                    <Check size={24} />
                  </div>
                  <p className="text-xs font-black text-emerald-800">{resetSuccess}</p>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="w-full py-2.5 bg-gray-950 text-white font-bold text-xs rounded-xl"
                    type="button"
                  >
                    حسناً، فهمت
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setResetError('');
                    setResetSuccess('');
                    if (!resetEmail) {
                      setResetError('الرجاء كتابة البريد الإلكتروني أولاً');
                      return;
                    }
                    try {
                      await sendPasswordResetEmail(auth, resetEmail);
                      setResetSuccess('تم إرسال رابط استعادة كلمة المرور لبريدك الإلكتروني بنجاح!');
                    } catch (err: any) {
                      console.error(err);
                      if (err.code === 'auth/operation-not-allowed') {
                        setResetError('خدمة استرجاع كلمات المرور غير مفعلة لأن تسجيل الدخول بالبريد معطل في منفذ Firebase لمشروعك.');
                      } else if (err.code === 'auth/user-not-found') {
                        setResetError('لا يوجد مستخدم مسجل بهذا البريد الإلكتروني');
                      } else {
                        setResetError('حدث خطأ أثناء إرسال البريد، يرجى التأكد من كتابته بشكل صحيح');
                      }
                    }
                  }}
                  className="space-y-4"
                >
                  <p className="text-xs text-gray-500 leading-relaxed">
                    اكتب بريدك الإلكتروني المسجل في النظام، وسنقوم بإرسال رسالة تفعيل مخصصة لإضافة كلمة مرور جديدة في ثوانٍ.
                  </p>
                  
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email"
                      required
                      placeholder="البريد الإلكتروني"
                      className="w-full bg-gray-50 border border-gray-150 p-3.5 pr-11 rounded-xl text-xs outline-none focus:border-emerald-500 transition-colors"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95"
                  >
                    إرسال رابط استعادة كلمة المرور
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
