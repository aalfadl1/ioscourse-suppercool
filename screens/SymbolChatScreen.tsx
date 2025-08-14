// screens/SymbolChatScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export type Message = { id: string; symbol: string; user_id: string; content: string; created_at: string };

export default function SymbolChatScreen() {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { symbol } = route.params;

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // initial load
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('symbol', symbol)
        .order('created_at', { ascending: true })
        .limit(200);
      if (!error && mounted && data) setMsgs(data as any);
    })();

    // realtime inserts
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `symbol=eq.${symbol}` }, (payload) => {
        setMsgs((prev) => [...prev, payload.new as any]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 10);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [symbol]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('messages').insert({ symbol, user_id: user.id, content });
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection:'row', justifyContent:'space-between' },
    title: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
    sub: { color: theme.colors.textSecondary },
    msgRow: { paddingHorizontal: 16, paddingVertical: 10 },
    msgMine: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary + '33', borderRadius: 12, padding: 10, maxWidth: '80%' },
    msgOther: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 10, maxWidth: '80%' },
    msgText: { color: theme.colors.text },
    meta: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
    inputBar: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card },
    input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, color: theme.colors.text },
    sendBtn: { paddingHorizontal: 16, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center' },
    sendTxt: { color: '#fff', fontWeight: '700' },
  }), [theme]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{symbol} Chat</Text>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={styles.sub}>Close</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            const mine = false; // cheap way, you can compare item.user_id === current user
            return (
              <View style={styles.msgRow}>
                <View style={mine ? styles.msgMine : styles.msgOther}>
                  <Text style={styles.msgText}>{item.content}</Text>
                  <Text style={styles.meta}>{new Date(item.created_at).toLocaleTimeString()}</Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputBar}>
          <TextInput value={input} onChangeText={setInput} placeholder="Message" placeholderTextColor={theme.colors.textSecondary} style={styles.input} />
          <TouchableOpacity onPress={send} style={styles.sendBtn}><Text style={styles.sendTxt}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}