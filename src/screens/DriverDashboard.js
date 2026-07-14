import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS } from '../constants/wilayas';
import {
  getPendingRequestsByWilaya,
  getDriverRequests,
  acceptDeliveryRequest,
  updateDeliveryStatus,
} from '../services/delivery';
import { getUserChats, createChat } from '../services/chat';
import { logoutUser } from '../services/auth';
import { formatPrice, getStatusColor, getStatusText } from '../utils/helpers';

const DriverDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    loadData();
    const unsubChats = getUserChats(user.uid, (chatsList) => {
      setChats(chatsList || []);
    });
    return () => unsubChats();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pendingResult, myResult] = await Promise.all([
      getPendingRequestsByWilaya(user.wilaya),
      getDriverRequests(user.uid),
    ]);

    if (pendingResult.success) setPendingRequests(pendingResult.requests);
    if (myResult.success) setMyRequests(myResult.requests);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptRequest = (request) => {
    Alert.alert('تأكيد', `هل تريد قبول هذا الطلب؟\nالمبلغ: ${formatPrice(request.deliveryFee)}`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        onPress: async () => {
          const result = await acceptDeliveryRequest(request.id, user.uid, user.fullName);
          if (result.success) {
            await createChat(request.customerId, request.customerName, user.uid, user.fullName, request.id);
            Alert.alert('تم', 'تم قبول الطلب بنجاح');
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleUpdateStatus = (requestId, newStatus) => {
    const statusLabels = {
      picked_up: 'تم الاستلام',
      delivered: 'تم التوصيل',
    };
    Alert.alert('تأكيد', `هل تريد تحديث الحالة إلى "${statusLabels[newStatus]}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        onPress: async () => {
          const result = await updateDeliveryStatus(requestId, newStatus);
          if (result.success) {
            Alert.alert('تم', 'تم تحديث الحالة بنجاح');
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('تأكيد', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم', onPress: async () => {
        await logoutUser();
        navigation.replace('Login');
      }},
    ]);
  };

  const handleCallCustomer = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderPendingRequest = (request) => (
    <View key={request.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: '#FFA000' }]}>
          <Text style={styles.statusText}>طلب جديد</Text>
        </View>
        <Text style={styles.cardDate}>{new Date(request.createdAt).toLocaleDateString('ar-DZ')}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>الاستلام</Text>
            <Text style={styles.addressText}>{request.pickupAddress}</Text>
          </View>
        </View>

        <View style={styles.addressDivider} />

        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>🏁</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>التوصيل</Text>
            <Text style={styles.addressText}>{request.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Text style={styles.customerIcon}>👤</Text>
          <Text style={styles.customerText}>{request.customerName}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>رسوم التوصيل</Text>
          <Text style={styles.priceValue}>{formatPrice(request.deliveryFee)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(request)}>
          <LinearGradient colors={[COLORS.success, COLORS.successLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptButtonGradient}>
            <Text style={styles.acceptButtonText}>قبول الطلب</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={() => handleCallCustomer(request.customerPhone)}>
          <Text style={styles.callButtonText}>📞 اتصال</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMyRequest = (request) => (
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
            <Text style={styles.addressLabel}>الاستلام</Text>
            <Text style={styles.addressText}>{request.pickupAddress}</Text>
          </View>
        </View>

        <View style={styles.addressDivider} />

        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>🏁</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>التوصيل</Text>
            <Text style={styles.addressText}>{request.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Text style={styles.customerIcon}>👤</Text>
          <Text style={styles.customerText}>{request.customerName}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>رسوم التوصيل</Text>
          <Text style={styles.priceValue}>{formatPrice(request.deliveryFee)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {request.status === 'accepted' && (
          <TouchableOpacity style={styles.updateButton} onPress={() => handleUpdateStatus(request.id, 'picked_up')}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.updateButtonGradient}>
              <Text style={styles.updateButtonText}>تم الاستلام</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {request.status === 'picked_up' && (
          <TouchableOpacity style={styles.updateButton} onPress={() => handleUpdateStatus(request.id, 'delivered')}>
            <LinearGradient colors={[COLORS.success, COLORS.successLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.updateButtonGradient}>
              <Text style={styles.updateButtonText}>تم التوصيل</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.callButton} onPress={() => handleCallCustomer(request.customerPhone)}>
          <Text style={styles.callButtonText}>📞 اتصال</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('Chat', { chatId: request.id, otherUserName: request.customerName })}>
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChatItem = (chat) => (
    <TouchableOpacity
      key={chat.id}
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat', { chatId: chat.id, otherUserName: chat.customerName })}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.chatAvatarText}>{chat.customerName?.charAt(0) || 'ع'}</Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{chat.customerName || 'عميل'}</Text>
        <Text style={styles.chatLastMessage}>{chat.lastMessage || 'لا توجد رسائل'}</Text>
      </View>
      <Text style={styles.chatTime}>{chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة السائق</Text>
        <Text style={styles.headerSubtitle}>مرحباً، {user?.fullName || 'سائق'}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingRequests.length}</Text>
          <Text style={styles.statLabel}>طلبات جديدة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{myRequests.filter((r) => r.status === 'accepted').length}</Text>
          <Text style={styles.statLabel}>قيد التنفيذ</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{myRequests.filter((r) => r.status === 'delivered').length}</Text>
          <Text style={styles.statLabel}>تم التوصيل</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.activeTab]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            جديدة ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'my' && styles.activeTab]} onPress={() => setActiveTab('my')}>
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>طلباتي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'chats' && styles.activeTab]} onPress={() => setActiveTab('chats')}>
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>المحادثات</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'pending' && (
              pendingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>لا توجد طلبات جديدة حالياً</Text>
                </View>
              ) : (
                pendingRequests.map(renderPendingRequest)
              )
            )}

            {activeTab === 'my' && (
              myRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyText}>لم تقبل أي طلبات بعد</Text>
                </View>
              ) : (
                myRequests.map(renderMyRequest)
              )
            )}

            {activeTab === 'chats' && (
              chats.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyText}>لا توجد محادثات بعد</Text>
                </View>
              ) : (
                chats.map(renderChatItem)
              )
            )}
          </>
        )}
      </ScrollView>
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
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
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
  customerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 8, padding: 8, backgroundColor: COLORS.background, borderRadius: 8 },
  customerIcon: { fontSize: 14, marginRight: 8 },
  customerText: { fontSize: 12, color: COLORS.text },
  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 10, backgroundColor: COLORS.background, borderRadius: 8 },
  priceLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  cardActions: { flexDirection: 'row-reverse', padding: 14, gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  acceptButton: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  acceptButtonGradient: { paddingVertical: 10, alignItems: 'center' },
  acceptButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  updateButton: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  updateButtonGradient: { paddingVertical: 10, alignItems: 'center' },
  updateButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  callButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  callButtonText: { fontSize: 12, color: COLORS.text },
  chatButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary },
  chatButtonText: { fontSize: 14 },
  chatCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  chatAvatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  chatLastMessage: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  chatTime: { fontSize: 10, color: COLORS.textSecondary },
  logoutButton: { position: 'absolute', top: 50, left: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  logoutButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
});

export default DriverDashboard;
