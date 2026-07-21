import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Calendar, Award, ListOrdered, Sparkles, MapPin, ArrowRight, Download, Clock, Ticket } from 'lucide-react';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import { Event } from '../../types';
import { generateCertificatePdf } from '../../lib/certificatePdf';

export const StudentDashboard: React.FC = () => {
  const { 
    currentUser, 
    registrations, 
    certificates, 
    events, 
    navigateTo,
    colleges
  } = useApp();

  if (!currentUser) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Upcoming Registered Events (active registration, date is today or in the future)
  const upcomingRegistered = registrations.filter(reg => {
    if (reg.studentId !== currentUser.id || reg.status !== 'registered') return false;
    const ev = events.find(e => e.id === reg.eventId);
    const evDate = ev?.date || reg.eventDate;
    return evDate >= todayStr;
  });

  // All My Registered Events (any registration state: registered, attended, cancelled)
  const allMyRegistrations = registrations.filter(
    reg => reg.studentId === currentUser.id
  );

  const studentCerts = certificates.filter(
    c => c.studentId === currentUser.id
  );

  const activeRegsCount = registrations.filter(
    r => r.studentId === currentUser.id && r.status === 'registered'
  ).length;

  const attendedRegsCount = registrations.filter(
    r => r.studentId === currentUser.id && r.status === 'attended'
  ).length;

  // Compute closest upcoming event
  const closestEvent = upcomingRegistered.reduce((closest, current) => {
    const currentEv = events.find(e => e.id === current.eventId);
    if (!currentEv) return closest;
    if (!closest) return currentEv;
    const closestDate = new Date(`${closest.date}T${closest.time || '10:00'}`);
    const currentDate = new Date(`${currentEv.date}T${currentEv.time || '10:00'}`);
    return currentDate < closestDate ? currentEv : closest;
  }, null as Event | null);

  return (
    <div className="space-y-8 py-6">
      {/* Welcome section with student name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-slate-400 font-semibold">
            Welcome back, <span className="text-indigo-600 font-bold">{currentUser.name}</span>! Track your campus bookings, certificates, and explore upcoming panels.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigateTo('/events')}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Discover New Events
        </Button>
      </div>

      {/* Responsive Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Bookings"
          value={activeRegsCount}
          icon={ListOrdered}
          iconColorClass="text-indigo-600"
          iconBgClass="bg-indigo-50"
          trend={{ value: 'Upcoming', isPositive: true, label: 'events' }}
          delay={0.1}
        />
        <StatCard
          title="Attended Events"
          value={attendedRegsCount}
          icon={Calendar}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
          trend={{ value: 'Verified', isPositive: true, label: 'attendance' }}
          delay={0.2}
        />
        <StatCard
          title="Earned Credentials"
          value={studentCerts.length}
          icon={Award}
          iconColorClass="text-amber-600"
          iconBgClass="bg-amber-50"
          trend={{ value: 'Verifiable', isPositive: true, label: 'credentials' }}
          delay={0.3}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upcoming Registered Events pass list */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section 1: Upcoming Registered Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-800">Upcoming Registered Events</h3>
                <p className="text-[10px] text-slate-400 font-medium">Your upcoming confirmed event passes and entry check-ins.</p>
              </div>
            </div>

            {upcomingRegistered.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-3">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Upcoming Bookings Found</h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                  You have no active event reservations scheduled. Explore the inter-college and campus-exclusive events list to book seats!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold border-slate-200 mt-2"
                  onClick={() => navigateTo('/events')}
                >
                  Explore Events Directory
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {upcomingRegistered.map(reg => {
                  const ev = events.find(e => e.id === reg.eventId);
                  return (
                    <Card
                      key={reg.id}
                      className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-600" />
                      
                      <div className="pl-2 space-y-4">
                        {/* Event Visibility & Status */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border capitalize bg-emerald-50 border-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {reg.status === 'registered' ? 'Confirmed Entry' : reg.status}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-400 truncate">
                            {ev?.visibility === 'open' ? 'Inter-College' : 'Campus Exclusive'}
                          </span>
                        </div>

                        {/* Title Context */}
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">{reg.eventTitle}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{ev?.collegeName || currentUser.collegeName}</p>
                        </div>

                        {/* Event Details: Date, Time, Venue */}
                        <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>{reg.eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>{ev?.time || '10:00 AM'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{reg.eventVenue}</span>
                          </div>
                        </div>

                        {/* QR Code and Seat/Reference context */}
                        <div className="pt-3.5 border-t border-slate-50 flex items-center gap-4">
                          <img
                            src={reg.qrCodeUrl}
                            alt="Admission QR"
                            className="h-16 w-16 bg-slate-50 p-1 border border-slate-100 rounded-xl shrink-0 object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1 min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                              Registration ID
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-600 truncate leading-none select-all py-0.5">
                              {reg.id}
                            </p>
                            <span className="inline-block text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md leading-none mt-1">
                              Seat Confirmed ({ev?.currentParticipants || 1}/{ev?.maxParticipants || 100})
                            </span>
                          </div>
                        </div>

                        {ev && (
                          <div className="pt-2 border-t border-slate-50">
                            <CountdownTimer date={ev.date} time={ev.time} />
                          </div>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full bg-indigo-600 font-bold text-xs py-2 mt-1"
                        onClick={() => navigateTo(`/student/event-pass?id=${reg.id}`)}
                      >
                        Open Event Pass
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: My Registered Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-800">My Registered Events</h3>
                <p className="text-[10px] text-slate-400 font-medium">All-time record of your event reservations and status logs.</p>
              </div>
            </div>

            {allMyRegistrations.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-2">
                <p className="text-xs font-semibold text-slate-400">You haven't registered for any events yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {allMyRegistrations.map(reg => {
                  const ev = events.find(e => e.id === reg.eventId);
                  return (
                    <Card
                      key={reg.id}
                      className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border capitalize ${
                            reg.status === 'registered'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                              : reg.status === 'attended'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            {reg.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{ev?.category || 'academic'}</span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{reg.eventTitle}</h4>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{ev?.collegeName || currentUser.collegeName}</p>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-500">
                          <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-slate-400 shrink-0" /> {reg.eventDate}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400 shrink-0" /> <span className="truncate">{reg.eventVenue}</span></p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigateTo(`/events/${reg.eventId}`)}
                      >
                        Event Details
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Earned Certificates */}
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-800">Earned Academic Certificates</h3>
                <p className="text-[10px] text-slate-400 font-medium">Verify and download cryptographically signed academic credentials.</p>
              </div>
              {studentCerts.length > 0 && (
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  {studentCerts.length} Issued
                </span>
              )}
            </div>

            {studentCerts.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-3 flex flex-col items-center">
                <div className="h-10 w-10 text-slate-200 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-xs font-semibold text-slate-400">No certificates issued yet.</p>
                <p className="text-[10px] text-slate-400/80 max-w-xs mx-auto font-medium">
                  Once you attend an event and check-in with the coordinator, your credential will be generated automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {studentCerts.map(cert => (
                  <Card
                    key={cert.id}
                    className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col justify-between space-y-4 group hover:border-indigo-100 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border capitalize bg-emerald-50 border-emerald-100 text-emerald-700 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Issued
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{cert.department}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{cert.eventTitle}</h4>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Verification: <span className="font-mono text-slate-500">{cert.verificationCode}</span></p>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Date: {cert.eventDate}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-400 text-[10px] italic">
                          <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-1/2 text-xs py-1.5 bg-indigo-600"
                        onClick={() => navigateTo('/student/certificates')}
                      >
                        View Badge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-1/2 text-xs py-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-1"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const collegeName = colleges.find(c => c.id === cert.collegeId)?.name || currentUser.collegeName || 'ANITS';
                          await generateCertificatePdf(cert, collegeName);
                        }}
                      >
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Quick shortcuts & Recommended Assistant */}
        <div className="lg:col-span-4 space-y-6">
          {/* Closest Upcoming Event Countdown Widget */}
          {closestEvent && (
            <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-xs space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block tracking-wider">
                  Next Event Commencing
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 line-clamp-1" title={closestEvent.title}>
                  {closestEvent.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {closestEvent.venue}
                </p>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100/85">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timer</span>
                <CountdownTimer date={closestEvent.date} time={closestEvent.time} />
              </div>
            </Card>
          )}

          <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-3xl border-none shadow-md shadow-indigo-100 flex flex-col justify-between min-h-[180px]">
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-indigo-200 tracking-widest bg-indigo-400/30 px-2 py-0.5 rounded-full inline-block">SOCIETY PROFILE</span>
              <h3 className="text-base font-bold tracking-tight">Need verification details?</h3>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                Your earned credentials include cryptographically verifiable identifiers that employers can query directly in LinkedIn or Resume packages.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50 text-indigo-700 font-semibold border-none mt-4 shadow"
              onClick={() => navigateTo('/student/certificates')}
            >
              Verify Certificates
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default StudentDashboard;
