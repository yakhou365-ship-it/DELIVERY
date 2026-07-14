import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { db } from './firebase';

const imageToBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return 'data:image/jpeg;base64,' + base64;
  } catch (error) {
    return null;
  }
};

export const submitPayment = async (paymentData) => {
  try {
    let proofImage = paymentData.proofImage || paymentData.screenshotBase64;
    if (proofImage && proofImage.startsWith('file://')) {
      const base64 = await imageToBase64(proofImage);
      if (base64) {
        proofImage = base64;
      }
    }

    const docRef = await addDoc(collection(db, 'payments'), {
      userId: paymentData.userId,
      userName: paymentData.userName,
      userEmail: paymentData.userEmail || '',
      userPhone: paymentData.userPhone || '',
      planType: paymentData.planType || paymentData.plan || '',
      planDuration: paymentData.planDuration || 0,
      amount: paymentData.amount,
      proofImage: proofImage,
      note: paymentData.note || '',
      type: paymentData.type || 'subscription',
      status: 'pending',
      adminNote: '',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    });
    return { success: true, paymentId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPendingPayments = async () => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const payments = [];
    snapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, payments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllPayments = async () => {
  try {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const payments = [];
    snapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, payments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const approvePayment = async (paymentId, userId, planType, planDuration) => {
  try {
    if (userId && planType && planDuration) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + planDuration);
      const planName = planType === 'monthly' ? 'شهري' : 'سنوي';
      await updateDoc(doc(db, 'users', userId), {
        subscription: {
          planId: planType,
          planName: planName,
          duration: planDuration,
          startDate: new Date().toISOString(),
          expiryDate: expiryDate.toISOString(),
          isActive: true,
        },
      });
    }

    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const rejectPayment = async (paymentId, note) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'rejected',
      adminNote: note || 'مرفوض',
      reviewedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserPayments = async (userId) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const payments = [];
    snapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, payments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
