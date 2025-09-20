import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const settings = {
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
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    (async () => {
      const recordsStr = await AsyncStorage.getItem('smokingRecords');
      const records = recordsStr ? JSON.parse(recordsStr) : [];
      const todayRecord = records.find((r: any) => r.date === today);
      setTodayCount(todayRecord?.count || 0);

      // 今月の浮いた金額
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthRecords = records.filter((r: any) => r.date.startsWith(currentMonth));
      const monthTotal = monthRecords.reduce((sum: number, r: any) => sum + r.count, 0);
      setMonthTotalCount(monthTotal);
      const dayOfMonth = new Date().getDate();
      const expectedMonthCount = settings.averageCountBefore * dayOfMonth;
      setMonthCountDifference(expectedMonthCount - monthTotal);
      setMonthCostDifference((expectedMonthCount - monthTotal) * (settings.pricePerPack / settings.cigarettesPerPack));
    })();
  }, [today, todayCount]);

  const updateCount = async (newCount: number) => {
    if (newCount < 0) return;
    setTodayCount(newCount);
    const recordsStr = await AsyncStorage.getItem('smokingRecords');
    const records = recordsStr ? JSON.parse(recordsStr) : [];
    const existingIndex = records.findIndex((r: any) => r.date === today);
    if (existingIndex >= 0) {
      records[existingIndex].count = newCount;
    } else {
      records.push({ date: today, count: newCount });
    }
    await AsyncStorage.setItem('smokingRecords', JSON.stringify(records));
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
        <Text style={styles.title}>今日の喫煙本数</Text>
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
        <Text style={styles.sectionTitle}>目標との差分</Text>
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
            今日は目標を達成しています！この調子で続けましょう 🎉
          </Text>
        ) : (
          <Text style={{ color: '#7b1fa2' }}>
            目標まであと{Math.abs(targetDifference)}本です。頑張りましょう 💪
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
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