import React, { useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallBlocker } from '../../hooks/useCallBlocker';
import { usePermissions } from '../../hooks/usePermissions';

export default function HomeScreen() {
  const {
    settings,
    isServiceRunning,
    blockedCalls,
    manuallyBlockedNumbers,
    updateSettings,
    startService,
    stopService,
    clearBlockedCallsHistory,
  } = useCallBlocker();

  const {
    permissions,
    areAllPermissionsGranted,
    getMissingPermissions,
    requestAllPermissions,
    openAppSettings,
  } = usePermissions();

  useEffect(() => {
    if (settings.isEnabled && areAllPermissionsGranted() && !isServiceRunning) {
      startService();
    }
  }, [settings.isEnabled, areAllPermissionsGranted, isServiceRunning]);

  const handleToggleService = async () => {
    if (!areAllPermissionsGranted()) {
      Alert.alert(
        'Необходимы разрешения',
        `Для работы блокировщика необходимо предоставить следующие разрешения:\n\n${getMissingPermissions().join('\n')}`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Запросить разрешения', onPress: requestAllPermissions },
          { text: 'Открыть настройки', onPress: openAppSettings },
        ]
      );
      return;
    }

    const newEnabled = !settings.isEnabled;
    await updateSettings({ isEnabled: newEnabled });

    if (newEnabled) {
      const started = await startService();
      if (!started) {
        Alert.alert('Ошибка', 'Не удалось запустить сервис блокировки');
      }
    } else {
      await stopService();
    }
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const getStatusColor = () => {
    if (!areAllPermissionsGranted()) return '#ff6b6b';
    if (settings.isEnabled && isServiceRunning) return '#51cf66';
    return '#ffd43b';
  };

  const getStatusText = () => {
    if (!areAllPermissionsGranted()) return 'Нет разрешений';
    if (settings.isEnabled && isServiceRunning) return 'Защита активна';
    if (settings.isEnabled && !isServiceRunning) return 'Запуск...';
    return 'Отключена';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>АнтиБанк</Text>
        <Text style={styles.subtitle}>Защита от спам-звонков</Text>
      </View>

      {/* Статус блокировщика */}
      <View style={[styles.statusCard, { backgroundColor: getStatusColor() + '20' }]}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusTitle}>Статус защиты</Text>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          <Switch
            value={settings.isEnabled}
            onValueChange={handleToggleService}
            trackColor={{ false: '#767577', true: getStatusColor() }}
            thumbColor={settings.isEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        
        {!areAllPermissionsGranted() && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestAllPermissions}
          >
            <Text style={styles.permissionButtonText}>Предоставить разрешения</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Статистика */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Статистика</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{blockedCalls.length}</Text>
            <Text style={styles.statLabel}>Заблокировано звонков</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {blockedCalls.filter(call => call.reason === 'MICRO_CALL').length}
            </Text>
            <Text style={styles.statLabel}>Микровызовов</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{manuallyBlockedNumbers.length}</Text>
            <Text style={styles.statLabel}>В черном списке</Text>
          </View>
        </View>
      </View>

      {/* Настройки блокировки */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>Настройки блокировки</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Блокировать неизвестные номера</Text>
            <Text style={styles.settingDescription}>
              Блокировать звонки от номеров, которых нет в контактах
            </Text>
          </View>
          <Switch
            value={settings.blockUnknownNumbers}
            onValueChange={() => handleToggleSetting('blockUnknownNumbers')}
            trackColor={{ false: '#767577', true: '#51cf66' }}
            thumbColor={settings.blockUnknownNumbers ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Блокировать микровызовы</Text>
            <Text style={styles.settingDescription}>
              Автоматически блокировать короткие звонки (менее 3 сек)
            </Text>
          </View>
          <Switch
            value={settings.blockMicroCalls}
            onValueChange={() => handleToggleSetting('blockMicroCalls')}
            trackColor={{ false: '#767577', true: '#51cf66' }}
            thumbColor={settings.blockMicroCalls ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Показывать уведомления</Text>
            <Text style={styles.settingDescription}>
              Уведомлять о заблокированных звонках
            </Text>
          </View>
          <Switch
            value={settings.showNotifications}
            onValueChange={() => handleToggleSetting('showNotifications')}
            trackColor={{ false: '#767577', true: '#51cf66' }}
            thumbColor={settings.showNotifications ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Последние заблокированные звонки */}
      {blockedCalls.length > 0 && (
        <View style={styles.recentCallsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Последние заблокированные</Text>
            <TouchableOpacity onPress={clearBlockedCallsHistory}>
              <Text style={styles.clearButton}>Очистить</Text>
            </TouchableOpacity>
          </View>
          
          {blockedCalls.slice(0, 5).map((call, index) => (
            <View key={index} style={styles.callItem}>
              <View>
                <Text style={styles.callNumber}>{call.phoneNumber}</Text>
                <Text style={styles.callTime}>
                  {new Date(call.timestamp).toLocaleString('ru-RU')}
                </Text>
              </View>
              <View style={styles.callReason}>
                <Text style={styles.reasonText}>
                  {call.reason === 'NOT_IN_CONTACTS' && 'Нет в контактах'}
                  {call.reason === 'MICRO_CALL' && 'Микровызов'}
                  {call.reason === 'USER_BLOCKED' && 'Черный список'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {Platform.OS !== 'android' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ Данное приложение работает только на Android устройствах
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  statusCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionButton: {
    marginTop: 16,
    backgroundColor: '#3182ce',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3182ce',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  settingsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#718096',
  },
  recentCallsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    color: '#e53e3e',
    fontSize: 14,
    fontWeight: '500',
  },
  callItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  callNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  callTime: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  callReason: {
    backgroundColor: '#fed7d7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonText: {
    fontSize: 12,
    color: '#c53030',
    fontWeight: '500',
  },
  warningCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fef5e7',
    borderWidth: 1,
    borderColor: '#f6ad55',
  },
  warningText: {
    fontSize: 14,
    color: '#c05621',
    textAlign: 'center',
  },
});