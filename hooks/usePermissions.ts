import * as Contacts from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export interface AppPermissions {
  contacts: PermissionStatus;
  phone: PermissionStatus;
  callLog: PermissionStatus;
  systemAlert: PermissionStatus;
  answerCalls: PermissionStatus;
  manageCalls: PermissionStatus;
}

const initialPermissions: AppPermissions = {
  contacts: { granted: false, canAskAgain: true },
  phone: { granted: false, canAskAgain: true },
  callLog: { granted: false, canAskAgain: true },
  systemAlert: { granted: false, canAskAgain: true },
  answerCalls: { granted: false, canAskAgain: true },
  manageCalls: { granted: false, canAskAgain: true },
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<AppPermissions>(initialPermissions);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    setIsCheckingPermissions(true);
    
    try {
      const [
        contactsStatus,
        phoneStatus,
        callLogStatus,
        systemAlertStatus,
        answerCallsStatus,
        manageCallsStatus
      ] = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.MANAGE_OWN_CALLS),
      ]);

      setPermissions({
        contacts: { granted: contactsStatus, canAskAgain: true },
        phone: { granted: phoneStatus, canAskAgain: true },
        callLog: { granted: callLogStatus, canAskAgain: true },
        systemAlert: { granted: systemAlertStatus, canAskAgain: true },
        answerCalls: { granted: answerCallsStatus, canAskAgain: true },
        manageCalls: { granted: manageCallsStatus, canAskAgain: true },
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsCheckingPermissions(false);
    }
  }, []);

  const requestContactsPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Используем Expo Contacts для более надежной работы
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      
      setPermissions(prev => ({
        ...prev,
        contacts: { granted, canAskAgain: status !== 'denied' }
      }));
      
      return granted;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }, []);

  const requestPhonePermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
        PermissionsAndroid.PERMISSIONS.MANAGE_OWN_CALLS,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      setPermissions(prev => ({
        ...prev,
        phone: { 
          granted: granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted',
          canAskAgain: granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] !== 'never_ask_again'
        },
        callLog: { 
          granted: granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === 'granted',
          canAskAgain: granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] !== 'never_ask_again'
        },
        answerCalls: { 
          granted: granted[PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS] === 'granted',
          canAskAgain: granted[PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS] !== 'never_ask_again'
        },
        manageCalls: { 
          granted: granted[PermissionsAndroid.PERMISSIONS.MANAGE_OWN_CALLS] === 'granted',
          canAskAgain: granted[PermissionsAndroid.PERMISSIONS.MANAGE_OWN_CALLS] !== 'never_ask_again'
        }
      }));

      return Object.values(granted).every(status => status === 'granted');
    } catch (error) {
      console.error('Error requesting phone permissions:', error);
      return false;
    }
  }, []);

  const requestSystemAlertPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
        {
          title: 'Разрешение на отображение поверх других приложений',
          message: 'Это разрешение необходимо для блокировки входящих звонков',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Отмена',
          buttonPositive: 'Разрешить',
        }
      );

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      
      setPermissions(prev => ({
        ...prev,
        systemAlert: { 
          granted: isGranted, 
          canAskAgain: granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN 
        }
      }));

      return isGranted;
    } catch (error) {
      console.error('Error requesting system alert permission:', error);
      return false;
    }
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    const results = await Promise.all([
      requestContactsPermission(),
      requestPhonePermissions(),
      requestSystemAlertPermission(),
    ]);

    return results.every(result => result);
  }, [requestContactsPermission, requestPhonePermissions, requestSystemAlertPermission]);

  const openAppSettings = useCallback(() => {
    Alert.alert(
      'Необходимы разрешения',
      'Для полной функциональности приложения необходимо предоставить все разрешения в настройках',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Открыть настройки', 
          onPress: () => Linking.openSettings() 
        }
      ]
    );
  }, []);

  const areAllPermissionsGranted = useCallback((): boolean => {
    return Object.values(permissions).every(permission => permission.granted);
  }, [permissions]);

  const getMissingPermissions = useCallback((): string[] => {
    const missing: string[] = [];
    
    if (!permissions.contacts.granted) missing.push('Контакты');
    if (!permissions.phone.granted) missing.push('Телефон');
    if (!permissions.callLog.granted) missing.push('Журнал звонков');
    if (!permissions.systemAlert.granted) missing.push('Отображение поверх приложений');
    if (!permissions.answerCalls.granted) missing.push('Ответ на звонки');
    if (!permissions.manageCalls.granted) missing.push('Управление звонками');
    
    return missing;
  }, [permissions]);

  return {
    permissions,
    isCheckingPermissions,
    checkAllPermissions,
    requestContactsPermission,
    requestPhonePermissions,
    requestSystemAlertPermission,
    requestAllPermissions,
    openAppSettings,
    areAllPermissionsGranted,
    getMissingPermissions,
  };
};