import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OpenAntsLogoProps {
  size?: number;
  color?: string;
}

export default function OpenAntsLogo({ size = 32, color = '#FFFFFF' }: OpenAntsLogoProps) {
  const dotSize = size * 0.08;
  const spacing = size * 0.12;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Left circle pattern */}
      <View style={[styles.circle, { 
        left: size * 0.1, 
        top: size * 0.2, 
        width: size * 0.35, 
        height: size * 0.35 
      }]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const radius = size * 0.15;
          const x = radius + radius * Math.cos(angle);
          const y = radius + radius * Math.sin(angle);
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: color,
                  left: x - dotSize / 2,
                  top: y - dotSize / 2,
                }
              ]}
            />
          );
        })}
      </View>

      {/* Right circle pattern */}
      <View style={[styles.circle, { 
        right: size * 0.1, 
        top: size * 0.2, 
        width: size * 0.35, 
        height: size * 0.35 
      }]}>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5) * Math.PI / 180;
          const radius = size * 0.15;
          const x = radius + radius * Math.cos(angle);
          const y = radius + radius * Math.sin(angle);
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotSize * 0.8,
                  height: dotSize * 0.8,
                  backgroundColor: color,
                  left: x - (dotSize * 0.8) / 2,
                  top: y - (dotSize * 0.8) / 2,
                }
              ]}
            />
          );
        })}
      </View>

      {/* Bottom connecting dots */}
      <View style={[styles.connectingDots, { bottom: size * 0.15 }]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                backgroundColor: color,
                left: size * 0.2 + (i * spacing),
                top: 0,
              }
            ]}
          />
        ))}
      </View>

      {/* Additional scattered dots for network effect */}
      {[
        { x: 0.15, y: 0.4 },
        { x: 0.25, y: 0.6 },
        { x: 0.4, y: 0.1 },
        { x: 0.6, y: 0.1 },
        { x: 0.75, y: 0.6 },
        { x: 0.85, y: 0.4 },
        { x: 0.5, y: 0.8 },
      ].map((pos, i) => (
        <View
          key={`scatter-${i}`}
          style={[
            styles.dot,
            {
              width: dotSize * 0.9,
              height: dotSize * 0.9,
              backgroundColor: color,
              left: size * pos.x,
              top: size * pos.y,
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  connectingDots: {
    position: 'absolute',
    width: '100%',
  },
  dot: {
    position: 'absolute',
    borderRadius: 50,
  },
});