import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  I18nManager,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS, WILAYAS } from '../constants/wilayas';
import {
  getCustomerRequests,
  createDeliveryRequest,
  cancelDeliveryRequest,
  calculateDeliveryFee,
} from '../services/delivery';
import { getUserPayments, submitPayment } from '../services/payment';
import { getUserChats } from '../services/chat';
import { getAppSettings } from '../services/settings';
import { formatPrice } from '../utils/helpers';

I18nManager.forceRTL(true);

const CustomerDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // New request form states
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pickupAddress && deliveryAddress) {
      const fee = calculateDeliveryFee(pickupAddress, deliveryAddress);
      setDeliveryFee(fee);
    }
  }, [pickupAddress, deliveryAddress]);

  const loadData = async () => {
    setLoading(true);
    const [requestsResult, chatsResult, settingsResult] = await Promise.all([
      getCustomerRequests(user.uid),
      getUserChats(user.uid),
      getAppSettings(),
    ]);

    if (requestsResult.success) setRequests(requestsResult.requests);
    if (chatsResult.success) setChats(chatsResult.chats);
    if (settingsResult.success) setSettings(settingsResult.settings);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateRequest = async () => {
    if (!pickupAddress || !deliveryAddress || !contactPhone) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const result = await createDeliveryRequest({
      customerId: user.uid,
      customerName: user.fullName,
      customerPhone: user.phone || contactPhone,
      pickupAddress,
      deliveryAddress,
      packageDescription,
      contactPhone,
      deliveryFee,
      wilaya: user.wilaya,
    });

    if (result.success) {
      Alert.alert('تم', 'تم إنشاء طلب التوصيل بنجاح');
      setShowNewRequest(false);
      resetForm();
      loadData();
    } else {
      Alert.alert('خطأ', result.error);
    }
  };

  const handleCancelRequest = (requestId) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من إلغاء هذا الطلب؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        onPress: async () => {
          const result = await cancelDeliveryRequest(requestId);
          if (result.success) {
            Alert.alert('تم', 'تم إلغاء الطلب بنجاح');
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleSubmitPayment = async () => {
    if (!paymentAmount || !paymentScreenshot) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    const result = await submitPayment({
      userId: user.uid,
      userName: user.fullName,
      amount: parseFloat(paymentAmount),
      screenshotBase64: paymentScreenshot,
      note: paymentNote,
      requestId: selectedRequest?.id,
    });

    if (result.success) {
      Alert.alert('تم', 'تم إرسال الدفع بنجاح');
      setShowPaymentModal(false);
      resetPaymentForm();
    } else {
      Alert.alert('خطأ', result.error);
    }
  };

  const resetForm = () => {
    setPickupAddress('');
    setDeliveryAddress('');
    setPackageDescription('');
    setContactPhone('');
    setDeliveryFee(0);
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentScreenshot(null);
    setPaymentNote('');
    setSelectedRequest(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA000';
      case 'accepted': return '#2196F3';
      case 'picked_up': return '#9C27B0';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return COLORS.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'accepted': return 'تم القبول';
      case 'picked_up': return 'تم الاستلام';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const renderRequestCard = (request) => (
    <View key={request.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
        </View>
        <Text style={styles.cardDate}>{new Date(request.createdAt).toLocaleDateString('ar-DZ')}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>من</Text>
            <Text style={styles.addressText}>{request.pickupAddress}</Text>
          </View>
        </View>

        <View style={styles.addressDivider} />

        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>🏁</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>إلى</Text>
            <Text style={styles.addressText}>{request.deliveryAddress}</Text>
          </View>
        </View>

        {request.driverName && (
          <View style={styles.driverInfo}>
            <Text style={styles.driverIcon}>🚗</Text>
            <Text style={styles.driverText}>السائق: {request.driverName}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>{formatPrice(request.deliveryFee)}</Text>
          {request.status === 'pending' && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelRequest(request.id)}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderChatItem = (chat) => (
    <TouchableOpacity
      key={chat.id}
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat', { chatId: chat.id, otherUserName: chat.driverName })}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.chatAvatarText}>{chat.driverName?.charAt(0) || 'د'}</Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{chat.driverName || 'سائق'}</Text>
        <Text style={styles.chatLastMessage}>{chat.lastMessage || 'لا توجد رسائل'}</Text>
      </View>
      <Text style={styles.chatTime}>{chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
        <Text style={styles.headerSubtitle}>مرحباً، {user?.fullName || 'عميل'}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests.length}</Text>
          <Text style={styles.statLabel}>الطلبات</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests.filter((r) => r.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>قيد الانتظار</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests.filter((r) => r.status === 'delivered').length}</Text>
          <Text style={styles.statLabel}>تم التوصيل</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>طلباتي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'chats' && styles.activeTab]} onPress={() => setActiveTab('chats')}>
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>المحادثات</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {activeTab === 'requests' && (
          <View>
            {loading ? (
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            ) : requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>لا توجد طلبات بعد</Text>
                <TouchableOpacity onPress={() => navigation.navigate('NewDelivery')}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.newRequestButton}>
                    <Text style={styles.newRequestButtonText}>طلب توصيل جديد</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              requests.map(renderRequestCard)
            )}
          </View>
        )}

        {activeTab === 'chats' && (
          <View>
            {chats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>لا توجد محادثات بعد</Text>
              </View>
            ) : (
              chats.map(renderChatItem)
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewDelivery')}>
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, textAlign: 'right' },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.8, textAlign: 'right', marginTop: 4 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  tabBar: { flexDirection: 'row-reverse', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  loadingText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 24 },
  newRequestButton: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  newRequestButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  cardDate: { fontSize: 11, color: COLORS.textSecondary },
  cardBody: { padding: 14 },
  addressRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 8 },
  addressIcon: { fontSize: 16, marginRight: 10, marginTop: 2 },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 },
  addressText: { fontSize: 13, color: COLORS.text, fontWeight: '500', textAlign: 'right' },
  addressDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8, marginHorizontal: 20 },
  driverInfo: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 8, padding: 8, backgroundColor: COLORS.background, borderRadius: 8 },
  driverIcon: { fontSize: 14, marginRight: 8 },
  driverText: { fontSize: 12, color: COLORS.text },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  priceText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  cancelButton: { backgroundColor: COLORS.error, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cancelButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  chatCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  chatAvatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  chatLastMessage: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  chatTime: { fontSize: 10, color: COLORS.textSecondary },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28, elevation: 6 },
  fabGradient: { flex: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300' },
});

export default CustomerDashboard;
