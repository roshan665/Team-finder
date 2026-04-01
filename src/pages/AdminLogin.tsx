import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, LogIn, ArrowLeft, Lock, Mail, Sparkles, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('as1917378@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user.email === 'as1917378@gmail.com') {
        navigate('/admin');
      } else {
        setError('Unauthorized. Only the system administrator can access this portal.');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error('Google Login error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Admin account not found. Please click "Bootstrap Admin" below to create it.');
      } else {
        setError(err.message || 'Failed to sign in as admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrapAdmin = async () => {
    setBootstrapLoading(true);
    setError('');
    try {
      // Create the admin user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, 'as1917378@gmail.com', 'Admin@123');
      const firebaseUser = userCredential.user;

      // Create the admin profile in Firestore
      const adminProfile: User = {
        uid: firebaseUser.uid,
        name: 'System Admin',
        email: 'as1917378@gmail.com',
        photoURL: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
        skills: ['Management', 'Coordination', 'Strategy'],
        trustScore: 100,
        githubReposCount: 0,
        achievements: [],
        role: 'admin',
        hasCompletedProfile: true,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), adminProfile);
      setError('Admin account created successfully! You can now sign in.');
    } catch (err: any) {
      console.error('Bootstrap error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Admin account already exists. Try signing in with password: Admin@123');
      } else {
        setError(err.message || 'Failed to bootstrap admin');
      }
    } finally {
      setBootstrapLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-cyan-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-cyan-500/20"
          >
            <ShieldCheck className="text-black w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Admin <span className="text-cyan-500">Portal</span></h1>
          <p className="text-gray-500">Authorized personnel only. Please sign in with your administrator credentials.</p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl"
        >
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  required
                  type="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@college.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  required
                  type="password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <button
              disabled={loading || bootstrapLoading || googleLoading}
              type="submit"
              className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black text-lg hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  Sign in to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading || bootstrapLoading}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Chrome className="w-6 h-6" />
                  Sign in with Google
                </>
              )}
            </button>

            <button
              onClick={handleBootstrapAdmin}
              disabled={bootstrapLoading || loading || googleLoading}
              className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {bootstrapLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  Bootstrap Admin Account
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-white transition-colors text-sm font-bold flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Student Portal
            </button>
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
            Secure Environment • 256-bit Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
