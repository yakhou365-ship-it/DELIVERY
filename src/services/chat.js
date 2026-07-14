import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

export const sendMessage = async (data) => {
  try {
    const chatId = data.chatId;
    const senderId = data.senderId;
    const senderName = data.senderName;
    const text = data.text;

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString(),
      read: false,
    });

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: new Date().toISOString(),
      lastMessageBy: senderId,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createChat = async (customerId, customerName, driverId, driverName, requestId) => {
  try {
    const q = query(
      collection(db, 'chats'),
      where('customerId', '==', customerId),
      where('driverId', '==', driverId),
      where('requestId', '==', requestId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      return { success: true, chatId: existing.docs[0].id };
    }

    const docRef = await addDoc(collection(db, 'chats'), {
      customerId,
      customerName,
      driverId,
      driverName,
      requestId,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { success: true, chatId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToMessages = (chatId, callback) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

export const getUserChats = (userId, callback) => {
  let customerChats = [];
  let driverChats = [];

  const emit = () => {
    const allChats = [...customerChats, ...driverChats].sort(
      (a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
    );
    callback(allChats);
  };

  const q1 = query(
    collection(db, 'chats'),
    where('customerId', '==', userId)
  );

  const q2 = query(
    collection(db, 'chats'),
    where('driverId', '==', userId)
  );

  const unsub1 = onSnapshot(q1, (snapshot1) => {
    customerChats = [];
    snapshot1.forEach((doc) => {
      customerChats.push({ id: doc.id, ...doc.data() });
    });
    emit();
  });

  const unsub2 = onSnapshot(q2, (snapshot2) => {
    driverChats = [];
    snapshot2.forEach((doc) => {
      driverChats.push({ id: doc.id, ...doc.data() });
    });
    emit();
  });

  return () => {
    unsub1();
    unsub2();
  };
};

export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.data().senderId !== userId) {
        updates.push(updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { read: true }));
      }
    });
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
