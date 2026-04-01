import { useState, useEffect } from 'react';
import { User } from '../types';
import { db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { User as UserIcon, Github, ShieldCheck, BrainCircuit, Rocket, Edit3, Check, X, Trophy, Users, Zap, CheckCircle2, Camera, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import PhotoCapture from '../components/PhotoCapture';
import { fetchGithubRepoCount } from '../lib/github';
import { USER_ACHIEVEMENTS } from '../constants';

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    college: user.college || '',
    year: user.year || '',
    enrollmentNo: user.enrollmentNo || '',
    branch: user.branch || '',
    githubUsername: user.githubUsername || '',
    linkedinURL: user.linkedinURL || '',
    photoURL: user.photoURL || '',
    skills: [...user.skills],
    githubReposCount: user.githubReposCount || 0,
    achievements: user.achievements || [],
  });
  const [newSkill, setNewSkill] = useState('');

  const handleUpdate = async () => {
    try {
      let githubReposCount = formData.githubReposCount;
      
      // If github username changed and count is 0, try to fetch it
      if (formData.githubUsername && (formData.githubReposCount === 0 || formData.githubUsername !== user.githubUsername)) {
        try {
          githubReposCount = await fetchGithubRepoCount(formData.githubUsername);
        } catch (err) {
          console.error("Failed to fetch github repos:", err);
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        githubReposCount,
        hasCompletedProfile: true
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  const syncGithub = async () => {
    if (!formData.githubUsername) return;
    
    try {
      const count = await fetchGithubRepoCount(formData.githubUsername);
      
      // Also fetch skills from repos
      const response = await fetch(`https://api.github.com/users/${formData.githubUsername}/repos?sort=updated&per_page=100`);
      if (response.ok) {
        const repos = await response.json();
        const languages = new Set<string>(formData.skills);
        repos.forEach((repo: any) => {
          if (repo.language) languages.add(repo.language);
        });
        
        const skills = Array.from(languages);
        if (repos.some((r: any) => r.name.toLowerCase().includes('react'))) skills.push('React');
        if (repos.some((r: any) => r.name.toLowerCase().includes('node'))) skills.push('Node.js');
        if (repos.some((r: any) => r.name.toLowerCase().includes('tailwind'))) skills.push('Tailwind CSS');
        
        setFormData({
          ...formData,
          githubReposCount: count,
          skills: Array.from(new Set(skills))
        });
      } else {
        setFormData({
          ...formData,
          githubReposCount: count
        });
      }
      alert(`Synced! Found ${count} repositories.`);
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to sync with GitHub. Please check your username.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-20">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full">
          <div className="relative group shrink-0">
            {isEditing ? (
              <PhotoCapture 
                currentPhoto={formData.photoURL || user.photoURL}
                onCapture={(base64) => setFormData({ ...formData, photoURL: base64 })}
                className="w-24 h-24 sm:w-32 sm:h-32"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-cyan-500/10 border-2 border-cyan-500/20 overflow-hidden relative">
                <img 
                  src={formData.photoURL || user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-3xl sm:text-4xl font-black tracking-tight bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full focus:outline-none focus:border-cyan-500/50 mb-4"
                placeholder="Your Name"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 flex items-center justify-center sm:justify-start gap-3">
                {user.name}
                {user.isVerified && (
                  <div className="bg-green-500/10 text-green-500 p-1 rounded-full border border-green-500/20 shrink-0" title="Verified Student">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </h1>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-gray-500 text-xs sm:text-sm font-medium">
              <span className="flex items-center gap-1"><Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {user.college || 'No College Set'}</span>
              <span className="hidden sm:inline w-1 h-1 bg-gray-700 rounded-full"></span>
              <span>{user.year || 'No Year Set'}</span>
              {user.branch && (
                <>
                  <span className="hidden sm:inline w-1 h-1 bg-gray-700 rounded-full"></span>
                  <span>{user.branch}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm sm:text-base bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400"
            >
              <X className="w-5 h-5" /> Cancel
            </button>
          )}
          <button
            onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
            className={cn(
              "flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm sm:text-base",
              isEditing ? "bg-cyan-500 text-black hover:bg-cyan-400" : "bg-white/5 border border-white/10 hover:bg-white/10"
            )}
          >
            {isEditing ? <><Check className="w-5 h-5" /> Save Changes</> : <><Edit3 className="w-5 h-5" /> Edit Profile</>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="space-y-8">
          <section className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Social Links</h2>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">GitHub Username</label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={formData.githubUsername}
                        onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                        placeholder="username"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">LinkedIn URL</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={formData.linkedinURL}
                        onChange={(e) => setFormData({ ...formData, linkedinURL: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <a 
                    href={user.githubUsername ? `https://github.com/${user.githubUsername}` : '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className={cn(
                      "flex items-center justify-between p-4 bg-white/5 rounded-2xl transition-all",
                      user.githubUsername ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Github className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium">GitHub</span>
                    </div>
                    <span className="text-xs text-gray-500">{user.githubUsername || 'Not set'}</span>
                  </a>
                  <a 
                    href={user.linkedinURL || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className={cn(
                      "flex items-center justify-between p-4 bg-white/5 rounded-2xl transition-all",
                      user.linkedinURL ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </div>
                    <span className="text-xs text-gray-500">{user.linkedinURL ? 'Connected' : 'Not set'}</span>
                  </a>
                </>
              )}
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Trust Metrics</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Trust Score</span>
                  <span className="text-cyan-500 font-bold">{user.trustScore}/100</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${user.trustScore}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">GitHub Repos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{user.githubReposCount}</span>
                  {!isEditing && (
                    <button 
                      onClick={syncGithub}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-cyan-500"
                      title="Refresh GitHub Stats"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Achievements</h2>
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-2 w-full">
                  {USER_ACHIEVEMENTS.map((achievement) => {
                    const isSelected = formData.achievements.includes(achievement.label);
                    const Icon = {
                      Github, Trophy, BrainCircuit, Sparkles, Rocket, Zap, Users, ShieldCheck
                    }[achievement.icon] || Sparkles;

                    return (
                      <button
                        key={achievement.id}
                        onClick={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              achievements: formData.achievements.filter(a => a !== achievement.label)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              achievements: [...formData.achievements, achievement.label]
                            });
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                          isSelected 
                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-500" 
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isSelected ? "text-cyan-500" : "text-gray-500")} />
                        <span className="text-xs font-bold">{achievement.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  {user.achievements && user.achievements.length > 0 ? user.achievements.map((achievementLabel) => {
                    const achievement = USER_ACHIEVEMENTS.find(a => a.label === achievementLabel);
                    const Icon = achievement ? {
                      Github, Trophy, BrainCircuit, Sparkles, Rocket, Zap, Users, ShieldCheck
                    }[achievement.icon] || Sparkles : Sparkles;

                    return (
                      <div key={achievementLabel} className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center" title={achievementLabel}>
                        <Icon className="w-5 h-5 text-cyan-500" />
                      </div>
                    );
                  }) : (
                    <p className="text-gray-500 italic text-xs">No achievements selected.</p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Bio & Skills */}
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">About Me</h2>
            {isEditing ? (
              <div className="space-y-6">
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-cyan-500/50 transition-all resize-none text-sm"
                  rows={4}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="College"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="Year"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={formData.enrollmentNo}
                    onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                    placeholder="Enrollment No"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Branch"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none text-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400 leading-relaxed text-sm sm:text-lg">
                {user.bio || "No bio added yet. Tell the world what you're building!"}
              </p>
            )}
          </section>

          <section className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Technical Skills</h2>
              {isEditing && (
                <button 
                  onClick={syncGithub}
                  className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  Sync with GitHub <Zap className="w-3 h-3 fill-current" />
                </button>
              )}
            </div>
            
            {isEditing && (
              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill (e.g. React)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
                <button 
                  onClick={addSkill}
                  className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-cyan-400"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {formData.skills.length > 0 ? formData.skills.map(skill => (
                <div key={skill} className="bg-cyan-500/10 text-cyan-500 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-cyan-500/10 font-bold text-xs sm:text-sm flex items-center gap-2 group">
                  {skill}
                  {isEditing && (
                    <button 
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-gray-500 italic text-sm">No skills added yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
