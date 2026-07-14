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
  const baseFee = 200;
  const kmRate = 50;
  const len = Math.abs(pickupAddress.length - deliveryAddress.length);
  const estimatedKm = Math.max(1, Math.min(50, Math.floor(len / 5) + 3));
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
