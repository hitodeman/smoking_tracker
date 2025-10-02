import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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

  useEffect(() => {
    (async () => {
      const recordsStr = await AsyncStorage.getItem('smokingRecords');
      const records = recordsStr ? JSON.parse(recordsStr) : [];
      const todayRecord = records.find((r: any) => r.date === today);
      const initialCount = todayRecord?.count || 0;
      
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
    })();
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

    // 月間統計を即座に更新
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthRecords = records.filter((r: any) => r.date.startsWith(currentMonth));
    const monthTotal = monthRecords.reduce((sum: number, r: any) => sum + r.count, 0);
    setMonthTotalCount(monthTotal);

    // 今月のアプリ利用日数を再計算
    const appStartDate = await AsyncStorage.getItem('appStartDate') || today;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const appStart = new Date(appStartDate);
    
    // 今月の開始日は、月初かアプリ開始日のいずれか遅い方
    const monthStartForCalculation = appStart > startOfMonth ? appStart : startOfMonth;
    const daysInMonth = Math.floor((currentDate.getTime() - monthStartForCalculation.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const expectedMonthCount = settings.averageCountBefore * daysInMonth;
    const newMonthCountDifference = expectedMonthCount - monthTotal;
    const newMonthCostDifference = newMonthCountDifference * (settings.pricePerPack / settings.cigarettesPerPack);
    
    setMonthCountDifference(newMonthCountDifference);
    setMonthCostDifference(newMonthCostDifference);
  };

  const costPerCigarette = settings.pricePerPack / settings.cigarettesPerPack;
  const todayCost = todayCount * costPerCigarette;
  const targetDifference = todayCount - settings.targetCount;
  const todayCountDifference = settings.averageCountBefore - todayCount;
  const todayCostDifference = todayCountDifference * costPerCigarette;

  return (
    <LinearGradient
      colors={['#f8fafc', '#dbeafe', '#e0e7ff']}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.content}>
          {/* Main Counter Card */}
          <BlurView intensity={20} style={styles.mainCard}>
            <LinearGradient
              colors={['rgba(251, 146, 60, 0.1)', 'rgba(239, 68, 68, 0.1)']}
              style={styles.cardGradient}
            />
            <View style={styles.cardContent}>
              <View style={styles.titleContainer}>
                <LinearGradient
                  colors={['#fb923c', '#ef4444']}
                  style={styles.iconContainer}
                >
                  <MaterialCommunityIcons name="cigar" size={20} color="white" />
                </LinearGradient>
                <Text style={styles.cardTitle}>今日の喫煙本数</Text>
              </View>
              
              <Text style={styles.counterText}>{todayCount}</Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.minusButton}
                  onPress={() => updateCount(todayCount - 1)}
                  disabled={todayCount === 0}
                >
                  <Ionicons name="remove" size={24} color="#6b7280" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.plusButton}
                  onPress={() => updateCount(todayCount + 1)}
                >
                  <LinearGradient
                    colors={['#fb923c', '#ef4444']}
                    style={styles.plusButtonGradient}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {/* Cost and Target Card */}
            <View style={styles.statCard}>
              <View style={styles.dualStatContent}>
                {/* Cost Section */}
                <View style={styles.statSection}>
                  <Text style={styles.statLabel}>今日の費用</Text>
                  <Text style={styles.statValue}>¥{Math.round(todayCost).toLocaleString('ja-JP')}</Text>
                </View>
                
                {/* Divider */}
                <View style={styles.divider} />
                
                {/* Target Section */}
                <View style={styles.statSection}>
                  <View style={styles.statHeader}>
                    <Ionicons name="flag" size={16} color="#ef4444" />
                    <Text style={styles.statLabel}>目標との差</Text>
                  </View>
                  <Text style={[styles.targetValue, targetDifference <= 0 ? { color: '#059669' } : { color: '#ef4444' }]}>
                    {targetDifference > 0 ? '+' : ''}{targetDifference}本
                  </Text>
                  {targetDifference <= 0 && (
                    <Text style={styles.achievementText}>目標達成！</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Savings Card */}
            <View style={styles.savingsCardWrapper}>
              <View style={styles.dualSavingsContent}>
                {/* Today's Savings Section */}
                <LinearGradient
                  colors={['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.1)']}
                  style={styles.savingsBackground}
                >
                  <View style={styles.statHeader}>
                    <Ionicons name="trending-up" size={16} color="#059669" />
                    <Text style={[styles.statLabel, styles.greenText]}>今日の浮いた金額</Text>
                  </View>
                  <Text style={styles.savingsValue}>
                    {todayCostDifference >= 0 ? '+' : ''}¥{Math.round(Math.abs(todayCostDifference)).toLocaleString('ja-JP')}
                  </Text>
                </LinearGradient>
                
                {/* Divider */}
                <View style={styles.divider} />
                
                {/* Monthly Savings Section */}
                <LinearGradient
                  colors={['rgba(147, 51, 234, 0.1)', 'rgba(124, 58, 237, 0.1)']}
                  style={styles.savingsBackground}
                >
                  <Text style={[styles.statLabel, styles.purpleText]}>今月の浮いた金額</Text>
                  <Text style={styles.purpleSavingsValue}>
                    {monthCostDifference >= 0 ? '+' : ''}¥{Math.round(Math.abs(monthCostDifference)).toLocaleString('ja-JP')}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Motivational Message */}
            <LinearGradient
              colors={targetDifference <= 0 
                ? ['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.1)']
                : ['rgba(59, 130, 246, 0.1)', 'rgba(99, 102, 241, 0.1)']
              }
              style={[styles.statCard, styles.messageCard]}
            >
              <View style={styles.messageContent}>
                <Ionicons 
                  name={targetDifference <= 0 ? "checkmark-circle" : "alert-circle"} 
                  size={20} 
                  color={targetDifference <= 0 ? "#059669" : "#3b82f6"} 
                />
                <Text style={[styles.messageText, { color: targetDifference <= 0 ? "#047857" : "#1d4ed8" }]}>
                  {targetDifference <= 0 ? (
                    "目標を達成しています！この調子で続けましょう 🎉"
                  ) : (
                    `目標から${Math.abs(targetDifference)}本超過しています。今日はなるべく控えめにしましょう。`
                  )}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  content: {
    gap: 24,
  },
  mainCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
  counterText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  minusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  plusButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    gap: 16,
  },
  statCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dualStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  statSection: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 0,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  targetValue: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    textAlign: 'center',
  },
  savingsCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dualSavingsContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 80,
  },
  savingsBackground: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenText: {
    color: '#047857',
  },
  savingsValue: {
    fontSize: 20,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  purpleText: {
    color: '#7c3aed',
  },
  purpleSavingsValue: {
    fontSize: 20,
    color: '#8b5cf6',
    fontWeight: '600',
    textAlign: 'center',
  },
  messageCard: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  messageContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});