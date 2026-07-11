import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { User, Award, ShieldCheck, Mail, BookOpen, UserPlus, Sparkles } from 'lucide-react';

export const CoordinatorProfile: React.FC = () => {
  const { currentUser, colleges, updateUserProfile, addNotification } = useApp();
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  // Find current college departments
  const myCollegeObj = colleges.find(c => c.name === currentUser?.collegeName);
  const myCollegeDepts = myCollegeObj ? myCollegeObj.departments : [];
  
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync department selection when colleges or departments change
  React.useEffect(() => {
    if (myCollegeDepts.length > 0) {
      if (!department || !myCollegeDepts.includes(department)) {
        setDepartment(myCollegeDepts[0]);
      }
    } else {
      setDepartment('');
    }
  }, [myCollegeDepts]);

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateUserProfile(name.trim(), bio.trim(), department);
      setIsSaving(false);
      addNotification('Profile Saved', 'Your coordinator details were updated successfully.', 'success');
    }, 600);
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Coordinator Identity Profile</h1>
        <p className="text-xs text-slate-400 font-semibold">Manage your coordinator credentials and division affiliations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Col: Badges & Stats */}
        <div className="md:col-span-4 space-y-6">
          <Card className="p-6 text-center space-y-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="relative inline-block mx-auto">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-indigo-50/50"
              />
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800 leading-none">{currentUser.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentUser.role} account</p>
            </div>

            <div className="border-t border-slate-50 pt-4 flex justify-around text-center">
              <div className="space-y-0.5">
                <p className="text-xs font-black text-indigo-600">Verified</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Status</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-indigo-600">Coordinator</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Rank</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-indigo-950 text-white rounded-3xl space-y-3 relative overflow-hidden shadow-md">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-900/30 blur-2xl pointer-events-none" />
            <div className="h-9 w-9 rounded-xl bg-indigo-900/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold tracking-tight">Institutional Affiliation</h4>
              <p className="text-[11px] text-indigo-200 font-medium leading-relaxed">
                Your profile is bound to the official domain and private student network of:
              </p>
              <p className="text-xs font-black text-white bg-indigo-900/40 px-3 py-1.5 rounded-lg inline-block mt-2">
                🏫 {currentUser.collegeName}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Col: Fields */}
        <div className="md:col-span-8">
          <form onSubmit={handleSave}>
            <Card className="p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
              <div className="space-y-1 border-b border-slate-50 pb-4">
                <h3 className="text-sm font-extrabold text-slate-800">Coordinator Profile Details</h3>
                <p className="text-[10px] text-slate-400">Review database fields linked with your verified academic accounts.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Coordinator Display Name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200"
                  />
                  <Input
                    label="Primary Email Address"
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                    helperText="Email domains are locked by database administrators."
                  />
                </div>

                {myCollegeDepts.length === 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                    <span className="block text-xs font-bold text-amber-800">No Departments Configured</span>
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      No departments available. College administrators can add departments.
                    </p>
                  </div>
                ) : (
                  <Select
                    label="Academic Department / Division"
                    options={myCollegeDepts.map(d => ({ value: d, label: d }))}
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="bg-slate-50 border-slate-200"
                  />
                )}

                <Textarea
                  label="Biography / Role Description"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  placeholder="Describe your division role, faculty lead chapter responsibilities, or contact office hours..."
                  className="bg-slate-50 border-slate-200"
                />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold px-6 py-2"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorProfile;
