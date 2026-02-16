import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { CallEvent, Contact } from '../types/callBlocker';

const { CallBlockerModule } = NativeModules;

const STORAGE_KEYS = {
  BLOCKED_CALLS: 'blocked_calls',
  SETTINGS: 'call_blocker_settings',
  BLOCKED_NUMBERS: 'manually_blocked_numbers'
};

export interface CallBlockerSettings {
  isEnabled: boolean;
  blockUnknownNumbers: boolean;
  blockMicroCalls: boolean;
  showNotifications: boolean;
}

const defaultSettings: CallBlockerSettings = {
  isEnabled: true,
  blockUnknownNumbers: true,
  blockMicroCalls: true,
  showNotifications: true,
};

export const useCallBlocker = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blockedCalls, setBlockedCalls] = useState<CallEvent[]>([]);
  const [settings, setSettings] = useState<CallBlockerSettings>(defaultSettings);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [manuallyBlockedNumbers, setManuallyBlockedNumbers] = useState<string[]>([]);

  // Загрузка данных при инициализации
  useEffect(() => {
    loadStoredData();
    if (Platform.OS === 'android') {
      setupEventListeners();
    }
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedBlockedCalls, storedSettings, storedBlockedNumbers] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_CALLS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_NUMBERS)
      ]);

      if (storedBlockedCalls) {
        setBlockedCalls(JSON.parse(storedBlockedCalls));
      }

      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }

      if (storedBlockedNumbers) {
        setManuallyBlockedNumbers(JSON.parse(storedBlockedNumbers));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const setupEventListeners = () => {
    const eventEmitter = new NativeEventEmitter();
    
    // Слушаем события блокировки звонков
    const callBlockedSubscription = eventEmitter.addListener('CALL_BLOCKED', (event) => {
      const newBlockedCall: CallEvent = {
        phoneNumber: event.phoneNumber,
        timestamp: Date.now(),
        reason: event.reason
      };
      
      setBlockedCalls(prev => {
        const updated = [newBlockedCall, ...prev.slice(0, 99)]; // Максимум 100 записей
        AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_CALLS, JSON.stringify(updated));
        return updated;
      });
    });

    // Слушаем микровызовы
    const microCallSubscription = eventEmitter.addListener('MICRO_CALL_DETECTED', (event) => {
      if (settings.blockMicroCalls) {
        const newBlockedCall: CallEvent = {
          phoneNumber: event.phoneNumber,
          duration: event.duration,
          timestamp: Date.now(),
          reason: 'MICRO_CALL'
        };
        
        setBlockedCalls(prev => {
          const updated = [newBlockedCall, ...prev.slice(0, 99)];
          AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_CALLS, JSON.stringify(updated));
          return updated;
        });
      }
    });

    return () => {
      callBlockedSubscription.remove();
      microCallSubscription.remove();
    };
  };

  const loadContacts = useCallback(async () => {
    try {
      if (Platform.OS === 'android' && CallBlockerModule) {
        const contactsList = await CallBlockerModule.getAllContacts();
        setContacts(contactsList);
        return contactsList;
      }
      return [];
    } catch (error) {
      console.error('Error loading contacts:', error);
      return [];
    }
  }, []);

  const isNumberInContacts = useCallback(async (phoneNumber: string): Promise<boolean> => {
    try {
      if (Platform.OS === 'android' && CallBlockerModule) {
        return await CallBlockerModule.isNumberInContacts(phoneNumber);
      }
      return false;
    } catch (error) {
      console.error('Error checking contact:', error);
      return false;
    }
  }, []);

  const blockNumber = useCallback(async (phoneNumber: string): Promise<boolean> => {
    try {
      if (Platform.OS === 'android' && CallBlockerModule) {
        const result = await CallBlockerModule.blockCall(phoneNumber);
        
        // Добавляем в список заблокированных вручную
        setManuallyBlockedNumbers(prev => {
          const updated = [...prev, phoneNumber];
          AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_NUMBERS, JSON.stringify(updated));
          return updated;
        });
        
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error blocking number:', error);
      return false;
    }
  }, []);

  const unblockNumber = useCallback(async (phoneNumber: string) => {
    setManuallyBlockedNumbers(prev => {
      const updated = prev.filter(num => num !== phoneNumber);
      AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_NUMBERS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const startService = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android' && CallBlockerModule) {
        const result = await CallBlockerModule.startCallBlockingService();
        setIsServiceRunning(result);
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error starting service:', error);
      return false;
    }
  }, []);

  const stopService = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android' && CallBlockerModule) {
        const result = await CallBlockerModule.stopCallBlockingService();
        setIsServiceRunning(!result);
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error stopping service:', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<CallBlockerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    
    // Если блокировка отключена, останавливаем сервис
    if (!updatedSettings.isEnabled && isServiceRunning) {
      await stopService();
    } else if (updatedSettings.isEnabled && !isServiceRunning) {
      await startService();
    }
  }, [settings, isServiceRunning, startService, stopService]);

  const clearBlockedCallsHistory = useCallback(async () => {
    setBlockedCalls([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.BLOCKED_CALLS);
  }, []);

  return {
    // State
    contacts,
    blockedCalls,
    settings,
    isServiceRunning,
    manuallyBlockedNumbers,
    
    // Actions
    loadContacts,
    isNumberInContacts,
    blockNumber,
    unblockNumber,
    startService,
    stopService,
    updateSettings,
    clearBlockedCallsHistory,
  };
};