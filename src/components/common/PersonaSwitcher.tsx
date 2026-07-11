import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Shield, Sparkles, UserCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PersonaSwitcher: React.FC = () => {
  const { currentUser, loginAs, logout, colleges, updateUserCollege } = useApp();
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-full px-4">
      <AnimatePresence>
        {isVisible ? (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center gap-1.5 sm:gap-2.5 shrink-0"
          >
            {/* Legend label */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 border-r border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <span>SaaS Simulator</span>
            </div>

            {/* Live College Selector */}
            {currentUser && (
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2 shrink-0">
                <span className="hidden sm:inline text-[9px] font-bold text-indigo-400 uppercase">Tenant:</span>
                <select
                  value={currentUser.collegeName}
                  onChange={(e) => updateUserCollege(e.target.value)}
                  className="bg-slate-800 text-slate-100 text-[10px] font-bold px-1.5 py-1 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
                >
                  {colleges.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Guest Option */}
            <button
              onClick={() => {
                logout();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentUser === null
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Guest
            </button>

            {/* Student Alex */}
            <button
              onClick={() => loginAs('student', currentUser?.collegeName || colleges[0]?.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUser?.role === 'student'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Student</span>
            </button>

            {/* Coordinator Sarah */}
            <button
              onClick={() => loginAs('coordinator', currentUser?.collegeName || colleges[0]?.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUser?.role === 'coordinator'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3 w-3" />
              <span>Coordinator</span>
            </button>

            {/* Admin Vance */}
            <button
              onClick={() => loginAs('admin', currentUser?.collegeName || colleges[0]?.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUser?.role === 'admin'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="h-3 w-3" />
              <span>Admin</span>
            </button>

            {/* Hide Trigger */}
            <button
              onClick={() => setIsVisible(false)}
              title="Minimize panel"
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 shrink-0 ml-1 cursor-pointer"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsVisible(true)}
            className="bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-full shadow-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Eye className="h-4 w-4 text-indigo-400" />
            <span>Show Persona Switcher</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
