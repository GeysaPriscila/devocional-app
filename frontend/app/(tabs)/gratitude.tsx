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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

interface Gratitude {
  id: string;
  content: string;
  date: string;
}

export default function GratitudeScreen() {
  const { theme } = useTheme();
  const [gratitudes, setGratitudes] = useState<Gratitude[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    loadGratitudes();
  }, []);

  async function loadGratitudes() {
    try {
      const response = await api.get('/gratitudes');
      setGratitudes(response.data);
    } catch (error) {
      console.error('Error loading gratitudes:', error);
      Alert.alert('Erro', 'Não foi possível carregar as gratidões');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setContent('');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!content) {
      Alert.alert('Erro', 'Escreva sua gratidão');
      return;
    }

    try {
      await api.post('/gratitudes', {
        content,
        date: new Date().toISOString(),
      });

      setModalVisible(false);
      loadGratitudes();
    } catch (error) {
      console.error('Error saving gratitude:', error);
      Alert.alert('Erro', 'Não foi possível salvar a gratidão');
    }
  }

  async function handleDelete(gratitudeId: string) {
    Alert.alert(
      'Excluir Gratidão',
      'Tem certeza que deseja excluir esta gratidão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/gratitudes/${gratitudeId}`);
              loadGratitudes();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a gratidão');
            }
          },
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Diário de Gratidão</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {gratitudes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Comece seu diário de gratidão
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Registre as coisas pelas quais você é grato
            </Text>
            <TouchableOpacity onPress={openAddModal} style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.addButtonText}>Adicionar Gratidão</Text>
            </TouchableOpacity>
          </View>
        ) : (
          gratitudes.map((gratitude) => (
            <View key={gratitude.id} style={[styles.gratitudeCard, { backgroundColor: theme.card }]}>
              <View style={styles.gratitudeHeader}>
                <View style={[styles.heartIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="heart" size={20} color={theme.primary} />
                </View>
                <TouchableOpacity onPress={() => handleDelete(gratitude.id)}>
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.gratitudeContent, { color: theme.text }]}>
                {gratitude.content}
              </Text>

              <Text style={[styles.gratitudeDate, { color: theme.textSecondary }]}>
                {new Date(gratitude.date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          ))
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
                Nova Gratidão
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Hoje sou grato por..."
              placeholderTextColor={theme.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
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
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gratitudeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gratitudeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gratitudeContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  gratitudeDate: {
    fontSize: 12,
    textTransform: 'capitalize',
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
    maxHeight: '80%',
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
