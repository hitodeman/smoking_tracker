import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import BottomNavigation from './components/BottomNavigation';
import HomeScreen from './components/HomeScreen';
import VisualizationScreen from './components/VisualizationScreen';
import SettingsScreen from './components/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'settings'>('home');
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('smokingSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      } else {
        await AsyncStorage.setItem('smokingSettings', JSON.stringify(defaultSettings));
      }
    })();
  }, []);

  const handleSettingsChange = async (newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('smokingSettings', JSON.stringify(newSettings));
  };

  let ScreenComponent = null;
  if (activeTab === 'home') {
    ScreenComponent = <HomeScreen />;
  } else if (activeTab === 'chart') {
    ScreenComponent = <VisualizationScreen />;
  } else if (activeTab === 'settings') {
    ScreenComponent = <SettingsScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.vertical}>
        <View style={styles.content}>{ScreenComponent}</View>
        <SafeAreaView style={styles.bottomNavArea}>
          <BottomNavigation activeTab={activeTab} onTabChange={tab => setActiveTab(tab as 'home' | 'chart' | 'settings')} />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  bottomNavArea: {
    backgroundColor: '#fff',
  },
  vertical: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
});
