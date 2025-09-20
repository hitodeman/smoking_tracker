import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import HomeIcon from './HomeIcon';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'chart', label: 'グラフ', icon: '📈' },
  { id: 'settings', label: '設定', icon: '⚙️' },
];

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={styles.tabButton}
          >
            <Text style={[styles.icon, isActive && styles.active]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.active]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
    color: '#888',
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  active: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});