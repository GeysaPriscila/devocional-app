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

interface Prayer {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}

export default function PrayersScreen() {
  const { theme } = useTheme();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('pendente');

  const categories = [
    { value: 'pendente', label: 'Pendente', icon: 'time', color: '#ED8936' },
    { value: 'respondida', label: 'Respondida', icon: 'checkmark-circle', color: '#48BB78' },
    { value: 'continua', label: 'Contínua', icon: 'repeat', color: '#4299E1' },
  ];

  useEffect(() => {
    loadPrayers();
  }, []);

  async function loadPrayers(filterCategory?: string | null) {
    try {
      const url = filterCategory ? `/prayers?category=${filterCategory}` : '/prayers';
      const response = await api.get(url);
      setPrayers(response.data);
    } catch (error) {
      console.error('Error loading prayers:', error);
      Alert.alert('Erro', 'Não foi possível carregar as orações');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingPrayer(null);
    setTitle('');
    setContent('');
    setCategory('pendente');
    setModalVisible(true);
  }

  function openEditModal(prayer: Prayer) {
    setEditingPrayer(prayer);
    setTitle(prayer.title);
    setContent(prayer.content);
    setCategory(prayer.category);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title || !content) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      if (editingPrayer) {
        await api.put(`/prayers/${editingPrayer.id}`, {
          title,
          content,
          category,
          date: new Date().toISOString(),
        });
      } else {
        await api.post('/prayers', {
          title,
          content,
          category,
          date: new Date().toISOString(),
        });
      }

      setModalVisible(false);
      loadPrayers(selectedCategory);
    } catch (error) {
      console.error('Error saving prayer:', error);
      Alert.alert('Erro', 'Não foi possível salvar a oração');
    }
  }

  async function handleDelete(prayerId: string) {
    Alert.alert(
      'Excluir Oração',
      'Tem certeza que deseja excluir esta oração?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/prayers/${prayerId}`);
              loadPrayers(selectedCategory);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a oração');
            }
          },
        },
      ]
    );
  }

  function filterByCategory(categoryValue: string | null) {
    setSelectedCategory(categoryValue);
    loadPrayers(categoryValue);
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Caderno de Orações</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: selectedCategory === null ? theme.primary : theme.card },
          ]}
          onPress={() => filterByCategory(null)}
        >
          <Text
            style={[
              styles.filterText,
              { color: selectedCategory === null ? '#FFF' : theme.text },
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === cat.value ? theme.primary : theme.card,
              },
            ]}
            onPress={() => filterByCategory(cat.value)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.value ? '#FFF' : cat.color}
            />
            <Text
              style={[
                styles.filterText,
                { color: selectedCategory === cat.value ? '#FFF' : theme.text },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {prayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nenhuma oração encontrada
            </Text>
            <TouchableOpacity onPress={openAddModal} style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.addButtonText}>Adicionar Oração</Text>
            </TouchableOpacity>
          </View>
        ) : (
          prayers.map((prayer) => {
            const cat = categories.find((c) => c.value === prayer.category);
            return (
              <TouchableOpacity
                key={prayer.id}
                style={[styles.prayerCard, { backgroundColor: theme.card }]}
                onLongPress={() => openEditModal(prayer)}
              >
                <View style={styles.prayerHeader}>
                  <View style={styles.prayerTitleRow}>
                    <Ionicons name={cat?.icon as any} size={20} color={cat?.color} />
                    <Text style={[styles.prayerTitle, { color: theme.text }]}>
                      {prayer.title}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(prayer.id)}>
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.prayerContent, { color: theme.textSecondary }]}>
                  {prayer.content}
                </Text>

                <View style={styles.prayerFooter}>
                  <View style={[styles.categoryBadge, { backgroundColor: cat?.color + '20' }]}>
                    <Text style={[styles.categoryText, { color: cat?.color }]}>
                      {cat?.label}
                    </Text>
                  </View>
                  <Text style={[styles.prayerDate, { color: theme.textSecondary }]}>
                    {new Date(prayer.date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </TouchableOpacity>
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
                {editingPrayer ? 'Editar Oração' : 'Nova Oração'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Título"
                placeholderTextColor={theme.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Escreva sua oração..."
                placeholderTextColor={theme.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
              />

              <Text style={[styles.label, { color: theme.text }]}>Categoria</Text>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: category === cat.value ? cat.color + '20' : theme.background,
                        borderColor: category === cat.value ? cat.color : theme.border,
                      },
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                    <Text style={[styles.categoryOptionText, { color: theme.text }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </ScrollView>
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
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    marginTop: 16,
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
  prayerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  prayerContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prayerDate: {
    fontSize: 12,
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryContainer: {
    gap: 8,
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
