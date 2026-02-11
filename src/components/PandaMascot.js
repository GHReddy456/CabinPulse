import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const BASE_SIZE = 14;
const em = (val) => val * BASE_SIZE;
const rem = (val) => val * 16;

const PANDA_THEME = {
    white: '#FFFFFF',
    dark: '#000000',
    outline: '#000000',
    blush: '#ff8bb1',
};

// --- FACE COMPONENT ---
export const PandaMascot = ({
    isTypingUsername = false,
    isTypingPassword = false
}) => {
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const eyeballPos = useRef(new Animated.Value(0)).current;
    const interactionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const blink = () => {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start();
        };
        const interval = setInterval(() => { if (!isTypingPassword) blink(); }, 7000);
        return () => clearInterval(interval);
    }, [isTypingPassword]);

    useEffect(() => {
        Animated.timing(eyeballPos, {
            toValue: isTypingUsername ? 1 : 0,
            duration: 350,
            useNativeDriver: true,
        }).start();
    }, [isTypingUsername]);

    useEffect(() => {
        Animated.timing(interactionAnim, {
            toValue: isTypingPassword ? 1 : 0,
            duration: 350,
            useNativeDriver: false,
        }).start();
    }, [isTypingPassword]);

    const eyeY = eyeballPos.interpolate({
        inputRange: [0, 1],
        outputRange: [0, em(0.35)],
    });

    const mouthSize = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [em(1.6), em(0.85)],
    });

    const mouthHeight = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [em(0.6), em(0.85)],
    });

    const mouthBorderWidth = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, em(0.18)],
    });

    return (
        <View style={styles.faceContainer}>
            <View style={styles.face}>
                <View style={[styles.ear, styles.earL]} />
                <View style={[styles.ear, styles.earR]} />
                <View style={[styles.blush, styles.blushL]} />
                <View style={[styles.blush, styles.blushR]} />

                <Animated.View style={[styles.eye, styles.eyeL, { transform: [{ scaleY: blinkAnim }] }]}>
                    <Animated.View style={[styles.eyeball, { transform: [{ translateY: eyeY }] }]} />
                </Animated.View>
                <Animated.View style={[styles.eye, styles.eyeR, { transform: [{ scaleY: blinkAnim }] }]}>
                    <Animated.View style={[styles.eyeball, { transform: [{ translateY: eyeY }] }]} />
                </Animated.View>

                <View style={styles.nose} />

                <View style={styles.mouthContainer}>
                    <Animated.View style={[
                        styles.mouth,
                        {
                            width: mouthSize,
                            height: mouthHeight,
                            borderRadius: em(1),
                            borderWidth: mouthBorderWidth,
                            borderBottomWidth: em(0.2),
                        }
                    ]} />
                </View>
            </View>
        </View>
    );
};

// --- HANDS COMPONENT ---
export const PandaHands = ({ isTypingPassword = false }) => {
    const interactionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(interactionAnim, {
            toValue: isTypingPassword ? 1 : 0,
            duration: 350,
            useNativeDriver: false,
        }).start();
    }, [isTypingPassword]);

    const handHeight = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [em(2.4), em(6.6)],
    });

    const handTop = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [em(-0.6), em(-0.8)],
    });

    const handHorizontal = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [rem(3.2), em(5.0)],
    });

    const handL_Rotate = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-135deg'],
    });

    const handR_Rotate = interactionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '135deg'],
    });

    return (
        <>
            <Animated.View style={[
                styles.hand,
                {
                    height: handHeight,
                    top: handTop,
                    left: handHorizontal,
                    transform: [{ rotate: handL_Rotate }]
                }
            ]} />
            <Animated.View style={[
                styles.hand,
                {
                    height: handHeight,
                    top: handTop,
                    right: handHorizontal,
                    transform: [{ rotate: handR_Rotate }]
                }
            ]} />
        </>
    );
};

// --- PAWS COMPONENT ---
export const PandaPaws = () => (
    <View style={styles.pawsWrapper}>
        <View style={styles.paw}>
            <View style={styles.pawPad} />
        </View>
        <View style={styles.paw}>
            <View style={styles.pawPad} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    faceContainer: {
        width: '100%',
        alignItems: 'center',
        zIndex: 4,
        position: 'absolute',
        top: 0,
        // Nudged head up just a bit more for perfect peek effect
        transform: [{ translateY: -em(3.1) }],
    },
    face: {
        width: em(7.4),
        height: em(6.6),
        backgroundColor: PANDA_THEME.white,
        borderWidth: em(0.18),
        borderColor: PANDA_THEME.outline,
        borderRadius: em(5.2),
        borderTopLeftRadius: em(7),
        borderTopRightRadius: em(7),
    },
    ear: {
        position: 'absolute',
        top: em(-0.55),
        backgroundColor: PANDA_THEME.dark,
        height: em(2.2),
        width: em(2.4),
        borderWidth: em(0.18),
        borderColor: PANDA_THEME.outline,
        borderRadius: em(2.6),
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    earL: { left: em(-0.6), transform: [{ rotate: '-32deg' }] },
    earR: { right: em(-0.6), transform: [{ rotate: '32deg' }] },
    eye: {
        position: 'absolute',
        top: em(1.9),
        backgroundColor: PANDA_THEME.dark,
        height: em(1.9),
        width: em(1.75),
        borderRadius: em(1),
    },
    eyeL: { left: em(1.25) },
    eyeR: { right: em(1.25) },
    eyeball: {
        position: 'absolute',
        height: em(0.55),
        width: em(0.55),
        backgroundColor: PANDA_THEME.white,
        borderRadius: em(0.3),
        top: em(0.55),
        left: em(0.55),
    },
    blush: {
        position: 'absolute',
        top: em(3.4),
        backgroundColor: PANDA_THEME.blush,
        height: em(0.8),
        width: em(1.1),
        borderRadius: em(0.5),
    },
    blushL: { left: em(0.9) },
    blushR: { right: em(0.9) },
    nose: {
        position: 'absolute',
        top: em(3.9),
        left: '50%',
        marginLeft: -em(0.425),
        height: em(0.85),
        width: em(0.85),
        backgroundColor: PANDA_THEME.dark,
        borderRadius: em(1),
        borderBottomLeftRadius: em(0.25),
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
        transform: [{ rotate: '45deg' }],
    },
    mouthContainer: {
        position: 'absolute',
        top: em(4.7),
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    mouth: {
        borderColor: PANDA_THEME.dark,
        borderBottomColor: PANDA_THEME.dark,
    },
    hand: {
        position: 'absolute',
        backgroundColor: PANDA_THEME.dark,
        width: em(2.3),
        borderWidth: em(0.18),
        borderColor: PANDA_THEME.outline,
        borderRadius: em(2.2),
        borderTopLeftRadius: em(0.7),
        borderTopRightRadius: em(0.7),
        zIndex: 6,
        transformOrigin: 'top',
    },
    pawsWrapper: {
        position: 'absolute',
        bottom: -rem(0.95),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: rem(3.2),
        zIndex: 5,
    },
    paw: {
        backgroundColor: PANDA_THEME.dark,
        height: em(2.5),
        width: em(2.5),
        borderWidth: em(0.18),
        borderColor: PANDA_THEME.outline,
        borderRadius: em(1.1),
        borderTopLeftRadius: em(2.3),
        borderTopRightRadius: em(2.3),
        alignItems: 'center',
    },
    pawPad: {
        backgroundColor: PANDA_THEME.white,
        height: em(0.95),
        width: em(1.25),
        borderRadius: em(1),
        marginTop: em(0.8),
    }
});
