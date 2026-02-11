import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../constants/Theme';

export const GlassCard = ({ children, style }) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                <View style={styles.inner}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: Theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    blur: {
        padding: 1,
    },
    inner: {
        padding: Theme.spacing.md,
    },
});
