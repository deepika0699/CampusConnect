import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { COLLEGE_DEPARTMENT_PRESETS } from '../../data/mockData';
import { 
  Sparkles, 
  Calendar, 
  Award, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Trophy, 
  Landmark, 
  Building, 
  Users, 
  Cpu, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LandingPageProps {
  registerFocused?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ registerFocused }) => {
  const { 
    colleges, 
    registerInstitution, 
    currentUser, 
    loginAs, 
    events, 
    users,
    navigateTo 
  } = useApp();

  // New College Registration Form State
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeDomain, setNewCollegeDomain] = useState('');
  const [customDepts, setCustomDepts] = useState<string[]>([]);
  const [deptInput, setDeptInput] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  // Scroll to register section if route is focused
  React.useEffect(() => {
    if (registerFocused) {
      setTimeout(() => {
        const el = document.getElementById('register-college-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [registerFocused]);

  // Calculate stats dynamically
  const approvedEvents = events.filter(e => e.status === 'approved');
  
  const stats = [
    { label: 'Registered Campuses', value: colleges.length, icon: Building, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Academic Departments', value: colleges.reduce((acc, c) => acc + c.departments.length, 0), icon: Landmark, color: 'text-violet-600 bg-violet-50' },
    { label: 'Confidential Events', value: approvedEvents.length, icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Credentials Verified', value: '1,120+', icon: Award, color: 'text-amber-600 bg-amber-50' }
  ];

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (deptInput.trim() && !customDepts.includes(deptInput.trim())) {
      setCustomDepts(prev => [...prev, deptInput.trim()]);
      setDeptInput('');
    }
  };

  const handleRemoveDept = (dept: string) => {
    setCustomDepts(prev => prev.filter(d => d !== dept));
  };

  const handleRegisterCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;

    const registered = registerInstitution(
      newCollegeName.trim(), 
      newCollegeDomain.trim() || undefined, 
      customDepts
    );

    setRegisteredName(registered.name);
    setRegistrationSuccess(true);
    setNewCollegeName('');
    setNewCollegeDomain('');
    setCustomDepts([]);

    setTimeout(() => {
      setRegistrationSuccess(false);
    }, 5000);
  };

  return (
    <div className="space-y-16 py-8 sm:py-12 relative overflow-visible">
      {/* Hero Wrapper with overflow-visible to correctly position architectural background around the hero panel */}
      <div className="relative w-full max-w-[1280px] mx-auto overflow-visible">
        
        {/* 1. Hero Spotlight */}
        <section 
          className="relative w-full max-w-[1280px] mx-auto py-20 lg:py-[88px] px-6 sm:px-12 lg:px-[72px] rounded-[32px] overflow-hidden text-center flex flex-col items-center justify-center z-10"
          style={{ background: 'linear-gradient(135deg, #0F1B4D 0%, #1A2B6B 100%)' }}
        >
          {/* Subtle central radial glow behind the headline */}
          <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{
              background: 'radial-gradient(circle at center, rgba(112, 145, 230, 0.09) 0%, transparent 65%)'
            }}
          />

          {/* INNER CUBE SURFACES */}
          
          {/* LEFT UPPER PANEL */}
          <motion.div 
            className="absolute pointer-events-none select-none rounded-[12px]"
            style={{
              width: '190px',
              height: '220px',
              left: '-60px',
              top: '10%',
              backgroundColor: '#C7D2FE',
              opacity: 0.14,
              transform: 'rotate(-18deg)',
              zIndex: 1,
            }}
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* BOTTOM-LEFT PANEL */}
          <motion.div 
            className="absolute pointer-events-none select-none rounded-[12px]"
            style={{
              width: '150px',
              height: '180px',
              left: '-40px',
              bottom: '-30px',
              backgroundColor: '#A5B4FC',
              opacity: 0.10,
              transform: 'rotate(22deg)',
              zIndex: 1,
            }}
            animate={{ y: [0, 1, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* RIGHT PANEL */}
          <motion.div 
            className="absolute pointer-events-none select-none rounded-[12px]"
            style={{
              width: '210px',
              height: '250px',
              right: '-50px',
              top: '15%',
              backgroundColor: '#C7D2FE',
              opacity: 0.12,
              transform: 'rotate(-24deg)',
              zIndex: 1,
            }}
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Content layout (centered) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl space-y-6 relative z-10"
          >
            {/* Subtle navy pill top badge */}
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#3D52A0]/30 text-[#7091E6] border border-[#7091E6]/30 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-[#E8D59E] animate-pulse" /> Multi-Campus Event Cloud
            </span>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Educate. Engage.<br />
              <span className="inline-block text-[0.82em] bg-gradient-to-r from-[#7091E6] via-[#8697C4] to-[#C7D2FE] bg-clip-text text-transparent">
                CampusConnect
              </span>
            </h1>

          {/* Supporting enterprise paragraph */}
          <p className="text-base sm:text-lg text-[#D6E2FF] font-medium max-w-2xl mx-auto leading-relaxed">
            The private digital event ecosystem for academic institutions. We empower colleges to host confidential department workshops, athletic leagues, and cultural councils completely isolated within their campus boundaries with secure QR-code attendance check-ins, automated updates, and cryptographically verified academic credentials.
          </p>

          {/* CTA Buttons */}
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            {currentUser ? (
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="primary"
                  className="h-[50px] px-8 bg-[#7091E6] hover:bg-[#5C7FE0] text-white font-bold rounded-[16px] shadow-lg shadow-[#7091E6]/25 border-none transition-all duration-200 w-full sm:w-auto text-sm"
                  rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
                  onClick={() => navigateTo('/events')}
                >
                  Go to Events Dashboard
                </Button>
              </motion.div>
            ) : (
              <>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="primary"
                    className="h-[50px] px-8 bg-[#7091E6] hover:bg-[#5C7FE0] text-white font-bold rounded-[16px] shadow-lg shadow-[#7091E6]/25 border-none transition-all duration-200 w-full sm:w-auto text-sm"
                    rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
                    onClick={() => navigateTo('/events')}
                  >
                    Explore Events
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="h-[50px] px-8 bg-white border border-slate-200/80 hover:bg-[#EDE8F5]/30 hover:border-slate-300 text-[#0F1B4D] font-bold rounded-[16px] shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto text-sm"
                    onClick={() => navigateTo('/institution/register')}
                  >
                    Register Institution
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </section>
      </div>

      {/* Secure Campus Portals Gateway */}
      <section className="space-y-4 py-4">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-600 tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-md">Gateways</span>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Institutional Entrance Portals</h2>
          <p className="text-xs text-slate-400">Direct endpoints to access your isolated university networks.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl inline-block">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">Student Portal</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Register for events, claim attendance credentials, and download signed certificates.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold py-1.5"
              onClick={() => navigateTo('/login?role=student')}
            >
              Student Login &rarr;
            </Button>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <span className="p-2 bg-violet-50 text-violet-600 rounded-xl inline-block">
                <Cpu className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">Department Coordinator</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Construct new academic or cultural events, track student check-ins, and authorize awards.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-violet-600 border-violet-100 hover:bg-violet-50 font-bold py-1.5"
              onClick={() => navigateTo('/login?role=coordinator')}
            >
              Coordinator Login &rarr;
            </Button>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl inline-block">
                <Landmark className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">College Administrator</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Review campus metrics, approve department event requests, and audit certificate issuers.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-emerald-600 border-emerald-100 hover:bg-emerald-50 font-bold py-1.5"
              onClick={() => navigateTo('/login?role=admin')}
            >
              Admin Login &rarr;
            </Button>
          </Card>
        </div>
      </section>

      {/* 2. Unified Metric Counters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((st, idx) => {
          const Icon = st.icon;
          return (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="p-6 flex items-center gap-4 h-24 bg-white border border-slate-100 shadow-sm">
                <div className={`p-3 rounded-xl ${st.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{st.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {/* 4. "Register Your College" Section (Interactive Form) */}
      <section id="register-college-section" className="bg-slate-50/80 border border-slate-100 p-8 sm:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="space-y-5 lg:col-span-5">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow shadow-indigo-100">
            <Building className="h-5 w-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Register Your Educational Institution Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Deploy CampusConnect for your university. Create private, secure sub-portals for all your campus academic divisions, student affairs, athletics, and cultural societies.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Full Data Isolation by Mail Domain</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Unlimited Coordinators & Events</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Cryptographic Attendance Certificates</span>
            </div>
          </div>
        </div>

        {/* College onboarding application mock form */}
        <div className="lg:col-span-7 w-full bg-white border border-slate-100 rounded-2xl shadow-lg p-6 relative">
          <AnimatePresence mode="wait">
            {registrationSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 text-center space-y-4"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">Campus Provisioned Successfully!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {registeredName} is now registered in the SaaS cloud. You can now choose this institution in the sandbox above or register user profiles under it!
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleRegisterCollege}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">SaaS Onboarding Flow</span>
                  <h3 className="text-base font-extrabold text-slate-800">Register Institution Node</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="College / Institution Name"
                    placeholder="e.g. SRM University"
                    required
                    value={newCollegeName}
                    onChange={e => setNewCollegeName(e.target.value)}
                  />
                  <Input
                    label="Authorized Domain Name"
                    placeholder="e.g. srmuniv.edu.in"
                    value={newCollegeDomain}
                    onChange={e => setNewCollegeDomain(e.target.value)}
                  />
                </div>

                {/* Manage Departments in onboarding */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-500">
                      Institution Departments / Societies ({customDepts.length})
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCustomDepts(COLLEGE_DEPARTMENT_PRESETS['ANITS'])}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[9px] font-bold rounded text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        ANITS (9)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomDepts(COLLEGE_DEPARTMENT_PRESETS['GITAM'])}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[9px] font-bold rounded text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        GITAM (4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomDepts([])}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-[9px] font-bold rounded text-slate-600 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl min-h-[40px]">
                    {customDepts.map(dept => (
                      <span key={dept} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                        {dept}
                        <button type="button" onClick={() => handleRemoveDept(dept)} className="text-slate-400 hover:text-red-500 font-extrabold font-sans">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom department (e.g. Mechanical Engineering)"
                      value={deptInput}
                      onChange={e => setDeptInput(e.target.value)}
                      className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Button 
                      variant="outline" 
                      type="button" 
                      size="sm"
                      onClick={handleAddDept}
                      className="border-slate-200 font-bold"
                      leftIcon={<Plus className="h-3 w-3" />}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                  >
                    Deploy Campus Portal Node
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 5. Smart Verification Feature Block */}
      <section className="bg-slate-50/80 border border-slate-100 p-8 sm:p-12 rounded-3xl flex flex-col lg:flex-row items-center gap-8">
        <div className="space-y-5 lg:w-1/2">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow shadow-indigo-100">
            <Award className="h-5.5 w-5.5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Earn Verifiable Institutional Participation Credentials
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Attendance verification is automated. Secure your QR seat ticket on registration. Once verified by the faculty coordinator at the venue desk, a tamper-proof digital certificate is minted in real-time under your student profile, complete with cryptographic verification hashes ready for placement on resumes.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-bold text-slate-700">Cryptographically Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-bold text-slate-700">Official Institution Seal</span>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 w-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent blur-2xl" />
          <Card className="w-full max-w-sm p-6 bg-white border border-slate-200/60 rounded-2xl shadow-xl flex flex-col gap-6 text-center border-t-8 border-t-indigo-600 relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Award className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">Certificate of Excellence</span>
              <h4 className="text-sm font-bold text-slate-800 uppercase">Alex Rivera</h4>
              <p className="text-[10px] text-slate-500">has successfully attended and actively engaged in the pre-eminent symposium</p>
              <h5 className="text-xs font-bold text-slate-700">AI & Ethics Symposium 2026</h5>
            </div>
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[8px] font-bold text-slate-400">
              <div className="flex flex-col text-left">
                <span>VERIFICATION CODE</span>
                <span className="text-slate-600 font-mono">CC-VERT-AE714D9</span>
              </div>
              <div className="flex flex-col text-right">
                <span>ISSUED BY</span>
                <span className="text-indigo-600">CSE DEPARTMENT</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
