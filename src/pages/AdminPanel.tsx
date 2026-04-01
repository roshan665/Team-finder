import React, { useState, useEffect } from 'react';
import { User, Organization, Hackathon, Team } from '../types';
import { db } from '../firebase';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Users, School, Trophy, Zap, LayoutDashboard, Plus, Trash2, Edit2, X, Search, Mail, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  user: User;
}

type AdminTab = 'dashboard' | 'users' | 'students' | 'hackathons' | 'teams' | 'organizations';

export default function AdminPanel({ user }: AdminPanelProps) {
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin' || user.email === 'as1917378@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ enrollmentNo: '', name: '', course: '', branch: '' });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHackathonModal, setShowHackathonModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newHackathon, setNewHackathon] = useState({ title: '', description: '', date: '', location: '' });
  const [newOrg, setNewOrg] = useState({ name: '', type: 'University' });
  const [editingHackathonId, setEditingHackathonId] = useState<string | null>(null);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);

  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHackathonId) {
        await updateDoc(doc(db, 'hackathons', editingHackathonId), {
          ...newHackathon,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'hackathons'), {
          ...newHackathon,
          participantsCount: 0,
          createdAt: serverTimestamp()
        });
      }
      setShowHackathonModal(false);
      setEditingHackathonId(null);
      setNewHackathon({ title: '', description: '', date: '', location: '' });
    } catch (error) {
      console.error('Save hackathon error:', error);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentId = newStudent.enrollmentNo.toUpperCase();
      await setDoc(doc(db, 'students', studentId), {
        name: newStudent.name,
        course: newStudent.course,
        branch: newStudent.branch,
        updatedAt: serverTimestamp()
      });
      setShowStudentModal(false);
      setEditingStudentId(null);
      setNewStudent({ enrollmentNo: '', name: '', course: '', branch: '' });
    } catch (error) {
      console.error('Save student error:', error);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrgId) {
        await updateDoc(doc(db, 'organizations', editingOrgId), {
          ...newOrg,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'organizations'), {
          ...newOrg,
          createdAt: serverTimestamp()
        });
      }
      setShowOrgModal(false);
      setEditingOrgId(null);
      setNewOrg({ name: '', type: 'University' });
    } catch (error) {
      console.error('Save organization error:', error);
    }
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ ...d.data() } as User))));
    const unsubOrgs = onSnapshot(collection(db, 'organizations'), (s) => setOrganizations(s.docs.map(d => ({ id: d.id, ...d.data() } as Organization))));
    const unsubHacks = onSnapshot(collection(db, 'hackathons'), (s) => setHackathons(s.docs.map(d => ({ id: d.id, ...d.data() } as Hackathon))));
    const unsubTeams = onSnapshot(collection(db, 'teams'), (s) => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() } as Team))));
    const unsubStudents = onSnapshot(collection(db, 'students'), (s) => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    setLoading(false);
    return () => {
      unsubUsers();
      unsubOrgs();
      unsubHacks();
      unsubTeams();
      unsubStudents();
    };
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="text-black w-7 h-7" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Admin <span className="text-cyan-500">Control</span></h1>
        </div>
        <p className="text-gray-500">Manage users, organizations, and platform features.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'students', label: 'Students DB', icon: School },
            { id: 'hackathons', label: 'Hackathons', icon: Trophy },
            { id: 'teams', label: 'Teams', icon: Zap },
            { id: 'organizations', label: 'Organizations', icon: School },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left",
                activeTab === tab.id ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <h2 className="text-2xl font-black mb-8">Platform Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { id: 'users', label: 'Total Users', value: users.length, icon: Users, color: 'text-cyan-500' },
                    { id: 'students', label: 'Verified Students', value: students.length, icon: School, color: 'text-blue-500' },
                    { id: 'teams', label: 'Active Teams', value: teams.length, icon: Zap, color: 'text-yellow-500' },
                    { id: 'organizations', label: 'Organizations', value: organizations.length, icon: School, color: 'text-purple-500' },
                    { id: 'hackathons', label: 'Hackathons', icon: Trophy, color: 'text-green-500' },
                  ].map((stat, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(stat.id as AdminTab)}
                      className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all hover:border-cyan-500/50 group"
                    >
                      <stat.icon className={cn("w-6 h-6 mb-4 transition-transform group-hover:scale-110", stat.color)} />
                      <div className="text-3xl font-black mb-1">{stat.value}</div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">User Directory</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete ALL non-admin users from Firestore?')) return;
                        try {
                          const nonAdmins = users.filter(u => u.role !== 'admin' && u.email !== 'as1917378@gmail.com');
                          for (const u of nonAdmins) {
                            await deleteDoc(doc(db, 'users', u.uid));
                          }
                          alert(`Deleted ${nonAdmins.length} non-admin users from Firestore.`);
                        } catch (error) {
                          console.error('Error deleting users:', error);
                          alert('Error deleting users. Check console.');
                        }
                      }}
                      className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm"
                    >
                      Delete All Non-Admins
                    </button>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-11 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 w-64"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4">
                  {users.map((u) => (
                    <div key={u.uid} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 font-bold text-lg">
                          {u.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold">{u.displayName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="w-3 h-3" /> {u.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          u.role === 'admin' ? "bg-purple-500/20 text-purple-500" : "bg-cyan-500/20 text-cyan-500"
                        )}>
                          {u.role}
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedUser(u);
                            setShowUserModal(true);
                          }}
                          className="p-2 hover:bg-cyan-500/20 hover:text-cyan-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="View Profile"
                        >
                          <UserIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete('users', u.uid)}
                          className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">Students Database</h2>
                  <button 
                    onClick={() => setShowStudentModal(true)}
                    className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="w-5 h-5" /> Add Student
                  </button>
                </div>
                <div className="grid gap-4">
                  {students.map((s) => (
                    <div key={s.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-bold text-lg">
                          <School className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold">{s.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="text-cyan-500">{s.id}</span> • {s.course} • {s.branch}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setNewStudent({ enrollmentNo: s.id, name: s.name, course: s.course, branch: s.branch });
                            setEditingStudentId(s.id);
                            setShowStudentModal(true);
                          }}
                          className="p-2 hover:bg-cyan-500/20 hover:text-cyan-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete('students', s.id)}
                          className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'hackathons' && (
              <motion.div key="hackathons" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">Hackathon Management</h2>
                  <button 
                    onClick={() => setShowHackathonModal(true)}
                    className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="w-5 h-5" /> Create New
                  </button>
                </div>
                <div className="grid gap-6">
                  {hackathons.map((h) => (
                    <div key={h.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:bg-white/10 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{h.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2">{h.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setNewHackathon({ title: h.title, description: h.description, date: h.date, location: h.location });
                              setEditingHackathonId(h.id);
                              setShowHackathonModal(true);
                            }}
                            className="p-2 hover:bg-cyan-500/20 hover:text-cyan-500 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete('hackathons', h.id)}
                            className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {h.date}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {h.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {h.participantsCount} Registered
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div key="teams" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-2xl font-black mb-8">Active Teams</h2>
                <div className="grid gap-4">
                  {teams.map((t) => (
                    <div key={t.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold mb-1">{t.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{t.members.length} Members</span>
                          <span>•</span>
                          <span className="text-cyan-500">{t.hackathonId}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete('teams', t.id)}
                        className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'organizations' && (
              <motion.div key="organizations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">Organizations</h2>
                  <button 
                    onClick={() => setShowOrgModal(true)}
                    className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="w-5 h-5" /> Add Organization
                  </button>
                </div>
                <div className="grid gap-4">
                  {organizations.map((o) => (
                    <div key={o.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                          <School className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1">{o.name}</h3>
                          <p className="text-sm text-gray-500">{o.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setNewOrg({ name: o.name, type: o.type });
                            setEditingOrgId(o.id);
                            setShowOrgModal(true);
                          }}
                          className="p-2 hover:bg-cyan-500/20 hover:text-cyan-500 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete('organizations', o.id)}
                          className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStudentModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black">{editingStudentId ? 'Edit Student' : 'Add Student'}</h3>
                <button onClick={() => { setShowStudentModal(false); setEditingStudentId(null); setNewStudent({ enrollmentNo: '', name: '', course: '', branch: '' }); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreateStudent} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Enrollment Number</label>
                  <input type="text" required disabled={!!editingStudentId} value={newStudent.enrollmentNo} onChange={e => setNewStudent({...newStudent, enrollmentNo: e.target.value.toUpperCase()})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50" placeholder="e.g. 0827CS211001" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                  <input type="text" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="Student Name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Course</label>
                  <input type="text" required value={newStudent.course} onChange={e => setNewStudent({...newStudent, course: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="e.g. B.Tech" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Branch</label>
                  <input type="text" required value={newStudent.branch} onChange={e => setNewStudent({...newStudent, branch: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="e.g. Computer Science" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25">
                  {editingStudentId ? 'Save Changes' : 'Add Student'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showHackathonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHackathonModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black">{editingHackathonId ? 'Edit Hackathon' : 'Create Hackathon'}</h3>
                <button onClick={() => { setShowHackathonModal(false); setEditingHackathonId(null); setNewHackathon({ title: '', description: '', date: '', location: '' }); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreateHackathon} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
                  <input required value={newHackathon.title} onChange={e => setNewHackathon({...newHackathon, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="Enter hackathon title" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Description</label>
                  <textarea required value={newHackathon.description} onChange={e => setNewHackathon({...newHackathon, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all h-32 resize-none" placeholder="Enter description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date</label>
                    <input required type="date" value={newHackathon.date} onChange={e => setNewHackathon({...newHackathon, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Location</label>
                    <input required value={newHackathon.location} onChange={e => setNewHackathon({...newHackathon, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="e.g. Online" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black text-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 mt-4">
                  {editingHackathonId ? 'Save Changes' : 'Create Hackathon'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showOrgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrgModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black">{editingOrgId ? 'Edit Organization' : 'Add Organization'}</h3>
                <button onClick={() => { setShowOrgModal(false); setEditingOrgId(null); setNewOrg({ name: '', type: 'University' }); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreateOrg} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Name</label>
                  <input required value={newOrg.name} onChange={e => setNewOrg({...newOrg, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="Enter organization name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                  <select value={newOrg.type} onChange={e => setNewOrg({...newOrg, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none">
                    <option value="University">University</option>
                    <option value="Company">Company</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black text-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 mt-4">
                  {editingOrgId ? 'Save Changes' : 'Add Organization'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black">User Profile</h3>
                <button onClick={() => { setShowUserModal(false); setSelectedUser(null); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 font-bold text-3xl">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt={selectedUser.name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    ) : (
                      selectedUser.displayName?.[0] || selectedUser.name?.[0] || 'U'
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{selectedUser.name || selectedUser.displayName}</h4>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> {selectedUser.email}
                    </p>
                    <div className={cn(
                      "inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      selectedUser.role === 'admin' ? "bg-purple-500/20 text-purple-500" : "bg-cyan-500/20 text-cyan-500"
                    )}>
                      {selectedUser.role}
                    </div>
                  </div>
                </div>
                
                {selectedUser.bio && (
                  <div>
                    <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Bio</h5>
                    <p className="text-gray-300 bg-white/5 p-4 rounded-xl">{selectedUser.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedUser.college && (
                    <div>
                      <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">College</h5>
                      <p className="text-gray-300">{selectedUser.college}</p>
                    </div>
                  )}
                  {selectedUser.branch && (
                    <div>
                      <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Branch</h5>
                      <p className="text-gray-300">{selectedUser.branch}</p>
                    </div>
                  )}
                  {selectedUser.year && (
                    <div>
                      <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Year</h5>
                      <p className="text-gray-300">{selectedUser.year}</p>
                    </div>
                  )}
                  {selectedUser.enrollmentNo && (
                    <div>
                      <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Enrollment No</h5>
                      <p className="text-gray-300">{selectedUser.enrollmentNo}</p>
                    </div>
                  )}
                </div>

                {selectedUser.skills && selectedUser.skills.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
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
