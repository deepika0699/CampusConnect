import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { User, Award, ShieldCheck, Mail, BookOpen, UserPlus, Sparkles } from 'lucide-react';

export const StudentProfile: React.FC = () => {
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
      addNotification('Profile Saved', 'Your student details were updated successfully.', 'success');
    }, 600);
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Academic Identity Profile</h1>
        <p className="text-xs text-slate-400 font-semibold">Manage your student persona and review society registry files.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left column: Visual identity badge */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <Card className="p-6 bg-white border border-slate-150 rounded-3xl text-center flex flex-col items-center gap-4 relative overflow-hidden border-t-8 border-t-indigo-600 shadow-sm">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-24 w-24 rounded-2xl object-cover border-4 border-indigo-50 shadow-md ring-2 ring-indigo-500/10"
            />
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 leading-snug">{currentUser.name}</h3>
              <p className="text-xs text-indigo-600 font-semibold uppercase bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">
                {currentUser.role}
              </p>
            </div>

            <div className="w-full border-t border-slate-50 pt-4 text-xs space-y-2.5 text-slate-500 text-left font-medium">
              <p className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                <span className="truncate">{currentUser.department || 'Undergraduate Unit'}</span>
              </p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span>ID: {currentUser.studentId || 'STU-2026-N9'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{currentUser.email}</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Right column: Edit Details form */}
        <form onSubmit={handleSave} className="md:col-span-8">
          <Card className="p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3">Edit Identity File</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Student Name"
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
              label="Student Biography"
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Tell student societies about your academic tracks, research interests, or musical instruments..."
              className="bg-slate-50 border-slate-200"
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
              >
                Save Details
              </Button>
            </div>
          </Card>
        </form>

      </div>
    </div>
  );
};

// Quick mock helper inline since SVG icons used
const GraduationCap: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M6 18.8v-4L2 13v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1z" />
    <path d="M21.5 12v6h-1v-6z" />
  </svg>
);
export default StudentProfile;
