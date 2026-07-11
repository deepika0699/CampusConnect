import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/Input';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { Event } from '../../types';

export const CreateEventPage: React.FC = () => {
  const { createEvent, navigateTo, currentUser, colleges } = useApp();
  
  // Find current college departments
  const myCollegeObj = colleges.find(c => c.name === currentUser?.collegeName);
  const myCollegeDepts = myCollegeObj ? myCollegeObj.departments : [];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'tech' | 'academic' | 'cultural' | 'sports' | 'career'>('tech');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [collegeName, setCollegeName] = useState(currentUser?.collegeName || 'ANITS');
  const [clubOrg, setClubOrg] = useState('');

  // Sync selected department when college departments load/change
  React.useEffect(() => {
    if (myCollegeDepts.length > 0) {
      if (!department || !myCollegeDepts.includes(department)) {
        setDepartment(myCollegeDepts[0]);
      }
    } else {
      setDepartment('');
    }
  }, [myCollegeDepts]);
  const [facultyCoordinator, setFacultyCoordinator] = useState(currentUser?.name || '');
  const [studentCoordinator, setStudentCoordinator] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const defaultImg = {
      tech: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
      academic: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      cultural: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800',
      sports: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
      career: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'
    };

    setTimeout(() => {
      createEvent({
        title,
        category,
        department,
        description,
        longDescription,
        venue,
        locationDetails,
        collegeName,
        clubOrg,
        facultyCoordinator,
        studentCoordinator,
        date,
        time,
        registrationDeadline,
        maxParticipants: Number(maxParticipants),
        imageUrl: imageUrl || defaultImg[category],
        tags,
        mapLocation: {
          lat: 17.7812 + (Math.random() - 0.5) * 0.01,
          lng: 83.3768 + (Math.random() - 0.5) * 0.01,
          name: venue
        }
      });
      setIsSubmitting(false);
      navigateTo('/coordinator/dashboard');
    }, 600);
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Construct New Event</h1>
        <p className="text-xs text-slate-400 font-semibold">Publish academic conferences, athletic matches, or coding tournaments.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3">Event Parameters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Event Name / Title"
              type="text"
              placeholder="e.g. Vanguard Hackathon 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
            <Select
              label="Event Category"
              options={[
                { value: 'tech', label: 'Tech & Coding' },
                { value: 'academic', label: 'Academic Panels' },
                { value: 'cultural', label: 'Cultural & Music' },
                { value: 'sports', label: 'Athletic Sports' },
                { value: 'career', label: 'Careers & Fairs' }
              ]}
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="bg-slate-50 border-slate-200"
            />
            {myCollegeDepts.length === 0 ? (
              <div className="p-3.5 bg-amber-50/80 border border-amber-100 rounded-xl space-y-1">
                <span className="block text-xs font-bold text-amber-800">Department Setup Needed</span>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                  No departments available. College administrators can add departments in college setup/onboarding.
                </p>
              </div>
            ) : (
              <Select
                label="Hosting Department / Division"
                options={myCollegeDepts.map(d => ({ value: d, label: d }))}
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            )}
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 pt-2">Campus Affiliation & Leaders</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Campus / College Ecosystem"
              type="text"
              value={collegeName}
              disabled
              className="bg-slate-100 border-slate-200 text-slate-500 font-bold"
              helperText="Events are securely locked to your registered institution."
            />
            <Input
              label="Organizing Club / Society"
              type="text"
              placeholder="e.g. ACM Student Chapter, Sports Club, CSI Branch"
              value={clubOrg}
              onChange={e => setClubOrg(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Faculty Coordinator"
              type="text"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={facultyCoordinator}
              onChange={e => setFacultyCoordinator(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
            <Input
              label="Student Coordinator (Representative)"
              type="text"
              placeholder="e.g. Alex Rivera"
              value={studentCoordinator}
              onChange={e => setStudentCoordinator(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 pt-2">Event Parameters</h3>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Short Hook / Caption"
              type="text"
              placeholder="A brief 1-sentence hook display on directories cards..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
            <Textarea
              label="Detailed Schedule & Requirements"
              placeholder="Detail the schedules, prerequisites, eligibility structures, or prizes. Formatted markdown or bullet lines..."
              value={longDescription}
              onChange={e => setLongDescription(e.target.value)}
              rows={5}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Specific Venue Location"
              type="text"
              placeholder="e.g. Turing Computer Lab, Room 402"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
            <Input
              label="Venue Accessibility Notes"
              type="text"
              placeholder="e.g. Ground level entrance opposite central fountain"
              value={locationDetails}
              onChange={e => setLocationDetails(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Event Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-xs font-semibold"
            />
            <Input
              label="Event Start Time"
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-xs font-semibold"
            />
            <Input
              label="Registration Deadline"
              type="date"
              value={registrationDeadline}
              onChange={e => setRegistrationDeadline(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Maximum Occupancy Capacity"
              type="number"
              min="10"
              max="5000"
              value={maxParticipants}
              onChange={e => setMaxParticipants(e.target.value)}
              required
              className="bg-slate-50 border-slate-200"
            />
            <Input
              label="Cover Image Address (Optional)"
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="bg-slate-50 border-slate-200"
              helperText="Prefills beautiful generic category overlays if empty."
            />
            <Input
              label="Tags / Hashtags (Comma-separated)"
              type="text"
              placeholder="e.g. Google, Coding, Prizes"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="bg-slate-50 border-slate-200"
              helperText="Separate multiple keywords with commas."
            />
          </div>

          {/* Admin notice */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 text-xs text-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="font-semibold leading-relaxed">
              Upon publishing, your event parameters will enter the Administration Approval Queue. Students can only book seats once approved.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigateTo('/coordinator/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={myCollegeDepts.length === 0}
            >
              Submit for Review
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
export default CreateEventPage;
