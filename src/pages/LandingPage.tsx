import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase';
import { Github, LogIn, Users, Trophy, Sparkles, ShieldCheck, MessageSquare, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Users className="text-black w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">TeamUp <span className="text-cyan-500">AI</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#hackathons" className="hover:text-white transition-colors">Hackathons</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="text-sm font-medium hover:text-cyan-500 transition-colors">Admin Login</Link>
            <Link to="/auth" className="text-sm font-medium hover:text-cyan-500 transition-colors">Log in</Link>
            <Link to="/auth" className="bg-cyan-500 text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20">Sign up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 sm:mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Team Formation
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] sm:leading-[0.9] mb-6 sm:mb-8"
          >
            Find Your <span className="text-cyan-500">Dream Team</span> <br className="hidden sm:block" /> for Any Hackathon
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg md:text-xl mb-10 sm:mb-12 leading-relaxed"
          >
            TeamUp AI matches students with complementary skills using GitHub activity analysis, trust scoring, and smart recommendations. Stop searching — start building.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth" className="w-full sm:w-auto bg-cyan-500 text-black px-8 py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-cyan-400 transition-all flex items-center justify-center gap-3">
              Get Started Free <Zap className="w-5 h-5 fill-current" />
            </Link>
            <button onClick={handleGithubLogin} className="w-full sm:w-auto bg-white/5 border border-white/10 px-8 py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <Github className="w-5 h-5" /> Connect GitHub
            </button>
            <Link to="/admin/login" className="w-full sm:w-auto bg-white/5 border border-white/10 px-8 py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <LogIn className="w-5 h-5" /> Admin Login
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto border-t border-white/5 pt-10 sm:pt-12"
          >
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">2.4K+</div>
              <div className="text-[10px] sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Students</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">580+</div>
              <div className="text-[10px] sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Teams Formed</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">120+</div>
              <div className="text-[10px] sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Hackathons</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">Everything You Need to <span className="text-cyan-500">Build Great Teams</span></h2>
            <p className="text-gray-500 text-base sm:text-lg">From skill analysis to team communication — all powered by AI.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'GitHub Skill Detection', icon: Github, desc: 'Auto-detect languages, frameworks, and expertise from your GitHub repositories.' },
              { title: 'AI Smart Matching', icon: Sparkles, desc: 'Get matched with teams that need your exact skills and experience level.' },
              { title: 'Trust Score System', icon: ShieldCheck, desc: 'Activity-based scoring rewards consistent contributors and active members.' },
              { title: 'Team Management', icon: Users, desc: 'Create teams, post roles, accept requests, and collaborate seamlessly.' },
              { title: 'Real-time Chat', icon: MessageSquare, desc: 'Built-in team messaging to coordinate tasks and share ideas instantly.' },
              { title: 'Hackathon Mode', icon: Trophy, desc: 'Organize teams around specific events with deadlines and role requirements.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-500 transition-colors">
                  <feature.icon className="w-5 h-5 sm:w-6 h-6 text-cyan-500 group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 sm:py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-16 sm:mb-20">How <span className="text-cyan-500">TeamUp AI</span> Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 relative">
            <div className="hidden md:block absolute top-1/4 left-0 w-full h-px bg-white/5 -z-10"></div>
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up with your college ID and connect your GitHub.' },
              { step: '02', title: 'Skills Auto-Detected', desc: 'We analyze your repos to identify languages, frameworks, and strengths.' },
              { step: '03', title: 'Get Matched', desc: 'AI recommends teams based on your skills, experience, and activity.' },
              { step: '04', title: 'Build Together', desc: 'Join a team, chat in real-time, and crush your next hackathon.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-5xl sm:text-6xl font-black text-white/5 mb-6">{step.step}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Users className="text-black w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">TeamUp <span className="text-cyan-500">AI</span></h1>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Link to="/admin/login" className="text-gray-600 hover:text-cyan-500 transition-colors text-[10px] font-bold uppercase tracking-widest">Admin Portal</Link>
            <div className="text-gray-500 text-[10px] sm:text-sm">
              © 2026 TeamUp AI. Built for students, by students.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
