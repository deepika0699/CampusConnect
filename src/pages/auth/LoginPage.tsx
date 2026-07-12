import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input, Select } from '../../components/common/Input';
import { Sparkles, Shield, User, ArrowRight, Lock, Mail, Building2, HelpCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAs, loginWithEmail, colleges, users, navigateTo, currentPath } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(colleges[0]?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCollege) {
      setError('Please register an educational institution first.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await loginWithEmail(email, selectedCollege, password);
      if (result && !result.success) {
        setError(result.error || `No registered account found with email "${email}" at "${selectedCollege}". Please register first!`);
      }
    } catch (err: any) {
      console.error("Login page error:", err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-medium text-rose-700 animate-fade-in leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Building2 className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
                <Select
                  label="Select Your Educational Institution"
                  options={colleges.map(c => ({ value: c.name, label: c.name }))}
                  value={selectedCollege}
                  onChange={e => setSelectedCollege(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200"
                />
              </div>

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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-50 border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors p-1.5 focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-2.5 mt-2"
                leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                rightIcon={!isLoading ? <ArrowRight className="h-4.5 w-4.5" /> : null}
              >
                {isLoading ? "Signing in..." : `Sign In to ${selectedCollege || 'SaaS Portal'}`}
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
