import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserData } from '../services/auth';
import { COLORS } from '../constants/wilayas';

const SplashScreen = ({ navigation }) => {
  const scaleValue = useRef(new Animated.Value(0.5)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const loadingAnimValue = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(loadingAnimValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();

    // Safety timeout: navigate to Login after 5 seconds if auth check hangs
    const safetyTimeout = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        try {
          navigation.replace('Login');
        } catch (e) {
          // navigation may be unmounted
        }
      }
    }, 5000);

    let unsubscribe = null;

    try {
      if (!auth) {
        // Firebase not initialized - go to Login after a short delay
        setTimeout(() => {
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            navigation.replace('Login');
          }
        }, 2000);
        return () => clearTimeout(safetyTimeout);
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        clearTimeout(safetyTimeout);

        if (user) {
          try {
            const result = await getUserData(user.uid);
            const role = result.success ? result.user?.role : 'customer';
            if (role === 'admin') navigation.replace('AdminDashboard');
            else if (role === 'driver') navigation.replace('DriverDashboard');
            else navigation.replace('CustomerDashboard');
          } catch (e) {
            navigation.replace('CustomerDashboard');
          }
        } else {
          navigation.replace('Login');
        }
      });
    } catch (error) {
      console.error('SplashScreen auth error:', error);
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        clearTimeout(safetyTimeout);
        navigation.replace('Login');
      }
    }

    return () => {
      clearTimeout(safetyTimeout);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadingWidth = loadingAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      >
        <Text style={styles.logoIcon}>🚚</Text>
        <Text style={styles.logoText}>توصلني</Text>
        <Text style={styles.logoSubtext}>Tousalni</Text>
      </Animated.View>

      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingBar, { width: loadingWidth }]} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 14,
    color: COLORS.primaryLight,
    letterSpacing: 2,
  },
  loadingContainer: {
    width: 120,
    height: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 60,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
});

export default SplashScreen;