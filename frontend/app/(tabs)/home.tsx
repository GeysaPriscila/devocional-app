import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';

interface Devotional {
  id: string;
  title: string;
  content: string;
  verse: string;
  verse_reference: string;
  music_suggestions: Array<{
    name: string;
    artist: string;
    country: string;
  }>;
  date: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevotional();
    scheduleDailyNotification();
  }, []);

  async function scheduleDailyNotification() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Devocional Diário',
          body: 'Seu devocional de hoje está pronto! 📖',
          sound: true,
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async function loadDevotional() {
    try {
      const response = await api.post('/devotionals/generate');
      setDevotional(response.data);
    } catch (error: any) {
      console.error('Error loading devotional:', error);
      Alert.alert('Erro', 'Não foi possível carregar o devocional');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleShare() {
    if (!devotional) return;

    const shareText = `📖 ${devotional.title}\n\n${devotional.content}\n\n"${devotional.verse}"\n- ${devotional.verse_reference}\n\n#DevocionalDiário`;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync('data:text/plain,' + encodeURIComponent(shareText));
      } else {
        Alert.alert('Compartilhar', shareText);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadDevotional();
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
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>Olá, {user?.name}</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social" size={24} color={theme.primary} />
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
        {devotional && (
          <>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Ionicons name="book" size={16} color="#FFFFFF" />
                <Text style={styles.badgeText}>Devocional do Dia</Text>
              </View>

              <Text style={[styles.title, { color: theme.text }]}>
                {devotional.title}
              </Text>

              <Text style={[styles.content, { color: theme.text }]}>
                {devotional.content}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.verseHeader}>
                <Ionicons name="quote" size={24} color={theme.accent} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Versículo do Dia
                </Text>
              </View>

              <Text style={[styles.verse, { color: theme.text }]}>
                "{devotional.verse}"
              </Text>

              <Text style={[styles.verseReference, { color: theme.textSecondary }]}>
                {devotional.verse_reference}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.musicHeader}>
                <Ionicons name="musical-notes" size={24} color={theme.accent} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Músicas Sugeridas
                </Text>
              </View>

              {devotional.music_suggestions.map((music, index) => (
                <View key={index} style={[styles.musicItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.musicIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="play" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.musicInfo}>
                    <Text style={[styles.musicName, { color: theme.text }]}>
                      {music.name}
                    </Text>
                    <Text style={[styles.musicArtist, { color: theme.textSecondary }]}>
                      {music.artist} • {music.country}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  musicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  verse: {
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  musicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  musicInfo: {
    flex: 1,
  },
  musicName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  musicArtist: {
    fontSize: 14,
  },
});
