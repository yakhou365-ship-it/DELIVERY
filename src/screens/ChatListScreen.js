import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS } from '../constants/wilayas';
import { getUserChats } from '../services/chat';

I18nManager.forceRTL(true);

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = getUserChats(user.uid, (chatsList) => {
      setChats(chatsList || []);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat', {
        chatId: item.id,
        otherUserName: user.role === 'driver' ? item.customerName : item.driverName,
      })}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.chatAvatarText}>
          {(user.role === 'driver' ? item.customerName : item.driverName)?.charAt(0) || '?'}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>
          {user.role === 'driver' ? item.customerName : item.driverName || 'محادثة'}
        </Text>
        <Text style={styles.chatLastMessage} numberOfLines={1}>
          {item.lastMessage || 'لا توجد رسائل بعد'}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={styles.chatTime}>
          {item.lastMessageTime
            ? new Date(item.lastMessageTime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
            : ''}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>المحادثات</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>لا توجد محادثات</Text>
              <Text style={styles.emptySubtitle}>ستظهر المحادثات هنا عندما تبدأ تواصل مع سائق أو عميل</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  listContent: { padding: 16 },
  chatCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10, elevation: 2 },
  chatAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 14 },
  chatAvatarText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  chatLastMessage: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: 4 },
  chatMeta: { alignItems: 'flex-end', gap: 6 },
  chatTime: { fontSize: 10, color: COLORS.textSecondary },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 80, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default ChatListScreen;
