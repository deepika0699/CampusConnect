import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BookOpen, Users, CheckCircle2, PlusCircle, ArrowRight, Calendar } from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { currentUser, events, registrations, navigateTo } = useApp();

  if (!currentUser) return null;

  // Filter events managed by this coordinator
  const coordEvents = events.filter(e => e.coordinatorId === currentUser.id);
  const totalRegistrations = registrations.filter(r => coordEvents.some(e => e.id === r.eventId));
  const attendedCount = totalRegistrations.filter(r => r.status === 'attended').length;
  
  const checkedInPercent = totalRegistrations.length > 0 
    ? Math.round((attendedCount / totalRegistrations.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 py-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Coordinator Dashboard</h1>
          <p className="text-xs text-slate-400 font-semibold">Welcome, {currentUser.name}. Manage schedules and log attendance files.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigateTo('/coordinator/create-event')}
          leftIcon={<PlusCircle className="h-4 w-4" />}
        >
          Create New Event
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Events Created"
          value={coordEvents.length}
          icon={BookOpen}
          iconColorClass="text-indigo-600"
          iconBgClass="bg-indigo-50"
          trend={{ value: 'Approved', isPositive: true, label: 'academic catalogs' }}
          delay={0.1}
        />
        <StatCard
          title="Registrations Tracked"
          value={totalRegistrations.length}
          icon={Users}
          iconColorClass="text-violet-600"
          iconBgClass="bg-violet-50"
          trend={{ value: 'Total seats', isPositive: true, label: 'booked' }}
          delay={0.2}
        />
        <StatCard
          title="Attendance checked-in"
          value={`${checkedInPercent}%`}
          icon={CheckCircle2}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
          trend={{ value: `${attendedCount}/${totalRegistrations.length}`, isPositive: true, label: 'scans verified' }}
          delay={0.3}
        />
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Owned Events list */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">My Managed Events</h3>
              <button
                onClick={() => navigateTo('/coordinator/events')}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {coordEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BookOpen className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-semibold">No active events found.</p>
                <p className="text-[10px] text-slate-400 mt-1">Tap the create button to publish your first academic event.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 space-y-4">
                {coordEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                    <div className="flex gap-4 items-center min-w-0">
                      <img
                        src={evt.imageUrl}
                        alt={evt.title}
                        className="h-12 w-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{evt.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {evt.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {evt.currentParticipants}/{evt.maxParticipants} slots
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(`/events/${evt.id}`)}
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Audit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Quick Action Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-slate-900 text-slate-300 rounded-3xl border-none shadow-md shadow-indigo-100 flex flex-col justify-between min-h-[180px]">
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full inline-block">CHECK-IN DESK</span>
              <h3 className="text-base font-bold tracking-tight text-white">Attendance Sheets</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Scan tickets and manage seating checklists on-site using the centralized Attendance desk.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 border-none text-white font-bold mt-4 shadow"
              onClick={() => navigateTo('/coordinator/registrations')}
            >
              Verify Check-in
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default CoordinatorDashboard;
