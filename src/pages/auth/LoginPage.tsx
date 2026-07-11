import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input, Select } from '../../components/common/Input';
import { Sparkles, Shield, User, ArrowRight, Lock, Mail, Building2, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAs, loginWithEmail, colleges, users, navigateTo, currentPath } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(colleges[0]?.name || '');

  // Extract selected role query parameter (e.g. /login?role=student)
  const getSelectedRole = (): string => {
    if (!currentPath) return '';
    const parts = currentPath.split('role=');
    if (parts.length > 1) {
      return parts[1].split('&')[0];
    }
    return '';
  };
  const selectedRoleParam = getSelectedRole();

  // Keep selectedCollege in sync with colleges if it loads later
  React.useEffect(() => {
    if (colleges.length > 0 && !selectedCollege) {
      setSelectedCollege(colleges[0].name);
    }
  }, [colleges, selectedCollege]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) {
      alert('Please register an educational institution first.');
      return;
    }
    const success = loginWithEmail(email, selectedCollege);
    if (!success) {
      alert(`No registered account found with email "${email}" at "${selectedCollege}". Please register first!`);
    }
  };

  const collegeUsers = users.filter(u => {
    const matchesCollege = u.collegeName === selectedCollege;
    if (selectedRoleParam) {
      return matchesCollege && u.role === selectedRoleParam;
    }
    return matchesCollege;
  });

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-100 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {selectedRoleParam === 'student' && 'Student Portal Sign In'}
            {selectedRoleParam === 'coordinator' && 'Coordinator Portal Sign In'}
            {selectedRoleParam === 'admin' && 'Administrator Portal Sign In'}
            {!selectedRoleParam && 'Sign In to CampusConnect'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {selectedRoleParam === 'student' && 'Access student events, registrations, and certifications.'}
            {selectedRoleParam === 'coordinator' && 'Manage departments, construct events, and issue credentials.'}
            {selectedRoleParam === 'admin' && 'Oversee campus activity, approve requests, and audit logs.'}
            {!selectedRoleParam && 'Unified multi-campus secure digital event portal.'}
          </p>
        </div>

        {colleges.length === 0 ? (
          <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-center space-y-4">
            <Building2 className="h-10 w-10 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No Registered Institutions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                CampusConnect operates as a multi-tenant SaaS. To start, an administrator must register their institution first on the homepage.
              </p>
            </div>
            <Button
              onClick={() => navigateTo('/')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-xs py-2"
            >
              Register Your Institution
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose simulation context</span>
              
              <Select
                label="Selected Institution Node"
                options={colleges.map(c => ({ value: c.name, label: c.name }))}
                value={selectedCollege}
                onChange={e => setSelectedCollege(e.target.value)}
                className="bg-white border-slate-200/60 mb-2 py-1 text-xs"
              />

              {collegeUsers.length === 0 ? (
                <div className="text-center p-2">
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    No users registered under <strong className="text-slate-600">{selectedCollege}</strong> yet.<br />
                    Please click <button onClick={() => navigateTo('/register')} className="text-indigo-600 font-bold hover:underline">Register now</button> below to create your profile!
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Quick Switcher (Registered Accounts)</span>
                    <span className="font-mono text-indigo-500">{collegeUsers.length} active</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-28 overflow-y-auto pr-1">
                    {collegeUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => loginAs(u.role, selectedCollege)}
                        className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            u.role === 'student' ? 'bg-indigo-500' : u.role === 'coordinator' ? 'bg-violet-500' : 'bg-rose-500'
                          }`} />
                          <span className="truncate max-w-[150px]">{u.name}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
                <Input
                  label="Campus Email Address"
                  type="email"
                  placeholder="name@campus.edu"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200"
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-2.5 mt-2" rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
                Sign In to {selectedCollege || 'SaaS Portal'}
              </Button>
            </form>
          </>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400 font-medium">
            Don't have an account?{' '}
            <button
              onClick={() => navigateTo('/register')}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Register now
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
