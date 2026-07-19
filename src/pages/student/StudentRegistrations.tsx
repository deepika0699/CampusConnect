import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Calendar, MapPin, Ticket, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { CountdownTimer } from '../../components/common/CountdownTimer';

export const StudentRegistrations: React.FC = () => {
  const { currentUser, registrations, cancelRegistration, navigateTo, events } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'cancelled'>('active');

  if (!currentUser) return null;

  const studentRegs = registrations.filter(r => r.studentId === currentUser.id);
  
  const activeRegs = studentRegs.filter(r => r.status !== 'cancelled');
  const cancelledRegs = studentRegs.filter(r => r.status === 'cancelled');

  const visibleRegs = activeTab === 'active' ? activeRegs : cancelledRegs;

  return (
    <div className="space-y-8 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Event Bookings</h1>
        <p className="text-xs text-slate-400 font-semibold">Access your seating codes and digital QR entry tickets.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'active' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Active Passes ({activeRegs.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'cancelled' 
              ? 'border-rose-600 text-rose-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Cancelled ({cancelledRegs.length})
        </button>
      </div>

      {/* Grid of Tickets */}
      {visibleRegs.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">
          <Ticket className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No bookings found in this directory</p>
          <p className="text-xs text-slate-400 mt-1">Explore upcoming events to reserve seats.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleRegs.map((reg) => {
            const ev = events.find(e => e.id === reg.eventId);
            return (
              <Card 
                key={reg.id} 
                className="p-5 bg-white border border-slate-200/60 rounded-3xl shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between relative overflow-hidden"
              >
                {/* Visual side highlights */}
                <div className={`absolute top-0 bottom-0 left-0 w-2 ${
                  reg.status === 'attended' 
                    ? 'bg-emerald-500' 
                    : reg.status === 'cancelled' 
                    ? 'bg-rose-500' 
                    : 'bg-indigo-600'
                }`} />

                {/* Ticket Details */}
                <div className="space-y-4 flex-1 pl-3 min-w-0">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {ev?.department || 'General Society'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 truncate" title={reg.eventTitle}>
                      {reg.eventTitle}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{reg.eventDate}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate" title={reg.eventVenue}>
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{reg.eventVenue}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      Reservation ID: <span className="font-mono text-slate-600">{reg.id}</span>
                    </p>
                    {reg.status === 'registered' && (
                      <div className="mt-2.5">
                        <CountdownTimer 
                          date={ev?.date || reg.eventDate} 
                          time={ev?.time || '10:00'} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => navigateTo(`/events/${reg.eventId}`)}
                    >
                      Event Details
                    </Button>
                    
                    {reg.status !== 'cancelled' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="bg-indigo-600 text-xs"
                        onClick={() => navigateTo(`/student/event-pass?id=${reg.id}`)}
                      >
                        Open Pass
                      </Button>
                    )}
                    
                    {reg.status === 'registered' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
                        onClick={() => cancelRegistration(reg.id)}
                      >
                        Cancel Ticket
                      </Button>
                    )}
                  </div>
                </div>

                {/* QR Ticket image container */}
                {reg.status !== 'cancelled' && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-1.5 shrink-0 text-center">
                    <img
                      src={reg.qrCodeUrl}
                      alt="Ticket QR Code"
                      className="h-28 w-28 rounded-lg object-contain bg-white p-1"
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {reg.status === 'attended' ? 'Check-in Verified' : 'Scan to Entry'}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default StudentRegistrations;
