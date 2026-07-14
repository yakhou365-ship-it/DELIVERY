import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const checkDb = () => {
  if (!db) throw new Error('Firebase Firestore غير متوفر.');
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
        subscription: { monthlyPrice: 500, yearlyPrice: 5000, freeTrialDays: 7 },
        delivery: { minDriverEarnings: 200 },
        ccp: { accountNumber: '', key: '', name: '', wilaya: '' },
      },
    };
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
