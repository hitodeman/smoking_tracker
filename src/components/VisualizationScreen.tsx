import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartesianChart, Line, Scatter } from 'victory-native';

const settings = {
  targetCount: 10,
  averageCountBefore: 20,
};

export default function VisualizationScreen() {
  const [records, setRecords] = useState<{ date: string; count: number }[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    (async () => {
      const recordsStr = await AsyncStorage.getItem('smokingRecords');
      setRecords(recordsStr ? JSON.parse(recordsStr) : []);
    })();
  }, []);

  const getChartData = () => {
    const now = new Date();
    const data = [];
    const days = viewMode === 'week' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const record = records.find(r => r.date === dateString);
      data.push({
        date: dateString,
        displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
        count: record?.count || 0,
        target: settings.targetCount,
      });
    }
    return data;
  };

  const chartData = getChartData();
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);
  const averageCount = totalCount / chartData.length;
  const targetAchievementDays = chartData.filter(item => item.count <= settings.targetCount).length;
  const achievementRate = (targetAchievementDays / chartData.length) * 100;

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView contentContainerStyle={[styles.root, { paddingBottom: 80 }] }>
      <Text style={styles.header}>喫煙データ</Text>

      {/* 期間選択 */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.switchButton, viewMode === 'week' && styles.switchButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={viewMode === 'week' ? styles.switchButtonTextActive : styles.switchButtonText}>週間表示</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, viewMode === 'month' && styles.switchButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={viewMode === 'month' ? styles.switchButtonTextActive : styles.switchButtonText}>月間表示</Text>
        </TouchableOpacity>
      </View>

      {/* 統計サマリー */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>合計</Text>
          <Text style={styles.summaryValue}>{totalCount}本</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>平均</Text>
          <Text style={styles.summaryValue}>{averageCount.toFixed(1)}本</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>達成率</Text>
          <Text style={[styles.summaryValue, { color: '#43a047' }]}>{achievementRate.toFixed(0)}%</Text>
        </View>
      </View>

      {/* 折れ線グラフ */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>日別喫煙本数</Text>
        <View style={{ width: screenWidth - 32, height: 260 }}>
          <CartesianChart
            data={chartData}
            xKey="displayDate"
            yKeys={["count", "target"]}
            padding={{ left: 40, right: 16, top: 24, bottom: 40 }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.count}
                  color="#1976d2"
                  strokeWidth={3}
                />
                <Line
                  points={points.target}
                  color="#888"
                  strokeWidth={2}
                />
                <Scatter
                  points={points.count}
                  color="#1976d2"
                  radius={5}
                />
              </>
            )}
          </CartesianChart>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} /><Text style={styles.legendLabel}>0本の日</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legendLabel}>目標超過日</Text></View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#1976d2',
  },
  switchButtonText: {
    color: '#555',
    fontWeight: 'bold',
  },
  switchButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: '#555',
  },
});