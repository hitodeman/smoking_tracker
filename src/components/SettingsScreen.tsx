import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
  averageCountBefore: 20,
};

export default function SettingsScreen() {
  const [localSettings, setLocalSettings] = useState(defaultSettings);

  useEffect(() => {
    (async () => {
      const settingsStr = await AsyncStorage.getItem('smokingSettings');
      if (settingsStr) {
        setLocalSettings(JSON.parse(settingsStr));
      }
    })();
  }, []);

  const handleSave = async () => {
    if (localSettings.pricePerPack <= 0) {
      Alert.alert('エラー', 'タバコの価格は0円より大きい値を入力してください');
      return;
    }
    if (localSettings.targetCount < 0) {
      Alert.alert('エラー', '目標本数は0以上の値を入力してください');
      return;
    }
    if (localSettings.cigarettesPerPack <= 0) {
      Alert.alert('エラー', '1箱あたりの本数は0本より大きい値を入力してください');
      return;
    }
    if (localSettings.averageCountBefore < 0) {
      Alert.alert('エラー', '過去の平均本数は0以上の値を入力してください');
      return;
    }
    await AsyncStorage.setItem('smokingSettings', JSON.stringify(localSettings));
    Alert.alert('保存完了', '設定を保存しました');
  };

  const costPerCigarette = localSettings.pricePerPack / localSettings.cigarettesPerPack;
  const dailyTargetCost = localSettings.targetCount * costPerCigarette;

  return (
    <ScrollView contentContainerStyle={[styles.root, { paddingBottom: 80 }] }>
      <Text style={styles.header}>設定</Text>

      {/* タバコの価格設定 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>タバコの価格</Text>
        <Text style={styles.label}>1箱あたりの価格（円）</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(localSettings.pricePerPack)}
          onChangeText={v => setLocalSettings({ ...localSettings, pricePerPack: Number(v) })}
          placeholder="500"
        />
        <Text style={styles.label}>1箱あたりの本数</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(localSettings.cigarettesPerPack)}
          onChangeText={v => setLocalSettings({ ...localSettings, cigarettesPerPack: Number(v) })}
          placeholder="20"
        />
        <Text style={styles.hint}>1本あたりの価格: ¥{costPerCigarette.toFixed(1)}</Text>
      </View>

      {/* 過去の平均設定 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>過去の喫煙データ</Text>
        <Text style={styles.label}>今までの1日あたりの平均本数</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(localSettings.averageCountBefore)}
          onChangeText={v => setLocalSettings({ ...localSettings, averageCountBefore: Number(v.replace(/[^0-9]/g, '')) })}
          placeholder="20"
        />
        <Text style={styles.hint}>アプリ使用前の平均的な喫煙本数を入力してください</Text>
        <Text style={styles.hint}>過去の1日の費用: ¥{(localSettings.averageCountBefore * costPerCigarette).toFixed(0)}</Text>
      </View>

      {/* 目標設定 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>目標設定</Text>
        <Text style={styles.label}>1日の目標本数</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(localSettings.targetCount)}
          onChangeText={v => setLocalSettings({ ...localSettings, targetCount: Number(v) })}
          placeholder="10"
        />
        <Text style={styles.hint}>この本数以下に抑えることを目標とします</Text>
        <Text style={styles.hint}>目標達成時の1日の費用: ¥{dailyTargetCost.toFixed(0)}</Text>
        <Text style={styles.hint}>過去との差: -{localSettings.averageCountBefore - localSettings.targetCount}本 (¥{((localSettings.averageCountBefore - localSettings.targetCount) * costPerCigarette).toFixed(0)}節約)</Text>
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>設定を保存</Text>
      </TouchableOpacity>

      {/* 使い方のヒント */}
      <View style={[styles.card, { backgroundColor: '#ede7f6', borderColor: '#b39ddb' }] }>
        <Text style={styles.tipsTitle}>💡 使い方のヒント</Text>
        <Text style={styles.tip}>• 目標本数は段階的に減らしていくのがおすすめです</Text>
        <Text style={styles.tip}>• ホーム画面で簡単に喫煙本数を記録できます</Text>
        <Text style={styles.tip}>• グラフ画面で進捗を視覚的に確認しましょう</Text>
        <Text style={styles.tip}>• 毎日の記録を続けることが成功の鍵です</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginTop: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: '#7b1fa2',
    marginBottom: 2,
  },
});