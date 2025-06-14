import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OpenAntsLogoProps {
  size?: number;
  color?: string;
}

export default function OpenAntsLogo({ size = 32, color = '#8B5CF6' }: OpenAntsLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main ant body - large rounded shape */}
      <View style={[
        styles.antBody,
        {
          width: size * 0.65,
          height: size * 0.4,
          backgroundColor: color,
          left: size * 0.175,
          top: size * 0.3,
        }
      ]} />
      
      {/* Ant head - circular */}
      <View style={[
        styles.antHead,
        {
          width: size * 0.28,
          height: size * 0.28,
          backgroundColor: color,
          left: size * 0.05,
          top: size * 0.36,
        }
      ]} />
      
      {/* Ant abdomen - oval shape */}
      <View style={[
        styles.antAbdomen,
        {
          width: size * 0.35,
          height: size * 0.25,
          backgroundColor: color,
          left: size * 0.6,
          top: size * 0.375,
        }
      ]} />
      
      {/* Left antenna */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.15,
          height: size * 0.03,
          backgroundColor: color,
          left: size * 0.08,
          top: size * 0.25,
          transform: [{ rotate: '-35deg' }],
        }
      ]} />
      
      {/* Right antenna */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.15,
          height: size * 0.03,
          backgroundColor: color,
          left: size * 0.18,
          top: size * 0.22,
          transform: [{ rotate: '25deg' }],
        }
      ]} />
      
      {/* Antenna tips */}
      <View style={[
        styles.antennaTip,
        {
          width: size * 0.04,
          height: size * 0.04,
          backgroundColor: color,
          left: size * 0.02,
          top: size * 0.18,
        }
      ]} />
      <View style={[
        styles.antennaTip,
        {
          width: size * 0.04,
          height: size * 0.04,
          backgroundColor: color,
          left: size * 0.28,
          top: size * 0.15,
        }
      ]} />
      
      {/* Simplified legs - geometric lines */}
      {/* Front legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.22,
          top: size * 0.72,
          transform: [{ rotate: '25deg' }],
        }
      ]} />
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.22,
          top: size * 0.18,
          transform: [{ rotate: '-25deg' }],
        }
      ]} />
      
      {/* Middle legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.14,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.38,
          top: size * 0.75,
          transform: [{ rotate: '45deg' }],
        }
      ]} />
      <View style={[
        styles.leg,
        {
          width: size * 0.14,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.38,
          top: size * 0.15,
          transform: [{ rotate: '-45deg' }],
        }
      ]} />
      
      {/* Back legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.65,
          top: size * 0.72,
          transform: [{ rotate: '15deg' }],
        }
      ]} />
      <View style={[
        styles.leg,
        {
          width: size * 0.12,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.65,
          top: size * 0.18,
          transform: [{ rotate: '-15deg' }],
        }
      ]} />
      
      {/* Eye - small white circle for contrast */}
      <View style={[
        styles.eye,
        {
          width: size * 0.06,
          height: size * 0.06,
          backgroundColor: 'white',
          left: size * 0.15,
          top: size * 0.42,
        }
      ]} />
      
      {/* Eye pupil */}
      <View style={[
        styles.eyePupil,
        {
          width: size * 0.025,
          height: size * 0.025,
          backgroundColor: color,
          left: size * 0.165,
          top: size * 0.435,
        }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  antBody: {
    position: 'absolute',
    borderRadius: 50,
  },
  antHead: {
    position: 'absolute',
    borderRadius: 50,
  },
  antAbdomen: {
    position: 'absolute',
    borderRadius: 50,
  },
  antenna: {
    position: 'absolute',
    borderRadius: 2,
  },
  antennaTip: {
    position: 'absolute',
    borderRadius: 50,
  },
  leg: {
    position: 'absolute',
    borderRadius: 2,
  },
  eye: {
    position: 'absolute',
    borderRadius: 50,
  },
  eyePupil: {
    position: 'absolute',
    borderRadius: 50,
  },
});