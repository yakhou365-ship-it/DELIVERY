import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, WILAYAS, VEHICLE_TYPES, USER_ROLES } from '../constants/wilayas';
import { registerUser } from '../services/auth';
import { validateEmail, validatePhone } from '../utils/helpers';

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [userType, setUserType] = useState(USER_ROLES.CUSTOMER);
  const [vehicleType, setVehicleType] = useState('');
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert('خطأ', 'البريد الإلكتروني غير صحيح');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
        return;
      }
      if (password.length < 6) {
        Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!name || !phone || !wilaya) {
        Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
        return;
      }
      if (!validatePhone(phone)) {
        Alert.alert('خطأ', 'رقم الهاتف غير صحيح (05 أو 06 أو 07 + 8 أرقام)');
        return;
      }
      if (userType === USER_ROLES.DRIVER && !vehicleType) {
        Alert.alert('خطأ', 'يرجى اختيار نوع المركبة');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    const result = await registerUser({
      email,
      password,
      fullName: name,
      phone,
      wilaya,
      role: userType,
      vehicleType: userType === USER_ROLES.DRIVER ? vehicleType : null,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('تم', 'تم إنشاء الحساب بنجاح', [
        { text: 'حسناً', onPress: () => navigation.replace('Login') },
      ]);
    } else {
      Alert.alert('خطأ', result.error);
    }
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <View style={styles.stepsContainer}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={styles.stepIndicatorWrapper}>
                  <View style={[styles.stepIndicator, s <= step && styles.stepIndicatorActive]}>
                    <Text style={[styles.stepText, s <= step && styles.stepTextActive]}>{s}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>إنشاء حسابك</Text>
              <Text style={styles.stepSubtitle}>أدخل بريدك الإلكتروني وكلمة المرور</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} placeholder="البريد الإلكتروني" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  <Text style={styles.inputIcon}>✉️</Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.inputIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>تأكيد كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} placeholder="تأكيد كلمة المرور" placeholderTextColor={COLORS.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.inputIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>معلوماتك الشخصية</Text>
              <Text style={styles.stepSubtitle}>أخبرنا عن نفسك</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>الاسم الكامل</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} placeholder="الاسم الكامل" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
                  <Text style={styles.inputIcon}>👤</Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>رقم الهاتف</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} placeholder="05XXXXXXXX" placeholderTextColor={COLORS.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  <Text style={styles.inputIcon}>📱</Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>الولاية</Text>
                <TouchableOpacity style={styles.inputContainer} onPress={() => setShowWilayaPicker(true)}>
                  <Text style={[styles.input, !wilaya && { color: COLORS.textSecondary }]}>{wilaya || 'اختر الولاية'}</Text>
                  <Text style={styles.inputIcon}>📍</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>نوع الحساب</Text>
                <View style={styles.userTypeContainer}>
                  <TouchableOpacity style={[styles.userTypeButton, userType === USER_ROLES.CUSTOMER && styles.userTypeButtonActive]} onPress={() => setUserType(USER_ROLES.CUSTOMER)}>
                    <Text style={styles.userTypeIcon}>👤</Text>
                    <Text style={[styles.userTypeText, userType === USER_ROLES.CUSTOMER && styles.userTypeTextActive]}>عميل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.userTypeButton, userType === USER_ROLES.DRIVER && styles.userTypeButtonActive]} onPress={() => setUserType(USER_ROLES.DRIVER)}>
                    <Text style={styles.userTypeIcon}>🚗</Text>
                    <Text style={[styles.userTypeText, userType === USER_ROLES.DRIVER && styles.userTypeTextActive]}>سائق</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {userType === USER_ROLES.DRIVER && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>نوع المركبة</Text>
                  <TouchableOpacity style={styles.inputContainer} onPress={() => setShowVehiclePicker(true)}>
                    <Text style={[styles.input, !vehicleType && { color: COLORS.textSecondary }]}>
                      {vehicleType ? VEHICLE_TYPES.find((v) => v.id === vehicleType)?.name : 'اختر المركبة'}
                    </Text>
                    <Text style={styles.inputIcon}>🚗</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>تأكيد البيانات</Text>
              <Text style={styles.stepSubtitle}>تحقق من صحة المعلومات</Text>

              <View style={styles.confirmationCard}>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>البريد الإلكتروني</Text>
                  <Text style={styles.confirmationValue}>{email}</Text>
                </View>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>الاسم</Text>
                  <Text style={styles.confirmationValue}>{name}</Text>
                </View>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>الهاتف</Text>
                  <Text style={styles.confirmationValue}>{phone}</Text>
                </View>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>الولاية</Text>
                  <Text style={styles.confirmationValue}>{wilaya}</Text>
                </View>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>نوع الحساب</Text>
                  <Text style={styles.confirmationValue}>{userType === USER_ROLES.CUSTOMER ? 'عميل' : 'سائق'}</Text>
                </View>
                {userType === USER_ROLES.DRIVER && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>المركبة</Text>
                    <Text style={styles.confirmationValue}>{VEHICLE_TYPES.find((v) => v.id === vehicleType)?.name}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Modal visible={showWilayaPicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowWilayaPicker(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>اختر الولاية</Text>
                </View>
                <FlatList
                  data={WILAYAS}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.wilayaItem} onPress={() => { setWilaya(`${item.id} - ${item.name}`); setShowWilayaPicker(false); }}>
                      <Text style={styles.wilayaItemText}>{item.id} - {item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showVehiclePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowVehiclePicker(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>اختر المركبة</Text>
                </View>
                <View style={styles.vehicleGrid}>
                  {VEHICLE_TYPES.map((vehicle) => (
                    <TouchableOpacity key={vehicle.id} style={[styles.vehicleItem, vehicleType === vehicle.id && styles.vehicleItemActive]} onPress={() => { setVehicleType(vehicle.id); setShowVehiclePicker(false); }}>
                      <Text style={styles.vehicleEmoji}>{vehicle.emoji}</Text>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.buttonContainer}>
            {step > 1 && (
              <TouchableOpacity style={styles.backBtnStyle} onPress={handleBack}>
                <Text style={styles.backBtnText}>رجوع</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <LinearGradient colors={[COLORS.accent, COLORS.accentLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.nextButton, step === 1 && styles.fullButton]}>
                <TouchableOpacity style={styles.buttonInner} onPress={handleNext}>
                  <Text style={styles.buttonText}>التالي</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <LinearGradient colors={[COLORS.success, COLORS.successLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.nextButton, styles.fullButton]}>
                <TouchableOpacity style={styles.buttonInner} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.white} size="large" /> : <Text style={styles.buttonText}>إنشاء الحساب</Text>}
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: COLORS.background, paddingVertical: 20 },
  container: { flex: 1, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 2 },
  backIcon: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold' },
  progressContainer: { marginBottom: 32 },
  progressBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  stepsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  stepIndicatorWrapper: { alignItems: 'center' },
  stepIndicator: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepIndicatorActive: { backgroundColor: COLORS.primary },
  stepText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary },
  stepTextActive: { color: COLORS.white },
  stepContainer: { marginBottom: 24 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  stepSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 24, textAlign: 'right' },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: COLORS.surface },
  input: { flex: 1, color: COLORS.text, fontSize: 13, marginHorizontal: 8, textAlign: 'right' },
  inputIcon: { fontSize: 16 },
  userTypeContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 12 },
  userTypeButton: { flex: 1, borderWidth: 2, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: COLORS.surface },
  userTypeButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  userTypeIcon: { fontSize: 24, marginBottom: 4 },
  userTypeText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  userTypeTextActive: { color: COLORS.primary },
  confirmationCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, elevation: 2, marginBottom: 24 },
  confirmationItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  confirmationLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  confirmationValue: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingTop: 20 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalClose: { fontSize: 24, color: COLORS.textSecondary },
  wilayaItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  wilayaItemText: { fontSize: 14, color: COLORS.text, textAlign: 'right' },
  vehicleGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', padding: 20 },
  vehicleItem: { width: '48%', borderWidth: 2, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginBottom: 12, backgroundColor: COLORS.lightGrey },
  vehicleItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  vehicleEmoji: { fontSize: 32, marginBottom: 8 },
  vehicleName: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row-reverse', gap: 12, marginTop: 24 },
  backBtnStyle: { flex: 0.3, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  backBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  nextButton: { flex: 1, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  fullButton: { flex: 1 },
  buttonInner: { paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
});

export default RegisterScreen;
