import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/wilayas';
import { loginUser, resetPassword } from '../services/auth';
import { useAuth } from '../services/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if (result.success) {
      await refreshUser();
      const role = result.user?.role;
      if (role === 'admin') navigation.replace('AdminDashboard');
      else if (role === 'driver') navigation.replace('DriverDashboard');
      else navigation.replace('CustomerDashboard');
    } else {
      Alert.alert('خطأ', result.error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('خطأ', 'أدخل بريدك الإلكتروني أولاً');
      return;
    }
    const result = await resetPassword(email);
    if (result.success)
      Alert.alert('تم', 'تم إرسال رابط إعادة تعيين كلمة المرور');
    else Alert.alert('خطأ', result.error);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>🚚</Text>
          <Text style={styles.logoText}>توصلني</Text>
          <Text style={styles.logoSubtext}>Tousalni</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>
          <Text style={styles.cardSubtitle}>
            أدخل بياناتك للمتابعة
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark || '#E67E00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>تسجيل الدخول</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            ليس لديك حساب؟{' '}
            <Text style={styles.linkTextBold}>إنشاء حساب</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F5F6FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 13,
    color: '#999',
    letterSpacing: 2,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E9EF',
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  eyeButton: {
    paddingLeft: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotText: {
    color: COLORS.primary,
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 20,
    marginTop: 4,
  },
  buttonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 15,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
