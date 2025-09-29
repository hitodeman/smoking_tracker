import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import WidgetDataManager from '../services/WidgetDataManager';

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
  averageCountBefore: 20,
};

export default function HomeScreen() {
  const [todayCount, setTodayCount] = useState(0);
  const [monthTotalCount, setMonthTotalCount] = useState(0);
  const [monthCountDifference, setMonthCountDifference] = useState(0);
  const [monthCostDifference, setMonthCostDifference] = useState(0);
  const [settings, setSettings] = useState(defaultSettings);
  const today = new Date().toISOString().split('T')[0];

  // Widget同期処理
  const syncWithWidget = async () => {
    try {
      const recordsStr = await AsyncStorage.getItem('smokingRecords');
      const records = recordsStr ? JSON.parse(recordsStr) : [];
      const todayRecord = records.find((r: any) => r.date === today);
      let currentCount = todayRecord?.count || 0;
      
      const widgetCount = await WidgetDataManager.getTodayCount();
      if (widgetCount > currentCount) {
        // Widgetの方が新しい場合
        const existingIndex = records.findIndex((r: any) => r.date === today);
        if (existingIndex >= 0) {
          records[existingIndex].count = widgetCount;
        } else {
          records.push({ date: today, count: widgetCount });
        }
        await AsyncStorage.setItem('smokingRecords', JSON.stringify(records));
        setTodayCount(widgetCount);
        console.log('Widget→App同期:', widgetCount);
        return widgetCount;
      } else if (currentCount > widgetCount) {
        // アプリの方が新しい場合
        await WidgetDataManager.setTodayCount(currentCount);
        console.log('App→Widget同期:', currentCount);
      }
      return currentCount;
    } catch (error) {
      console.warn('Widget同期エラー:', error);
      return todayCount;
    }
  };

  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    
    (async () => {
      const recordsStr = await AsyncStorage.getItem('smokingRecords');
      const records = recordsStr ? JSON.parse(recordsStr) : [];
      const todayRecord = records.find((r: any) => r.date === today);
      let initialCount = todayRecord?.count || 0;
      
      // 初期同期
      initialCount = await syncWithWidget();
      setTodayCount(initialCount);

      // 設定を読み込む
      const settingsStr = await AsyncStorage.getItem('smokingSettings');
      let currentSettings = defaultSettings;
      if (settingsStr) {
        const savedSettings = JSON.parse(settingsStr);
        // 保存された設定値が有効かチェック
        currentSettings = {
          pricePerPack: isNaN(savedSettings.pricePerPack) || savedSettings.pricePerPack <= 0 ? defaultSettings.pricePerPack : savedSettings.pricePerPack,
          targetCount: isNaN(savedSettings.targetCount) || savedSettings.targetCount < 0 ? defaultSettings.targetCount : savedSettings.targetCount,
          cigarettesPerPack: isNaN(savedSettings.cigarettesPerPack) || savedSettings.cigarettesPerPack <= 0 ? defaultSettings.cigarettesPerPack : savedSettings.cigarettesPerPack,
          averageCountBefore: isNaN(savedSettings.averageCountBefore) || savedSettings.averageCountBefore < 0 ? defaultSettings.averageCountBefore : savedSettings.averageCountBefore,
        };
      }
      setSettings(currentSettings);

      // アプリ開始日を取得
      let appStartDate = await AsyncStorage.getItem('appStartDate');
      if (!appStartDate) {
        appStartDate = today;
        await AsyncStorage.setItem('appStartDate', appStartDate);
      }

      // 今月の浮いた金額（アプリ利用開始日を加味）
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthRecords = records.filter((r: any) => r.date.startsWith(currentMonth));
      const monthTotal = monthRecords.reduce((sum: number, r: any) => sum + r.count, 0);
      setMonthTotalCount(monthTotal);
      
      // 今月のアプリ利用日数を計算
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const appStart = new Date(appStartDate);
      
      // 今月の開始日は、月初かアプリ開始日のいずれか遅い方
      const monthStartForCalculation = appStart > startOfMonth ? appStart : startOfMonth;
      const daysInMonth = Math.floor((currentDate.getTime() - monthStartForCalculation.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const expectedMonthCount = currentSettings.averageCountBefore * daysInMonth;
      setMonthCountDifference(expectedMonthCount - monthTotal);
      setMonthCostDifference((expectedMonthCount - monthTotal) * (currentSettings.pricePerPack / currentSettings.cigarettesPerPack));
      
      // 定期的な同期を開始（30秒ごと）
      syncInterval = setInterval(syncWithWidget, 30000);
    })();

    // アプリがフォアグラウンドに戻った時の同期
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        syncWithWidget();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [today]);

  const updateCount = async (newCount: number) => {
    if (newCount < 0) return;
    setTodayCount(newCount);
    
    // AsyncStorageに保存
    const recordsStr = await AsyncStorage.getItem('smokingRecords');
    const records = recordsStr ? JSON.parse(recordsStr) : [];
    const existingIndex = records.findIndex((r: any) => r.date === today);
    if (existingIndex >= 0) {
      records[existingIndex].count = newCount;
    } else {
      records.push({ date: today, count: newCount });
    }
    await AsyncStorage.setItem('smokingRecords', JSON.stringify(records));
    
    // Widgetと同期
    try {
      await WidgetDataManager.setTodayCount(newCount);
      console.log('Widget同期成功:', newCount);
    } catch (error) {
      console.warn('Widget同期失敗:', error);
    }
  };

  const costPerCigarette = settings.pricePerPack / settings.cigarettesPerPack;
  const todayCost = todayCount * costPerCigarette;
  const targetDifference = todayCount - settings.targetCount;
  const todayCountDifference = settings.averageCountBefore - todayCount;
  const todayCostDifference = todayCountDifference * costPerCigarette;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.root, { paddingBottom: 80 }] }>
        <View style={styles.card}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="cigar" size={24} color="orange" />
          <Text style={styles.title}>今日の喫煙本数</Text>
        </View>
        <Text style={styles.count}>{todayCount}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: '#eee' }]}
            onPress={() => updateCount(todayCount - 1)}
            disabled={todayCount === 0}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: '#ff9800' }]}
            onPress={() => updateCount(todayCount + 1)}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 統計情報 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>今日の費用</Text>
        <Text style={styles.value}>¥{todayCost.toFixed(0)}</Text>
        <Text style={styles.sectionTitle}>目標との差</Text>
        <Text style={[styles.value, targetDifference <= 0 ? { color: '#2196f3' } : { color: '#f44336' }]}>
          {targetDifference > 0 ? '+' : ''}{targetDifference}本
        </Text>
        {targetDifference <= 0 && (
          <Text style={{ color: '#4caf50' }}>目標達成！</Text>
        )}
      </View>

      {/* 浮いた金額 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>今日の浮いた金額</Text>
        <Text style={[styles.value, todayCostDifference >= 0 ? { color: '#43a047' } : { color: '#f44336' }]}>
          {todayCostDifference >= 0 ? '+' : ''}¥{todayCostDifference.toFixed(0)}
        </Text>
        <Text style={styles.sectionTitle}>今月の浮いた金額</Text>
        <Text style={[styles.value, monthCostDifference >= 0 ? { color: '#7b1fa2' } : { color: '#f44336' }]}>
          {monthCostDifference >= 0 ? '+' : ''}¥{monthCostDifference.toFixed(0)}
        </Text>
      </View>

      {/* 今日のメッセージ */}
      <View style={[styles.card, { backgroundColor: '#e3f2fd' }] }>
        {targetDifference <= 0 ? (
          <Text style={{ color: '#1976d2' }}>
            目標を達成しています！この調子で続けましょう 🎉
          </Text>
        ) : (
          <Text style={{ color: '#7b1fa2' }}>
            目標から{Math.abs(targetDifference)}本超過しています。今日はなるべく控えめにしましょう。
          </Text>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#555',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
});