import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OpenAntsLogoProps {
  size?: number;
  color?: string;
}

export default function OpenAntsLogo({ size = 32, color = '#8B5CF6' }: OpenAntsLogoProps) {
  const dotSize = size * 0.08;
  const spacing = size * 0.12;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main ant body - central oval */}
      <View style={[
        styles.antBody,
        {
          width: size * 0.4,
          height: size * 0.25,
          backgroundColor: color,
          left: size * 0.3,
          top: size * 0.375,
        }
      ]} />
      
      {/* Ant head - smaller circle */}
      <View style={[
        styles.antHead,
        {
          width: size * 0.18,
          height: size * 0.18,
          backgroundColor: color,
          left: size * 0.15,
          top: size * 0.35,
        }
      ]} />
      
      {/* Ant abdomen - larger oval */}
      <View style={[
        styles.antAbdomen,
        {
          width: size * 0.3,
          height: size * 0.2,
          backgroundColor: color,
          left: size * 0.55,
          top: size * 0.4,
        }
      ]} />
      
      {/* Antennae */}
      <View style={[
        styles.antenna,
        {
          width: size * 0.12,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.12,
          top: size * 0.32,
          transform: [{ rotate: '-25deg' }],
        }
      ]} />
      <View style={[
        styles.antenna,
        {
          width: size * 0.12,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.18,
          top: size * 0.28,
          transform: [{ rotate: '15deg' }],
        }
      ]} />
      
      {/* Legs - simplified geometric lines */}
      {/* Front legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.08,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.25,
          top: size * 0.55,
          transform: [{ rotate: '45deg' }],
        }
      ]} />
      <View style={[
        styles.leg,
        {
          width: size * 0.08,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.25,
          top: size * 0.25,
          transform: [{ rotate: '-45deg' }],
        }
      ]} />
      
      {/* Middle legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.1,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.35,
          top: size * 0.58,
          transform: [{ rotate: '60deg' }],
        }
      ]} />
      <View style={[
        styles.leg,
        {
          width: size * 0.1,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.35,
          top: size * 0.22,
          transform: [{ rotate: '-60deg' }],
        }
      ]} />
      
      {/* Back legs */}
      <View style={[
        styles.leg,
        {
          width: size * 0.08,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.55,
          top: size * 0.55,
          transform: [{ rotate: '30deg' }],
        }
      ]} />
      <View style={[
        styles.leg,
        {
          width: size * 0.08,
          height: size * 0.02,
          backgroundColor: color,
          left: size * 0.55,
          top: size * 0.25,
          transform: [{ rotate: '-30deg' }],
        }
      ]} />
      
      {/* Network connection dots around the ant */}
      {[
        { x: 0.05, y: 0.15 },
        { x: 0.85, y: 0.2 },
        { x: 0.9, y: 0.7 },
        { x: 0.1, y: 0.8 },
        { x: 0.45, y: 0.05 },
        { x: 0.45, y: 0.85 },
      ].map((pos, i) => (
        <View
          key={`dot-${i}`}
          style={[
            styles.networkDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              left: size * pos.x,
              top: size * pos.y,
              opacity: 0.6,
            }
          ]}
        />
      ))}
      
      {/* Subtle connection lines */}
      <View style={[
        styles.connectionLine,
        {
          width: size * 0.15,
          height: 1,
          backgroundColor: color,
          left: size * 0.1,
          top: size * 0.25,
          opacity: 0.3,
          transform: [{ rotate: '45deg' }],
        }
      ]} />
      <View style={[
        styles.connectionLine,
        {
          width: size * 0.12,
          height: 1,
          backgroundColor: color,
          left: size * 0.75,
          top: size * 0.6,
          opacity: 0.3,
          transform: [{ rotate: '-30deg' }],
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
  leg: {
    position: 'absolute',
    borderRadius: 1,
  },
  networkDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  connectionLine: {
    position: 'absolute',
  },
});