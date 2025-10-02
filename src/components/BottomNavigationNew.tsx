import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'ホーム', iconName: 'home-outline' },
  { id: 'chart', label: '情報', iconName: 'bar-chart-outline' },
  { id: 'settings', label: '設定', iconName: 'settings-outline' },
];

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <View key={tab.id} style={styles.tabWrapper}>
            <TouchableOpacity
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
            >
              <Ionicons 
                name={tab.iconName as any} 
                size={26} 
                color={isActive ? '#1976d2' : '#888'} 
              />
              <Text style={[styles.label, isActive && styles.active]}>{tab.label}</Text>
            </TouchableOpacity>
            {/* 最後のタブ以外に区切り線を追加 */}
            {index < tabs.length - 1 && <View style={styles.separator} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'transparent',
  },
  tabWrapper: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -20,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  active: {
    color: '#1976d2',
  },
});