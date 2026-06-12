import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, isLocalGuestSession } from '../lib/firebase';
import { AnimatePresence, motion } from 'framer-motion';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  coverURL?: string;
  isPremium: boolean;
  points: number;
  streakDays: number;
  role: 'student' | 'admin';
  academicInfo?: {
    branch: string;
    goal: string;
    school: string;
  };
  lastActive?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  awardPoints: (amount: number, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  updateProfile: async () => {},
  awardPoints: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointsNotification, setPointsNotification] = useState<{ amount: number; reason: string } | null>(null);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { ...profile, ...data }, { merge: true });
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const awardPoints = async (amount: number, reason: string) => {
    if (!user) return;
    
    setProfile(prev => {
      if (!prev) return null;
      const newPoints = (prev.points || 0) + amount;
      
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, { points: newPoints }, { merge: true }).catch(err => {
        console.error("Error setting points in Firestore:", err);
      });
      
      return { ...prev, points: newPoints };
    });

    setPointsNotification({ amount, reason });
    setTimeout(() => {
      setPointsNotification(prev => prev && prev.reason === reason ? null : prev);
    }, 4500);
  };

  const checkAndUpdateStreak = async (loadedProfile: UserProfile, currentUser: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = loadedProfile.lastActive;

    let updatedProfile = { ...loadedProfile };
    let pointsAwarded = 0;
    let reason = '';
    let hasChanges = false;

    if (!lastActive) {
      updatedProfile.streakDays = 1;
      updatedProfile.lastActive = todayStr;
      pointsAwarded = 50;
      reason = 'أول تسجيل دخول وعزيمة البداية! 🏆';
      hasChanges = true;
    } else if (lastActive === todayStr) {
      // Already logged in today
    } else {
      const lastActiveDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        updatedProfile.streakDays = (loadedProfile.streakDays || 0) + 1;
        updatedProfile.lastActive = todayStr;
        pointsAwarded = 25;
        reason = `استمرار الدراسة بانتظام! يومك الأسطوري رقم ${updatedProfile.streakDays} 🔥`;
        hasChanges = true;
      } else if (diffDays > 1) {
        updatedProfile.streakDays = 1;
        updatedProfile.lastActive = todayStr;
        pointsAwarded = 10;
        reason = 'العودة للمراجعة كبطل من جديد! 🌟';
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updatedProfile.points = (loadedProfile.points || 0) + pointsAwarded;
      
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(docRef, {
        points: updatedProfile.points,
        streakDays: updatedProfile.streakDays,
        lastActive: updatedProfile.lastActive
      }, { merge: true });

      setPointsNotification({ amount: pointsAwarded, reason });
      setTimeout(() => {
        setPointsNotification(prev => prev && prev.reason === reason ? null : prev);
      }, 4500);
    }

    return updatedProfile;
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const rawProfile = docSnap.data() as UserProfile;
            const updatedProfile = await checkAndUpdateStreak(rawProfile, currentUser);
            setProfile(updatedProfile);
          } else {
            const todayStr = new Date().toISOString().split('T')[0];
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'تلميذ',
              photoURL: currentUser.photoURL || '',
              coverURL: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=2070&auto=format&fit=crop',
              isPremium: false,
              points: 50,
              streakDays: 1,
              role: 'student',
              academicInfo: {
                branch: 'شعبة علوم تجريبية',
                goal: '18.00 معدل البكالوريا',
                school: 'ثانوية النجاح'
              },
              lastActive: todayStr
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
            
            setPointsNotification({ amount: 50, reason: 'أول تسجيل دخول وعزيمة البداية! 🏆' });
            setTimeout(() => setPointsNotification(null), 4500);
          }
        } else {
          // Check if guest session is active
          if (isLocalGuestSession()) {
            const guestDataStr = localStorage.getItem('bac_2027_local_guest');
            let guestUser: any = null;
            
            try {
              if (guestDataStr) {
                const parsed = JSON.parse(guestDataStr);
                guestUser = {
                  uid: parsed.uid || 'local_guest_session',
                  displayName: parsed.displayName || 'زائر البكالوريا',
                  email: parsed.email || 'guest@bacdz.net',
                  isAnonymous: true,
                  photoURL: ''
                };
              }
            } catch (e) {
              // ignore parse errors
            }

            if (!guestUser) {
              const randId = 'guest_' + Math.random().toString(36).substring(2, 9);
              guestUser = {
                uid: randId,
                displayName: 'زائر البكالوريا',
                email: 'guest@bacdz.net',
                isAnonymous: true,
                photoURL: ''
              };
              localStorage.setItem('bac_2027_local_guest', JSON.stringify(guestUser));
            }

            const guestDocRef = doc(db, 'users', guestUser.uid);
            const guestDocSnap = await getDoc(guestDocRef);
            let guestProfile: UserProfile;

            if (guestDocSnap && guestDocSnap.exists()) {
              guestProfile = guestDocSnap.data() as UserProfile;
            } else {
              const todayStr = new Date().toISOString().split('T')[0];
              guestProfile = {
                uid: guestUser.uid,
                email: guestUser.email,
                displayName: guestUser.displayName,
                photoURL: guestUser.photoURL,
                coverURL: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=2070&auto=format&fit=crop',
                isPremium: false,
                points: 50,
                streakDays: 1,
                role: 'student',
                academicInfo: {
                  branch: 'شعبة آداب وفلسفة',
                  goal: '17.50 في البكالوريا 🏆',
                  school: 'ثانوية الزوار الرقمية'
                },
                lastActive: todayStr
              };
              await setDoc(guestDocRef, guestProfile);
            }

            setUser(guestUser);
            setProfile(guestProfile);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Auth context error:", error);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile, awardPoints }}>
      {children}
      <AnimatePresence>
        {pointsNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 15 }}
            className="fixed top-4 left-4 right-4 z-[9999] max-w-md mx-auto bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white rounded-[24px] p-4 shadow-2xl border border-white/20 flex items-center justify-between gap-4 rtl"
            style={{ direction: 'rtl' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 leading-none animate-bounce">
                ✨
              </div>
              <div className="text-right">
                <h4 className="font-extrabold text-xs text-yellow-300">لقد كسبت +{pointsNotification.amount} نقطة!</h4>
                <p className="text-xs font-bold text-white leading-relaxed">{pointsNotification.reason}</p>
              </div>
            </div>
            <button 
              onClick={() => setPointsNotification(null)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white text-lg font-bold shrink-0"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
