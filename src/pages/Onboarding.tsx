import React, { useState } from 'react';
import { User } from '../types';
import { db, auth } from '../firebase';
import { doc, updateDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Rocket, AlertCircle, LogOut, User as UserIcon, ArrowRight } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { STUDENTS_DATA } from '../data/students';

interface OnboardingProps {
  user: User;
  onComplete: (user: User) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const navigate = useNavigate();
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentNo.trim()) return;

    setLoading(true);
    setError('');

    try {
      // 1. Check if enrollment_no exists in our local students data
      const studentRecord = STUDENTS_DATA[enrollmentNo.toUpperCase()];

      if (!studentRecord) {
        setError('Invalid Enrollment Number. Please check and try again.');
        setLoading(false);
        return;
      }

      // 2. Prevent duplicate usage of same enrollment number
      const q = query(
        collection(db, 'users'),
        where('enrollmentNo', '==', enrollmentNo.toUpperCase()),
        limit(1)
      );

      let userSnapshot;
      try {
        userSnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }

      if (userSnapshot && !userSnapshot.empty) {
        setError('Enrollment already used by another account.');
        setLoading(false);
        return;
      }

      const updatedUser: User = {
        ...user,
        name: studentRecord.name,
        enrollmentNo: studentRecord.college_id,
        course: studentRecord.course,
        branch: studentRecord.branch,
        college: studentRecord.college_name,
        hasCompletedProfile: true, // This maps to profile_completed
      };

      try {
        await updateDoc(doc(db, 'users', user.uid), updatedUser as any);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      
      onComplete(updatedUser);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      <button 
        onClick={handleLogout}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-widest z-10"
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" /> Back to Login
      </button>
      
      <div className="max-w-md w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-center mb-2">Complete Profile</h2>
          <p className="text-gray-400 text-center mb-8">
            Please enter your enrollment number to verify your student status.
          </p>

          <form onSubmit={handleComplete} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Enrollment Number</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-all uppercase"
                  placeholder="e.g. 0827CS211001"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !enrollmentNo.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify & Complete Profile
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
