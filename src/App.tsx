/**
 * CampusConnect Main Router and Layout Module
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Page Imports
import { LandingPage } from './pages/public/LandingPage';
import { EventDiscoveryPage } from './pages/public/EventDiscoveryPage';
import { EventDetailsPage } from './pages/public/EventDetailsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student Page Imports
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentRegistrations } from './pages/student/StudentRegistrations';
import { StudentCertificates } from './pages/student/StudentCertificates';
import { StudentCalendar } from './pages/student/StudentCalendar';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentEventPass } from './pages/student/StudentEventPass';

// Coordinator Page Imports
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { CreateEventPage } from './pages/coordinator/CreateEventPage';
import { CoordinatorEvents } from './pages/coordinator/CoordinatorEvents';
import { CoordinatorRegistrations } from './pages/coordinator/CoordinatorRegistrations';
import { CoordinatorAnalytics } from './pages/coordinator/CoordinatorAnalytics';
import { CoordinatorProfile } from './pages/coordinator/CoordinatorProfile';

// Admin Page Imports
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Lucide Lock Icon for security panels
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './components/common/Button';

const AppContent: React.FC = () => {
  const { currentPath, currentUser, navigateTo } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Dynamic Route Matcher & Role Authorization Guard ---
  const renderRoute = () => {
    // Parse query/hash parameters safely
    const pathName = currentPath.split('?')[0];

    // 1. Public Routes
    if (pathName === '/') return <LandingPage />;
    if (pathName === '/events' || currentPath.includes('category=')) return <EventDiscoveryPage />;
    if (pathName.startsWith('/events/')) return <EventDetailsPage />;
    if (pathName === '/institution/register') return <LandingPage registerFocused={true} />;
    
    // 2. Auth Routes
    if (pathName === '/login') return <LoginPage />;
    if (pathName === '/register') return <RegisterPage />;

    // 3. Student Routes (Requires student role)
    if (pathName.startsWith('/student/')) {
      if (!currentUser) {
        navigateTo('/login');
        return <LoginPage />;
      }
      if (currentUser.role !== 'student') {
        return <SecurityGuardRequired role="student" currentRole={currentUser.role} />;
      }

      switch (pathName) {
        case '/student/dashboard':
          return <StudentDashboard />;
        case '/student/events':
          return <EventDiscoveryPage />;
        case '/student/registrations':
          return <StudentRegistrations />;
        case '/student/certificates':
          return <StudentCertificates />;
        case '/student/event-pass':
          return <StudentEventPass />;
        case '/student/calendar':
          return <StudentCalendar />;
        case '/student/profile':
          return <StudentProfile />;
        default:
          return <StudentDashboard />;
      }
    }

    // 4. Coordinator Routes (Requires coordinator role)
    if (pathName.startsWith('/coordinator/')) {
      if (!currentUser) {
        navigateTo('/login');
        return <LoginPage />;
      }
      if (currentUser.role !== 'coordinator') {
        return <SecurityGuardRequired role="coordinator" currentRole={currentUser.role} />;
      }

      switch (pathName) {
        case '/coordinator/dashboard':
          return <CoordinatorDashboard />;
        case '/coordinator/create-event':
          return <CreateEventPage />;
        case '/coordinator/events':
          return <CoordinatorEvents />;
        case '/coordinator/registrations':
          return <CoordinatorRegistrations />;
        case '/coordinator/analytics':
          return <CoordinatorAnalytics />;
        case '/coordinator/profile':
          return <CoordinatorProfile />;
        default:
          return <CoordinatorDashboard />;
      }
    }

    // 5. Admin Routes (Requires admin role)
    if (pathName.startsWith('/admin/')) {
      if (!currentUser) {
        navigateTo('/login');
        return <LoginPage />;
      }
      if (currentUser.role !== 'admin') {
        return <SecurityGuardRequired role="admin" currentRole={currentUser.role} />;
      }

      switch (pathName) {
        case '/admin/dashboard':
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }

    // Fallback standard 404 view
    return (
      <div className="py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-sm text-slate-500">The page you are looking for has been moved or does not exist.</p>
        <Button variant="outline" onClick={() => navigateTo('/')}>
          Back to Homepage
        </Button>
      </div>
    );
  };

  // Determine if sidebar should be rendered (Only for internal dashboard directories)
  const isDashboardView = currentUser && (
    currentPath.startsWith('/student/') || 
    currentPath.startsWith('/coordinator/') || 
    currentPath.startsWith('/admin/')
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Top Header */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Structural Layout */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        
        {/* Left Side: Role-based Sidebar navigation */}
        {isDashboardView && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        {/* Center Canvas */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 min-w-0">
          {renderRoute()}
        </main>
      </div>
    </div>
  );
};

// Security Guard Warning panel
const SecurityGuardRequired: React.FC<{ role: string; currentRole: string }> = ({ role, currentRole }) => {
  const { navigateTo } = useApp();
  return (
    <div className="py-20 text-center space-y-5 max-w-md mx-auto">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow shadow-rose-100">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          This portal requires active <span className="font-bold text-slate-800 capitalize">{role}</span> credentials. Your current persona is authenticated as a <span className="font-bold text-slate-800 capitalize">{currentRole}</span>.
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigateTo('/')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Home
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            const roleRoutes = {
              student: '/student/dashboard',
              coordinator: '/coordinator/dashboard',
              admin: '/admin/dashboard'
            };
            navigateTo(roleRoutes[currentRole as keyof typeof roleRoutes] || '/');
          }}
        >
          My Dashboard
        </Button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
