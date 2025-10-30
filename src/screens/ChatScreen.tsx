import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import ChatService, { Message, UserType } from '../services/ChatService';
import AuthService from '../services/AuthService';
import FoodSurplusService from '../services/FoodSurplusService';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FoodSurplus } from '../models/FoodSurplus';

export default function ChatScreen({ route, navigation }: any) {
  const { chatId, otherUserName: otherUserNameParam, otherUserType: otherUserTypeParam } = route.params || {};
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatArchived, setChatArchived] = useState(false);
  const [allowedToChat, setAllowedToChat] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(otherUserNameParam || null);
  const [otherUserType, setOtherUserType] = useState<UserType | null>(otherUserTypeParam || null);
  const flatListRef = useRef<FlatList>(null);
  
  // OTP confirmation states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [linkedSurplus, setLinkedSurplus] = useState<FoodSurplus | null>(null);
  const [otpType, setOtpType] = useState<'pickup' | 'delivery' | null>(null);

  useEffect(() => {
    (async () => {
      const u = await AuthService.getCurrentUser();
      setUser(u);
      const chat = await ChatService.getChatById(chatId);
      if (!chat || !u) return;
      const otherId = (chat.participants || []).find((pid) => pid !== u.id) || null;
      setOtherUserId(otherId);
      const oName = otherId ? (chat.participantNames?.[otherId] || otherUserNameParam || 'Unknown') : (otherUserNameParam || 'Unknown');
      setOtherUserName(oName);
      const rawType: UserType | null = otherId ? ((chat.participantTypes?.[otherId] as UserType) || otherUserTypeParam || 'ngo') : (otherUserTypeParam || 'ngo');
      setOtherUserType(rawType);

      // Load linked surplus data if available
      if (chat.deliverySurplusId) {
        try {
          const surplus = await FoodSurplusService.getFoodSurplusById(chat.deliverySurplusId);
          setLinkedSurplus(surplus);
        } catch (e) {
          console.warn('Failed to load linked surplus:', e);
        }
      }

      // Driver/Volunteer archival check
      if (chat?.deliverySurplusId && (u?.userType === 'driver' || u?.userType === 'volunteer')) {
        const surplus = await FoodSurplusService.getFoodSurplusById(chat.deliverySurplusId);
        const archived = surplus && (surplus.status === 'collected' || surplus.status === 'expired');
        if (archived) {
          setChatArchived(true);
          Alert.alert('Delivery Completed', 'This chat is archived because the delivery has been completed.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
      }

      // Enforce role-based restrictions
      const allowed = await isContactAllowed(u, otherId, rawType || 'ngo');
      setAllowedToChat(!!allowed);
      if (!allowed) {
        Alert.alert('Restricted', 'You can only chat with contacts linked to your active pickups/deliveries.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const unsub = ChatService.subscribeMessages(chatId, (msgs) => {
        setMessages(msgs);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      });
      return () => unsub();
    })();
  }, [chatId]);

  const isContactAllowed = async (self: any, targetId: string | null, targetTypeRaw: UserType): Promise<boolean> => {
    if (!self || !targetId) return false;
    const selfType: UserType = (self.userType === 'volunteer' ? 'driver' : self.userType);
    const targetType: UserType = (targetTypeRaw === 'volunteer' ? 'driver' : targetTypeRaw);

    try {
      if (selfType === 'ngo') {
        const claimed = await FoodSurplusService.getClaimedFoodSurplus(self.id);
        const active = claimed.filter(s => s.status === 'claimed');
        if (targetType === 'canteen') return active.some(s => s.canteenId === targetId);
        if (targetType === 'driver') return active.some(s => s.assignedDriverId === targetId);
        return false;
      }
      if (selfType === 'canteen') {
        const items = await FoodSurplusService.getFoodSurplusByCanteen(self.id);
        const active = items.filter(s => s.status === 'claimed');
        if (targetType === 'ngo') return active.some(s => s.claimedBy === targetId);
        if (targetType === 'driver') return active.some(s => s.assignedDriverId === targetId);
        return false;
      }
      if (selfType === 'driver') {
        const assigned = await FoodSurplusService.getDriverAssignedSurplus(self.id);
        const active = assigned.filter(s => s.status === 'claimed');
        if (targetType === 'ngo') return active.some(s => s.claimedBy === targetId);
        if (targetType === 'canteen') return active.some(s => s.canteenId === targetId);
        return false;
      }
      return false;
    } catch (e) {
      console.warn('Failed allowed check', e);
      return false;
    }
  };

  const asDisplayType = (type: UserType): 'ngo' | 'driver' | 'canteen' => {
    return (type === 'volunteer' ? 'driver' : type) as any;
  };

  const bubbleColor = (type: UserType, mine: boolean) => {
    const displayType = asDisplayType(type);
    if (mine) return '#4CAF50'; // my messages green
    switch (displayType) {
      case 'ngo': return '#4ECDC4';
      case 'driver': return '#45B7D1';
      case 'canteen': return '#FF6B6B';
      default: return '#95A5A6';
    }
  };

  const send = async () => {
    try {
      if (!user || !input.trim() || chatArchived || !allowedToChat) return;
      const senderType: UserType = user.userType; // keep original type for storage
      await ChatService.sendMessage(chatId, user.id, senderType, input.trim());
      setInput('');
    } catch (e) {
      console.error('Failed to send:', e);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleCall = async () => {
    try {
      if (!otherUserId) return;
      const d = await getDoc(doc(collection(db, 'users'), otherUserId));
      if (!d.exists()) return Alert.alert('Unavailable', 'Contact not found.');
      const data: any = d.data();
      const phone: string | undefined = data.contactNumber || data.phone || data.phoneNumber;
      if (!phone) return Alert.alert('Unavailable', 'This contact has no phone number.');
      const telUrl = `tel:${String(phone).replace(/[^+\d]/g, '')}`;
      const supported = await Linking.canOpenURL(telUrl);
      if (supported) await Linking.openURL(telUrl);
      else Alert.alert('Unavailable', 'Calling is not supported on this device.');
    } catch (e) {
      console.error('Call failed', e);
      Alert.alert('Error', 'Unable to start call.');
    }
  };

  // OTP confirmation functions
  const canShowPickupConfirmation = () => {
    return user?.userType === 'canteen' && 
           linkedSurplus && 
           linkedSurplus.status === 'claimed' && 
           linkedSurplus.assignedDriverId && 
           !linkedSurplus.driverPickupVerifiedAt;
  };

  const canShowDeliveryConfirmation = () => {
    return user?.userType === 'ngo' && 
           linkedSurplus && 
           linkedSurplus.status === 'claimed' && 
           linkedSurplus.assignedDriverId && 
           linkedSurplus.driverPickupVerifiedAt && 
           !linkedSurplus.ngoDeliveryVerifiedAt;
  };

  const startOtpConfirmation = (type: 'pickup' | 'delivery') => {
    setOtpType(type);
    setOtpInput('');
    setShowOtpInput(true);
  };

  const cancelOtpConfirmation = () => {
    setShowOtpInput(false);
    setOtpInput('');
    setOtpType(null);
  };

  const submitOtpConfirmation = async () => {
    try {
      if (!linkedSurplus || !otpInput.trim()) {
        Alert.alert('Enter code', 'Please enter the verification code.');
        return;
      }

      const code = otpInput.trim();
      const ref = doc(collection(db, 'foodSurplus'), linkedSurplus.id);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        Alert.alert('Error', 'Record not found.');
        return;
      }

      const data: any = snap.data();
      if (!data.deliveryCode) {
        Alert.alert('Not ready', 'No verification code set yet. Please wait for driver assignment.');
        return;
      }

      if (String(data.deliveryCode) !== code) {
        Alert.alert('Incorrect code', 'The code you entered does not match.');
        return;
      }

      if (otpType === 'pickup') {
        // Canteen confirming pickup
        await updateDoc(ref, { 
          driverPickupVerifiedAt: Timestamp.now(), 
          updatedAt: Timestamp.now() 
        });
        setLinkedSurplus(prev => prev ? { ...prev, driverPickupVerifiedAt: new Date() } : null);
        Alert.alert('Pickup confirmed', 'Pickup has been verified successfully!');
      } else if (otpType === 'delivery') {
        // NGO confirming delivery
        if (!data.driverPickupVerifiedAt) {
          Alert.alert('Not ready', 'Driver has not yet picked up this item from the canteen.');
          return;
        }
        await updateDoc(ref, { 
          ngoDeliveryVerifiedAt: Timestamp.now(), 
          status: 'collected',
          updatedAt: Timestamp.now() 
        });
        setLinkedSurplus(prev => prev ? { ...prev, ngoDeliveryVerifiedAt: new Date(), status: 'collected' } : null);
        Alert.alert('Delivery confirmed', 'Thank you for confirming the delivery!');
      }

      cancelOtpConfirmation();
    } catch (e) {
      console.error('OTP confirmation failed', e);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.senderId === user?.id;
    const color = bubbleColor(item.senderType, mine);
    const label = asDisplayType(item.senderType).toUpperCase();
    return (
      <View style={[styles.messageRow, mine ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, { backgroundColor: color }, mine ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={styles.text}>{item.text}</Text>
          <Text style={styles.meta}>{label}</Text>
        </View>
      </View>
    );
  };

  const headerSubtitleLabel = (t?: UserType | null) => (t ? asDisplayType(t).toUpperCase() : '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}> 
        <View>
          <Text style={styles.title}>{otherUserName || 'Chat'}</Text>
          <Text style={styles.subtitle}>Chatting with: {headerSubtitleLabel(otherUserType)}</Text>
        </View>
        <TouchableOpacity onPress={handleCall} style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
          <Ionicons name="call" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
      />

      {/* OTP Confirmation Section */}
      {(canShowPickupConfirmation() || canShowDeliveryConfirmation()) && !showOtpInput && (
        <View style={styles.otpPromptContainer}>
          <Text style={styles.otpPromptText}>
            {canShowPickupConfirmation() 
              ? 'Ready to confirm pickup?' 
              : 'Ready to confirm delivery?'}
          </Text>
          <TouchableOpacity
            style={styles.otpPromptButton}
            onPress={() => startOtpConfirmation(canShowPickupConfirmation() ? 'pickup' : 'delivery')}
          >
            <Text style={styles.otpPromptButtonText}>Enter Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* OTP Input Section */}
      {showOtpInput && (
        <View style={styles.otpInputContainer}>
          <Text style={styles.otpInputTitle}>
            {otpType === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
          </Text>
          <Text style={styles.otpInputSubtitle}>
            Enter the 4-digit verification code
          </Text>
          <TextInput
            style={styles.otpInput}
            value={otpInput}
            onChangeText={setOtpInput}
            placeholder="Enter code"
            keyboardType="numeric"
            maxLength={4}
            autoFocus
          />
          <View style={styles.otpButtonsContainer}>
            <TouchableOpacity
              style={styles.otpCancelButton}
              onPress={cancelOtpConfirmation}
            >
              <Text style={styles.otpCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.otpSubmitButton}
              onPress={submitOtpConfirmation}
            >
              <Text style={styles.otpSubmitButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {allowedToChat && !chatArchived && !showOtpInput && (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={chatArchived ? 'Chat archived' : (allowedToChat ? 'Type a message...' : 'Chat restricted to active deliveries')}
            value={input}
            onChangeText={setInput}
            editable={!chatArchived && allowedToChat}
          />
          <TouchableOpacity style={[styles.sendButton, (chatArchived || !allowedToChat) ? { backgroundColor: '#ccc' } : {}]} onPress={send} disabled={chatArchived || !allowedToChat}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  messageRow: { marginVertical: 6, flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  bubbleRight: { borderBottomRightRadius: 4 },
  text: { color: '#fff', fontSize: 14 },
  meta: { color: '#f0f0f0', fontSize: 10, marginTop: 4 },
  otpPromptContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  otpPromptText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  otpPromptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  otpPromptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpInputContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  otpInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  otpInputSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 5,
  },
  otpButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  otpCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpSubmitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  otpSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8 },
  sendButton: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
});