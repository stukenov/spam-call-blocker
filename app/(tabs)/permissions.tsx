import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionCardProps {
  title: string;
  description: string;
  isGranted: boolean;
  canAskAgain: boolean;
  onRequest: () => Promise<boolean>;
  isEssential?: boolean;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  title,
  description,
  isGranted,
  canAskAgain,
  onRequest,
  isEssential = false,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const granted = await onRequest();
      if (!granted && !canAskAgain) {
        Alert.alert(
          'Разрешение отклонено',
          'Для предоставления этого разрешения перейдите в настройки приложения',
          [
            { text: 'Позже', style: 'cancel' },
            { text: 'Настройки', onPress: () => {} } // Здесь можно добавить переход в настройки
          ]
        );
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusColor = () => {
    if (isGranted) return '#51cf66';
    if (isEssential) return '#ff6b6b';
    return '#ffd43b';
  };

  const getStatusText = () => {
    if (isGranted) return 'Предоставлено';
    if (!canAskAgain) return 'Отклонено навсегда';
    return 'Не предоставлено';
  };

  return (
    <View style={[styles.permissionCard, isEssential && !isGranted && styles.essentialCard]}>
      <View style={styles.permissionHeader}>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{isGranted ? '✓' : '!'}</Text>
        </View>
      </View>
      
      <View style={styles.permissionFooter}>
        <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        
        {!isGranted && canAskAgain && (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: getStatusColor() }]}
            onPress={handleRequest}
            disabled={isRequesting}
          >
            <Text style={styles.requestButtonText}>
              {isRequesting ? 'Запрос...' : 'Запросить'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isEssential && !isGranted && (
        <View style={styles.essentialWarning}>
          <Text style={styles.essentialWarningText}>
            ⚠️ Критически важно для работы блокировщика
          </Text>
        </View>
      )}
    </View>
  );
};

export default function PermissionsScreen() {
  const {
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
  } = usePermissions();

  const handleRequestAll = async () => {
    const granted = await requestAllPermissions();
    if (granted) {
      Alert.alert('Успех!', 'Все разрешения предоставлены. Теперь можно активировать блокировщик.');
    } else {
      const missing = getMissingPermissions();
      Alert.alert(
        'Не все разрешения предоставлены',
        `Отсутствуют:\n${missing.join('\n')}\n\nБез этих разрешений блокировщик не сможет полноценно работать.`
      );
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>Неподдерживаемая платформа</Text>
          <Text style={styles.warningText}>
            Данное приложение работает только на Android устройствах.
            iOS не предоставляет необходимые API для блокировки звонков.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Разрешения</Text>
        <Text style={styles.subtitle}>
          Для работы блокировщика необходимо предоставить следующие разрешения
        </Text>
      </View>

      {/* Общий статус */}
      <View style={[
        styles.statusCard, 
        { backgroundColor: areAllPermissionsGranted() ? '#51cf6620' : '#ff6b6b20' }
      ]}>
        <Text style={styles.statusTitle}>
          {areAllPermissionsGranted() ? 'Все разрешения предоставлены' : 'Требуются разрешения'}
        </Text>
        <Text style={styles.statusDescription}>
          {areAllPermissionsGranted() 
            ? 'Блокировщик готов к работе' 
            : `Отсутствует ${getMissingPermissions().length} разрешений`
          }
        </Text>
        
        {!areAllPermissionsGranted() && (
          <TouchableOpacity style={styles.requestAllButton} onPress={handleRequestAll}>
            <Text style={styles.requestAllButtonText}>Запросить все разрешения</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Список разрешений */}
      <PermissionCard
        title="Доступ к контактам"
        description="Необходим для проверки, есть ли входящий номер в вашей телефонной книге"
        isGranted={permissions.contacts.granted}
        canAskAgain={permissions.contacts.canAskAgain}
        onRequest={requestContactsPermission}
        isEssential={true}
      />

      <PermissionCard
        title="Доступ к телефону"
        description="Необходим для отслеживания входящих звонков и их состояния"
        isGranted={permissions.phone.granted}
        canAskAgain={permissions.phone.canAskAgain}
        onRequest={requestPhonePermissions}
        isEssential={true}
      />

      <PermissionCard
        title="Журнал звонков"
        description="Позволяет анализировать историю звонков для выявления спама"
        isGranted={permissions.callLog.granted}
        canAskAgain={permissions.callLog.canAskAgain}
        onRequest={requestPhonePermissions}
        isEssential={true}
      />

      <PermissionCard
        title="Ответ на звонки"
        description="Позволяет автоматически отклонять нежелательные звонки"
        isGranted={permissions.answerCalls.granted}
        canAskAgain={permissions.answerCalls.canAskAgain}
        onRequest={requestPhonePermissions}
        isEssential={true}
      />

      <PermissionCard
        title="Управление звонками"
        description="Необходимо для полного контроля над входящими звонками"
        isGranted={permissions.manageCalls.granted}
        canAskAgain={permissions.manageCalls.canAskAgain}
        onRequest={requestPhonePermissions}
        isEssential={true}
      />

      <PermissionCard
        title="Отображение поверх приложений"
        description="Позволяет показывать интерфейс блокировки поверх других приложений"
        isGranted={permissions.systemAlert.granted}
        canAskAgain={permissions.systemAlert.canAskAgain}
        onRequest={requestSystemAlertPermission}
        isEssential={false}
      />

      {/* Информационный блок */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Почему нужны эти разрешения?</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoBold}>Контакты</Text> - чтобы не блокировать звонки от ваших друзей и знакомых{'\n'}
          • <Text style={styles.infoBold}>Телефон</Text> - для отслеживания входящих звонков{'\n'}
          • <Text style={styles.infoBold}>Управление звонками</Text> - для автоматического отклонения спама{'\n'}
          • <Text style={styles.infoBold}>Отображение поверх приложений</Text> - для показа уведомлений о блокировке
        </Text>
      </View>

      {/* Кнопка перехода в настройки */}
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
          <Text style={styles.settingsButtonText}>Открыть настройки приложения</Text>
        </TouchableOpacity>
        <Text style={styles.settingsDescription}>
          Если какое-то разрешение было отклонено навсегда, его можно включить в настройках Android
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={checkAllPermissions}>
        <Text style={styles.refreshButtonText}>
          {isCheckingPermissions ? 'Проверка...' : 'Обновить статус разрешений'}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  statusCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  requestAllButton: {
    backgroundColor: '#3182ce',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  essentialCard: {
    borderColor: '#fed7d7',
    backgroundColor: '#fffaf0',
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  requestButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  essentialWarning: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fed7d7',
    borderRadius: 6,
  },
  essentialWarningText: {
    fontSize: 12,
    color: '#c53030',
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#e6fffa',
    borderWidth: 1,
    borderColor: '#81e6d9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 22,
  },
  infoBold: {
    fontWeight: '600',
  },
  settingsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  settingsButton: {
    backgroundColor: '#718096',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '500',
  },
  warningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
});