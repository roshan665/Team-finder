import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Team, Hackathon, JoinRequest, Invitation } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { Users, Plus, Search, Filter, Trophy, Sparkles, Zap, X, CheckCircle2, AlertCircle, UserPlus, Mail, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TeamsProps {
  user: User;
}

export default function Teams({ user }: TeamsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null && search !== searchQuery) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ search: searchQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [searchQuery, setSearchParams]);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hackathonId: '',
    neededSkills: '',
  });

  useEffect(() => {
    // Fetch Hackathons for the dropdown
    const fetchHackathons = async () => {
      const hSnapshot = await getDocs(collection(db, 'hackathons'));
      setHackathons(hSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hackathon)));
    };
    fetchHackathons();

    // Real-time listener for teams
    const q = query(collection(db, 'teams'), where('status', '==', 'recruiting'));
    const unsubscribeTeams = onSnapshot(q, (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
      setLoading(false);
    });

    // Real-time listener for join requests (if leader)
    const qRequests = query(collection(db, 'joinRequests'), where('leaderId', '==', user.uid), where('status', '==', 'pending'));
    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      setJoinRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest)));
    });

    // Real-time listener for invitations (for current user)
    const qInvitations = query(collection(db, 'invitations'), where('inviteeId', '==', user.uid), where('status', '==', 'pending'));
    const unsubscribeInvitations = onSnapshot(qInvitations, (snapshot) => {
      setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
    });

    return () => {
      unsubscribeTeams();
      unsubscribeRequests();
      unsubscribeInvitations();
    };
  }, [user.uid]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const hackathon = hackathons.find(h => h.id === formData.hackathonId);
    
    const newTeam: Partial<Team> = {
      leaderId: user.uid,
      leaderName: user.name,
      title: formData.title,
      description: formData.description,
      hackathonId: formData.hackathonId,
      hackathonName: hackathon?.name || '',
      neededSkills: formData.neededSkills.split(',').map(s => s.trim()),
      members: [user.uid],
      status: 'recruiting',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'teams'), newTeam);
    setIsCreateModalOpen(false);
    setFormData({ title: '', description: '', hackathonId: '', neededSkills: '' });
  };

  const handleApply = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Create join request
    await addDoc(collection(db, 'joinRequests'), {
      teamId: teamId,
      teamName: team.title,
      leaderId: team.leaderId,
      applicantId: user.uid,
      applicantName: user.name,
      status: 'pending',
      createdAt: serverTimestamp(),
      message: `Hi! I'm ${user.name} and I'd love to join your team. I have skills in ${user.skills.join(', ')}.`,
    });

    // Create notification for team leader
    await addDoc(collection(db, 'notifications'), {
      userId: team.leaderId,
      title: 'New Join Request',
      message: `${user.name} wants to join your team "${team.title}".`,
      type: 'request',
      read: false,
      createdAt: serverTimestamp(),
      link: `/teams`,
    });

    alert('Application sent successfully!');
  };

  const handleInvite = async (invitee: User) => {
    if (!selectedTeam) return;

    // Check if already a member
    if (selectedTeam.members.includes(invitee.uid)) {
      alert('User is already a member of this team.');
      return;
    }

    // Create invitation
    await addDoc(collection(db, 'invitations'), {
      teamId: selectedTeam.id,
      teamName: selectedTeam.title,
      leaderId: user.uid,
      leaderName: user.name,
      inviteeId: invitee.uid,
      inviteeName: invitee.name,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Create notification for invitee
    await addDoc(collection(db, 'notifications'), {
      userId: invitee.uid,
      title: 'Team Invitation',
      message: `${user.name} invited you to join team "${selectedTeam.title}".`,
      type: 'request',
      read: false,
      createdAt: serverTimestamp(),
      link: `/teams`,
    });

    alert(`Invitation sent to ${invitee.name}!`);
  };

  const handleAcceptRequest = async (request: JoinRequest) => {
    // 1. Update team members
    const teamRef = doc(db, 'teams', request.teamId);
    await updateDoc(teamRef, {
      members: arrayUnion(request.applicantId)
    });

    // 2. Update request status
    await updateDoc(doc(db, 'joinRequests', request.id), {
      status: 'accepted'
    });

    // 3. Notify applicant
    await addDoc(collection(db, 'notifications'), {
      userId: request.applicantId,
      title: 'Request Accepted',
      message: `Your request to join "${request.teamName}" has been accepted!`,
      type: 'acceptance',
      read: false,
      createdAt: serverTimestamp(),
      link: `/teams`,
    });
  };

  const handleRejectRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'joinRequests', requestId), {
      status: 'rejected'
    });
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    // 1. Update team members
    const teamRef = doc(db, 'teams', invitation.teamId);
    await updateDoc(teamRef, {
      members: arrayUnion(user.uid)
    });

    // 2. Update invitation status
    await updateDoc(doc(db, 'invitations', invitation.id), {
      status: 'accepted'
    });

    // 3. Notify leader
    await addDoc(collection(db, 'notifications'), {
      userId: invitation.leaderId,
      title: 'Invitation Accepted',
      message: `${user.name} has accepted your invitation to join "${invitation.teamName}"!`,
      type: 'acceptance',
      read: false,
      createdAt: serverTimestamp(),
      link: `/teams`,
    });
  };

  const handleRejectInvitation = async (invitationId: string) => {
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'rejected'
    });
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  useEffect(() => {
    if (!isInviteModalOpen) {
      setUserSearchQuery('');
      setSearchResults([]);
    }
  }, [isInviteModalOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) return;
    
    // For better search, we fetch all users and filter client-side
    // In a real large-scale app, we'd use a search service or name_lowercase field
    const snapshot = await getDocs(collection(db, 'users'));
    const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    
    const results = allUsers.filter(u => 
      u.uid !== user.uid && 
      (u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
       u.college.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
       u.skills.some(s => s.toLowerCase().includes(userSearchQuery.toLowerCase())))
    );
    
    setSearchResults(results);
  };

  const filteredTeams = teams.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.neededSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Find Your <span className="text-cyan-500">Team</span></h1>
          <p className="text-gray-500 text-sm sm:text-base">Browse recruiting teams or create your own project.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto bg-cyan-500 text-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-6 h-6" />
          Create Team
        </button>
      </header>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by team name or skills..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-cyan-500/50 transition-all text-sm sm:text-base"
          />
        </div>
        <button className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-bold text-gray-400">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      {/* Join Requests & Invitations */}
      <div className="grid sm:grid-cols-2 gap-8 mb-12">
        {/* Invitations for User */}
        {invitations.length > 0 && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-500" />
              Team Invitations
            </h2>
            <div className="space-y-4">
              {invitations.map(inv => (
                <div key={inv.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{inv.teamName}</div>
                    <div className="text-xs text-gray-500 truncate">Invited by {inv.leaderName}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptInvitation(inv)}
                      className="w-10 h-10 bg-cyan-500 text-black rounded-xl flex items-center justify-center hover:bg-cyan-400 transition-all"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(inv.id)}
                      className="w-10 h-10 bg-white/5 text-gray-400 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Requests for Leader */}
        {joinRequests.length > 0 && (
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Join Requests
            </h2>
            <div className="space-y-4">
              {joinRequests.map(req => (
                <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{req.applicantName}</div>
                    <div className="text-xs text-gray-500 truncate">Wants to join {req.teamName}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center hover:bg-purple-400 transition-all"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="w-10 h-10 bg-white/5 text-gray-400 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-8">
          {filteredTeams.length > 0 ? filteredTeams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] hover:border-cyan-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl -z-10 group-hover:bg-cyan-500/10 transition-all"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 truncate">{team.title}</h3>
                  <div className="flex items-center gap-2 text-cyan-500 text-[10px] font-bold uppercase tracking-widest truncate">
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    {team.hackathonName}
                  </div>
                </div>
                <div className="bg-white/5 text-gray-500 text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5 shrink-0">
                  {team.members.length} / 4
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-8 leading-relaxed line-clamp-2">
                {team.description}
              </p>

              <div className="space-y-4 mb-8">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Needed Skills</div>
                <div className="flex flex-wrap gap-2">
                  {team.neededSkills.map(skill => (
                    <span key={skill} className="bg-cyan-500/10 text-cyan-500 text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-cyan-500/10">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-white/5 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[#0a0a0a] overflow-hidden shrink-0">
                    <img src={`https://picsum.photos/seed/${team.leaderId}/100/100`} alt="Leader" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Leader</div>
                    <div className="text-sm font-bold">{team.leaderName}</div>
                  </div>
                </div>
                {team.leaderId === user.uid ? (
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setIsInviteModalOpen(true);
                        }}
                        className="bg-cyan-500/10 text-cyan-500 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </button>
                      <button className="text-gray-500 font-bold text-xs sm:text-sm hover:underline">Manage</button>
                    </div>
                    <button 
                      onClick={() => setTeamToDelete(team.id)}
                      className="text-red-500/50 hover:text-red-500 transition-colors p-2"
                      title="Delete Team"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(team.id)}
                    className="w-full sm:w-auto bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all shadow-lg"
                  >
                    Apply to Join
                  </button>
                )}
              </div>
            </motion.div>
          )) : (
            <div className="col-span-1 sm:col-span-2 py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem] sm:rounded-[2.5rem]">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="text-gray-500 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">No teams found</h3>
              <p className="text-gray-500">Try adjusting your search or create your own team!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleCreateTeam}>
                <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                      <Plus className="text-black w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black">Create Your Team</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Team Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Neural Navigators"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Select Hackathon</label>
                    <select
                      required
                      value={formData.hackathonId}
                      onChange={(e) => setFormData({ ...formData, hackathonId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                    >
                      <option value="">Select a Hackathon</option>
                      {hackathons.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Needed Skills (comma separated)</label>
                    <input
                      required
                      type="text"
                      value={formData.neededSkills}
                      onChange={(e) => setFormData({ ...formData, neededSkills: e.target.value })}
                      placeholder="e.g. React, Python, TensorFlow"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Project Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your project idea and what you're looking for..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition-all resize-none text-sm"
                    />
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-full sm:flex-1 px-6 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 bg-cyan-500 text-black px-6 py-4 rounded-xl font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 text-sm"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isInviteModalOpen && selectedTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
              className="relative w-full max-w-xl bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                    <UserPlus className="text-black w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black truncate">Invite Member</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest truncate">To {selectedTeam.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && searchUsers()}
                    placeholder="Search users by name..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                  />
                  <button
                    onClick={searchUsers}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-500 text-black px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-cyan-400 transition-all"
                  >
                    Search
                  </button>
                </div>

                <div className="space-y-3">
                  {searchResults.length > 0 ? searchResults.map(u => (
                    <div key={u.uid} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 overflow-hidden shrink-0">
                          <img src={u.photoURL || `https://picsum.photos/seed/${u.uid}/100/100`} alt={u.name} referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{u.name}</div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">{u.college}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInvite(u)}
                        className="bg-white/5 text-cyan-500 p-2 rounded-xl border border-cyan-500/20 hover:bg-cyan-500 hover:text-black transition-all shrink-0"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )) : userSearchQuery && (
                    <div className="text-center py-8 text-gray-500 text-sm">No users found. Try a different name.</div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-black/40 border-t border-white/5 shrink-0">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full px-6 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Team Confirmation Modal */}
      <AnimatePresence>
        {teamToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTeamToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black mb-2">Delete Team?</h2>
                <p className="text-gray-500 text-sm mb-8">This action cannot be undone. All team data and messages will be permanently removed.</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setTeamToDelete(null)}
                    className="w-full sm:flex-1 px-6 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(teamToDelete)}
                    className="w-full sm:flex-1 bg-red-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
