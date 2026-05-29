import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../theme/theme';

// Pantalla de splash personalizada que se muestra mientras
// se restaura la sesión desde SecureStore
export default function SplashContent() {
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.85)).current;
  const dotAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada del logo
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, tension: 60, friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de los puntos de carga
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        {/* Cruz MACSA */}
        <View style={styles.crossWrap}>
          <View style={[styles.crossH, { backgroundColor: '#FFF' }]} />
          <View style={[styles.crossV, { backgroundColor: Colors.secondary }]} />
        </View>
        <Text style={styles.brandName}>MACSA</Text>
        <Text style={styles.brandSub}>Clínica de Salud</Text>
        <View style={styles.divider} />
        <Text style={styles.appName}>Call Center Analytics</Text>
      </Animated.View>

      {/* Indicador de carga */}
      <Animated.View style={[styles.loadingRow, { opacity }]}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[styles.dot, {
              opacity: dotAnim.interpolate({
                inputRange:  [0, 0.33 * (i + 1), 1],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              }),
            }]}
          />
        ))}
      </Animated.View>

      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: { alignItems: 'center' },
  crossWrap: {
    width: 64, height: 64,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative', marginBottom: 20,
  },
  crossH: { position:'absolute', width: 56, height: 18, borderRadius: 4 },
  crossV: { position:'absolute', width: 18, height: 56, borderRadius: 4 },
  brandName: {
    fontSize: 32, fontWeight: '700',
    color: '#FFF', letterSpacing: 2,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5, marginBottom: 16,
  },
  divider:  { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  appName:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5 },
  loadingRow:{ flexDirection: 'row', gap: 8, marginTop: 48 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
  version:   { position: 'absolute', bottom: 40, fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
