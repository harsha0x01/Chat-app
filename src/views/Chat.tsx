import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { Chat, Message, User } from '../types';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import { format } from 'date-fns';
import { Lock, Send, Search, Image as ImageIcon, WifiOff, MessageSquare, Phone, Video, PhoneOff, Mic, MicOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useI18n } from '../contexts/I18nContext';

export function ChatView() {
  const { appUser } = useAuth();
  const { t } = useI18n();
  const isOnline = useOnlineStatus();
  
  const [chats, setChats] = useState<(Chat & { otherUser?: User })[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersSearch, setUsersSearch] = useState<User[]>([]);
  
  // Call simulation state
  const [callState, setCallState] = useState<{ type: 'audio' | 'video', status: 'calling' | 'connected' } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState?.status === 'connected') {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState?.status]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startCall = (type: 'audio' | 'video') => {
    setCallState({ type, status: 'calling' });
    setCallDuration(0);
    setIsMuted(false);
    // Simulate pickup after 3 seconds
    setTimeout(() => {
      setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 3000);
  };

  const endCall = () => {
    setCallState(null);
    setCallDuration(0);
  };

  useEffect(() => {
    if (!appUser) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', appUser.uid)
    );
    
    const unsub = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
      
      const populatedChats = await Promise.all(chatsData.map(async (chat) => {
        const otherUid = chat.participants.find(p => p !== appUser.uid);
        if (otherUid) {
          const userDoc = await getDoc(doc(db, 'users', otherUid));
          if (userDoc.exists()) {
            return { ...chat, otherUser: userDoc.data() as User };
          }
        }
        return chat;
      }));
      
      setChats(populatedChats.sort((a, b) => b.updatedAt - a.updatedAt));
    });
    
    return unsub;
  }, [appUser]);

  useEffect(() => {
    if (!appUser || !activeChat) return;
    
    const activeChatData = chats.find(c => c.id === activeChat);
    const otherUid = activeChatData?.participants.find(p => p !== appUser.uid);
    if (!otherUid) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', activeChat),
      orderBy('timestamp', 'asc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => {
        const data = d.data() as Message;
        // Decrypt on the fly
        if (data.encrypted && data.text) {
          data.text = decryptMessage(data.text, appUser.uid, otherUid);
        }
        return data;
      });
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    
    return unsub;
  }, [appUser, activeChat, chats]);

  const handleSearchUsers = async (queryText: string) => {
    setSearchQuery(queryText);
    if (queryText.length < 3) {
      setUsersSearch([]);
      return;
    }
    
    // In a real app we'd use Algolia or a better search structure. 
    // Here we'll just get all users and filter client side for prototype simplicity
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(d => d.data() as User)
      .filter(u => u.uid !== appUser?.uid && (u.displayName.toLowerCase().includes(queryText.toLowerCase()) || u.email.toLowerCase().includes(queryText.toLowerCase())));
      
    setUsersSearch(users);
  };

  const startChat = async (otherUser: User) => {
    if (!appUser) return;
    // Check if chat exists
    const existing = chats.find(c => c.participants.includes(otherUser.uid));
    if (existing) {
      setActiveChat(existing.id);
      setSearchQuery('');
      setUsersSearch([]);
      return;
    }
    
    // Create new chat
    const newChatRef = doc(collection(db, 'chats'));
    await setDoc(newChatRef, {
      participants: [appUser.uid, otherUser.uid],
      updatedAt: Date.now()
    });
    
    setActiveChat(newChatRef.id);
    setSearchQuery('');
    setUsersSearch([]);
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!appUser || !activeChat || !newMessage.trim()) return;
    
    const activeChatData = chats.find(c => c.id === activeChat);
    const otherUid = activeChatData?.participants.find(p => p !== appUser.uid);
    if (!otherUid) return;

    const text = newMessage.trim();
    setNewMessage('');
    
    const encryptedText = encryptMessage(text, appUser.uid, otherUid);
    
    await addDoc(collection(db, 'messages'), {
      chatId: activeChat,
      senderId: appUser.uid,
      text: encryptedText,
      timestamp: Date.now(),
      encrypted: true
    });
    
    await setDoc(doc(db, 'chats', activeChat), {
      updatedAt: Date.now(),
      lastMessage: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    }, { merge: true });
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-slate-900 relative">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {!isOnline && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
              <WifiOff className="w-3 h-3" />
              <span>{t('offline')}</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {searchQuery ? (
            <div className="p-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Users</h3>
              {usersSearch.map(u => (
                <div key={u.uid} onClick={() => startChat(u)} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                    {u.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{u.displayName}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat.id)}
                  className={`flex items-center gap-3 p-4 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 transition-colors ${activeChat === chat.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {chat.otherUser?.displayName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{chat.otherUser?.displayName}</p>
                      <span className="text-xs text-slate-400 shrink-0">{format(chat.updatedAt, 'HH:mm')}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{chat.lastMessage || '...'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      {activeChat ? (
        <div className={`flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden w-8 h-8 flex items-center justify-center text-slate-500 rounded-lg hover:bg-slate-100"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400">
                {chats.find(c => c.id === activeChat)?.otherUser?.displayName?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {chats.find(c => c.id === activeChat)?.otherUser?.displayName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Lock className="w-3 h-3" />
                  {t('encrypted')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => startCall('audio')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Voice Call">
                <Phone className="w-5 h-5" />
              </button>
              <button onClick={() => startCall('video')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Video Call">
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                {t('noMessages')}
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === appUser?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-700'}`}>
                      <p>{msg.text}</p>
                      <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {format(msg.timestamp, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form onSubmit={sendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
              <button type="button" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ImageIcon className="w-6 h-6" />
              </button>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-3xl relative flex items-center border border-transparent focus-within:border-emerald-500/30 transition-colors">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('typeMessage')}
                  className="w-full bg-transparent text-slate-900 dark:text-white px-5 py-3 outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full transition-colors shadow-sm"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/50">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">CipherChat</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Select a conversation or search for a user to start a secure, end-to-end encrypted chat.
            </p>
          </div>
        </div>
      )}

      {/* Call Overlay */}
      {callState && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto p-8 text-center relative">
            <div className="mb-8 relative">
              <div className={`w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold border-4 border-slate-700 z-10 relative ${callState.status === 'calling' ? 'animate-pulse' : ''}`}>
                {chats.find(c => c.id === activeChat)?.otherUser?.displayName?.charAt(0) || '?'}
              </div>
              {callState.status === 'calling' && (
                <>
                  <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                  <div className="absolute -inset-4 bg-emerald-500 rounded-full animate-pulse opacity-10"></div>
                </>
              )}
            </div>
            
            <h2 className="text-3xl font-semibold mb-2">
              {chats.find(c => c.id === activeChat)?.otherUser?.displayName}
            </h2>
            <p className="text-slate-400 mb-12 text-lg">
              {callState.status === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
            
            <div className="flex items-center gap-6 mt-auto mb-10">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button 
                onClick={endCall}
                className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
