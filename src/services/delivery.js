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
import { db } from './firebase';

export const createDeliveryRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'delivery_requests'), {
      customerId: requestData.customerId,
      customerName: requestData.customerName,
      customerPhone: requestData.customerPhone,
      driverId: null,
      driverName: null,
      driverPhone: null,
      pickupAddress: requestData.pickupAddress,
      deliveryAddress: requestData.deliveryAddress,
      pickupLocation: requestData.pickupLocation,
      deliveryLocation: requestData.deliveryLocation,
      itemType: requestData.itemType,
      itemDescription: requestData.itemDescription,
      itemPrice: requestData.itemPrice,
      deliveryFee: requestData.deliveryFee || 0,
      status: 'pending',
      notes: requestData.notes || '',
      wilaya: requestData.wilaya,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, requestId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const acceptDeliveryRequest = async (requestId, driverId, driverName) => {
  try {
    const driverDoc = await getDoc(doc(db, 'users', driverId));
    if (driverDoc.exists()) {
      const driverData = driverDoc.data();
      if (driverData.subscription && driverData.subscription.isActive) {
        const expiryDate = new Date(driverData.subscription.expiryDate);
        if (expiryDate <= new Date()) {
          return { success: false, error: 'اشتراكك منتهي. يرجى تجديده لقبول الطلبات.' };
        }
      } else {
        return { success: false, error: 'ليس لديك اشتراك نشط. يرجى الاشتراك أولاً.' };
      }
    }
    await updateDoc(doc(db, 'delivery_requests', requestId), {
      driverId: driverId,
      driverName: driverName,
      status: 'accepted',
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateDeliveryStatus = async (requestId, status) => {
  try {
    await updateDoc(doc(db, 'delivery_requests', requestId), {
      status: status,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCustomerRequests = async (customerId) => {
  try {
    const q = query(
      collection(db, 'delivery_requests'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getDriverRequests = async (driverId) => {
  try {
    const q = query(
      collection(db, 'delivery_requests'),
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPendingRequestsByWilaya = async (wilaya) => {
  try {
    const q = query(
      collection(db, 'delivery_requests'),
      where('wilaya', '==', wilaya),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const rateDelivery = async (requestId, rating, comment) => {
  try {
    await updateDoc(doc(db, 'delivery_requests', requestId), {
      rating: rating,
      ratingComment: comment,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateDeliveryRequest = async (requestId, updates) => {
  try {
    await updateDoc(doc(db, 'delivery_requests', requestId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const cancelDeliveryRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, 'delivery_requests', requestId), {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const calculateDeliveryFee = (pickupAddress, deliveryAddress) => {
  // Base fee for any delivery
  const baseFee = 200;
  // Estimate distance based on address text similarity
  // This is a client-side heuristic; for production, use a distance matrix API
  const words1 = pickupAddress.split(/[\s,]+/).filter(Boolean);
  const words2 = deliveryAddress.split(/[\s,]+/).filter(Boolean);
  const uniqueWords = new Set([...words1, ...words2]);
  const commonWords = words1.filter(w => words2.includes(w));
  // More common words = closer addresses = lower fee
  const similarity = commonWords.length / uniqueWords.size;
  const estimatedKm = Math.max(1, Math.min(50, Math.round((1 - similarity) * 30 + 3)));
  const kmRate = 50;
  return baseFee + estimatedKm * kmRate;
};

export const getAllRequests = async () => {
  try {
    const q = query(collection(db, 'delivery_requests'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
