import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { COLORS } from '../constants/wilayas';
import { sendMessage, subscribeToMessages, markMessagesAsRead } from '../services/chat';

I18nManager.forceRTL(true);

const ChatScreen = ({ route, navigation }) => {
  const { chatId, otherUserName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    markMessagesAsRead(chatId, user.uid);

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const result = await sendMessage({
      chatId,
      senderId: user.uid,
      senderName: user.fullName,
      text: messageText,
    });

    if (!result.success) {
      Alert.alert('خطأ', 'فشل إرسال الرسالة');
      setNewMessage(messageText);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
        <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{otherUserName?.charAt(0) || '?'}</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{otherUserName || 'محادثة'}</Text>
              <Text style={styles.headerSubtitle}>متصل الآن</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatText}>ابدأ المحادثة</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالتك..."
          placeholderTextColor={COLORS.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!newMessage.trim()}>
          <LinearGradient colors={newMessage.trim() ? [COLORS.primary, COLORS.primaryDark] : [COLORS.border, COLORS.border]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendButtonGradient}>
            <Text style={styles.sendButtonText}>←</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  headerInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, textAlign: 'right' },
  headerSubtitle: { fontSize: 11, color: COLORS.white, opacity: 0.8, textAlign: 'right' },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, elevation: 1 },
  senderName: { fontSize: 10, fontWeight: '600', color: COLORS.primary, marginBottom: 4, textAlign: 'right' },
  messageText: { fontSize: 14, color: COLORS.text, lineHeight: 20, textAlign: 'right' },
  myMessageText: { color: COLORS.white },
  messageTime: { fontSize: 9, color: COLORS.textSecondary, marginTop: 4, textAlign: 'left' },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { alignItems: 'center', marginTop: 100 },
  emptyChatIcon: { fontSize: 64, marginBottom: 12 },
  emptyChatText: { fontSize: 16, color: COLORS.textSecondary },
  inputContainer: { flexDirection: 'row-reverse', alignItems: 'flex-end', padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.text, maxHeight: 100, textAlign: 'right', borderWidth: 1, borderColor: COLORS.border },
  sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sendButtonText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
});

export default ChatScreen;
