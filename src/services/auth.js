import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { USER_ROLES, ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants/wilayas';

const checkAuth = () => {
  if (!auth) throw new Error('Firebase Auth غير متوفر. تحقق من اتصالك بالإنترنت وأعد تشغيل التطبيق.');
};

const checkDb = () => {
  if (!db) throw new Error('Firebase Firestore غير متوفر. تحقق من اتصالك بالإنترنت.');
};

export const registerUser = async (data) => {
  try {
    checkAuth();
    checkDb();

    const email = data.email;
    const password = data.password;

    if (email === ADMIN_EMAIL) {
      return { success: false, error: 'هذا البريد محجوز للمدير' };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      fullName: data.fullName,
      phone: data.phone,
      wilaya: data.wilaya,
      role: data.role || USER_ROLES.CUSTOMER,
      profileImage: '',
      createdAt: new Date().toISOString(),
      isActive: true,
      subscription: null,
      vehicleType: data.vehicleType || null,
      currentLocation: null,
    });

    await updateProfile(user, { displayName: data.fullName });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    checkAuth();
    checkDb();

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        fullName: email === ADMIN_EMAIL ? 'المدير العام' : '',
        phone: '',
        wilaya: 'الجزائر',
        role: email === ADMIN_EMAIL ? USER_ROLES.ADMIN : USER_ROLES.CUSTOMER,
        profileImage: '',
        createdAt: new Date().toISOString(),
        isActive: true,
        subscription: null,
        vehicleType: null,
        currentLocation: null,
      });
      const newDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      return { success: true, user: newDoc.data() };
    }

    const userData = userDoc.data();
    if (email === ADMIN_EMAIL && userData.role !== USER_ROLES.ADMIN) {
      await updateDoc(doc(db, 'users', userCredential.user.uid), { role: USER_ROLES.ADMIN });
      userData.role = USER_ROLES.ADMIN;
    }

    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    checkAuth();
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    checkAuth();
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserData = async (uid) => {
  try {
    checkDb();
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    }
    return { success: false, error: 'المستخدم غير موجود' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserLocation = async (uid, location) => {
  try {
    checkDb();
    await updateDoc(doc(db, 'users', uid), {
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSubscription = async (uid, plan) => {
  try {
    checkDb();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration);

    await updateDoc(doc(db, 'users', uid), {
      subscription: {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        duration: plan.duration,
        startDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        isActive: true,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getNearbyDrivers = async (wilaya) => {
  try {
    checkDb();
    const q = query(
      collection(db, 'users'),
      where('role', '==', USER_ROLES.DRIVER),
      where('wilaya', '==', wilaya),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const drivers = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.currentLocation && data.subscription && data.subscription.isActive) {
        drivers.push(data);
      }
    });
    return { success: true, drivers };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    checkDb();
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    querySnapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const toggleUserStatus = async (uid, statusOrActive) => {
  try {
    checkDb();
    const isActive = typeof statusOrActive === 'boolean' ? statusOrActive : statusOrActive === 'active';
    await updateDoc(doc(db, 'users', uid), { isActive });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (uid) => {
  try {
    checkDb();
    await deleteDoc(doc(db, 'users', uid));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAdminSettings = async (settings) => {
  try {
    checkDb();
    await setDoc(doc(db, 'settings', 'app_settings'), settings, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAppSettings = async () => {
  try {
    checkDb();
    const docSnap = await getDoc(doc(db, 'settings', 'app_settings'));
    if (docSnap.exists()) {
      return { success: true, settings: docSnap.data() };
    }
    return {
      success: true,
      settings: {
        subscriptionMonthly: { price: 0, duration: 30 },
        subscriptionYearly: { price: 0, duration: 365 },
        ccp: { accountNumber: '', key: '', name: '', wilaya: '' },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
