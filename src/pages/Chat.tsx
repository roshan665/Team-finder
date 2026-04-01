import React, { useState, useEffect, useRef } from 'react';
import { User, Team, Message } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { MessageSquare, Send, Users, Sparkles, Zap, Hash, Search, Info, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatProps {
  user: User;
}

export default function Chat({ user }: ChatProps) {
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Fetch teams where user is a member
    const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid));
    const unsubscribeTeams = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setMyTeams(teams);
      if (teams.length > 0 && !selectedTeam) {
        // Don't auto-select on mobile to show sidebar first
        if (window.innerWidth >= 768) {
          setSelectedTeam(teams[0]);
          setIsSidebarOpen(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeTeams();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedTeam) return;
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    // Real-time listener for messages in the selected team
    const q = query(
      collection(db, `teams/${selectedTeam.id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribeMessages();
  }, [selectedTeam?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeam) return;

    const messageData: Partial<Message> = {
      teamId: selectedTeam.id,
      senderId: user.uid,
      senderName: user.name,
      senderPhoto: user.photoURL,
      text: newMessage,
      createdAt: serverTimestamp(),
    };

    setNewMessage('');
    await addDoc(collection(db, `teams/${selectedTeam.id}/messages`), messageData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-4rem)] flex gap-6 relative overflow-hidden">
      {/* Teams Sidebar */}
      <div className={cn(
        "w-full md:w-80 bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-300 shrink-0",
        !isSidebarOpen && "hidden md:flex"
      )}>
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h2 className="text-xl sm:text-2xl font-black mb-6">Messages</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {myTeams.length > 0 ? myTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                setSelectedTeam(team);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group",
                selectedTeam?.id === team.id
                  ? "bg-cyan-500/10 border border-cyan-500/20"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                selectedTeam?.id === team.id ? "bg-cyan-500 text-black" : "bg-white/5 text-gray-500 group-hover:bg-white/10"
              )}>
                <Hash className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-sm sm:text-base">{team.title}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 truncate uppercase font-bold tracking-widest">{team.hackathonName}</div>
              </div>
              {selectedTeam?.id === team.id && (
                <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50 shrink-0"></div>
              )}
            </button>
          )) : (
            <div className="p-8 text-center text-gray-500 text-sm italic">
              You haven't joined any teams yet.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden relative transition-all duration-300",
        isSidebarOpen && "hidden md:flex"
      )}>
        {selectedTeam ? (
          <>
            {/* Chat Header */}
            <div className="p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 hover:bg-white/5 rounded-xl text-gray-500 shrink-0"
                >
                  <Users className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold truncate">{selectedTeam.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-medium truncate">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {selectedTeam.members.length} Members
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button className="p-2 sm:p-3 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                  <Info className="w-5 h-5" />
                </button>
                <button className="p-2 sm:p-3 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user.uid;
                const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={cn("flex gap-3 sm:gap-4", isMe ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 border-2 border-[#0a0a0a] overflow-hidden shrink-0", !showAvatar && "opacity-0")}>
                      <img src={msg.senderPhoto || `https://picsum.photos/seed/${msg.senderId}/100/100`} alt="Avatar" referrerPolicy="no-referrer" />
                    </div>
                    <div className={cn("max-w-[85%] sm:max-w-[70%] space-y-1", isMe ? "items-end" : "items-start")}>
                      {showAvatar && (
                        <div className={cn("text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1", isMe && "text-right")}>
                          {msg.senderName}
                        </div>
                      )}
                      <div className={cn(
                        "px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-sm leading-relaxed",
                        isMe ? "bg-cyan-500 text-black font-medium rounded-tr-none" : "bg-white/5 text-gray-300 rounded-tl-none border border-white/5"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-8 bg-black/40 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${selectedTeam.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 pr-14 sm:pr-16 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3 sm:px-4 bg-cyan-500 text-black rounded-xl font-bold hover:bg-cyan-400 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8">
              <MessageSquare className="text-gray-500 w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-4">No Chat Selected</h3>
            <p className="text-gray-500 max-w-sm text-sm sm:text-base">Select a team from the sidebar to start collaborating with your teammates.</p>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden mt-8 bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
            >
              View Teams
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
