import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User as UserIcon, Users, Trophy, MessageSquare, LogOut, ShieldCheck, Bell, Menu, X as CloseIcon, Check, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, addDoc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { User, Notification, JoinRequest } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    // Fetch notifications
    const nQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeNotifications = onSnapshot(nQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    // Fetch join requests for teams owned by user
    const rQuery = query(collection(db, 'joinRequests'), where('status', '==', 'pending'));
    const unsubscribeRequests = onSnapshot(rQuery, async (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest));
      
      // Filter requests for teams owned by the user
      const myTeamsQuery = query(collection(db, 'teams'), where('leaderId', '==', user.uid));
      const myTeamsSnapshot = await getDocs(myTeamsQuery);
      const myTeamIds = myTeamsSnapshot.docs.map(d => d.id);
      
      setJoinRequests(requests.filter(r => myTeamIds.includes(r.teamId)));
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeRequests();
    };
  }, [user.uid]);

  const isAdmin = user.role === 'admin' || user.email === 'as1917378@gmail.com';

  const handleLogout = async () => {
    const wasAdmin = isAdmin;
    await signOut(auth);
    if (wasAdmin) {
      navigate('/admin/login');
    } else {
      navigate('/');
    }
  };

  const handleAcceptRequest = async (request: JoinRequest) => {
    // Add user to team members
    await updateDoc(doc(db, 'teams', request.teamId), {
      members: arrayUnion(request.applicantId)
    });

    // Update request status
    await updateDoc(doc(db, 'joinRequests', request.id), {
      status: 'accepted'
    });

    // Notify applicant
    await addDoc(collection(db, 'notifications'), {
      userId: request.applicantId,
      title: 'Request Accepted!',
      message: `You have been accepted into the team. Start chatting now!`,
      type: 'acceptance',
      read: false,
      createdAt: serverTimestamp(),
      link: '/chat',
    });
  };

  const handleRejectRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'joinRequests', requestId), {
      status: 'rejected'
    });
  };

  const markNotificationRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const navItems = isAdmin 
    ? [{ label: 'Admin Panel', icon: ShieldCheck, path: '/admin' }]
    : [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Profile', icon: UserIcon, path: '/profile' },
        { label: 'Teams', icon: Users, path: '/teams' },
        { label: 'Hackathons', icon: Trophy, path: '/hackathons' },
        { label: 'Chat', icon: MessageSquare, path: '/chat' },
      ];

  const totalAlerts = unreadCount + joinRequests.length;

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Users className="text-black w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TeamUp <span className="text-cyan-500">AI</span></h1>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path
                ? "bg-cyan-500/10 text-cyan-500"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn(
                "w-5 h-5",
                location.pathname === item.path ? "text-cyan-500" : "text-gray-400 group-hover:text-white"
              )} />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}

        {!isAdmin && (
          <button
            onClick={() => {
              setIsAlertsOpen(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-gray-400 hover:text-white hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400 group-hover:text-white" />
              <span className="font-medium">Alerts</span>
            </div>
            {totalAlerts > 0 && (
              <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
            )}
          </button>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[#0a0a0a] overflow-hidden">
            <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Me" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{user.name}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trust: {user.trustScore}</div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout / Back to Login</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center text-cyan-500 shadow-xl"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-[#0a0a0a] border-r border-white/10 h-screen fixed left-0 top-0 flex-col z-50">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-r border-white/10 z-[80] shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alerts Modal */}
      <AnimatePresence>
        {isAlertsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAlertsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <Bell className="text-cyan-500 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">Alerts & Requests</h2>
                </div>
                <button
                  onClick={() => setIsAlertsOpen(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
                {/* Join Requests */}
                {joinRequests.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-cyan-500" />
                      Join Requests
                    </h3>
                    <div className="space-y-4">
                      {joinRequests.map((req) => (
                        <div key={req.id} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 overflow-hidden">
                              <img src={`https://picsum.photos/seed/${req.applicantId}/100/100`} alt="Applicant" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold">New Applicant</div>
                              <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest">Wants to join your team</div>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-400 mb-4 italic">"{req.message}"</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(req)}
                              className="flex-1 bg-cyan-500 text-black py-2 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-cyan-400 transition-all flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="flex-1 bg-white/5 text-gray-400 py-2 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Notifications */}
                <section>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-cyan-500" />
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={cn(
                          "p-4 rounded-2xl transition-all cursor-pointer border",
                          n.read ? "bg-transparent border-transparent opacity-50" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                        )}
                      >
                        <div className="font-bold text-sm mb-1">{n.title}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{n.message}</div>
                      </div>
                    )) : (
                      <p className="text-center text-gray-500 text-sm italic py-4">No new notifications</p>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
