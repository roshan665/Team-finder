/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import Onboarding from './pages/Onboarding';
import StudentAuth from './pages/StudentAuth';
import Teams from './pages/Teams';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import { User } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Listen to user document changes
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // Create new user profile if it doesn't exist
            const isAdminEmail = firebaseUser.email === 'as1917378@gmail.com';
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || (isAdminEmail ? 'System Admin' : 'Anonymous'),
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              skills: [],
              trustScore: 70,
              githubReposCount: 0,
              achievements: [],
              role: isAdminEmail ? 'admin' : 'user',
              hasCompletedProfile: isAdminEmail,
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        if (unsubscribeUser) {
          unsubscribeUser();
          unsubscribeUser = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const showSidebar = user && user.hasCompletedProfile;
  const isAdmin = user?.role === 'admin' || user?.email === 'as1917378@gmail.com';

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white flex">
        {showSidebar && <Sidebar user={user} />}
        <main className={cn(
          "flex-1 transition-all duration-300",
          showSidebar ? "lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8" : "p-0"
        )}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={user ? (user.hasCompletedProfile ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <LandingPage />} />
            <Route path="/auth" element={user ? (user.hasCompletedProfile ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <StudentAuth />} />
            <Route path="/admin/login" element={user ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/" />) : <AdminLogin />} />

            {/* Student Protected Routes */}
            <Route path="/onboarding" element={user ? (user.hasCompletedProfile ? <Navigate to="/dashboard" /> : <Onboarding user={user} onComplete={(updatedUser) => setUser(updatedUser)} />) : <Navigate to="/" />} />
            <Route path="/dashboard" element={user?.hasCompletedProfile ? <Dashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/teams" element={user?.hasCompletedProfile ? <Teams user={user} /> : <Navigate to="/" />} />
            <Route path="/chat" element={user?.hasCompletedProfile ? <Chat user={user} /> : <Navigate to="/" />} />
            <Route path="/profile" element={user?.hasCompletedProfile ? <Profile user={user} /> : <Navigate to="/" />} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={isAdmin ? <AdminPanel user={user} /> : <Navigate to="/admin/login" />} />

            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-screen text-center p-6">
                <h1 className="text-6xl font-black mb-4">404</h1>
                <p className="text-gray-500 mb-8">Page not found.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-cyan-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-cyan-400 transition-all"
                >
                  Back to Login
                </button>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

