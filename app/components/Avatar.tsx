import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface AvatarProps {
  seed: string;
  size?: number;
  backgroundColor?: string;
}

export function Avatar({ seed, size = 40, backgroundColor }: AvatarProps) {
  const avatarSvg = useMemo(() => {
    try {
      return createAvatar(avataaars, {
        seed: seed || 'default',
      }).toString();
    } catch (error) {
      console.error('Avatar generation error:', error);
      return '';
    }
  }, [seed]);

  if (!avatarSvg) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: backgroundColor || '#f0f0f0',
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || '#f0f0f0',
        },
      ]}
    >
      <SvgXml xml={avatarSvg} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
