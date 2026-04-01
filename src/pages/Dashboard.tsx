import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Team, Hackathon, Notification, JoinRequest } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, ShieldCheck, Github, Trophy, Users, Zap, Search, MessageSquare, BrainCircuit, X, Bell, Check, Trash2, ExternalLink, CheckCircle2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [recommendedTeams, setRecommendedTeams] = useState<Team[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [activeHackathons, setActiveHackathons] = useState<Hackathon[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<User | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    // Fetch active hackathons
    const hQuery = query(collection(db, 'hackathons'), where('status', '==', 'active'), limit(3));
    const unsubscribeHackathons = onSnapshot(hQuery, (snapshot) => {
      setActiveHackathons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hackathon)));
    });

    // Fetch other users for discovery
    const uQuery = query(collection(db, 'users'), limit(10));
    const unsubscribeUsers = onSnapshot(uQuery, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as User))
        .filter(u => u.uid !== user.uid);
      setDiscoverUsers(users);
    });

    // Fetch my teams (where I am leader)
    const myTQuery = query(collection(db, 'teams'), where('leaderId', '==', user.uid));
    const unsubscribeMyTeams = onSnapshot(myTQuery, (snapshot) => {
      setMyTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
    });

    // Fetch recommended teams based on user skills
    const tQuery = query(collection(db, 'teams'), where('status', '==', 'recruiting'), limit(4));
    const unsubscribeTeams = onSnapshot(tQuery, (snapshot) => {
      const allTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      // Simple matching logic: teams that need at least one of the user's skills
      const matched = allTeams.filter(t => t.neededSkills.some(s => user.skills.includes(s)));
      setRecommendedTeams(matched.length > 0 ? matched : allTeams.slice(0, 2));
    });

    return () => {
      unsubscribeHackathons();
      unsubscribeUsers();
      unsubscribeMyTeams();
      unsubscribeTeams();
    };
  }, [user.uid, user.skills]);

  const handleInviteUser = async (teamId: string) => {
    if (!selectedUserToInvite) return;
    setIsInviting(true);

    try {
      const team = myTeams.find(t => t.id === teamId);
      if (!team) return;

      // Check if already invited
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', selectedUserToInvite.uid),
        where('teamId', '==', teamId),
        where('type', '==', 'invitation')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        alert('User already invited to this team');
        return;
      }

      await addDoc(collection(db, 'notifications'), {
        userId: selectedUserToInvite.uid,
        teamId: teamId,
        title: 'Team Invitation',
        message: `${user.name} invited you to join "${team.title}"`,
        type: 'invitation',
        read: false,
        createdAt: serverTimestamp(),
        link: '/teams',
      });

      setIsInviteModalOpen(false);
      setSelectedUserToInvite(null);
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleAskAi = async (queryText?: string) => {
    const textToAsk = queryText || aiQuery;
    if (!textToAsk.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please configure it in the environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are TeamUp AI Assistant. Help the user with their team formation and skill development. User Profile: ${JSON.stringify(user)}. User Question: ${textToAsk}`,
      });
      setAiResponse(response.text || 'Sorry, I could not generate a response.');
    } catch (error: any) {
      console.error('AI Error:', error);
      setAiResponse(`An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
            Welcome back, {user.name.split(' ')[0]} 👋
            {user.isVerified && (
              <div className="bg-green-500/10 text-green-500 p-1 rounded-full border border-green-500/20" title="Verified Student">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            )}
          </h1>
          <p className="text-gray-500 text-xs sm:text-base">
            {user.course && user.branch ? `${user.course} • ${user.branch}` : "Here's what's happening in your network today."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="w-full sm:w-auto bg-cyan-500 text-black px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 text-sm sm:text-base"
          >
            <Sparkles className="w-5 h-5" />
            Ask AI
          </button>
        </div>
      </header>

      <div className="space-y-6 sm:space-y-8 mb-12">
        {/* Main Stats & Recommendations */}
        <div className="space-y-6 sm:space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trust Score</span>
                <ShieldCheck className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mb-2">{user.trustScore}<span className="text-lg text-gray-600 font-medium">/100</span></div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: `${user.trustScore}%` }}></div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Skills</span>
                <BrainCircuit className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mb-2">{user.skills.length}</div>
              <div className="text-xs text-gray-500 font-medium">Auto-detected</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl xs:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GitHub</span>
                <Github className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mb-2">{user.githubReposCount}</div>
              <div className="text-xs text-gray-500 font-medium">Public Repos</div>
            </div>
          </div>

          {/* Discover Teammates */}
          <section className="mb-8 sm:mb-12 overflow-hidden">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                  <Users className="text-cyan-500 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight">Discover Teammates</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Find the perfect match for your team</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
              {discoverUsers.map((u, i) => (
                <motion.div
                  key={u.uid}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="min-w-[240px] sm:min-w-[280px] bg-white/5 border border-white/10 rounded-[2rem] p-5 sm:p-6 snap-start hover:bg-white/[0.08] transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-800 border-2 border-white/5 overflow-hidden shrink-0">
                      <img src={u.photoURL || `https://picsum.photos/seed/${u.uid}/100/100`} alt={u.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base truncate">{u.name}</h3>
                      <p className="text-[10px] text-gray-500 truncate">{u.college}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex flex-wrap gap-1.5">
                      {u.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="bg-cyan-500/10 text-cyan-500 text-[8px] sm:text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">
                          {skill}
                        </span>
                      ))}
                      {u.skills.length > 3 && (
                        <span className="text-[8px] text-gray-500 font-bold">+{u.skills.length - 3}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUserToInvite(u);
                      setIsInviteModalOpen(true);
                    }}
                    className="w-full bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all"
                  >
                    Invite to Team
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Active Hackathons */}
          <section className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                  <Trophy className="text-cyan-500 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight">Hackathons</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Open for registration</p>
                </div>
              </div>
              <Link to="/teams" className="text-xs sm:text-sm font-bold text-cyan-500 hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeHackathons.slice(0, 3).map((hackathon, i) => (
                <motion.div
                  key={hackathon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative p-5 sm:p-6 bg-white/5 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] hover:bg-white/[0.08] transition-all"
                >
                  <div className="absolute top-5 sm:top-6 right-5 sm:right-6">
                    <div className="bg-cyan-500 text-black text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest">
                      Active
                    </div>
                  </div>
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-2 truncate pr-12">{hackathon.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{hackathon.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{new Date(hackathon.deadline).toLocaleDateString()}</span>
                    </div>
                    <Link
                      to="/teams"
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-cyan-500 transition-all shadow-lg"
                    >
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    </Link>
                  </div>
                </motion.div>
              ))}
              {activeHackathons.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
                  <p className="text-gray-500 font-bold">No active hackathons at the moment.</p>
                </div>
              )}
            </div>
          </section>

          {/* AI Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                AI Recommendations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {recommendedTeams.length > 0 ? recommendedTeams.map((team) => (
                <div key={team.id} className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] hover:border-cyan-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">{team.title}</h3>
                      <p className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest truncate">{team.hackathonName}</p>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-500 text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">
                      {team.neededSkills.some(s => user.skills.includes(s)) ? '90% Match' : 'New Team'}
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed line-clamp-2">
                    {team.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                    {team.neededSkills.slice(0, 3).map(skill => (
                      <span key={skill} className="bg-white/5 text-gray-400 text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-1.5 rounded-lg uppercase tracking-widest">{skill}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {team.members.map(m => (
                        <div key={m} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#0a0a0a] bg-gray-800 overflow-hidden">
                          <img src={`https://picsum.photos/seed/${m}/100/100`} alt="Avatar" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <Link 
                      to={`/teams?search=${encodeURIComponent(team.title)}`}
                      className="bg-cyan-500 text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-cyan-400 transition-all"
                    >
                      View Team
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="col-span-full p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-gray-500">
                  No recommendations yet. Join some hackathons to get started!
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-black w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">AI Assistant</h2>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 sm:p-8 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto space-y-6">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    <p className="text-cyan-500 font-bold animate-pulse text-sm">Analyzing your request...</p>
                  </div>
                ) : aiResponse ? (
                  <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-2xl leading-relaxed text-gray-300 text-sm">
                    <div className="flex items-center gap-2 text-cyan-500 font-bold mb-4 uppercase tracking-widest text-[10px]">
                      <Sparkles className="w-3.5 h-3.5" /> AI Recommendation
                    </div>
                    {aiResponse}
                    <button
                      onClick={() => { setAiResponse(''); setAiQuery(''); }}
                      className="mt-6 text-xs sm:text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                    >
                      Ask another question <Zap className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { title: 'Find Best Team', desc: 'AI-matched teams based on your skills', icon: Users },
                      { title: 'Skill Suggestions', desc: 'What skills to learn next', icon: BrainCircuit },
                      { title: 'Analyze Profile', desc: 'Strengths & improvement areas', icon: Zap },
                      { title: 'Hackathon Ideas', desc: 'Project ideas for your skills', icon: Trophy },
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => { setAiQuery(opt.title); handleAskAi(opt.title); }}
                        className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/50 hover:bg-white/[0.08] transition-all text-left group"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500 transition-colors shrink-0">
                          <opt.icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 group-hover:text-black transition-colors" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm mb-0.5">{opt.title}</div>
                          <div className="text-[10px] text-gray-500">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8 bg-black/40 border-t border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                    placeholder="Ask me anything..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 pr-14 sm:pr-16 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                  />
                  <button
                    onClick={() => handleAskAi()}
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3 sm:px-4 bg-cyan-500 text-black rounded-xl font-bold hover:bg-cyan-400 transition-all disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && selectedUserToInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-black">Invite {selectedUserToInvite.name.split(' ')[0]}</h2>
                <button onClick={() => setIsInviteModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 sm:p-8 space-y-4">
                <p className="text-gray-500 text-sm">Select a team to invite this user to:</p>
                {myTeams.length > 0 ? (
                  <div className="space-y-2">
                    {myTeams.map(team => (
                      <button
                        key={team.id}
                        disabled={isInviting}
                        onClick={() => handleInviteUser(team.id)}
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/50 hover:bg-white/[0.08] transition-all text-left flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-sm">{team.title}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest">{team.hackathonName}</div>
                        </div>
                        <Check className="w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm italic">You don't lead any teams yet.</p>
                    <Link to="/teams" className="text-cyan-500 text-xs font-bold hover:underline mt-2 inline-block">Create a team</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
