import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
  averageCountBefore: 20,
};

export default function VisualizationScreen() {
  const [records, setRecords] = useState<{ date: string; count: number }[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [settings, setSettings] = useState(defaultSettings);
  const [appStartDate, setAppStartDate] = useState<string>('');

  useEffect(() => {
    (async () => {
      const recordsStr = await AsyncStorage.getItem('smokingRecords');
      setRecords(recordsStr ? JSON.parse(recordsStr) : []);
      
      // 設定も読み込む
      const settingsStr = await AsyncStorage.getItem('smokingSettings');
      if (settingsStr) {
        setSettings(JSON.parse(settingsStr));
      }

      // アプリ開始日を取得または設定
      let startDate = await AsyncStorage.getItem('appStartDate');
      if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem('appStartDate', startDate);
      }
      setAppStartDate(startDate);
    })();
  }, []);

  const getChartData = () => {
    const now = new Date();
    const data = [];
    const days = viewMode === 'week' ? 7 : 30;
    
    // 前に1日分のダミーデータを追加
    const beforeDate = new Date(now);
    beforeDate.setDate(beforeDate.getDate() - days);
    data.push({
      date: beforeDate.toISOString().split('T')[0],
      displayDate: '',
      count: null,
      target: settings.targetCount,
    });
    
    // 実際のデータ
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
    
    // 後に1日分のダミーデータを追加
    const afterDate = new Date(now);
    afterDate.setDate(afterDate.getDate() + 1);
    data.push({
      date: afterDate.toISOString().split('T')[0],
      displayDate: '',
      count: null,
      target: settings.targetCount,
    });
    
    return data;
  };

  const chartData = getChartData();
  const totalCount = chartData.reduce((sum, item) => sum + (item.count || 0), 0);
  const validDataCount = chartData.filter(item => item.count !== null).length;
  const averageCount = validDataCount > 0 ? totalCount / validDataCount : 0;
  const targetAchievementDays = chartData.filter(item => item.count !== null && item.count <= settings.targetCount).length;
  const achievementRate = validDataCount > 0 ? (targetAchievementDays / validDataCount) * 100 : 0;

  // Y軸の最大値を計算（データの最大値 + 1、最低でも目標値 + 1）
  const maxDataValue = Math.max(...chartData.filter(item => item.count !== null).map(item => item.count || 0));
  const yAxisMax = Math.max(maxDataValue + 1, settings.targetCount + 1);

  // アプリ開始日からの累積統計
  const getTotalStatistics = () => {
    if (!appStartDate) return { totalDays: 0, totalSmokingCount: 0, overallAverage: 0 };
    
    const today = new Date();
    const startDate = new Date(appStartDate);
    const totalDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalSmokingCount = records.reduce((sum, r) => sum + r.count, 0);
    const overallAverage = totalDays > 0 ? totalSmokingCount / totalDays : 0;
    
    return { totalDays, totalSmokingCount, overallAverage };
  };

  const { totalDays, totalSmokingCount, overallAverage } = getTotalStatistics();
  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.root, { paddingBottom: 30 }] }>
        <View style={styles.headerRow}>
          <Ionicons name="calendar" size={24} color="#001EFF93" />
          <Text style={styles.header}>喫煙データ</Text>
        </View>

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
            padding={{ left: 20, right: 30, top: 24, bottom: 30 }}
            domain={{ y: [-1, yAxisMax] }}
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
                  color="#30F24AC4"
                  strokeWidth={2}
                />
                {points.count.map((point, index) => {
                  // null値（ダミーデータ）の場合はポイントを描画しない
                  if (chartData[index]?.count === null) return null;
                  
                  return (
                    <Scatter
                      key={index}
                      points={[point]}
                      color={chartData[index]?.count >= settings.targetCount ? "#dc2626" : "#1976d2"}
                      radius={viewMode === 'month' ? 3 : 5}
                    />
                  );
                })}
              </>
            )}
          </CartesianChart>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1976d2' }]} /><Text style={styles.legendLabel}>喫煙本数</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: '#30F24AC4' }]} /><Text style={styles.legendLabel}>目標ライン（{settings.targetCount}本）</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legendLabel}>目標超過日</Text></View>
        </View>
      </View>

      {/* 累計情報 */}
      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>📊 累計情報</Text>
        <View style={styles.totalRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>総喫煙本数</Text>
            <Text style={styles.totalValue}>{totalSmokingCount}本</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>アプリ利用日数</Text>
            <Text style={styles.totalValue}>{totalDays}日</Text>
          </View>
        </View>
        <View style={styles.totalRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>全期間平均</Text>
            <Text style={styles.totalValue}>
              {overallAverage.toFixed(1)}本/日
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>累計費用</Text>
            <Text style={[styles.totalValue, { color: '#f44336' }]}>
              ¥{(totalSmokingCount * (settings.pricePerPack / settings.cigarettesPerPack)).toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  root: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
    backgroundColor: '#000000',
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
    marginBottom: 12,
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
    padding: 14,
    marginBottom: 12,
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
  legendLine: {
    width: 16,
    height: 2,
    marginRight: 4,
    alignSelf: 'center',
  },
  legendLabel: {
    fontSize: 12,
    color: '#555',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
});