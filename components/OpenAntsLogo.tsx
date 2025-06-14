import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OpenAntsLogoProps {
  size?: number;
  color?: string;
}

export default function OpenAntsLogo({ size = 32, color = '#8B5CF6' }: OpenAntsLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Ant head - large circle */}
      <View style={[
        styles.antHead,
        {
          width: size * 0.35,
          height: size * 0.35,
          backgroundColor: color,
          left: size * 0.1,
          top: size * 0.32,
        }
      ]} />
      
      {/* Ant thorax - medium oval */}
      <View style={[
        styles.antThorax,
        {
          width: size * 0.28,
          height: size * 0.4,
          backgroundColor: color,
          left: size * 0.36,
          top: size * 0.3,
        }
      ]} />
      
      {/* Ant abdomen - large oval */}
      <View style={[
        styles.antAbdomen,
        {
          width: size * 0.4,
          height: size * 0.45,
          backgroundColor: color,
          left: size * 0.55,
          top: size * 0.275,
        }
      ]} />
      
      {/* Left antenna - curved line */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.2,
          height: size * 0.04,
          backgroundColor: color,
          left: size * 0.15,
          top: size * 0.2,
          transform: [{ rotate: '-25deg' }],
        }
      ]} />
      
      {/* Right antenna - curved line */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.2,
          height: size * 0.04,
          backgroundColor: color,
          left: size * 0.25,
          top: size * 0.15,
          transform: [{ rotate: '25deg' }],
        }
      ]} />
      
      {/* Eye - white dot for personality */}
      <View style={[
        styles.eye,
        {
          width: size * 0.08,
          height: size * 0.08,
          backgroundColor: 'white',
          left: size * 0.22,
          top: size * 0.42,
        }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  antHead: {
    position: 'absolute',
    borderRadius: 1000,
  },
  antThorax: {
    position: 'absolute',
    borderRadius: 1000,
  },
  antAbdomen: {
    position: 'absolute',
    borderRadius: 1000,
  },
  antenna: {
    position: 'absolute',
    borderRadius: 1000,
  },
  eye: {
    position: 'absolute',
    borderRadius: 1000,
  },
});