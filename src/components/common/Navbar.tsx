import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, LogOut, ShieldCheck, User, Calendar, BookOpen, Award, Sparkles, Menu, X, Check, ChevronDown, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentUser, notifications, logout, markNotificationRead, clearNotification, navigateTo } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo & Menu Trigger */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          <div 
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Campus<span className="text-indigo-600">Connect</span>
            </span>
          </div>
        </div>

        {/* Center Side: Public Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigateTo('/')}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('/events')}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Discover Events
          </button>
        </nav>

        {/* Right Side: Notifications, Profile, Role badge */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b border-slate-50 px-4 py-3.5 bg-slate-50/50">
                          <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                              <Bell className="h-8 w-8 text-slate-300 mb-2" />
                              <p className="text-xs text-slate-500">All caught up! No notifications yet.</p>
                            </div>
                          ) : (
                            notifications.map((not) => (
                              <div
                                key={not.id}
                                className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50/50 ${
                                  !not.read ? 'bg-indigo-50/10' : ''
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1.5">
                                    <p className={`text-xs font-semibold text-slate-800 ${!not.read ? 'text-indigo-950 font-bold' : ''}`}>
                                      {not.title}
                                    </p>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      {new Date(not.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{not.message}</p>
                                  <div className="mt-2 flex items-center gap-3">
                                    {!not.read && (
                                      <button
                                        onClick={() => markNotificationRead(not.id)}
                                        className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                      >
                                        <Check className="h-3 w-3" /> Mark as read
                                      </button>
                                    )}
                                    <button
                                      onClick={() => clearNotification(not.id)}
                                      className="text-[10px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative border-l border-slate-100 pl-4">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-left focus:outline-none"
                >
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-800 leading-none">{currentUser.name}</span>
                    <span className="mt-1 text-[10px] font-medium text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full inline-block self-end uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                  </div>
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-9 w-9 rounded-xl object-cover ring-2 ring-indigo-50"
                  />
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden py-1.5"
                      >
                        <div className="px-4 py-2.5 border-b border-slate-50 sm:hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                          <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">{currentUser.role}</span>
                        </div>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            const roleRoutes = {
                              student: '/student/dashboard',
                              coordinator: '/coordinator/dashboard',
                              admin: '/admin/dashboard'
                            };
                            navigateTo(roleRoutes[currentUser.role as keyof typeof roleRoutes] || '/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                        >
                          <LayoutDashboard className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>My Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left border-t border-slate-50 mt-1 pt-2"
                        >
                          <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('/login')}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigateTo('/register')}
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
