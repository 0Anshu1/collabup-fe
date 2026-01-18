import React, { useState, useEffect, FormEvent } from 'react';
import { Users, MessageSquare, Calendar, Trophy, Send, X, Rocket } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, query, where, addDoc, onSnapshot, orderBy, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { getUserRole } from '../utils/getUserRole';
import { SOCKET_URL } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

interface Group {
  id: string;
  name: string;
  topic: string;
  college: string;
  memberCount: number;
  domain?: string; // Added for mentor/faculty filtering
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}


const CollegeCommunity = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ college: string; role: string; fullName: string; expertiseAreas?: string[]; researchAreas?: string[] } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const role = await getUserRole();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              college: data.college || data.instituteName || '',
              role: role || data.role || '',
              fullName: data.fullName || data.startupName || data.founderName || 'User',
              expertiseAreas: data.expertiseAreas || [],
              researchAreas: data.researchAreas || [],
            });
          } else {
            setError('User data not found. Please complete your profile.');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          setError('Failed to fetch user data.');
          setIsLoading(false);
          console.error('Error fetching user data:', err);
        }
      } else {
        setGroups([]);
        setEvents([]);
        setIsLoading(false);
      }
    });

    const fetchData = async () => {
      if (!currentUser || !userData) {
        return;
      }
      try {
        // Fetch groups
        let groupsQuery = query(collection(db, 'groups'));
        if (userData.role === 'student') {
          groupsQuery = query(collection(db, 'groups'), where('college', '==', userData.college));
        } else if (userData.role === 'mentor' && userData.expertiseAreas && userData.expertiseAreas.length > 0) {
          groupsQuery = query(collection(db, 'groups'), where('domain', 'in', userData.expertiseAreas));
        } else if (userData.role === 'faculty' && userData.researchAreas && userData.researchAreas.length > 0) {
          groupsQuery = query(collection(db, 'groups'), where('domain', 'in', userData.researchAreas));
        }
        const groupList: Group[] = [];
        const querySnapshot = await getDocs(groupsQuery);
        for (const groupDoc of querySnapshot.docs) {
          const membersSnapshot = await getDocs(collection(db, 'groups', groupDoc.id, 'group_members'));
          groupList.push({
            id: groupDoc.id,
            name: groupDoc.data().name,
            topic: groupDoc.data().topic,
            college: groupDoc.data().college,
            memberCount: membersSnapshot.size,
            domain: groupDoc.data().domain || '',
          });
        }
        setGroups(groupList);

        // Fetch events
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventList: Event[] = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '',
          date: doc.data().date || '',
          time: doc.data().time || '',
          location: doc.data().location || '',
        }));
        setEvents(eventList);
      } catch (err) {
        setError('Failed to load community data.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && userData) {
      fetchData();
    }

    // Initialize Socket.IO
    let socketCleanup: (() => void) | undefined;
    const initSocket = async () => {
      if (currentUser) {
        try {
          const token = await getIdToken(currentUser);
          const newSocket = io(SOCKET_URL, {
            auth: { token },
          });
          setSocket(newSocket);

          newSocket.on('connect_error', (err) => {
            setError('Failed to connect to chat server.');
            console.error('Socket connection error:', err);
          });

          socketCleanup = () => {
            newSocket.disconnect();
          };
        } catch (err) {
          setError('Failed to initialize chat.');
          console.error('Socket initialization error:', err);
        }
      }
    };

    initSocket();

    return () => {
      unsubscribeAuth();
      if (socketCleanup) socketCleanup();
    };
  }, [currentUser, userData]);

  const handleJoinGroup = async (group: Group) => {
    if (!currentUser || !userData) {
      setIsSignInModalOpen(true);
      return;
    }
    try {
      const memberRef = doc(db, 'groups', group.id, 'group_members', currentUser.uid);
      await setDoc(memberRef, {
        userId: currentUser.uid,
        joinedAt: new Date().toISOString(),
      });
      socket?.emit('joinGroup', { groupId: group.id, userName: userData.fullName });
      setGroups(groups.map(g => g.id === group.id ? { ...g, memberCount: g.memberCount + 1 } : g));
      setSelectedGroup(group);
      setIsChatModalOpen(true);
    } catch (err) {
      setError('Failed to join group.');
      console.error('Error joining group:', err);
    }
  };

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className={`text-6xl font-black mb-6 tracking-tight ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            College Community
          </h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {userData?.college ? `Welcome to ${userData.college}` : 'Connect with your campus and beyond'}
          </p>
        </div>

        {error && (
          <div className={`mb-8 p-6 rounded-3xl border flex items-center gap-4 animate-fade-in ${
            theme === 'dark' ? 'bg-rose-900/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
            <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading community...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                { icon: Users, label: 'Active Members', value: groups.reduce((sum, g) => sum + g.memberCount, 0) + '+', color: 'text-blue-600', bg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50' },
                { icon: MessageSquare, label: 'Study Groups', value: groups.length, color: 'text-emerald-600', bg: theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50' },
                { icon: Calendar, label: 'Upcoming Events', value: events.length, color: 'text-purple-600', bg: theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50' },
                { icon: Trophy, label: 'Success Stories', value: groups.length * 2 + '+', color: 'text-amber-600', bg: theme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-50' }
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-[2rem] shadow-sm border group hover:shadow-xl transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-800 hover:shadow-blue-500/10' 
                    : 'bg-white border-slate-100 hover:shadow-blue-500/5'
                }`}>
                  <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
                  <p className={`font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className={`p-10 rounded-[2.5rem] shadow-xl border transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' 
                  : 'bg-white border-slate-100 shadow-blue-500/5'
              }`}>
                <h2 className={`text-3xl font-black mb-10 flex items-center gap-4 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <Calendar className="text-purple-600" />
                  Upcoming Events
                </h2>
                {events.length === 0 ? (
                  <div className={`text-center py-12 rounded-[2rem] border-2 border-dashed transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No upcoming events found.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {events.map((event) => (
                      <div key={event.id} className={`group p-6 rounded-[2rem] border transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950/50 border-slate-800 hover:bg-slate-900 hover:shadow-purple-500/10' 
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-purple-500/5'
                      }`}>
                        <h3 className={`text-xl font-black mb-2 group-hover:text-purple-600 transition-colors duration-500 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>{event.title}</h3>
                        <div className={`flex flex-wrap gap-4 font-bold text-sm ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <span className="flex items-center gap-2">
                            <Calendar size={16} />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-2">
                            <Rocket size={16} className="rotate-90" />
                            {event.time}
                          </span>
                        </div>
                        <p className={`mt-4 font-medium flex items-center gap-2 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                          {event.location}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`p-10 rounded-[2.5rem] shadow-xl border transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' 
                  : 'bg-white border-slate-100 shadow-blue-500/5'
              }`}>
                <h2 className={`text-3xl font-black mb-10 flex items-center gap-4 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <MessageSquare className="text-blue-600" />
                  Active Study Groups
                </h2>
                {groups.length === 0 ? (
                  <div className={`text-center py-12 rounded-[2rem] border-2 border-dashed transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No study groups found for your college.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groups.map((group) => (
                      <div key={group.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 gap-6 ${
                        theme === 'dark' 
                          ? 'bg-slate-950/50 border-slate-800 hover:bg-slate-900 hover:shadow-blue-500/10' 
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-blue-500/5'
                      }`}>
                        <div>
                          <h3 className={`text-xl font-black mb-1 group-hover:text-blue-600 transition-colors duration-500 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>{group.name}</h3>
                          <p className={`font-bold text-sm mb-2 ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>{group.topic}</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                            theme === 'dark' 
                              ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' 
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {group.memberCount} Members
                          </span>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group)}
                          className={`px-8 py-3 rounded-xl font-black text-sm transition-all duration-500 hover:shadow-lg focus:ring-4 focus:ring-blue-500/50 outline-none ${
                            theme === 'dark'
                              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/20'
                              : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-blue-600/20'
                          }`}
                        >
                          Join Group
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {isSignInModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className={`rounded-[2.5rem] p-10 max-w-md w-full border shadow-2xl text-center relative overflow-hidden transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-colors duration-500 ${
                theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Join Community</h3>
              <p className={`text-lg font-medium mb-10 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Please sign in to access your college community and start collaborating.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setIsSignInModalOpen(false);
                    navigate('/login');
                  }}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all duration-500 focus:ring-4 focus:ring-blue-500/50 outline-none"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignInModalOpen(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-500 focus:ring-4 focus:ring-slate-500/50 outline-none ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isChatModalOpen && selectedGroup && (
          <ChatModal
            group={selectedGroup}
            socket={socket}
            currentUser={currentUser}
            userName={userData?.fullName || 'User'}
            onClose={() => setIsChatModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

const ChatModal = ({ group, socket, currentUser, userName, onClose }: { group: Group; socket: Socket | null; currentUser: User | null; userName: string; onClose: () => void }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !currentUser) {
      setError('You must be signed in to chat.');
      return;
    }

    const messagesQuery = query(collection(db, 'groups', group.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messageList);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, (err) => {
      setError('Failed to load messages.');
      console.error('Error fetching messages:', err);
    });

    socket.on('message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    socket.on('userJoined', ({ userId, userName }) => {
      setMessages((prev) => [...prev, {
        id: `join-${userId}-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `${userName} joined the group`,
        timestamp: new Date().toISOString(),
      }]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    socket.on('typing', ({ userName, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(userName)) {
          return [...prev, userName];
        } else if (!isTyping) {
          return prev.filter((name) => name !== userName);
        }
        return prev;
      });
    });

    socket.emit('joinGroup', { groupId: group.id, userName });

    return () => {
      unsubscribe();
      socket.off('message');
      socket.off('userJoined');
      socket.off('typing');
    };
  }, [socket, group.id, currentUser, userName]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !currentUser) {
      setError('Please enter a message or sign in.');
      return;
    }

    try {
      const message = {
        userId: currentUser.uid,
        userName,
        text: messageText,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'groups', group.id, 'messages'), message);
      socket.emit('sendMessage', { groupId: group.id, ...message });
      setMessageText('');
      socket.emit('typing', { groupId: group.id, isTyping: false });
    } catch (err) {
      setError('Failed to send message.');
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    socket?.emit('typing', { groupId: group.id, isTyping: !!e.target.value, userName });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className={`rounded-[2.5rem] p-8 max-w-2xl w-full border shadow-2xl h-[85vh] flex flex-col relative overflow-hidden transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{group.name}</h2>
            <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Active Community Chat</p>
          </div>
          <button onClick={onClose} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500 focus:ring-4 focus:ring-rose-500/20 outline-none ${
            theme === 'dark' 
              ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-900/30' 
              : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
          }`}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-2xl border font-bold flex items-center gap-3 transition-all duration-500 ${
            theme === 'dark' ? 'bg-rose-900/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
            <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto mb-8 p-6 rounded-[2rem] border space-y-4 transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.userId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
              {msg.userId === 'system' ? (
                <div className="w-full text-center my-2">
                  <span className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider transition-colors duration-500 ${
                    theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-200/50 text-slate-500'
                  }`}>
                    {msg.text}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className={`text-xs font-black uppercase tracking-wider transition-colors duration-500 ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>{msg.userName}</span>
                    <span className={`text-[10px] font-bold transition-colors duration-500 ${
                      theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
                    }`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl font-medium transition-all duration-500 ${
                    msg.userId === currentUser?.uid 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10' 
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </>
              )}
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className={`italic text-sm font-bold px-2 flex items-center gap-2 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <div className="flex gap-1">
                <div className={`w-1 h-1 rounded-full animate-bounce ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}`} />
                <div className={`w-1 h-1 rounded-full animate-bounce [animation-delay:0.2s] ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}`} />
                <div className={`w-1 h-1 rounded-full animate-bounce [animation-delay:0.4s] ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}`} />
              </div>
              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            className={`flex-1 p-5 rounded-2xl outline-none transition-all duration-500 font-medium border focus:ring-4 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-blue-500/20 focus:border-blue-500' 
                : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all duration-500 disabled:opacity-50 focus:ring-4 focus:ring-blue-500/50 outline-none"
            disabled={!messageText.trim()}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollegeCommunity;