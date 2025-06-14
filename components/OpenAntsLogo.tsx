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
          width: size * 0.4,
          height: size * 0.4,
          backgroundColor: color,
          left: size * 0.05,
          top: size * 0.1,
        }
      ]} />
      
      {/* Ant thorax - smaller circle */}
      <View style={[
        styles.antThorax,
        {
          width: size * 0.25,
          height: size * 0.25,
          backgroundColor: color,
          left: size * 0.375,
          top: size * 0.375,
        }
      ]} />
      
      {/* Ant abdomen - large oval */}
      <View style={[
        styles.antAbdomen,
        {
          width: size * 0.45,
          height: size * 0.35,
          backgroundColor: color,
          left: size * 0.5,
          top: size * 0.55,
        }
      ]} />
      
      {/* Left antenna */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.15,
          height: size * 0.03,
          backgroundColor: color,
          left: size * 0.1,
          top: size * 0.05,
          transform: [{ rotate: '-30deg' }],
        }
      ]} />
      
      {/* Right antenna */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.15,
          height: size * 0.03,
          backgroundColor: color,
          left: size * 0.3,
          top: size * 0.05,
          transform: [{ rotate: '30deg' }],
        }
      ]} />
      
      {/* Eye - small white circle */}
      <View style={[
        styles.eye,
        {
          width: size * 0.06,
          height: size * 0.06,
          backgroundColor: 'white',
          left: size * 0.18,
          top: size * 0.22,
        }
      ]} />
      
      {/* Legs - simple lines */}
      {/* Front legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.35,
          top: size * 0.45,
          transform: [{ rotate: '-45deg' }],
        }
      ]} />
      
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.45,
          top: size * 0.45,
          transform: [{ rotate: '45deg' }],
        }
      ]} />
      
      {/* Back legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.55,
          top: size * 0.75,
          transform: [{ rotate: '-45deg' }],
        }
      ]} />
      
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.65,
          top: size * 0.75,
          transform: [{ rotate: '45deg' }],
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
  leg: {
    position: 'absolute',
    borderRadius: 1000,
  },
});