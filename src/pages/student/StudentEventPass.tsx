import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import { 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  Award, 
  User, 
  Compass, 
  Building, 
  CheckCircle2, 
  Clock, 
  Ticket, 
  Layers 
} from 'lucide-react';

export const StudentEventPass: React.FC = () => {
  const { currentPath, registrations, events, navigateTo, currentUser } = useApp();

  if (!currentUser) return null;

  // Extract query parameters manually from custom hash path (e.g. /student/event-pass?id=reg_12345)
  const getQueryParam = (name: string): string | null => {
    try {
      const queryString = currentPath.split('?')[1];
      if (!queryString) return null;
      const params = new URLSearchParams(queryString);
      return params.get(name);
    } catch (e) {
      console.error("Error parsing query params:", e);
      return null;
    }
  };

  const regId = getQueryParam('id');
  const registration = registrations.find(r => r.id === regId);
  const event = registration ? events.find(e => e.id === registration.eventId) : null;

  if (!registration || !event) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <Ticket className="h-12 w-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Pass Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          We could not locate this digital event pass. Please verify the booking reference or return to your dashboard.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-slate-200"
          onClick={() => navigateTo('/student/dashboard')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Double check tenant isolation
  if (registration.studentId !== currentUser.id) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Layers className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You are not authorized to view this admission pass. For security, tickets are locked to their respective authenticated student owners.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-slate-200"
          onClick={() => navigateTo('/student/dashboard')}
        >
          My Dashboard
        </Button>
      </div>
    );
  }

  const isAttended = registration.status === 'attended';
  const isCancelled = registration.status === 'cancelled';

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('/student/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
          REF: {registration.id}
        </span>
      </div>

      {/* Main Digital Ticket */}
      <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-md relative">
        {/* Top visual strip indicating status */}
        <div className={`h-3 w-full ${
          isAttended 
            ? 'bg-emerald-500' 
            : isCancelled 
            ? 'bg-rose-500' 
            : 'bg-indigo-600'
        }`} />

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Main Info Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize flex items-center gap-1 ${
                isAttended 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : isCancelled 
                  ? 'bg-rose-50 border-rose-100 text-rose-700' 
                  : 'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}>
                {isAttended && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {isCancelled && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                {!isAttended && !isCancelled && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                {registration.status === 'registered' ? 'Confirmed Entry' : registration.status}
              </span>
              
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 border-slate-100 text-slate-500">
                {event.visibility === 'open' ? 'Inter-College' : 'Campus Exclusive'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-snug">
              {event.title}
            </h1>
          </div>

          {/* Ticket Body: Splitted with fake ticket perforated design */}
          <div className="border-t border-b border-dashed border-slate-200/80 py-6 my-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left Column: QR and scanning instructions */}
            <div className="md:col-span-5 flex flex-col items-center text-center space-y-3 md:border-r md:border-slate-100 md:pr-6">
              {!isCancelled ? (
                <>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                    <img 
                      src={registration.qrCodeUrl} 
                      alt="Pass QR Code" 
                      className="h-36 w-36 object-contain bg-white p-1.5 rounded-xl border border-slate-100/50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {isAttended ? 'Attendance Verified' : 'Scan for Admission'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Show this code to the event coordinator at the venue entrance.
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-36 w-36 bg-rose-50 border border-rose-100/60 rounded-2xl flex flex-col items-center justify-center text-rose-500 p-4 space-y-1">
                  <Layers className="h-8 w-8" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
                </div>
              )}
            </div>

            {/* Right Column: Admission specifications */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Date</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    {registration.eventDate}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Time</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    {event.time || '10:00 AM'}
                  </p>
                </div>

                <div className="space-y-0.5 col-span-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Venue Location</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1 truncate" title={registration.eventVenue}>
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    {registration.eventVenue}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Department</span>
                  <p className="font-bold text-slate-700 flex items-center gap-1 truncate" title={event.department}>
                    <Compass className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    {event.department}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Institution</span>
                  <p className="font-bold text-slate-700 flex items-center gap-1 truncate" title={event.collegeName}>
                    <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    {event.collegeName}
                  </p>
                </div>

                <div className="space-y-0.5 col-span-2 bg-slate-50/60 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Attendee Credentials</span>
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 mt-1">
                    <span>{registration.studentName}</span>
                    <span className="text-slate-400 font-medium font-mono">{registration.studentEmail}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Ticket Footer details: Organizer, seat status & countdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            
            {/* Countdown or Status widget */}
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pass Countdown</span>
              {!isCancelled && !isAttended ? (
                <CountdownTimer date={event.date} time={event.time} />
              ) : (
                <span className={`inline-flex items-center text-[10px] font-bold border px-2.5 py-0.5 rounded-md w-fit ${
                  isAttended ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'
                }`}>
                  {isAttended ? 'Verified Entry' : 'Pass Terminated'}
                </span>
              )}
            </div>

            {/* Organizer Context & Seats */}
            <div className="text-right text-xs space-y-1">
              <p className="text-slate-500 font-semibold">
                Organized by: <span className="text-slate-800 font-extrabold">{event.clubOrg || 'Student Council'}</span>
              </p>
              <div className="flex items-center gap-2 justify-end text-[10px] font-bold">
                <span className="text-slate-400">Seat Booking Status:</span>
                <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                  Confirmed Slot ({event.currentParticipants}/{event.maxParticipants})
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
