import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS, WILAYAS, VEHICLE_TYPES, ITEM_TYPES } from '../constants/wilayas';
import { createDeliveryRequest, calculateDeliveryFee } from '../services/delivery';
import * as Location from 'expo-location';

const NewDeliveryRequest = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [itemType, setItemType] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  useEffect(() => {
    if (pickupAddress && deliveryAddress) {
      const fee = calculateDeliveryFee(pickupAddress, deliveryAddress);
      setDeliveryFee(fee);
    }
  }, [pickupAddress, deliveryAddress]);

  const getCurrentLocation = async (type) => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'يرجى السماح بالوصول للموقع');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const fullAddress = `${address.street || ''}, ${address.district || ''}, ${address.city || ''}`.trim();
        if (type === 'pickup') {
          setPickupAddress(fullAddress);
        } else {
          setDeliveryAddress(fullAddress);
        }
      } else {
        Alert.alert('تنبيه', 'لم يتم تحديد العنوان، يرجى إدخاله يدوياً');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديد الموقع');
    }
    setLoadingLocation(false);
  };

  const handleSubmit = async () => {
    if (!pickupAddress || !deliveryAddress || !contactPhone) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    Alert.alert(
      'تأكيد الطلب',
      `رسوم التوصيل: ${deliveryFee} دج\nهل تريد إرسال الطلب؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setLoading(true);
            const result = await createDeliveryRequest({
              customerId: user.uid,
              customerName: user.fullName,
              customerPhone: user.phone || contactPhone,
              pickupAddress,
              deliveryAddress,
              packageDescription,
              contactPhone,
              deliveryFee,
              vehicleType,
              itemType,
              notes,
              wilaya: user.wilaya,
            });
            setLoading(false);

            if (result.success) {
              Alert.alert('تم', 'تم إرسال طلب التوصيل بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
              ]);
            } else {
              Alert.alert('خطأ', result.error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>طلب توصيل جديد</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>📍 عنوان الاستلام</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="أدخل عنوان الاستلام"
              placeholderTextColor={COLORS.textSecondary}
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
            <TouchableOpacity style={styles.locationBtn} onPress={() => getCurrentLocation('pickup')} disabled={loadingLocation}>
              {loadingLocation ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.locationBtnText}>📍</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>🏁 عنوان التوصيل</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="أدخل عنوان التوصيل"
              placeholderTextColor={COLORS.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
            />
            <TouchableOpacity style={styles.locationBtn} onPress={() => getCurrentLocation('delivery')} disabled={loadingLocation}>
              {loadingLocation ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.locationBtnText}>📍</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>📦 وصف الطرد</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="مثال: ملف، صندوق صغير، محفظة..."
            placeholderTextColor={COLORS.textSecondary}
            value={packageDescription}
            onChangeText={setPackageDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sectionTitle}>📱 رقم الاتصال</Text>
          <TextInput
            style={styles.input}
            placeholder="05XXXXXXXX"
            placeholderTextColor={COLORS.textSecondary}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionTitle}>🚗 نوع المركبة</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowVehicleModal(true)}>
            <Text style={[styles.pickerText, !vehicleType && { color: COLORS.textSecondary }]}>
              {vehicleType ? VEHICLE_TYPES.find((v) => v.id === vehicleType)?.name : 'اختر نوع المركبة (اختياري)'}
            </Text>
            <Text style={styles.pickerArrow}>▾</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>📋 نوع الطرد</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowItemModal(true)}>
            <Text style={[styles.pickerText, !itemType && { color: COLORS.textSecondary }]}>
              {itemType ? ITEM_TYPES.find((i) => i.id === itemType)?.name : 'اختر نوع الطرد (اختياري)'}
            </Text>
            <Text style={styles.pickerArrow}>▾</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>📝 ملاحظات إضافية</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="أي تعليمات خاصة للسائق..."
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />

          <View style={styles.feeCard}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.feeGradient}>
              <Text style={styles.feeLabel}>رسوم التوصيل</Text>
              <Text style={styles.feeValue}>{deliveryFee} دج</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitButton}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="large" />
              ) : (
                <Text style={styles.submitButtonText}>إرسال الطلب</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showVehicleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>اختر نوع المركبة</Text>
            </View>
            <FlatList
              data={VEHICLE_TYPES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, vehicleType === item.id && styles.modalItemActive]}
                  onPress={() => { setVehicleType(item.id); setShowVehicleModal(false); }}
                >
                  <Text style={styles.modalItemEmoji}>{item.emoji}</Text>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showItemModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowItemModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>اختر نوع الطرد</Text>
            </View>
            <FlatList
              data={ITEM_TYPES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, itemType === item.id && styles.modalItemActive]}
                  onPress={() => { setItemType(item.id); setShowItemModal(false); }}
                >
                  <Text style={styles.modalItemEmoji}>{item.emoji}</Text>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  content: { flex: 1, padding: 16 },
  formCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12, textAlign: 'right' },
  inputRow: { flexDirection: 'row-reverse', gap: 8 },
  inputFlex: { flex: 1 },
  input: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, textAlign: 'right', marginBottom: 8 },
  textArea: { height: 80, textAlignVertical: 'top' },
  locationBtn: { width: 48, height: 48, borderRadius: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  locationBtnText: { fontSize: 20 },
  pickerButton: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  pickerText: { fontSize: 14, color: COLORS.text },
  pickerArrow: { fontSize: 16, color: COLORS.textSecondary },
  feeCard: { borderRadius: 12, overflow: 'hidden', marginVertical: 16 },
  feeGradient: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  feeLabel: { fontSize: 14, color: COLORS.white, fontWeight: '500' },
  feeValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalClose: { fontSize: 24, color: COLORS.textSecondary },
  modalItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  modalItemActive: { backgroundColor: COLORS.primaryLight },
  modalItemEmoji: { fontSize: 24 },
  modalItemText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
});

export default NewDeliveryRequest;
