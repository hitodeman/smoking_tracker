import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultSettings = {
  pricePerPack: 600,
  targetCount: 10,
  cigarettesPerPack: 20,
  averageCountBefore: 20,
};

export interface SettingsScreenRef {
  checkUnsavedChanges: () => Promise<boolean>;
}

const SettingsScreen = forwardRef<SettingsScreenRef>((props, ref) => {
  const [localSettings, setLocalSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 入力中の一時的な値を管理
  const [inputValues, setInputValues] = useState({
    pricePerPack: String(defaultSettings.pricePerPack),
    cigarettesPerPack: String(defaultSettings.cigarettesPerPack),
    targetCount: String(defaultSettings.targetCount),
    averageCountBefore: String(defaultSettings.averageCountBefore),
  });

  useEffect(() => {
    (async () => {
      const settingsStr = await AsyncStorage.getItem('smokingSettings');
      if (settingsStr) {
        const loadedSettings = JSON.parse(settingsStr);
        // 保存された設定値が有効かチェックし、無効な場合はデフォルト値を使用
        const validatedSettings = {
          pricePerPack: isNaN(loadedSettings.pricePerPack) || loadedSettings.pricePerPack <= 0 ? 600 : loadedSettings.pricePerPack,
          targetCount: isNaN(loadedSettings.targetCount) || loadedSettings.targetCount < 0 ? 10 : loadedSettings.targetCount,
          cigarettesPerPack: isNaN(loadedSettings.cigarettesPerPack) || loadedSettings.cigarettesPerPack <= 0 ? 20 : loadedSettings.cigarettesPerPack,
          averageCountBefore: isNaN(loadedSettings.averageCountBefore) || loadedSettings.averageCountBefore < 0 ? 20 : loadedSettings.averageCountBefore,
        };
        setLocalSettings(validatedSettings);
        setSavedSettings(validatedSettings);
        
        // 入力フィールド用の文字列値も更新
        setInputValues({
          pricePerPack: String(validatedSettings.pricePerPack),
          cigarettesPerPack: String(validatedSettings.cigarettesPerPack),
          targetCount: String(validatedSettings.targetCount),
          averageCountBefore: String(validatedSettings.averageCountBefore),
        });
      } else {
        // 初回起動時はデフォルト設定を保存
        await AsyncStorage.setItem('smokingSettings', JSON.stringify(defaultSettings));
        setSavedSettings(defaultSettings);
        
        // 入力フィールド用の文字列値も設定
        setInputValues({
          pricePerPack: String(defaultSettings.pricePerPack),
          cigarettesPerPack: String(defaultSettings.cigarettesPerPack),
          targetCount: String(defaultSettings.targetCount),
          averageCountBefore: String(defaultSettings.averageCountBefore),
        });
      }
    })();
  }, []);

  // 設定値の変更を検知
  useEffect(() => {
    const settingsChanged = JSON.stringify(localSettings) !== JSON.stringify(savedSettings);
    setHasChanges(settingsChanged);
  }, [localSettings, savedSettings]);



  const checkForUnsavedChanges = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        '保存されていない変更があります',
        '設定の変更が保存されていません。保存しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '破棄',
            style: 'destructive',
            onPress: () => {
              // 変更を破棄して元の設定に戻す
              setLocalSettings(savedSettings);
              setHasChanges(false);
            },
          },
          {
            text: '保存',
            onPress: () => handleSave(),
          },
        ]
      );
    }
  }, [hasChanges, savedSettings]);

  const checkUnsavedChangesAsync = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!hasChanges) {
        resolve(true); // 変更がない場合は画面遷移を許可
        return;
      }

      Alert.alert(
        '保存されていない変更があります',
        '設定の変更が保存されていません。保存しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
            onPress: () => resolve(false), // 画面遷移をキャンセル
          },
          {
            text: '破棄',
            style: 'destructive',
            onPress: () => {
              // 変更を破棄して元の設定に戻す
              setLocalSettings(savedSettings);
              setHasChanges(false);
              resolve(true); // 画面遷移を許可
            },
          },
          {
            text: '保存',
            onPress: async () => {
              await handleSave();
              resolve(true); // 画面遷移を許可
            },
          },
        ]
      );
    });
  }, [hasChanges, savedSettings]);

  useImperativeHandle(ref, () => ({
    checkUnsavedChanges: checkUnsavedChangesAsync,
  }));

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
    
    try {
      await AsyncStorage.setItem('smokingSettings', JSON.stringify(localSettings));
      setSavedSettings(localSettings);
      setHasChanges(false);
      Alert.alert('保存完了', '設定を保存しました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const costPerCigarette = localSettings.pricePerPack / localSettings.cigarettesPerPack;
  const dailyTargetCost = localSettings.targetCount * costPerCigarette;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.root, { paddingBottom: 80 }] }>
        <Text style={styles.header}>設定</Text>

      {/* タバコの価格設定 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>タバコの価格</Text>
        <Text style={styles.label}>1箱あたりの価格（円）</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={inputValues.pricePerPack}
          onChangeText={v => {
            // 入力値を直接保存
            setInputValues({ ...inputValues, pricePerPack: v });
            
            // 数値として有効な場合のみlocalSettingsを更新
            if (v !== '') {
              const parsedValue = Number(v);
              if (!isNaN(parsedValue) && parsedValue >= 0) {
                setLocalSettings({ ...localSettings, pricePerPack: parsedValue });
              }
            }
          }}
          onBlur={() => {
            // フォーカスが外れた時にバリデーション
            const parsedValue = Number(inputValues.pricePerPack);
            if (inputValues.pricePerPack === '' || isNaN(parsedValue) || parsedValue <= 0) {
              const defaultValue = 600;
              setInputValues({ ...inputValues, pricePerPack: String(defaultValue) });
              setLocalSettings({ ...localSettings, pricePerPack: defaultValue });
            }
          }}
          placeholder="600"
        />
        <Text style={styles.label}>1箱あたりの本数</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={inputValues.cigarettesPerPack}
          onChangeText={v => {
            setInputValues({ ...inputValues, cigarettesPerPack: v });
            
            if (v !== '') {
              const parsedValue = Number(v);
              if (!isNaN(parsedValue) && parsedValue >= 0) {
                setLocalSettings({ ...localSettings, cigarettesPerPack: parsedValue });
              }
            }
          }}
          onBlur={() => {
            const parsedValue = Number(inputValues.cigarettesPerPack);
            if (inputValues.cigarettesPerPack === '' || isNaN(parsedValue) || parsedValue <= 0) {
              const defaultValue = 20;
              setInputValues({ ...inputValues, cigarettesPerPack: String(defaultValue) });
              setLocalSettings({ ...localSettings, cigarettesPerPack: defaultValue });
            }
          }}
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
          value={inputValues.averageCountBefore}
          onChangeText={v => {
            const numericValue = v.replace(/[^0-9]/g, '');
            setInputValues({ ...inputValues, averageCountBefore: numericValue });
            
            if (numericValue !== '') {
              const parsedValue = Number(numericValue);
              if (!isNaN(parsedValue) && parsedValue >= 0) {
                setLocalSettings({ ...localSettings, averageCountBefore: parsedValue });
              }
            }
          }}
          onBlur={() => {
            const parsedValue = Number(inputValues.averageCountBefore);
            if (inputValues.averageCountBefore === '' || isNaN(parsedValue) || parsedValue < 0) {
              const defaultValue = 20;
              setInputValues({ ...inputValues, averageCountBefore: String(defaultValue) });
              setLocalSettings({ ...localSettings, averageCountBefore: defaultValue });
            }
          }}
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
          value={inputValues.targetCount}
          onChangeText={v => {
            setInputValues({ ...inputValues, targetCount: v });
            
            if (v !== '') {
              const parsedValue = Number(v);
              if (!isNaN(parsedValue) && parsedValue >= 0) {
                setLocalSettings({ ...localSettings, targetCount: parsedValue });
              }
            }
          }}
          onBlur={() => {
            const parsedValue = Number(inputValues.targetCount);
            if (inputValues.targetCount === '' || isNaN(parsedValue) || parsedValue < 0) {
              const defaultValue = 10;
              setInputValues({ ...inputValues, targetCount: String(defaultValue) });
              setLocalSettings({ ...localSettings, targetCount: defaultValue });
            }
          }}
          placeholder="10"
        />
        <Text style={styles.hint}>この本数以下に抑えることを目標とします</Text>
        <Text style={styles.hint}>目標達成時の1日の費用: ¥{dailyTargetCost.toFixed(0)}</Text>
        <Text style={styles.hint}>過去との差: -{localSettings.averageCountBefore - localSettings.targetCount}本 (1日¥{((localSettings.averageCountBefore - localSettings.targetCount) * costPerCigarette).toFixed(0)}節約)</Text>
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity 
        style={[styles.saveButton, hasChanges && styles.saveButtonHighlight]} 
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          {hasChanges ? '設定を保存 ●' : '設定を保存'}
        </Text>
      </TouchableOpacity>
      
      {hasChanges && (
        <View style={styles.changesNotice}>
          <Text style={styles.changesNoticeText}>⚠️ 保存されていない変更があります</Text>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
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
  saveButtonHighlight: {
    backgroundColor: '#f57c00',
    shadowColor: '#f57c00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changesNotice: {
    backgroundColor: '#fff3cd',
    borderColor: '#f0ad4e',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  changesNoticeText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
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

export default SettingsScreen;