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
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS } from '../constants/wilayas';
import { getAllUsers, toggleUserStatus, deleteUser } from '../services/auth';
import { getAllRequests } from '../services/delivery';
import { getAllPayments, approvePayment, rejectPayment } from '../services/payment';
import { updateAdminSettings, getAppSettings } from '../services/settings';

I18nManager.forceRTL(true);

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({});

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [freeTrialDays, setFreeTrialDays] = useState('');
  const [minDriverEarnings, setMinDriverEarnings] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [usersResult, requestsResult, paymentsResult, settingsResult] = await Promise.all([
      getAllUsers(),
      getAllRequests(),
      getAllPayments(),
      getAppSettings(),
    ]);

    if (usersResult.success) setUsers(usersResult.users);
    if (requestsResult.success) setRequests(requestsResult.requests);
    if (paymentsResult.success) setPayments(paymentsResult.payments);
    if (settingsResult.success) {
      const s = settingsResult.settings || {};
      setSettings(s);
      setMonthlyPrice(s.subscription?.monthlyPrice?.toString() || '');
      setYearlyPrice(s.subscription?.yearlyPrice?.toString() || '');
      setFreeTrialDays(s.subscription?.freeTrialDays?.toString() || '');
      setMinDriverEarnings(s.delivery?.minDriverEarnings?.toString() || '');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleUser = (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    Alert.alert('تأكيد', `هل تريد ${newStatus === 'suspended' ? 'إيقاف' : 'تفعيل'} هذا المستخدم؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        onPress: async () => {
          const result = await toggleUserStatus(userId, newStatus);
          if (result.success) {
            Alert.alert('تم', `تم ${newStatus === 'suspended' ? 'إيقاف' : 'تفعيل'} المستخدم`);
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleDeleteUser = (userId, userName) => {
    Alert.alert('تأكيد', `هل تريد حذف المستخدم "${userName}"؟\nلا يمكن التراجع عن هذا الإجراء.`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteUser(userId);
          if (result.success) {
            Alert.alert('تم', 'تم حذف المستخدم');
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleApprovePayment = (paymentId) => {
    Alert.alert('تأكيد', 'هل تريد الموافقة على هذا الدفع؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        onPress: async () => {
          const result = await approvePayment(paymentId);
          if (result.success) {
            Alert.alert('تم', 'تمت الموافقة على الدفع');
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleRejectPayment = (paymentId) => {
    Alert.alert('تأكيد', 'هل تريد رفض هذا الدفع؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'رفض',
        style: 'destructive',
        onPress: async () => {
          const result = await rejectPayment(paymentId);
          if (result.success) {
            Alert.alert('تم', 'تم رفض الدفع');
            loadData();
          } else {
            Alert.alert('خطأ', result.error);
          }
        },
      },
    ]);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const result = await updateAdminSettings({
      subscription: {
        monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : 0,
        yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : 0,
        freeTrialDays: freeTrialDays ? parseInt(freeTrialDays) : 0,
      },
      delivery: {
        minDriverEarnings: minDriverEarnings ? parseFloat(minDriverEarnings) : 0,
      },
    });
    setIsSaving(false);

    if (result.success) {
      Alert.alert('تم', 'تم حفظ الإعدادات بنجاح');
      setShowSettings(false);
      loadData();
    } else {
      Alert.alert('خطأ', result.error);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchQuery || u.fullName?.includes(searchQuery) || u.email?.includes(searchQuery);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    totalUsers: users.length,
    activeDrivers: users.filter((u) => u.role === 'driver' && u.status === 'active').length,
    totalRequests: requests.length,
    pendingPayments: payments.filter((p) => p.status === 'pending').length,
  };

  const renderUserCard = (u) => (
    <View key={u.id} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, u.role === 'driver' ? styles.avatarDriver : styles.avatarCustomer]}>
              <Text style={styles.avatarText}>{u.role === 'driver' ? '🚗' : '👤'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{u.fullName}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
            </View>
          </View>
          <View style={[styles.statusDot, { backgroundColor: u.status === 'active' ? COLORS.success : COLORS.error }]} />
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>الهاتف</Text>
            <Text style={styles.detailValue}>{u.phone || 'غير محدد'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>الولاية</Text>
            <Text style={styles.detailValue}>{u.wilaya || 'غير محدد'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>النوع</Text>
            <Text style={styles.detailValue}>{u.role === 'driver' ? 'سائق' : 'عميل'}</Text>
          </View>
          {u.role === 'driver' && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>المركبة</Text>
              <Text style={styles.detailValue}>{u.vehicleType || 'غير محدد'}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, u.status === 'active' ? styles.suspendBtn : styles.activateBtn]}
            onPress={() => handleToggleUser(u.id, u.status)}
          >
            <Text style={styles.actionBtnText}>{u.status === 'active' ? 'إيقاف' : 'تفعيل'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteUser(u.id, u.fullName)}>
            <Text style={styles.actionBtnText}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRequestCard = (request) => (
    <View key={request.id} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
          </View>
          <Text style={styles.cardDate}>{new Date(request.createdAt).toLocaleDateString('ar-DZ')}</Text>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>العميل</Text>
            <Text style={styles.detailValue}>{request.customerName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>السائق</Text>
            <Text style={styles.detailValue}>{request.driverName || 'لم يُقبل بعد'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>من</Text>
            <Text style={styles.detailValue}>{request.pickupAddress}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>إلى</Text>
            <Text style={styles.detailValue}>{request.deliveryAddress}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>المبلغ</Text>
            <Text style={styles.detailValue}>{request.deliveryFee} دج</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPaymentCard = (payment) => (
    <View key={payment.id} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(payment.status) }]}>
            <Text style={styles.statusText}>{getPaymentStatusText(payment.status)}</Text>
          </View>
          <Text style={styles.cardDate}>{new Date(payment.createdAt).toLocaleDateString('ar-DZ')}</Text>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>المستخدم</Text>
            <Text style={styles.detailValue}>{payment.userName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>المبلغ</Text>
            <Text style={styles.detailValue}>{payment.amount} دج</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>ملاحظة</Text>
            <Text style={styles.detailValue}>{payment.note || 'لا توجد'}</Text>
          </View>
        </View>

        {payment.status === 'pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprovePayment(payment.id)}>
              <Text style={styles.actionBtnText}>موافقة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectPayment(payment.id)}>
              <Text style={styles.actionBtnText}>رفض</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsBtnText}>⚙️</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>لوحة المدير</Text>
            <Text style={styles.headerSubtitle}>مرحباً، {user?.fullName || 'مدير'}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>المستخدمين</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeDrivers}</Text>
          <Text style={styles.statLabel}>السائقين</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRequests}</Text>
          <Text style={styles.statLabel}>الطلبات</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingPayments}</Text>
          <Text style={styles.statLabel}>دفعات معلقة</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'users' && styles.activeTab]} onPress={() => setActiveTab('users')}>
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>المستخدمين</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>الطلبات</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'payments' && styles.activeTab]} onPress={() => setActiveTab('payments')}>
          <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>الدفعات</Text>
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
            {activeTab === 'users' && (
              <>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="بحث عن مستخدم..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <View style={styles.filterRow}>
                  {['all', 'customer', 'driver'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.filterBtn, filterRole === role && styles.filterBtnActive]}
                      onPress={() => setFilterRole(role)}
                    >
                      <Text style={[styles.filterBtnText, filterRole === role && styles.filterBtnTextActive]}>
                        {role === 'all' ? 'الكل' : role === 'customer' ? 'عملاء' : 'سائقين'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyText}>لا يوجد مستخدمين</Text>
                  </View>
                ) : (
                  filteredUsers.map(renderUserCard)
                )}
              </>
            )}

            {activeTab === 'requests' && (
              requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyText}>لا توجد طلبات</Text>
                </View>
              ) : (
                requests.map(renderRequestCard)
              )
            )}

            {activeTab === 'payments' && (
              payments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💳</Text>
                  <Text style={styles.emptyText}>لا توجد دفعات</Text>
                </View>
              ) : (
                payments.map(renderPaymentCard)
              )
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إعدادات النظام</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>الاشتراكات</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>سعر الشهري (دج)</Text>
                <TextInput style={styles.modalInput} placeholder="500" placeholderTextColor={COLORS.textSecondary} value={monthlyPrice} onChangeText={setMonthlyPrice} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>سعر السنوي (دج)</Text>
                <TextInput style={styles.modalInput} placeholder="5000" placeholderTextColor={COLORS.textSecondary} value={yearlyPrice} onChangeText={setYearlyPrice} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>أيام التجربة المجانية</Text>
                <TextInput style={styles.modalInput} placeholder="7" placeholderTextColor={COLORS.textSecondary} value={freeTrialDays} onChangeText={setFreeTrialDays} keyboardType="numeric" />
              </View>

              <Text style={styles.sectionTitle}>التوصيل</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الحد الأدنى لأرباح السائق (دج)</Text>
                <TextInput style={styles.modalInput} placeholder="200" placeholderTextColor={COLORS.textSecondary} value={minDriverEarnings} onChangeText={setMinDriverEarnings} keyboardType="numeric" />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelSettingsBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.cancelSettingsBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveSettingsBtnText}>حفظ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    case 'accepted': return 'مقبول';
    case 'picked_up': return 'تم الاستلام';
    case 'delivered': return 'تم التوصيل';
    case 'cancelled': return 'ملغي';
    default: return status;
  }
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#FFA000';
    case 'approved': return '#4CAF50';
    case 'rejected': return '#F44336';
    default: return COLORS.textSecondary;
  }
};

const getPaymentStatusText = (status) => {
  switch (status) {
    case 'pending': return 'قيد المراجعة';
    case 'approved': return 'تمت الموافقة';
    case 'rejected': return 'مرفوض';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, textAlign: 'right' },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.8, textAlign: 'right', marginTop: 4 },
  settingsBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  settingsBtnText: { fontSize: 20 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4 },
  tabBar: { flexDirection: 'row-reverse', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  searchContainer: { marginBottom: 12 },
  searchInput: { backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, textAlign: 'right' },
  filterRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  filterBtnTextActive: { color: COLORS.white },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 10, elevation: 2, overflow: 'hidden' },
  cardContent: { padding: 14 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  cardDate: { fontSize: 11, color: COLORS.textSecondary },
  userInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarDriver: { backgroundColor: COLORS.primaryLight },
  avatarCustomer: { backgroundColor: COLORS.accentLight },
  avatarText: { fontSize: 18 },
  userName: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  userEmail: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'right' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  userDetails: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10, marginTop: 4 },
  detailItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 12, color: COLORS.textSecondary },
  detailValue: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  cardActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  suspendBtn: { backgroundColor: '#FFF3E0' },
  activateBtn: { backgroundColor: '#E8F5E9' },
  deleteBtn: { backgroundColor: '#FFEBEE' },
  approveBtn: { backgroundColor: '#E8F5E9' },
  rejectBtn: { backgroundColor: '#FFEBEE' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalClose: { fontSize: 24, color: COLORS.textSecondary },
  modalBody: { padding: 20, maxHeight: 400 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16, textAlign: 'right' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, textAlign: 'right' },
  modalActions: { flexDirection: 'row-reverse', padding: 20, gap: 12 },
  cancelSettingsBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelSettingsBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveSettingsBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveSettingsBtnText: { color: COLORS.white, fontWeight: '600' },
});

export default AdminDashboard;
