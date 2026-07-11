import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input, Select } from '../../components/common/Input';
import { Sparkles, ArrowRight, User, Mail, Lock, GraduationCap, Building, ShieldCheck, Briefcase, Calendar, Plus, Library, Loader2 } from 'lucide-react';
import { UserRole } from '../../types';

export const RegisterPage: React.FC = () => {
  const { signUpUser, colleges, navigateTo, registerInstitution } = useApp();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  
  // College/Department references
  const [collegeName, setCollegeName] = useState(colleges[0]?.name || '');
  const [department, setDepartment] = useState('');

  // Role-Specific Fields
  const [yearOfStudy, setYearOfStudy] = useState('1st Year');
  const [designation, setDesignation] = useState('Assistant Professor');

  // Admin Specific College Onboarding Mode
  const [adminCollegeMode, setAdminCollegeMode] = useState<'existing' | 'new'>('new');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeDomain, setNewCollegeDomain] = useState('');
  const [newCollegeDepts, setNewCollegeDepts] = useState('CSE, CSD, CSM, IT, Cyber Security, ECE, EEE, Mechanical, Civil');

  // Keep collegeName in sync with colleges list if it changes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all core fields (Name, Email, and Password).');
      return;
    }

    let finalCollegeName = collegeName;
    let finalDepartment = department;

    // Handle College Onboarding for Administrator
    if (role === 'admin' && adminCollegeMode === 'new') {
      const trimmedColName = newCollegeName.trim();
      if (!trimmedColName) {
        setError('Please enter a name for the new college you wish to register.');
        return;
      }
      
      const parsedDepts = newCollegeDepts
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const registeredCol = registerInstitution(trimmedColName, newCollegeDomain.trim() || undefined, parsedDepts);
      finalCollegeName = registeredCol.name;
      finalDepartment = 'Administration';
    } else if (role === 'admin') {
      // Admin is managing an existing college
      if (!collegeName) {
        setError('Please select an existing college to manage.');
        return;
      }
      finalDepartment = 'Administration';
    } else {
      // Student or Coordinator: must have a college registered
      if (colleges.length === 0) {
        setError('There are no registered colleges on the platform. A College Administrator must register the college first.');
        return;
      }
      if (!collegeName) {
        setError('Please select your educational institution.');
        return;
      }
      if (!department) {
        setError('Please select your academic department.');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Call Context Sign Up Handler with passwords and role fields
      const result = await signUpUser(
        name.trim(),
        email.trim(),
        role,
        finalDepartment,
        finalCollegeName,
        password.trim(),
        {
          yearOfStudy: role === 'student' ? yearOfStudy : undefined,
          designation: role === 'coordinator' ? designation : undefined,
          collegeOwnership: role === 'admin' ? finalCollegeName : undefined
        }
      );

      if (result && !result.success) {
        setError(result.error || 'Registration failed. Please check your details and try again.');
      }
    } catch (err: any) {
      console.error("Signup error in page handler:", err);
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-lg p-8 bg-white border border-slate-100 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Create Campus Account</h2>
          <p className="text-xs text-slate-400 font-medium">Join your educational institution's private event portal.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-medium text-rose-700 animate-fade-in leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Unified Role Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Account Role</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-white text-indigo-600 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('coordinator')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === 'coordinator'
                    ? 'bg-white text-indigo-600 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Coordinator
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-white text-indigo-600 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
          </div>

          {/* Common Fields: Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label="Full Name"
                type="text"
                placeholder={role === 'admin' ? "Admin Name" : "Alex Rivera"}
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-400" />
              <Input
                label={role === 'admin' ? "Official Campus Email" : "Campus Email Address"}
                type="email"
                placeholder={role === 'admin' ? "admin@anits.edu" : "alex@anits.edu"}
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Secure Password field */}
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

          {/* Student Flow Extra Fields */}
          {role === 'student' && (
            <div className="space-y-4 animate-fade-in p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Student Academic Profile</span>
              
              {colleges.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center text-xs text-amber-700">
                  No educational institutions are currently registered. An administrator must register your college first.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Educational College"
                    options={colleges.map(c => ({ value: c.name, label: c.name }))}
                    value={collegeName}
                    onChange={e => setCollegeName(e.target.value)}
                    className="bg-white border-slate-200"
                  />

                  {collegeDepts.length === 0 ? (
                    <div className="flex items-center text-xs text-amber-600 mt-6">
                      No departments configured.
                    </div>
                  ) : (
                    <Select
                      label="Academic Department"
                      options={collegeDepts.map(d => ({ value: d, label: d }))}
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="bg-white border-slate-200"
                    />
                  )}
                </div>
              )}

              <Select
                label="Year of Study"
                options={[
                  { value: '1st Year', label: '1st Year / Freshman' },
                  { value: '2nd Year', label: '2nd Year / Sophomore' },
                  { value: '3rd Year', label: '3rd Year / Junior' },
                  { value: '4th Year', label: '4th Year / Senior' },
                  { value: 'Postgraduate', label: 'Postgraduate Student' }
                ]}
                value={yearOfStudy}
                onChange={e => setYearOfStudy(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
          )}

          {/* Department Coordinator Flow Extra Fields */}
          {role === 'coordinator' && (
            <div className="space-y-4 animate-fade-in p-4 bg-violet-50/30 rounded-2xl border border-violet-100/50">
              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest block">Department Coordinator Profile</span>

              {colleges.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center text-xs text-amber-700">
                  No educational institutions are currently registered. An administrator must register your college first.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Educational College"
                    options={colleges.map(c => ({ value: c.name, label: c.name }))}
                    value={collegeName}
                    onChange={e => setCollegeName(e.target.value)}
                    className="bg-white border-slate-200"
                  />

                  {collegeDepts.length === 0 ? (
                    <div className="flex items-center text-xs text-amber-600 mt-6">
                      No departments configured.
                    </div>
                  ) : (
                    <Select
                      label="Academic Department"
                      options={collegeDepts.map(d => ({ value: d, label: d }))}
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="bg-white border-slate-200"
                    />
                  )}
                </div>
              )}

              <Select
                label="Staff / Faculty Designation"
                options={[
                  { value: 'Assistant Professor', label: 'Assistant Professor' },
                  { value: 'Associate Professor', label: 'Associate Professor' },
                  { value: 'Professor', label: 'Professor' },
                  { value: 'Head of Department (HoD)', label: 'Head of Department (HoD)' },
                  { value: 'Senior Lab Coordinator', label: 'Senior Lab Coordinator' },
                  { value: 'Department Secretary', label: 'Department Secretary' },
                  { value: 'Other Academic Faculty', label: 'Other Academic Faculty' }
                ]}
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
          )}

          {/* College Administrator Flow Extra Fields */}
          {role === 'admin' && (
            <div className="space-y-4 animate-fade-in p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">College Details & Ownership</span>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setAdminCollegeMode('new')}
                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    adminCollegeMode === 'new' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Onboard New College
                </button>
                <button
                  type="button"
                  onClick={() => setAdminCollegeMode('existing')}
                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    adminCollegeMode === 'existing' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                  }`}
                  disabled={colleges.length === 0}
                >
                  Manage Existing College
                </button>
              </div>

              {adminCollegeMode === 'new' ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="relative">
                    <Building className="absolute left-3 top-[32px] h-4 w-4 text-slate-400" />
                    <Input
                      label="Institution / College Name"
                      type="text"
                      placeholder="e.g. GITAM University"
                      required
                      value={newCollegeName}
                      onChange={e => setNewCollegeName(e.target.value)}
                      className="pl-9 bg-white border-slate-200"
                    />
                  </div>

                  <Input
                    label="Official Web Domain (Optional)"
                    type="text"
                    placeholder="e.g. gitam.edu"
                    value={newCollegeDomain}
                    onChange={e => setNewCollegeDomain(e.target.value)}
                    className="bg-white border-slate-200"
                  />

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Initial Departments (Comma Separated)</label>
                    <textarea
                      required
                      value={newCollegeDepts}
                      onChange={e => setNewCollegeDepts(e.target.value)}
                      className="w-full h-18 text-xs p-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                      placeholder="e.g. CSE, CSD, CSM, IT, Cyber Security, ECE"
                    />
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                      Enter the academic departments belonging to this college. Students and Coordinators can select these upon registration.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <Select
                    label="Select College to Manage"
                    options={colleges.map(c => ({ value: c.name, label: c.name }))}
                    value={collegeName}
                    onChange={e => setCollegeName(e.target.value)}
                    className="bg-white border-slate-200"
                  />
                  <p className="text-[9px] text-slate-400 font-medium mt-1">
                    Register as an administrator of an existing college node on CampusConnect's multi-tenant network.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-2.5 shadow-md shadow-indigo-100"
              leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              rightIcon={!isLoading ? <ArrowRight className="h-4.5 w-4.5" /> : null}
            >
              {isLoading ? "Creating account..." : `Complete ${role === 'student' ? 'Student' : role === 'coordinator' ? 'Coordinator' : 'Admin'} Onboarding`}
            </Button>
          </div>
        </form>

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
