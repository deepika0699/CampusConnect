import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input, Select } from '../../components/common/Input';
import { Sparkles, ArrowRight, User, Mail, Lock, GraduationCap, Building, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

export const RegisterPage: React.FC = () => {
  const { signUpUser, colleges, navigateTo } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [collegeName, setCollegeName] = useState(colleges[0]?.name || '');
  const [department, setDepartment] = useState('');

  // Keep collegeName in sync with colleges list
  useEffect(() => {
    if (colleges.length > 0 && !collegeName) {
      setCollegeName(colleges[0].name);
    }
  }, [colleges, collegeName]);

  // Get departments for the selected college
  const selectedCollegeObj = colleges.find(c => c.name === collegeName);
  const collegeDepts = selectedCollegeObj ? selectedCollegeObj.departments : [];

  // Set default department when college changes
  useEffect(() => {
    if (collegeDepts.length > 0) {
      setDepartment(collegeDepts[0]);
    } else {
      setDepartment('');
    }
  }, [collegeName, collegeDepts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !collegeName) return;
    signUpUser(name.trim(), email.trim(), role, department, collegeName);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-100 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Create Campus Account</h2>
          <p className="text-xs text-slate-400 font-medium">Join your educational institution's private event portal.</p>
        </div>

        {colleges.length === 0 ? (
          <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-center space-y-4">
            <Building className="h-10 w-10 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No Registered Institutions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                CampusConnect operates as a multi-tenant SaaS network. Please register your educational institution first on our homepage before registering your user profile.
              </p>
            </div>
            <Button
              onClick={() => navigateTo('/')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-xs py-2"
            >
              Go to Homepage
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  role === 'student' ? 'bg-white text-indigo-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('coordinator')}
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  role === 'coordinator' ? 'bg-white text-indigo-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Coordinator
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  role === 'admin' ? 'bg-white text-indigo-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Admin
              </button>
            </div>

            <div className="relative">
              <User className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label="Full Name"
                type="text"
                placeholder="Alex Rivera"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label="Campus Email Address"
                type="email"
                placeholder="alex@campus.edu"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>

            <Select
              label="Select Your Institution"
              options={colleges.map(c => ({ value: c.name, label: c.name }))}
              value={collegeName}
              onChange={e => setCollegeName(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />

            {collegeDepts.length === 0 ? (
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                <span className="block text-xs font-bold text-amber-800">No Departments Configured</span>
                <p className="text-[10px] text-amber-700 font-medium leading-normal">
                  No departments available. College administrators can add departments in college setup/onboarding.
                </p>
              </div>
            ) : (
              <Select
                label="Academic Department / Division"
                options={collegeDepts.map(d => ({ value: d, label: d }))}
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="bg-slate-50 border-slate-200 animate-fade-in"
              />
            )}

            <div className="relative">
              <Lock className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label="Create Secure Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-2.5" rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
                Create {role === 'student' ? 'Student' : role === 'coordinator' ? 'Coordinator' : 'Admin'} Profile
              </Button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400 font-medium">
            Already have an account?{' '}
            <button
              onClick={() => navigateTo('/login')}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
