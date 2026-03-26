import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const Ring = React.memo(function Ring({ eaten, goal }) {
    const r = 52, circ = 2 * Math.PI * r;
    const ratio = goal > 0 ? eaten / goal : 0;
    const dash = Math.min(ratio, 1) * circ;
    const color = ratio >= 1 ? '#ef4444' : ratio > 0.85 ? '#f59e0b' : '#3b82f6';

    return (
        <View style={styles.container}>
            <Svg width="120" height="120" viewBox="0 0 120 120" style={styles.svg}>
                <Circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                <Circle 
                    cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                />
            </Svg>
            <View style={styles.centerText}>
                <Text style={styles.eatenText}>{Math.round(eaten)}</Text>
                <Text style={styles.goalText}>из {goal}</Text>
                <Text style={styles.unitText}>ккал</Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 120, height: 120, justifyContent: 'center', alignItems: 'center'
    },
    svg: {
        position: 'absolute',
    },
    centerText: {
        alignItems: 'center',
    },
    eatenText: {
        fontSize: 22, fontWeight: '800', lineHeight: 22, color: '#FFFFFF'
    },
    goalText: {
        fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 3
    },
    unitText: {
        fontSize: 9, fontWeight: '700', color: '#007AFF', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2
    }
});

export default Ring;
