import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from '../services/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CustomerDashboard from '../screens/CustomerDashboard';
import DriverDashboard from '../screens/DriverDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import NewDeliveryRequest from '../screens/NewDeliveryRequest';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import { logoutUser } from '../services/auth';

const Stack = createNativeStackNavigator();

// Role-based screen wrapper that redirects unauthorized users
const RoleProtectedScreen = ({ Component, allowedRoles, navigation }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.restrictedContainer}>
        <Text style={styles.restrictedText}>يرجى تسجيل الدخول أولاً</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.restrictedButton}>
          <Text style={styles.restrictedButtonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <View style={styles.restrictedContainer}>
        <Text style={styles.restrictedText}>ليس لديك صلاحية الوصول لهذه الصفحة</Text>
        <TouchableOpacity
          onPress={async () => {
            await logoutUser();
            navigation.replace('Login');
          }}
          style={styles.restrictedButton}
        >
          <Text style={styles.restrictedButtonText}>تسجيل الدخول بحساب آخر</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Component navigation={navigation} />;
};

// Wrapper factory for Stack.Screen
const withRoleProtection = (Component, allowedRoles) => {
  return (props) => (
    <RoleProtectedScreen
      Component={Component}
      allowedRoles={allowedRoles}
      navigation={props.navigation}
    />
  );
};

const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="CustomerDashboard"
            component={withRoleProtection(CustomerDashboard, ['customer'])}
          />
          <Stack.Screen
            name="DriverDashboard"
            component={withRoleProtection(DriverDashboard, ['driver'])}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={withRoleProtection(AdminDashboard, ['admin'])}
          />
          <Stack.Screen
            name="NewDelivery"
            component={withRoleProtection(NewDeliveryRequest, ['customer'])}
          />
          <Stack.Screen
            name="Subscription"
            component={withRoleProtection(SubscriptionScreen, ['driver'])}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 30,
  },
  restrictedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  restrictedButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  restrictedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AppNavigator;