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
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={styles.tabButton}
          >
            <Ionicons 
              name={tab.iconName as any} 
              size={24} 
              color={isActive ? '#1976d2' : '#888'} 
            />
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
    alignItems: 'center',
    paddingVertical: 8,
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