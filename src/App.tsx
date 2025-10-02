import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from './components/BottomNavigationNew';
import HomeScreen from './components/HomeScreen';
import VisualizationScreen from './components/VisualizationScreen';
import SettingsScreen, { SettingsScreenRef } from './components/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// グローバル変数でテスト
let globalCallbackCount = 0;
let appInstance: any = null;

// グローバルコールバック関数
function globalTabChangeHandler(tab: string) {
  globalCallbackCount++;
  console.log('🌟 GLOBAL HANDLER CALLED:', tab, 'Count:', globalCallbackCount);
  
  // 直接App instanceのsetterを呼び出す
  if (appInstance && appInstance.handleDirectTabChange) {
    console.log('🎯 Calling direct tab change');
    appInstance.handleDirectTabChange(tab);
  }
  
  Alert.alert('Global Handler', `Tab: ${tab}, Count: ${globalCallbackCount}`);
  return `GLOBAL_EXECUTED_${globalCallbackCount}`;
}

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'settings'>('home');
  const [settings, setSettings] = useState(defaultSettings);
  const settingsRef = useRef<SettingsScreenRef>(null);

  // setActiveTabの監視用ラッパー
  const setActiveTabWithLog = useCallback((newTab: 'home' | 'chart' | 'settings') => {
    console.log('*** setActiveTab called ***');
    console.log('Stack trace:', new Error().stack);
    console.log('Changing tab from', activeTab, 'to', newTab);
    setActiveTab(newTab);
  }, [activeTab]);

  // 直接タブ変更を処理する関数
  const handleDirectTabChange = useCallback(async (newTab: string) => {
    console.log('🎯 handleDirectTabChange called:', newTab);
    console.log('🎯 Current activeTab:', activeTab);
    
    // 設定画面から他の画面に切り替える時のチェック
    if (activeTab === 'settings' && newTab !== 'settings') {
      console.log('🎯 Checking for unsaved changes');
      const canProceed = await settingsRef.current?.checkUnsavedChanges();
      console.log('🎯 canProceed:', canProceed);
      if (!canProceed) {
        console.log('🎯 Tab change cancelled by user');
        return; // ユーザーがキャンセルした場合は画面遷移しない
      }
    }
    
    console.log('🎯 Setting active tab to:', newTab);
    setActiveTabWithLog(newTab as 'home' | 'chart' | 'settings');
  }, [activeTab, setActiveTabWithLog]);

  // App instanceをグローバルに設定
  useEffect(() => {
    appInstance = { handleDirectTabChange };
    return () => { appInstance = null; };
  }, [handleDirectTabChange]);

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

  const handleTabChange = useCallback(async (newTab: 'home' | 'chart' | 'settings') => {
    console.log('⚠️  OLD handleTabChange called:', { activeTab, newTab });
    
    // 設定画面から他の画面に切り替える時のチェック
    if (activeTab === 'settings' && newTab !== 'settings') {
      console.log('⚠️  OLD Checking for unsaved changes');
      const canProceed = await settingsRef.current?.checkUnsavedChanges();
      console.log('⚠️  OLD canProceed:', canProceed);
      if (!canProceed) {
        console.log('⚠️  OLD Tab change cancelled by user');
        return; // ユーザーがキャンセルした場合は画面遷移しない
      }
    }
    console.log('⚠️  OLD Setting active tab to:', newTab);
    setActiveTabWithLog(newTab);
  }, [activeTab, setActiveTabWithLog]);

  const onTabChangeCallback = useCallback((tab: string) => {
    console.log('*** App: onTabChangeCallback START ***');
    console.log('App: onTabChange called with:', tab);
    console.log('App: Current activeTab:', activeTab);
    
    try {
      console.log('App: About to call handleTabChange');
      // 非同期処理を fire-and-forget で実行
      handleTabChange(tab as 'home' | 'chart' | 'settings').then(() => {
        console.log('App: handleTabChange completed successfully');
      }).catch(error => {
        console.error('Error in handleTabChange:', error);
      });
      console.log('App: handleTabChange promise created');
    } catch (error) {
      console.error('App: Synchronous error in onTabChangeCallback:', error);
    }
    
    console.log('*** App: onTabChangeCallback END ***');
  }, [handleTabChange, activeTab]);

  let ScreenComponent = null;
  if (activeTab === 'home') {
    ScreenComponent = <HomeScreen />;
  } else if (activeTab === 'chart') {
    ScreenComponent = <VisualizationScreen />;
  } else if (activeTab === 'settings') {
    ScreenComponent = <SettingsScreen ref={settingsRef} />;
  }

  console.log('App: Rendering with activeTab:', activeTab);
  console.log('App: onTabChangeCallback type:', typeof onTabChangeCallback);

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={['#f8fafc', '#dbeafe', '#e0e7ff']}
        style={styles.outerContainer}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.vertical}>
            <SafeAreaView style={styles.content}>{ScreenComponent}</SafeAreaView>
            <SafeAreaView style={styles.bottomNavArea}>
              <BottomNavigation 
                activeTab={activeTab} 
                onTabChange={globalTabChangeHandler}
              />
            </SafeAreaView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomNavArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  vertical: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
