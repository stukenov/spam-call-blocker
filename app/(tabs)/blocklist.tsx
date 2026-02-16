import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCallBlocker } from '../../hooks/useCallBlocker';
import { Contact } from '../../types/callBlocker';

interface BlockedNumberItemProps {
  number: string;
  name?: string;
  onUnblock: (number: string) => void;
}

const BlockedNumberItem: React.FC<BlockedNumberItemProps> = ({ number, name, onUnblock }) => {
  const handleUnblock = () => {
    Alert.alert(
      'Разблокировать номер?',
      `Вы уверены, что хотите разблокировать номер ${number}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Разблокировать', onPress: () => onUnblock(number), style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.blockedItem}>
      <View style={styles.blockedItemInfo}>
        <Text style={styles.blockedNumber}>{number}</Text>
        {name && <Text style={styles.blockedName}>{name}</Text>}
      </View>
      <TouchableOpacity style={styles.unblockButton} onPress={handleUnblock}>
        <Text style={styles.unblockButtonText}>Разблокировать</Text>
      </TouchableOpacity>
    </View>
  );
};

interface ContactItemProps {
  contact: Contact;
  isBlocked: boolean;
  onToggleBlock: (number: string) => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, isBlocked, onToggleBlock }) => {
  return (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactNumber}>{contact.number}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggleButton, isBlocked && styles.toggleButtonBlocked]}
        onPress={() => onToggleBlock(contact.number)}
      >
        <Text style={[styles.toggleButtonText, isBlocked && styles.toggleButtonTextBlocked]}>
          {isBlocked ? 'Разблокировать' : 'Заблокировать'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function BlocklistScreen() {
  const {
    contacts,
    manuallyBlockedNumbers,
    loadContacts,
    blockNumber,
    unblockNumber,
  } = useCallBlocker();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'blocked' | 'contacts'>('blocked');

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.number.includes(searchQuery)
  );

  const handleAddNumber = () => {
    if (!newNumber.trim()) {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }

    const cleanNumber = newNumber.trim().replace(/[^\d+]/g, '');
    if (cleanNumber.length < 7) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    if (manuallyBlockedNumbers.includes(cleanNumber)) {
      Alert.alert('Ошибка', 'Этот номер уже заблокирован');
      return;
    }

    blockNumber(cleanNumber);
    setNewNumber('');
    setShowAddModal(false);
    Alert.alert('Успех', 'Номер добавлен в черный список');
  };

  const handleUnblockNumber = (number: string) => {
    unblockNumber(number);
    Alert.alert('Успех', 'Номер удален из черного списка');
  };

  const handleToggleContactBlock = (number: string) => {
    const isCurrentlyBlocked = manuallyBlockedNumbers.includes(number);
    
    if (isCurrentlyBlocked) {
      handleUnblockNumber(number);
    } else {
      blockNumber(number);
      Alert.alert('Успех', 'Контакт добавлен в черный список');
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>Неподдерживаемая платформа</Text>
          <Text style={styles.warningText}>
            Управление черным списком доступно только на Android устройствах.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Черный список</Text>
        <Text style={styles.subtitle}>Управление заблокированными номерами</Text>
      </View>

      {/* Табы */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}>
            Заблокированные ({manuallyBlockedNumbers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, activeTab === 'contacts' && styles.activeTabText]}>
            Контакты ({contacts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'blocked' ? (
        <View style={styles.content}>
          {/* Кнопка добавления */}
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ Добавить номер</Text>
          </TouchableOpacity>

          {/* Список заблокированных номеров */}
          {manuallyBlockedNumbers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Черный список пуст</Text>
              <Text style={styles.emptySubtext}>
                Добавьте номера, которые хотите заблокировать
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.listContainer}>
              {manuallyBlockedNumbers.map((number, index) => {
                const contact = contacts.find(c => c.number === number);
                return (
                  <BlockedNumberItem
                    key={index}
                    number={number}
                    name={contact?.name}
                    onUnblock={handleUnblockNumber}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {/* Поиск по контактам */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск контактов..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Список контактов */}
          {contacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Контакты не загружены</Text>
              <Text style={styles.emptySubtext}>
                Проверьте разрешения на доступ к контактам
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={loadContacts}>
                <Text style={styles.refreshButtonText}>Обновить контакты</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item, index) => `${item.number}-${index}`}
              renderItem={({ item }) => (
                <ContactItem
                  contact={item}
                  isBlocked={manuallyBlockedNumbers.includes(item.number)}
                  onToggleBlock={handleToggleContactBlock}
                />
              )}
              style={styles.contactsList}
            />
          )}
        </View>
      )}

      {/* Модал добавления номера */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Добавить номер в черный список</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Введите номер телефона"
              value={newNumber}
              onChangeText={setNewNumber}
              keyboardType="phone-pad"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewNumber('');
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddNumber}
              >
                <Text style={styles.confirmButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2d3748',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  addButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#3182ce',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e53e3e',
  },
  blockedItemInfo: {
    flex: 1,
  },
  blockedNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  blockedName: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  unblockButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    margin: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  contactNumber: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  toggleButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  toggleButtonBlocked: {
    backgroundColor: '#e53e3e',
  },
  toggleButtonText: {
    color: '#4a5568',
    fontSize: 12,
    fontWeight: '500',
  },
  toggleButtonTextBlocked: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#3182ce',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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