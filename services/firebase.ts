import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, UserStatus, HistoryItem, SolutionResponse } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Test Connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Error handling types and helper
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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

// Global Auth Providers
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

const ADMIN_EMAIL = "arshad2097@gmail.com";

// Firestore Helpers

// User Profile management
export const getOrCreateUserProfile = async (firebaseUser: FirebaseUser, defaultName?: string): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const path = `users/${firebaseUser.uid}`;
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { ...docSnap.data() as User, uid: firebaseUser.uid };
    } else {
      const email = firebaseUser.email || '';
      const isSystemAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      const newUser: User = {
        email: email,
        name: firebaseUser.displayName || defaultName || email.split('@')[0],
        role: isSystemAdmin ? 'admin' : 'user',
        status: isSystemAdmin ? 'approved' : 'pending',
        createdAt: Date.now()
      };
      
      await setDoc(userRef, newUser);
      return { ...newUser, uid: firebaseUser.uid };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};

export const registerWithEmailPassword = async (email: string, pass: string, name: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create profile
    const newUser = await getOrCreateUserProfile(userCredential.user, name);
    return newUser;
  } catch (error) {
    console.error("Email registration error:", error);
    throw error;
  }
};

export const loginWithEmailPassword = async (email: string, pass: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await getOrCreateUserProfile(userCredential.user);
    return profile;
  } catch (error) {
    console.error("Email login error:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

// Admin Panel Helpers
export const subscribeToUsers = (onUpdate: (users: User[]) => void, onError: (error: any) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as User;
      users.push({ ...data, uid: doc.id }); // Ensure uid and document fields are passed
    });
    onUpdate(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'users');
    onError(error);
  });
};

export const updateUserStatusInDb = async (userId: string, status: UserStatus): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;
  try {
    await updateDoc(userRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteUserFromDb = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;
  try {
    await deleteDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Global config helpers
export const fetchPlatformConfig = async (): Promise<{ allowSignup: boolean }> => {
  const configRef = doc(db, 'config', 'settings');
  try {
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      return snap.data() as { allowSignup: boolean };
    } else {
      return { allowSignup: true };
    }
  } catch (error) {
    console.warn("Could not fetch platform config, defaulting to allowSignup: true", error);
    return { allowSignup: true };
  }
};

export const updatePlatformConfig = async (allowSignup: boolean): Promise<void> => {
  const configRef = doc(db, 'config', 'settings');
  const path = 'config/settings';
  try {
    await setDoc(configRef, { allowSignup });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// History management
export const saveSolutionToHistory = async (userId: string, question: string, solution: SolutionResponse): Promise<HistoryItem> => {
  const historyCollectionRef = collection(db, 'users', userId, 'history');
  const path = `users/${userId}/history`;
  try {
    const newItem = {
      question,
      timestamp: Date.now(),
      solution
    };
    const docRef = await addDoc(historyCollectionRef, newItem);
    return {
      id: docRef.id,
      ...newItem
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const subscribeToHistory = (
  userId: string, 
  onUpdate: (history: HistoryItem[]) => void, 
  onError: (error: any) => void
) => {
  const historyCollectionRef = collection(db, 'users', userId, 'history');
  const q = query(historyCollectionRef, orderBy('timestamp', 'desc'));
  const path = `users/${userId}/history`;
  
  return onSnapshot(q, (snapshot) => {
    const items: HistoryItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        question: data.question,
        timestamp: data.timestamp,
        solution: data.solution as SolutionResponse
      });
    });
    onUpdate(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    onError(error);
  });
};

