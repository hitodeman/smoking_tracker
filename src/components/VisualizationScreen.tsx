import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    
    if (viewMode === 'week') {
      // 週間表示：月曜日〜日曜日で固定
      const currentDayOfWeek = now.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
      const mondayOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // 月曜日までの日数
      
      // 今週の月曜日を基準にする
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() - mondayOffset);
      
      // 前に1日分のダミーデータを追加
      const beforeDate = new Date(mondayDate);
      beforeDate.setDate(mondayDate.getDate() - 1);
      data.push({
        date: beforeDate.toISOString().split('T')[0],
        displayDate: '',
        count: null,
        target: settings.targetCount,
      });
      
      // 月曜日から日曜日まで（7日間）
      for (let i = 0; i < 7; i++) {
        const date = new Date(mondayDate);
        date.setDate(mondayDate.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const record = records.find(r => r.date === dateString);
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        data.push({
          date: dateString,
          displayDate: `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`,
          count: record?.count || 0,
          target: settings.targetCount,
        });
      }
      
      // 後に1日分のダミーデータを追加
      const afterDate = new Date(mondayDate);
      afterDate.setDate(mondayDate.getDate() + 7);
      data.push({
        date: afterDate.toISOString().split('T')[0],
        displayDate: '',
        count: null,
        target: settings.targetCount,
      });
    } else {
      // 月間表示：今月1日〜月末
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // 前に1日分のダミーデータを追加
      const beforeDate = new Date(firstDayOfMonth);
      beforeDate.setDate(firstDayOfMonth.getDate() - 1);
      data.push({
        date: beforeDate.toISOString().split('T')[0],
        displayDate: '',
        count: null,
        target: settings.targetCount,
      });
      
      // 実際のデータ（1日から月末まで）
      for (let date = new Date(firstDayOfMonth); date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const record = records.find(r => r.date === dateString);
        data.push({
          date: dateString,
          displayDate: `${date.getDate()}日`,
          count: record?.count || 0,
          target: settings.targetCount,
        });
      }
      
      // 後に1日分のダミーデータを追加
      const afterDate = new Date(lastDayOfMonth);
      afterDate.setDate(lastDayOfMonth.getDate() + 1);
      data.push({
        date: afterDate.toISOString().split('T')[0],
        displayDate: '',
        count: null,
        target: settings.targetCount,
      });
    }
    
    return data;
  };

  // 日付範囲を取得する関数
  const getDateRange = () => {
    const now = new Date();
    
    if (viewMode === 'week') {
      // 週間表示：今週の月曜日〜日曜日
      const currentDayOfWeek = now.getDay();
      const mondayOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() - mondayOffset);
      
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);
      
      return {
        startDate: `${mondayDate.getMonth() + 1}月${mondayDate.getDate()}日`,
        endDate: `${sundayDate.getMonth() + 1}月${sundayDate.getDate()}日`,
        monthName: undefined
      };
    } else {
      // 月間表示：今月
      return {
        startDate: undefined,
        endDate: undefined,
        monthName: `${now.getMonth() + 1}月`
      };
    }
  };

  const chartData = getChartData();
  const dateRange = getDateRange();
  
  // 統計計算：チャートと同じデータを使用して一致を保証
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
    <LinearGradient
      colors={['#f8fafc', '#dbeafe', '#e0e7ff']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={[styles.root, { paddingBottom: 20 }] }>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={['#60a5fa', '#a855f7']}
            style={styles.iconContainer}
          >
            <Ionicons name="bar-chart" size={20} color="white" />
          </LinearGradient>
          <Text style={styles.header}>喫煙データ</Text>
        </View>

      {/* 期間選択 */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'week' && styles.toggleButtonTextActive]}>
              週間表示
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'month' && styles.toggleButtonTextActive]}>
              月間表示
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 統計サマリー */}
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>合計</Text>
          <Text style={styles.overviewValue}>{totalCount}本</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>平均</Text>
          <Text style={styles.overviewValue}>{averageCount.toFixed(1)}本</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>達成率</Text>
          <Text style={[styles.overviewValue, styles.achievementValue]}>{achievementRate.toFixed(0)}%</Text>
        </View>
      </View>

      {/* 折れ線グラフ */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {viewMode === 'week' 
            ? `日別喫煙本数（${dateRange.startDate}〜${dateRange.endDate}）`
            : `日別喫煙本数（${dateRange.monthName}）`
          }
        </Text>
        <View style={{ width: screenWidth - 24, height: 220 }}>
          <CartesianChart
            data={chartData}
            xKey="displayDate"
            yKeys={["count", "target"]}
            padding={{ left: 18, right: 24, top: 16, bottom: 22 }}
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
      <LinearGradient
        colors={['rgba(238, 242, 255, 1)', 'rgba(243, 232, 255, 1)']}
        style={styles.summaryCard}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trending-up" size={20} color="#6366f1" />
            <Text style={styles.summaryTitle}>累計情報</Text>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>総喫煙本数</Text>
              <Text style={styles.summaryValue}>
                {totalSmokingCount.toLocaleString('ja-JP')}本
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>アプリ利用日数</Text>
              <Text style={styles.summaryValue}>
                {totalDays.toLocaleString('ja-JP')}日
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>全期間平均</Text>
              <Text style={styles.summaryValue}>
                {overallAverage.toFixed(1)}本/日
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>累計費用</Text>
              <Text style={[styles.summaryValue, styles.costValue]}>
                ¥{Math.round(totalSmokingCount * (settings.pricePerPack / settings.cigarettesPerPack)).toLocaleString('ja-JP')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  root: {
    padding: 12,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  toggleCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 7,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  overviewValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  achievementValue: {
    color: '#10b981',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginRight: 6,
    alignSelf: 'center',
  },
  legendLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 14,
    padding: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  summaryContent: {
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryItem: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 8,
    width: '48%',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'left',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'left',
  },
  costValue: {
    color: '#dc2626',
  },
});