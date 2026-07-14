import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS } from '../constants/wilayas';
import { getAppSettings } from '../services/settings';
import { submitPayment, getUserPayments } from '../services/payment';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

I18nManager.forceRTL(true);

const SubscriptionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [settingsResult, paymentsResult] = await Promise.all([
      getAppSettings(),
      getUserPayments(user.uid),
    ]);

    if (settingsResult.success) setSettings(settingsResult.settings);
    if (paymentsResult.success) setPayments(paymentsResult.payments);
    setLoading(false);
  };

  const getDaysRemaining = () => {
    const endDate = user?.subscription?.expiryDate;
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getSubscriptionStatus = () => {
    const endDate = user?.subscription?.expiryDate;
    if (!endDate) return 'inactive';
    const end = new Date(endDate);
    return end > new Date() ? 'active' : 'expired';
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'يرجى السماح بالوصول للمعرض');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: false,
    });

    if (!result.canceled) {
      try {
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setPaymentScreenshot(`data:image/jpeg;base64,${base64}`);
      } catch (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء قراءة الصورة');
      }
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan) {
      Alert.alert('خطأ', 'يرجى اختيار اشتراك');
      return;
    }
    if (!paymentScreenshot) {
      Alert.alert('خطأ', 'يرجى إرفاق إثبات الدفع');
      return;
    }

    Alert.alert(
      'تأكيد الدفع',
      `الاشتراك: ${selectedPlan === 'monthly' ? 'شهري' : 'سنوي'}\nالمبلغ: ${selectedPlan === 'monthly' ? settings?.subscription?.monthlyPrice : settings?.subscription?.yearlyPrice} دج`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setSubmitting(true);
            const result = await submitPayment({
              userId: user.uid,
              userName: user.fullName,
              amount: selectedPlan === 'monthly' ? settings?.subscription?.monthlyPrice : settings?.subscription?.yearlyPrice,
              screenshotBase64: paymentScreenshot,
              plan: selectedPlan,
              type: 'subscription',
            });
            setSubmitting(false);

            if (result.success) {
              Alert.alert('تم', 'تم إرسال طلب الدفع بنجاح. سيتم مراجعته من قبل المدير.', [
                { text: 'حسناً' },
              ]);
              setSelectedPlan(null);
              setPaymentScreenshot(null);
              loadData();
            } else {
              Alert.alert('خطأ', result.error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();
  const daysRemaining = getDaysRemaining();
  const monthlyPrice = settings?.subscription?.monthlyPrice || 500;
  const yearlyPrice = settings?.subscription?.yearlyPrice || 5000;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الاشتراك</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={[styles.statusDot, { backgroundColor: subscriptionStatus === 'active' ? COLORS.success : COLORS.error }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {subscriptionStatus === 'active' ? 'اشتراكك نشط' : 'لا يوجد اشتراك نشط'}
            </Text>
            {subscriptionStatus === 'active' && (
              <Text style={styles.statusSubtitle}>متبقي {daysRemaining} يوم</Text>
            )}
            {user?.subscription?.expiryDate && (
              <Text style={styles.statusDate}>ينتهي في: {new Date(user.subscription.expiryDate).toLocaleDateString('ar-DZ')}</Text>
            )}
          </View>
        </View>

        {/* Plans */}
        <Text style={styles.sectionTitle}>اختر اشتراكك</Text>

        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
          onPress={() => handleSelectPlan('monthly')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planIcon}>📅</Text>
            <View>
              <Text style={styles.planName}>الاشتراك الشهري</Text>
              <Text style={styles.planDuration}>30 يوم</Text>
            </View>
          </View>
          <Text style={styles.planPrice}>{monthlyPrice} دج</Text>
          {selectedPlan === 'monthly' && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓ محدد</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardActive, styles.planCardRecommended]}
          onPress={() => handleSelectPlan('yearly')}
        >
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>⭐ الأفضل قيمة</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={styles.planIcon}>📅</Text>
            <View>
              <Text style={styles.planName}>الاشتراك السنوي</Text>
              <Text style={styles.planDuration}>365 يوم</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.planPrice}>{yearlyPrice} دج</Text>
            <Text style={styles.planSavings}>توفر {Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)}%</Text>
          </View>
          {selectedPlan === 'yearly' && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓ محدد</Text>
            </View>
          )}
        </TouchableOpacity>

        {selectedPlan && (
          <>
            <Text style={styles.sectionTitle}>إثبات الدفع</Text>
            <Text style={styles.paymentInstructions}>
              قم بتحويل المبلغ إلى الحساب البنكي CCP ثم أرفق صورة إثبات التحويل
            </Text>

            <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
              {paymentScreenshot ? (
                <Image source={{ uri: paymentScreenshot }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>اضغط لإرفاق إثبات الدفع</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmitPayment} disabled={submitting}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitButton}>
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} size="large" />
                ) : (
                  <Text style={styles.submitButtonText}>إرسال طلب الدفع</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {payments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>سجل الدفعات</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentHistoryCard}>
                <View style={styles.paymentHistoryHeader}>
                  <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(payment.status) }]}>
                    <Text style={styles.paymentStatusText}>{getPaymentStatusText(payment.status)}</Text>
                  </View>
                  <Text style={styles.paymentDate}>{new Date(payment.createdAt).toLocaleDateString('ar-DZ')}</Text>
                </View>
                <View style={styles.paymentHistoryBody}>
                  <Text style={styles.paymentAmount}>{payment.amount} دج</Text>
                  <Text style={styles.paymentPlan}>{payment.plan === 'monthly' ? 'شهري' : 'سنوي'}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  content: { flex: 1, padding: 16 },
  statusCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2, gap: 14 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  statusSubtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textAlign: 'right', marginTop: 2 },
  statusDate: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'right' },
  planCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 12, elevation: 2, borderWidth: 2, borderColor: 'transparent' },
  planCardActive: { borderColor: COLORS.primary },
  planCardRecommended: { borderColor: COLORS.accent },
  planHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIcon: { fontSize: 32 },
  planName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  planDuration: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  planPrice: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  planSavings: { fontSize: 12, fontWeight: '600', color: COLORS.success, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recommendedBadge: { marginBottom: 8 },
  recommendedText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  selectedBadge: { marginTop: 12, alignItems: 'flex-start' },
  selectedBadgeText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  paymentInstructions: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'right', marginBottom: 16, lineHeight: 20 },
  uploadArea: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, padding: 24, alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadIcon: { fontSize: 48, marginBottom: 8 },
  uploadText: { fontSize: 14, color: COLORS.textSecondary },
  uploadedImage: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  paymentHistoryCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  paymentHistoryHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  paymentStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paymentStatusText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  paymentDate: { fontSize: 11, color: COLORS.textSecondary },
  paymentHistoryBody: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  paymentAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  paymentPlan: { fontSize: 13, color: COLORS.textSecondary },
});

export default SubscriptionScreen;
