import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

interface Reflection {
  id: string;
  user_name: string;
  content: string;
  type: string;
  date: string;
}

export default function CommunityScreen() {
  const { theme } = useTheme();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('devocional');

  const types = [
    { value: 'devocional', label: 'Devocional', icon: 'book' },
    { value: 'oracao', label: 'Oração', icon: 'hands' },
    { value: 'gratidao', label: 'Gratidão', icon: 'heart' },
  ];

  useEffect(() => {
    loadReflections();
  }, []);

  async function loadReflections() {
    try {
      const response = await api.get('/reflections/public');
      setReflections(response.data);
    } catch (error) {
      console.error('Error loading reflections:', error);
      Alert.alert('Erro', 'Não foi possível carregar as reflexões');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openShareModal() {
    setContent('');
    setType('devocional');
    setModalVisible(true);
  }

  async function handleShare() {
    if (!content) {
      Alert.alert('Erro', 'Escreva sua reflexão');
      return;
    }

    try {
      await api.post('/reflections', {
        content,
        type,
        is_public: true,
      });

      setModalVisible(false);
      loadReflections();
      Alert.alert('Sucesso', 'Sua reflexão foi compartilhada!');
    } catch (error) {
      console.error('Error sharing reflection:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar a reflexão');
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadReflections();
  }

  function getTypeInfo(typeValue: string) {
    return types.find((t) => t.value === typeValue) || types[0];
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Comunidade</Text>
        <TouchableOpacity onPress={openShareModal}>
          <Ionicons name="add-circle" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {reflections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nenhuma reflexão compartilhada ainda
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Seja o primeiro a compartilhar!
            </Text>
            <TouchableOpacity onPress={openShareModal} style={[styles.shareButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.shareButtonText}>Compartilhar Reflexão</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reflections.map((reflection) => {
            const typeInfo = getTypeInfo(reflection.type);
            return (
              <View key={reflection.id} style={[styles.reflectionCard, { backgroundColor: theme.card }]}>
                <View style={styles.reflectionHeader}>
                  <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                      <Text style={styles.avatarText}>
                        {reflection.user_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.userName, { color: theme.text }]}>
                        {reflection.user_name}
                      </Text>
                      <View style={styles.metaInfo}>
                        <Ionicons name={typeInfo.icon as any} size={14} color={theme.textSecondary} />
                        <Text style={[styles.reflectionType, { color: theme.textSecondary }]}>
                          {typeInfo.label}
                        </Text>
                        <Text style={[styles.separator, { color: theme.textSecondary }]}>•</Text>
                        <Text style={[styles.reflectionDate, { color: theme.textSecondary }]}>
                          {new Date(reflection.date).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={[styles.reflectionContent, { color: theme.text }]}>
                  {reflection.content}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Compartilhar Reflexão
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Tipo de Reflexão</Text>
            <View style={styles.typeContainer}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: type === t.value ? theme.primary + '20' : theme.background,
                      borderColor: type === t.value ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <Ionicons name={t.icon as any} size={20} color={theme.primary} />
                  <Text style={[styles.typeOptionText, { color: theme.text }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Compartilhe sua reflexão..."
              placeholderTextColor={theme.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleShare}
            >
              <Text style={styles.saveButtonText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  shareButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reflectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reflectionHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reflectionType: {
    fontSize: 12,
  },
  separator: {
    fontSize: 12,
  },
  reflectionDate: {
    fontSize: 12,
  },
  reflectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
