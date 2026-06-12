import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Wallet, Smartphone, ShieldCheck, Star, Sparkles, Loader2, Phone, MessageSquare, Copy, Send, ExternalLink, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, addDoc, serverTimestamp } from '../lib/firebase';

const Payment: React.FC = () => {
  const { profile, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Copy states for Algerian post details
  const [copiedRip, setCopiedRip] = useState(false);
  const [copiedCcp, setCopiedCcp] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Administrative message form states
  const [senderName, setSenderName] = useState(profile?.displayName || '');
  const [senderPhone, setSenderPhone] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  const copyToClipboard = (text: string, stateSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    stateSetter(true);
    setTimeout(() => stateSetter(false), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      await addDoc(collection(db, 'payment_messages'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || '',
        senderName: senderName || profile?.displayName || 'مستخدم',
        senderPhone: senderPhone || 'غير متوفر',
        messageText: msgText,
        status: 'unread',
        createdAt: serverTimestamp(),
      });
      setMsgSuccess(true);
      setMsgText('');
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً أو الاتصال بالهاتف مباشرة.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          // Resize the image to keep size very small (e.g., max width/height of 600px)
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 600;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress heavily to JPEG (0.4 quality is lightweight and legible)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.45);
            
            try {
              await addDoc(collection(db, 'payment_receipts'), {
                userId: user.uid,
                userEmail: user.email,
                receiptUrl: compressedBase64,
                status: 'pending',
                createdAt: serverTimestamp(),
              });
              setSuccess(true);
            } catch (err) {
              console.error("Firestore database error: ", err);
              alert("حدث خطأ في تدوين بيانات الدفع بقاعدة البيانات. تأكد من أن حجم الصورة مناسب.");
            } finally {
              setUploading(false);
            }
          } else {
            setUploading(false);
            alert("حدث خطأ أثناء معالجة الصورة");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setUploading(false);
        alert("فشل قراءة الملف كصورة");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الإرسال");
      setUploading(false);
    }
  };

  const features = [
    "فتح جميع الدروس في كل المواد",
    "ملخصات PDF كاملة قابلة للتحميل",
    "طرق منهجية لكتابة جميع المقالات",
    "مساعد ذكي غير محدود (الأستاذ)",
    "إزالة الإعلانات كلياً",
    "تحديثات مستمرة وفروض جديدة"
  ];

  return (
    <div className="p-6 pb-32 min-h-screen bg-gray-50">
      <header className="text-center mb-8 pt-4">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4 shadow-sm">
          <Star size={32} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">استمتع بالتجربة الكاملة</h1>
        <p className="text-gray-500 text-sm">افتح جميع المميزات وحضر للبكالوريا باحترافية</p>
      </header>

      {/* Plan Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-emerald-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200 mb-10"
      >
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">اشتراك سنوي</span>
            <Sparkles size={14} className="text-amber-300" />
          </div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-black">2000</span>
            <span className="text-lg font-bold opacity-80">دج / سنة</span>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <button className="w-full btn-3d bg-white text-emerald-700 shadow-[0_5px_0_0_rgba(209,213,219,1)]">
            اشترك الآن
          </button>
        </div>
      </motion.div>

      {/* Algerian Post Current Accounts & Details (CCP / BaridiMob) */}
      <h2 className="text-lg font-extrabold text-gray-950 mb-4 px-1 text-right" style={{ direction: 'rtl' }}>تفاصيل وبيانات الدفع والحساب البريدي</h2>
      
      <div className="space-y-4 mb-10 text-right" style={{ direction: 'rtl' }}>
        {/* BaridiMob account detail */}
        <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400">الدفع عبر تطبيق BaridiMob</h3>
                <p className="text-sm font-black text-gray-900 mt-0.5">رمز الحساب البريدي الدولي (RIP)</p>
              </div>
            </div>
            <button 
              onClick={() => copyToClipboard('00799999001164900851', setCopiedRip)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                copiedRip ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {copiedRip ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedRip ? 'تم النسخ!' : 'نسخ الـ RIP'}</span>
            </button>
          </div>
          <div className="mt-4 bg-gray-50 p-3 rounded-2xl text-center border border-gray-100 text-slate-700 font-mono text-sm tracking-wider select-all select-text font-black">
            00799999001164900851
          </div>
        </div>

        {/* CCP account details */}
        <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400">الحساب البريدي الجاري CCP</h3>
              <p className="text-sm font-black text-gray-900 mt-0.5">الدفع عن طريق مكتب البريد الجزائري</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-0.5">رقم الحساب البريدي</span>
                <span className="text-sm font-black text-gray-900 font-mono">0011649008</span>
              </div>
              <button 
                onClick={() => copyToClipboard('0011649008', setCopiedCcp)}
                className={`p-1.5 rounded-lg transition-all ${copiedCcp ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:bg-gray-100'}`}
                title="نسخ رقم الحساب"
              >
                {copiedCcp ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-0.5">المفتاح (Clé)</span>
                <span className="text-sm font-black text-gray-900 font-mono">51</span>
              </div>
              <button 
                onClick={() => copyToClipboard('51', setCopiedKey)}
                className={`p-1.5 rounded-lg transition-all ${copiedKey ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:bg-gray-100'}`}
                title="نسخ المفتاح"
              >
                {copiedKey ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">اسم صاحب الحساب</span>
                <span className="text-xs font-black text-gray-800">دحمان إبراهيم</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <MapPin size={16} className="text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">العنوان المرتبط بالحساب</span>
                <span className="text-xs font-black text-gray-800">بئر الجير، وهران</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Contact Admin Support Section */}
      <h2 className="text-lg font-extrabold text-gray-950 mb-4 px-1 text-right" style={{ direction: 'rtl' }}>التواصل مع الإدارة والتأكيد الفوري</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-right" style={{ direction: 'rtl' }}>
        {/* Telephone call card & direct Whatsapp option */}
        <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400">الدعم الهاتفي والمباشر</h3>
                <p className="text-sm font-black text-gray-900 mt-0.5">رقم هاتف الإدارة الرسمي</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              يمكنك الاتصال بنا مباشرة في أي وقت لتأكيد عملية الدفع أو الاستفسار أو إرسال لقطة شاشة لوصل التحويل البريدي.
            </p>
          </div>

          <div className="space-y-2 mt-4">
            <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
              <span className="text-sm font-black text-emerald-700 font-mono select-all tracking-wider">0671352882</span>
              <button 
                onClick={() => copyToClipboard('0671352882', setCopiedPhone)}
                className={`p-1.5 rounded-xl transition-all ${copiedPhone ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}
                title="نسخ رقم الهاتف"
              >
                {copiedPhone ? <Check size={14} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a 
                href="tel:0671352882"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-105 hover:scale-105 active:scale-95"
              >
                <Phone size={14} />
                <span>اتصال مباشر</span>
              </a>
              <a 
                href="https://wa.me/213671352882?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8Adjust%20%D9%82%D9%85%D8%AA%20%D8%A8%D8%A7%D9%84%D8%AF%D9%81%D8%B9%20%D9%84%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%20%D8%A8%D9%83%D8%A7%D9%84%D9%88%D8%B1%D9%8A%D8%A7%20%D8%A7%D9%84%D9%81%D9%84%D8%B3%D9%81%D8%A9%202027"
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-105 hover:scale-105 active:scale-95"
              >
                <MessageSquare size={14} />
                <span>واتساب للإدارة</span>
              </a>
            </div>
          </div>
        </div>

        {/* Administrative message submission form */}
        <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleSendMessage} className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400">إرسال رسالة سريعة للإدارة</h3>
                <p className="text-sm font-black text-gray-900 mt-0.5">تواصل رسمي بشأن الدفع والتفعيل</p>
              </div>
            </div>

            {msgSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center space-y-2"
              >
                <CheckCircle2 className="mx-auto text-emerald-500 animate-pulse" size={32} />
                <h3 className="text-xs font-black text-emerald-900">تم إرسال رسالتك للإدارة بنجاح!</h3>
                <p className="text-[10px] text-emerald-700">لقد تم إرسال رسالتك بخصوص الدفع، سيقوم فريق الإدارة بمتابعتها فوراً وتفعيل اشتراكك.</p>
                <button 
                  type="button"
                  onClick={() => setMsgSuccess(false)}
                  className="mt-1 px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold"
                >
                  إرسال رسالة أخرى
                </button>
              </motion.div>
            ) : (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  اكتب تفاصيل عملية الدفع الخاصة بك، مثل الاسم الكامل على حساب البريد أو توقيت التحويل، وسنقوم بالتفعيل لك فوراً.
                </p>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="الاسم الكامل"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-150 p-2.5 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                    <input 
                      type="text"
                      required
                      placeholder="رقم هاتف الاتصال"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-150 p-2.5 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all text-left font-mono"
                    />
                  </div>

                  <textarea 
                    required
                    rows={3}
                    placeholder="اكتب رسالتك للإدارة هنا... (مثال: قمت بتحويل مبلغ الاشتراك عبر BaridiMob اليوم)"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-150 p-3 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-95"
                >
                  {sendingMsg ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>{sendingMsg ? 'جاري الإرسال للإدارة...' : 'إرسال الرسالة لتأكيد الدفع'}</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 mb-10 text-right" style={{ direction: 'rtl' }}>
        <ShieldCheck className="text-blue-600 flex-shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-bold text-blue-900 leading-tight mb-1">دفع آمن ومضمون</h4>
          <p className="text-xs text-blue-700 opacity-80">جميع عمليات الدفع تتم عبر قنوات رسمية ومشفرة لضمان حقك وتفعيل اشتراكك.</p>
        </div>
      </div>

      {/* Receipt Upload Section */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-10">
        <h3 className="font-bold text-gray-900 mb-2">تفعيل الاشتراك اليدوي</h3>
        <p className="text-xs text-gray-500 mb-6">إذا قمت بالدفع عبر البريد أو BaridiMob، يرجى إرفاق صورة الوصل لتفعيل حسابك يدوياً.</p>
        
        {success ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={24} />
            </div>
            <h4 className="font-bold text-emerald-900 mb-1">تم إرسال الوصل بنجاح</h4>
            <p className="text-xs text-emerald-700">سيتم مراجعة طلبك من طرف الإدارة وتفعيل حسابك خلال 24 ساعة.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50/50 group hover:border-emerald-200 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) setFile(selectedFile);
                }}
              />
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                {file ? <Check className="text-emerald-500" size={24} /> : <Smartphone size={24} />}
              </div>
              <p className="text-xs font-bold text-gray-600">
                {file ? `تم اختيار: ${file.name}` : 'اضغط لرفع صورة الوصل'}
              </p>
              <p className="text-[10px] text-gray-400">JPG, PNG (بحد أقصى 5MB)</p>
            </div>

            <button 
              onClick={handleFileUpload}
              disabled={!file || uploading}
              className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                !file || uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white shadow-gray-200 active:scale-95'
              }`}
            >
              {uploading ? <Loader2 className="animate-spin" size={18} /> : null}
              {uploading ? 'جاري الإرسال...' : 'إرسال الوصل للمراجعة'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
