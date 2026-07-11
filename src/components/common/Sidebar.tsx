import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Award, 
  User, 
  PlusCircle, 
  Settings, 
  ListOrdered, 
  BarChart3, 
  CheckSquare, 
  ShieldCheck, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentPath, navigateTo } = useApp();

  if (!currentUser) return null;

  // Navigation configurations based on role
  const menus = {
    student: [
      { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'Explore Events', path: '/events', icon: Sparkles },
      { label: 'My Registrations', path: '/student/registrations', icon: ListOrdered },
      { label: 'Certificates', path: '/student/certificates', icon: Award },
      { label: 'My Calendar', path: '/student/calendar', icon: Calendar },
      { label: 'My Profile', path: '/student/profile', icon: User },
    ],
    coordinator: [
      { label: 'Coordinator Hub', path: '/coordinator/dashboard', icon: LayoutDashboard },
      { label: 'Create New Event', path: '/coordinator/create-event', icon: PlusCircle },
      { label: 'Manage Events', path: '/coordinator/events', icon: BookOpen },
      { label: 'Attendance & Check-in', path: '/coordinator/registrations', icon: CheckSquare },
      { label: 'Department Analytics', path: '/coordinator/analytics', icon: BarChart3 },
      { label: 'My Profile', path: '/coordinator/profile', icon: User },
    ],
    admin: [
      { label: 'Admin Terminal', path: '/admin/dashboard', icon: ShieldCheck },
      { label: 'Explore Events', path: '/events', icon: Sparkles },
    ],
  };

  const currentRoleMenus = menus[currentUser.role] || [];

  const handleLinkClick = (path: string) => {
    navigateTo(path);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Header: User Mini Card */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="h-11 w-11 rounded-xl object-cover ring-2 ring-indigo-500/30"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{currentUser.name}</h4>
            <p className="text-xs text-slate-400 capitalize flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentUser.role} Account
            </p>
          </div>
        </div>
        {currentUser.department && (
          <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 text-[10px] font-medium text-slate-300 leading-normal truncate">
            {currentUser.department}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-3">
          Navigation Portal
        </p>
        {currentRoleMenus.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleLinkClick(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                isActive ? 'text-white scale-100 opacity-80' : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`} />
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
        <p className="text-[10px] text-slate-500">CampusConnect v1.0.0</p>
        <p className="text-[9px] text-slate-600 mt-0.5">Academic Event Network</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Slide-over */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px]"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-64 max-w-xs z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
