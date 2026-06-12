import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider as fbGoogleAuthProvider,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  signInAnonymously as fbSignInAnonymously
} from 'firebase/auth';
import { 
  getFirestore,
  collection as fbCollection,
  doc as fbDoc,
  query as fbQuery,
  where as fbWhere,
  orderBy as fbOrderBy,
  getDoc as fbGetDoc,
  getDocs as fbGetDocs,
  setDoc as fbSetDoc,
  addDoc as fbAddDoc,
  updateDoc as fbUpdateDoc,
  deleteDoc as fbDeleteDoc,
  serverTimestamp as fbServerTimestamp,
  increment as fbIncrement,
  arrayUnion as fbArrayUnion,
  arrayRemove as fbArrayRemove,
  onSnapshot as fbOnSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Mandated Error Types and Codes
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to check if Guest session is active locally
export const isLocalGuestSession = (): boolean => {
  return localStorage.getItem('bac_2027_local_guest') !== null;
};

// Helper to check if a collection path is public-read
const isPublicPath = (path: string): boolean => {
  if (!path) return false;
  return path.startsWith('subjects') || path.startsWith('philosophy_essays');
};

// Local storage Mock DB helpers for local guest mode
const getLocalDBStore = (path: string): any => {
  const store = localStorage.getItem('bac_2027_mock_db_' + path);
  return store ? JSON.parse(store) : null;
};

const setLocalDBStore = (path: string, val: any) => {
  localStorage.setItem('bac_2027_mock_db_' + path, JSON.stringify(val));
};

const INITIAL_MOCK_POSTS = [
  {
    id: "mock_post_1",
    title: "منهجية كتابة مقالة الاستقصاء بالوضع خطوة بخطوة في الفلسفة ✍️",
    content: "السلام عليكم زملائي شعبة الآداب والفلسفة. إليكم المنهجية المعتمدة رسمياً في تصحيح وزارة التربية:\n1. طرح المشكلة (المقدمة): تمهيد من العام إلى الخاص، الإشارة إلى الفكرة الشائعة (نقيض الأطروحة)، طرح الأطروحة كفكرة الدفاع، صياغة السؤال للدفاع عن صحة ومبرر هذه الأطروحة.\n2. محاولة حل المشكلة (التوسيع): عرض موقف الأطروحة ودعمه بالحجج والأمثلة، تدعيم الموقف بحجج شخصية ومذاهب فلاسفة (مثل ديكارت أو جون لوك)، عرض نقد الخصوم وتفنيده.\n3. خاتمة وحل المشكلة: التأكيد التام على مشروعية الدفاع وقابليتها للتبني.",
    category: "philosophy",
    userId: "mock_user_1",
    userName: "الأستاذ مراد لقرع",
    userEmail: "prof_mourad@bacdz.net",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
    likes: ["mock_user_2", "mock_user_3"],
    reactions: { "mock_user_2": "study", "mock_user_3": "clap" },
    reportsCount: 0
  },
  {
    id: "mock_post_2",
    title: "مخططات خرائط مادة التاريخ والجغرافيا للبكالوريا - الحرب الباردة والثورة التحريرية",
    content: "يا جماعة، قمت برسم مخطط ملخص لأهم الخرائط التي تتكرر سنوياً في الجغرافيا والتاريخ لشعبة الآداب والفلسفة. تشمل الدول العشر الكبرى المؤسسة لحلف الناتو وحلف وارسو، مع طريقة تعيين المقرات لتسهيل الحفظ. يمكنكم الاستفسار حول أي دولة هنا وسيتم الجواب!",
    category: "history",
    userId: "mock_user_2",
    userName: "سامية بكالوريا",
    userEmail: "samia@bacdz.net",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 },
    likes: ["mock_user_1"],
    reactions: { "mock_user_1": "love" },
    reportsCount: 0
  },
  {
    id: "mock_post_3",
    title: "التواريخ المهمة والمرشحة بقوة في التاريخ (الثنائية القطبية والأزمات) 🗺️",
    content: "ركزوا معنا على هذه التواريخ الذهبية:\n- مؤتمر يالطة: 4-11 فيفري 1945\n- خطاب هاري ترومان (مشروع ترومان): 12 مارس 1947\n- مشروع مارشال لإعادة إعمار أوروبا: 5 جوان 1947\n- تأسيس الكومنفورم: 5-6 أكتوبر 1947\n- أزمة برلين الأولى: 1948 - 1949\nتكرار هذه النقاط البسيطة في أذهانكم يضمن النقاط كاملة في الجزء الأول لشعبة الآداب والفلسفة! بالتوفيق زملائي.",
    category: "history",
    userId: "mock_user_3",
    userName: "الأمين آداب وفلسفة",
    userEmail: "amine_dz@bacdz.net",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 172800 },
    likes: ["mock_user_1", "mock_user_2"],
    reactions: { "mock_user_1": "study", "mock_user_2": "smart" },
    reportsCount: 0
  }
];

const INITIAL_MOCK_COMMENTS = [
  {
    id: "mock_comm_1",
    postId: "mock_post_1",
    content: "من أفضل شروحات المنهجية التي قرأتها لدرس الاستقصاء بالوضع! بارك الله في علمك يا أستاذنا الكبير.",
    userId: "mock_user_2",
    userName: "سامية بكالوريا",
    userEmail: "samia@bacdz.net",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
    reportsCount: 0
  },
  {
    id: "mock_comm_2",
    postId: "mock_post_3",
    content: "تواريخ واضحة ومنظمة، شكراً جزيلاً الأمين.. سأقوم بحفظها مكرراً الليلة لكي لا أنساها.",
    userId: "mock_user_1",
    userName: "الأستاذ مراد لقرع",
    userEmail: "prof_mourad@bacdz.net",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
    reportsCount: 0
  }
];

// Seed default study-related threads inside mockup storage
const ensureMockDBInitialized = () => {
  if (!localStorage.getItem('bac_2027_mock_db_initialized')) {
    INITIAL_MOCK_POSTS.forEach(post => {
      localStorage.setItem('bac_2027_mock_db_forum_posts/' + post.id, JSON.stringify(post));
    });
    INITIAL_MOCK_COMMENTS.forEach(comm => {
      localStorage.setItem('bac_2027_mock_db_forum_comments/' + comm.id, JSON.stringify(comm));
    });
    localStorage.setItem('bac_2027_mock_db_initialized', 'true');
  }
};

// Helper to get path string from a reference
function getReferencePath(ref: any): string {
  if (!ref) return 'unknown';
  if (typeof ref.path === 'string') return ref.path;
  if (ref.colRef && typeof ref.colRef.path === 'string') return ref.colRef.path;
  return 'unknown';
}

// Wrapped Firestore functions
export const getDoc = async (docRef: any) => {
  const path = getReferencePath(docRef);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    const localData = getLocalDBStore(path);
    return {
      exists: () => localData !== null,
      data: () => localData,
      id: docRef.id || 'local_guest'
    };
  }
  try {
    return await fbGetDoc(docRef);
  } catch (error) {
    if (isLocalGuestSession()) {
      return { exists: () => false, data: () => null, id: docRef.id };
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const getDocs = async (queryOrCol: any) => {
  const path = getReferencePath(queryOrCol);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    const docsList: any[] = [];
    let filterPostId: string | null = null;
    
    try {
      if (queryOrCol && queryOrCol._query && Array.isArray(queryOrCol._query.filters)) {
        for (const f of queryOrCol._query.filters) {
          const isPostIdField = (f.field && f.field.path === 'postId') || 
                               (f.field && f.field.segments && f.field.segments.includes('postId')) ||
                               (f.field && String(f.field).includes('postId'));
          if (isPostIdField && f.value) {
            filterPostId = f.value;
          }
        }
      }
    } catch (e) {
      // ignore helper parsing
    }

    const storagePrefix = 'bac_2027_mock_db_' + path + '/';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(storagePrefix)) {
        const id = key.substring(storagePrefix.length);
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        
        if (filterPostId && data.postId !== filterPostId) {
          continue;
        }
        
        docsList.push({
          id,
          data: () => data
        });
      }
    }
    
    return {
      empty: docsList.length === 0,
      docs: docsList,
      size: docsList.length,
      forEach: (callback: any) => docsList.forEach(callback)
    };
  }
  try {
    return await fbGetDocs(queryOrCol);
  } catch (error) {
    if (isLocalGuestSession()) {
      return { empty: true, docs: [], size: 0, forEach: () => {} };
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const path = getReferencePath(docRef);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    let savedData = data;
    if (options && options.merge) {
      const existing = getLocalDBStore(path) || {};
      savedData = { ...existing, ...data };
    }
    setLocalDBStore(path, savedData);
    return;
  }
  try {
    return await fbSetDoc(docRef, data, options);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const addDoc = async (colRef: any, data: any) => {
  const path = getReferencePath(colRef);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    const id = 'mock_id_' + Math.random().toString(36).substring(2, 9);
    const docPath = `${path}/${id}`;
    
    const savedData = { ...data };
    if (savedData.createdAt && typeof savedData.createdAt === 'function') {
      savedData.createdAt = { seconds: Math.floor(Date.now() / 1000) };
    } else if (savedData.createdAt === null || (savedData.createdAt && savedData.createdAt.constructor && savedData.createdAt.constructor.name === 'ServerTimestampTransform')) {
      savedData.createdAt = { seconds: Math.floor(Date.now() / 1000) };
    }
    
    setLocalDBStore(docPath, savedData);
    return { id, path: docPath };
  }
  try {
    return await fbAddDoc(colRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  const path = getReferencePath(docRef);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    const existing = getLocalDBStore(path) || {};
    
    const savedData = { ...existing };
    for (const key of Object.keys(data)) {
      const val = data[key];
      const constructorName = val && val.constructor ? val.constructor.name : '';
      
      if (val && (constructorName.includes('Increment') || typeof val.operand === 'number')) {
        const operand = val.operand !== undefined ? val.operand : 1;
        const currentNum = typeof savedData[key] === 'number' ? savedData[key] : 0;
        savedData[key] = currentNum + operand;
      } 
      else if (val && (constructorName.includes('Union') || Array.isArray(val.elements))) {
        const elements = Array.isArray(val.elements) ? val.elements : [];
        const currentArr = Array.isArray(savedData[key]) ? savedData[key] : [];
        savedData[key] = Array.from(new Set([...currentArr, ...elements]));
      }
      else if (val && (constructorName.includes('Remove') || Array.isArray(val.elements))) {
        const elements = Array.isArray(val.elements) ? val.elements : [];
        const currentArr = Array.isArray(savedData[key]) ? savedData[key] : [];
        savedData[key] = currentArr.filter((el: any) => !elements.includes(el));
      }
      else {
        savedData[key] = val;
      }
    }
    
    setLocalDBStore(path, savedData);
    return;
  }
  try {
    return await fbUpdateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteDoc = async (docRef: any) => {
  const path = getReferencePath(docRef);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    localStorage.removeItem('bac_2027_mock_db_' + path);
    return;
  }
  try {
    return await fbDeleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const onSnapshot = (
  ref: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
) => {
  const path = getReferencePath(ref);
  if (isLocalGuestSession() && !isPublicPath(path)) {
    ensureMockDBInitialized();
    const timer = setTimeout(() => {
      if (path.split('/').length % 2 === 0) {
        const data = getLocalDBStore(path);
        onNext({
          exists: () => data !== null,
          data: () => data,
          id: ref.id
        });
      } else {
        let filterPostId: string | null = null;
        try {
          if (ref && ref._query && Array.isArray(ref._query.filters)) {
            for (const f of ref._query.filters) {
              const isPostIdField = (f.field && f.field.path === 'postId') || 
                                   (f.field && f.field.segments && f.field.segments.includes('postId')) ||
                                   (f.field && String(f.field).includes('postId'));
              if (isPostIdField && f.value) {
                filterPostId = f.value;
              }
            }
          }
        } catch (e) {
          // ignore
        }

        const docsList: any[] = [];
        const storagePrefix = 'bac_2027_mock_db_' + path + '/';
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(storagePrefix)) {
            const id = key.substring(storagePrefix.length);
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            
            if (filterPostId && data.postId !== filterPostId) {
              continue;
            }
            
            docsList.push({
              id,
              data: () => data
            });
          }
        }
        
        onNext({
          empty: docsList.length === 0,
          docs: docsList,
          size: docsList.length,
          forEach: (callback: any) => docsList.forEach(callback)
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }

  return fbOnSnapshot(
    ref,
    onNext,
    (error) => {
      if (isLocalGuestSession()) {
        onNext({
          exists: () => false,
          data: () => null,
          id: ref.id,
          empty: true,
          docs: [],
          size: 0,
          forEach: () => {}
        });
        return;
      }
      if (onError) {
        try {
          onError(error);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
};

// Re-export standard query constructs
export const collection = fbCollection;
export const doc = fbDoc;
export const query = fbQuery;
export const where = fbWhere;
export const orderBy = fbOrderBy;
export const serverTimestamp = fbServerTimestamp;
export const increment = fbIncrement;
export const arrayUnion = fbArrayUnion;
export const arrayRemove = fbArrayRemove;

// Auth Sign-In / Sign-Up / Management wrappers
export const onAuthStateChanged = fbOnAuthStateChanged;
export const GoogleAuthProvider = fbGoogleAuthProvider;
export const googleProvider = new fbGoogleAuthProvider();

export const signInWithGoogle = async () => {
  const provider = new fbGoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};

export const signInWithEmailAndPassword = fbSignInWithEmailAndPassword;
export const createUserWithEmailAndPassword = fbCreateUserWithEmailAndPassword;
export const updateProfile = fbUpdateProfile;
export const sendPasswordResetEmail = fbSendPasswordResetEmail;

export const signInAnonymously = async () => {
  return await fbSignInAnonymously(auth);
};

export const signOut = async (authInstance: any) => {
  localStorage.removeItem('bac_2027_local_guest');
  return await fbSignOut(authInstance);
};

export const logOut = async () => {
  localStorage.removeItem('bac_2027_local_guest');
  return await fbSignOut(auth);
};
