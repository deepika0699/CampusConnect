import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Calendar, Award, ListOrdered, Sparkles, MapPin, ArrowRight } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, registrations, certificates, events, navigateTo } = useApp();

  if (!currentUser) return null;

  // Active student registrations
  const activeRegs = registrations.filter(
    r => r.studentId === currentUser.id && r.status === 'registered'
  );

  const attendedRegs = registrations.filter(
    r => r.studentId === currentUser.id && r.status === 'attended'
  );

  const studentCerts = certificates.filter(
    c => c.studentId === currentUser.id
  );

  return (
    <div className="space-y-8 py-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-slate-400 font-semibold">Welcome back, {currentUser.name}! Track reservations and credentials.</p>
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

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Bookings"
          value={activeRegs.length}
          icon={ListOrdered}
          iconColorClass="text-indigo-600"
          iconBgClass="bg-indigo-50"
          trend={{ value: 'Upcoming', isPositive: true, label: 'events' }}
          delay={0.1}
        />
        <StatCard
          title="Attended Events"
          value={attendedRegs.length}
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
          trend={{ value: 'Verifiable', isPositive: true, label: 'on LinkedIn' }}
          delay={0.3}
        />
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upcoming Reservations pass list */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800">Upcoming Events</h3>
              </div>
              {events.filter(e => e.collegeName === currentUser.collegeName && e.status === 'approved').length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No events available yet. Your campus coordinators will publish events soon.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 space-y-4">
                  {events.filter(e => e.collegeName === currentUser.collegeName && e.status === 'approved').slice(0, 2).map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                      <div className="flex gap-4 items-center min-w-0">
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          className="h-12 w-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{ev.title}</h4>
                          <span className="text-[10px] text-indigo-600 font-bold uppercase">{ev.department}</span>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigateTo(`/events/${ev.id}`)}
                      >
                        Register
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-50 pt-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800">My Registrations</h3>
                <button
                  onClick={() => navigateTo('/student/registrations')}
                  className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {activeRegs.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <p className="text-xs font-semibold text-slate-500">No registrations yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 space-y-4">
                  {activeRegs.slice(0, 2).map((reg) => {
                    const ev = events.find(e => e.id === reg.eventId);
                    return (
                      <div key={reg.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                        <div className="flex gap-4 items-center min-w-0">
                          {ev && (
                            <img
                              src={ev.imageUrl}
                              alt={ev.title}
                              className="h-12 w-12 rounded-xl object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{reg.eventTitle}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" /> {reg.eventDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateTo(`/events/${reg.eventId}`)}
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          Pass
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-50 pt-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800">Certificates</h3>
                <button
                  onClick={() => navigateTo('/student/certificates')}
                  className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {studentCerts.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <p className="text-xs font-semibold text-slate-500">No certificates available.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 space-y-4">
                  {studentCerts.slice(0, 2).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{cert.eventTitle}</h4>
                        <span className="text-[9px] font-mono text-indigo-600 uppercase font-bold">{cert.certificateCode}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateTo('/student/certificates')}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Quick shortcuts & Recommended Assistant */}
        <div className="lg:col-span-4 space-y-6">
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
