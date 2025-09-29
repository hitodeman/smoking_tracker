import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP_ID = 'group.com.smokingtracker.shared';

interface WidgetDataManagerInterface {
  getTodayCount(): Promise<number>;
  setTodayCount(count: number): Promise<boolean>;
  incrementCount(): Promise<number>;
}

const createWidgetDataManager = (): WidgetDataManagerInterface => {
  if (Platform.OS === 'ios') {
    return {
      getTodayCount: async (): Promise<number> => {
        try {
          const count = await SharedGroupPreferences.getItem('todayCount', APP_GROUP_ID);
          return count ? parseInt(count, 10) : 0;
        } catch (error) {
          console.warn('WidgetDataManager getTodayCount error:', error);
          return 0;
        }
      },
      
      setTodayCount: async (count: number): Promise<boolean> => {
        try {
          await SharedGroupPreferences.setItem('todayCount', count.toString(), APP_GROUP_ID);
          return true;
        } catch (error) {
          console.warn('WidgetDataManager setTodayCount error:', error);
          return false;
        }
      },
      
      incrementCount: async (): Promise<number> => {
        try {
          const currentCount = await SharedGroupPreferences.getItem('todayCount', APP_GROUP_ID);
          const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
          await SharedGroupPreferences.setItem('todayCount', newCount.toString(), APP_GROUP_ID);
          return newCount;
        } catch (error) {
          console.warn('WidgetDataManager incrementCount error:', error);
          return 1;
        }
      },
    };
  }
  
  // Android or フォールバック実装
  return {
    getTodayCount: async () => 0,
    setTodayCount: async (count: number) => true,
    incrementCount: async () => 1,
  };
};

export const WidgetDataManager = createWidgetDataManager();

export default WidgetDataManager;