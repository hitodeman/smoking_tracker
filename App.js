

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from './src/components/BottomNavigationNew';
import HomeScreen from './src/components/HomeScreen';
import VisualizationScreen from './src/components/VisualizationScreen';
import SettingsScreen from './src/components/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [settings, setSettings] = useState(defaultSettings);
  const settingsRef = useRef(null);

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

  // タブ変更ハンドラー
  const handleTabChange = async (newTab) => {
    // 設定画面から他の画面に切り替える時のチェック
    if (activeTab === 'settings' && newTab !== 'settings') {
      if (settingsRef.current && settingsRef.current.checkUnsavedChanges) {
        const canProceed = await settingsRef.current.checkUnsavedChanges();
        if (!canProceed) {
          return; // ユーザーがキャンセルした場合は画面遷移しない
        }
      }
    }
    
    setActiveTab(newTab);
  };

  let ScreenComponent = null;
  if (activeTab === 'home') {
    ScreenComponent = <HomeScreen />;
  } else if (activeTab === 'chart') {
    ScreenComponent = <VisualizationScreen />;
  } else if (activeTab === 'settings') {
    ScreenComponent = <SettingsScreen ref={settingsRef} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.vertical}>
        <View style={styles.content}>{ScreenComponent}</View>
        <SafeAreaView style={styles.bottomNavArea}>
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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
  vertical: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
  bottomNavArea: {
    backgroundColor: '#fff',
  },
});
