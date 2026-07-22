import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Send, Sparkles, MessageSquare, Award, ShieldAlert, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { CountdownTimer } from '../../components/common/CountdownTimer';

export const EventDetailsPage: React.FC = () => {
  const { currentPath, events, currentUser, registrations, registerForEvent, cancelRegistration, navigateTo } = useApp();

  // Extract ID from path like /events/evt_01
  const getEventId = () => {
    const parts = currentPath.split('/');
    return parts[parts.length - 1] || '';
  };

  const eventId = getEventId();
  const event = events.find(e => e.id === eventId);

  // Event Assistant states
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: 'Hi! I am your Event Assistant. Ask me any question about venue, timing, fees, prerequisites, or policies for this event.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Cover Poster image states
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [event?.id]);

  if (!event) {
    return (
      <div className="py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
        <p className="text-sm text-slate-500">The event ID specified does not exist or may have been deleted.</p>
        <Button variant="outline" onClick={() => navigateTo('/events')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  // Check registration status
  const userReg = currentUser
    ? registrations.find(r => r.eventId === event.id && r.studentId === currentUser.id && r.status !== 'cancelled')
    : null;

  const isRegistered = !!userReg;
  const isFull = event.currentParticipants >= event.maxParticipants;
  const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();

  const hasMapCoords = event.mapLocation && 
    typeof event.mapLocation.lat === 'number' && 
    typeof event.mapLocation.lng === 'number' &&
    !isNaN(event.mapLocation.lat) && 
    !isNaN(event.mapLocation.lng);

  // Handle Grounded Event Assistant API query
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !event?.id || isTyping) return;
    const userText = chatMessage.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setChatMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/event-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, question: userText })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setChatLog(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: errData.answer || errData.error || 'The Event Assistant is temporarily unavailable. Please try again later.'
          }
        ]);
      } else {
        const data = await response.json();
        setChatLog(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer || 'I could not find that information in the event details. Please contact the event coordinator for confirmation.'
          }
        ]);
      }
    } catch (err) {
      console.error('Error calling Event Assistant API:', err);
      setChatLog(prev => [
        ...prev,
        { sender: 'assistant', text: 'The Event Assistant is temporarily unavailable. Please try again later.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Back to Events Navigation */}
      <button
        onClick={() => navigateTo('/events')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discover
      </button>

      {/* Grid: 2 columns. Left: details, directions, Right: Action pass, chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Media & Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Card */}
          <Card className="overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="relative w-full h-72 sm:h-96 bg-slate-900">
              {(() => {
                const posterSrc = event.coverImage || event.imageUrl;
                const hasPoster = Boolean(posterSrc && posterSrc.trim() && !imageError);

                if (hasPoster) {
                  return (
                    <>
                      <img
                        src={posterSrc}
                        alt={event.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                      />
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-2">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold text-slate-300">Loading Cover Poster...</span>
                        </div>
                      )}
                    </>
                  );
                } else {
                  return (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center relative p-8 text-center overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.2),transparent_70%)]" />
                      <div className="relative z-0 space-y-2 max-w-lg mb-12">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest border border-indigo-400/20 backdrop-blur-xs inline-block">
                          {event.category} Event
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
              
              {/* Overlay Content */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 z-10">
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600/95 font-bold text-xs uppercase tracking-widest text-white border border-indigo-400/20">
                    {event.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                    {event.clubOrg}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                    event.visibility === 'open'
                      ? 'bg-emerald-600/90 border-emerald-400/30 text-white'
                      : 'bg-amber-600/90 border-amber-400/30 text-white'
                  }`}>
                    {event.visibility === 'open' ? 'Open Inter-College' : 'Campus-Exclusive'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                    event.status === 'approved'
                      ? 'bg-teal-600/90 border-teal-400/30 text-white'
                      : event.status === 'pending'
                      ? 'bg-sky-600/90 border-sky-400/30 text-white'
                      : 'bg-rose-600/90 border-rose-400/30 text-white'
                  }`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{event.title}</h1>
                <p className="text-xs sm:text-sm text-slate-200 font-medium">
                  <span className="text-indigo-400 font-bold">{event.collegeName}</span> • Hosted by the Department of {event.department}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Quick Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-xs font-semibold">
                <div className="flex flex-col gap-1 border-r border-slate-200/50 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                    {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:border-r border-slate-200/50 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Start Time</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Clock className="h-4.5 w-4.5 text-indigo-500" />
                    {event.startTime || event.time}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-r border-slate-200/50 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">End Time</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Clock className="h-4.5 w-4.5 text-indigo-500" />
                    {event.endTime || '12:00 PM'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Attendance Certificate</span>
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md self-start">
                    <Award className="h-4 w-4" /> Verifiable
                  </span>
                </div>
              </div>

              {/* Event Long Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Event Description</h2>
                  {event.lastEditedAt && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Revised {new Date(event.lastEditedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {event.longDescription || event.description}
                </p>
              </div>

              {/* Campus Administration and Coordinators Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100/50 pb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span> Academic Coordinators
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 font-medium whitespace-nowrap">Coordinator</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs text-right truncate max-w-[150px]">{event.coordinatorName}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 font-medium whitespace-nowrap">Faculty Coordinator</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs text-right truncate max-w-[150px]">{event.facultyCoordinator}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 font-medium whitespace-nowrap">Student Coordinator</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs text-right truncate max-w-[150px]">{event.studentCoordinator}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-100/50 pb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Booking Constraints
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Registration Deadline</span>
                      <span className="font-extrabold text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">
                        {new Date(event.registrationDeadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Maximum Participants</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">{event.maxParticipants} max</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Current Participants</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">{event.currentParticipants} reserved</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Remaining Seats</span>
                      <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">{event.maxParticipants - event.currentParticipants} slots left</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {event.tags.map(t => (
                  <span key={t} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-100">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Venue & Navigation Section */}
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/60">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Venue & Navigation</h3>
                  <p className="text-xs text-slate-400 font-medium">Interactive venue map & directions</p>
                </div>
              </div>

              {hasMapCoords && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${event.mapLocation!.lat},${event.mapLocation!.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open directions to ${event.title} venue on Google Maps`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Directions</span>
                </a>
              )}
            </div>

            {hasMapCoords ? (
              <div className="space-y-6">
                {/* 4A: Embedded Google Map */}
                <div className="w-full overflow-hidden rounded-3xl border border-slate-200/80 shadow-xs">
                  <iframe
                    title={`Google Map for ${event.title} venue`}
                    src={`https://www.google.com/maps?q=${event.mapLocation!.lat},${event.mapLocation!.lng}&z=17&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-[300px] rounded-3xl block"
                  />
                </div>

                {/* 4B: Venue Information Card */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-indigo-600 shrink-0 mt-0.5 shadow-2xs">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm truncate">{event.venue}</h4>
                        {event.mapLocation!.mapLabel && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                            {event.mapLocation!.mapLabel}
                          </span>
                        )}
                      </div>

                      {(event.mapLocation!.address || event.mapLocation!.name || event.locationDetails) && (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {event.mapLocation!.address || event.mapLocation!.name || event.locationDetails}
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coordinates:</span>
                        <span className="font-mono text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                          {event.mapLocation!.lat.toFixed(6)}, {event.mapLocation!.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 5: Graceful Fallback Card */
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">Map not available for this event.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                    The event coordinator has not mapped exact GPS coordinates for {event.venue}.
                  </p>
                </div>
              </div>
            )}
          </Card>

        </div>

        {/* Right Column: Ticket pass widget & Chatbot */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Booking / QR Pass Panel */}
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col gap-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Event Access Portal</h3>
              <p className="text-[10px] text-slate-400 font-medium">Verify credentials and manage reservations.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Countdown</span>
              <CountdownTimer date={event.date} time={event.time} />
            </div>

            {currentUser === null ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-50 pb-2">
                  <span>Available seats:</span>
                  <span className="text-indigo-600 font-extrabold">{event.maxParticipants - event.currentParticipants} slots left</span>
                </div>

                {isDeadlinePassed ? (
                  <Button
                    variant="primary"
                    disabled
                    className="w-full bg-rose-50 text-rose-600 border border-rose-100 font-bold"
                  >
                    Registration Closed
                  </Button>
                ) : isFull ? (
                  <Button
                    variant="primary"
                    disabled
                    className="w-full bg-rose-50 text-rose-600 border border-rose-100 font-bold"
                  >
                    Event Full
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                    onClick={() => registerForEvent(event.id)}
                  >
                    Register
                  </Button>
                )}

                <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                  You are viewing this event as a guest. Clicking Register will prompt you to authenticate.
                </p>
              </div>
            ) : currentUser.role !== 'student' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Coordinator & Admin accounts are restricted from student bookings.
                </p>
                <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-lg inline-block">
                  {currentUser.role.toUpperCase()} View Mode
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isRegistered ? (
                  <div className="space-y-5">
                    {/* Visual Pass card */}
                    <div className="relative p-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center gap-4 text-center">
                      {/* Dashed separators like a real ticket */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 h-4 w-4 bg-white border-r border-dashed border-slate-200 rounded-full" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 h-4 w-4 bg-white border-l border-dashed border-slate-200 rounded-full" />
                      
                      <p className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">My Seat Admission Pass</p>
                      
                      {/* Image QR */}
                      <img
                        src={userReg.qrCodeUrl}
                        alt="Seat QR Ticket"
                        className="h-44 w-44 rounded-xl border border-slate-100 p-2.5 bg-white shadow-sm"
                      />

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">{userReg.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Verified Registration ID: {userReg.id}</p>
                      </div>

                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 rounded-full bg-emerald-100/40 text-emerald-800 border border-emerald-200/50">
                        Status: Registered
                      </div>
                    </div>

                    {/* Displays smart button showing 'Registered' alongside cancel action */}
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        disabled
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-xs"
                      >
                        Registered
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold"
                        onClick={() => cancelRegistration(userReg.id)}
                      >
                        Cancel Reservation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-50 pb-2">
                      <span>Available seats:</span>
                      <span className="text-indigo-600 font-extrabold">{event.maxParticipants - event.currentParticipants} slots left</span>
                    </div>

                    {/* Smart button for Registered Student */}
                    {isDeadlinePassed ? (
                      <Button
                        variant="primary"
                        disabled
                        className="w-full bg-rose-50 text-rose-500 border border-rose-200 font-bold"
                      >
                        Registration Closed
                      </Button>
                    ) : isFull ? (
                      <Button
                        variant="primary"
                        disabled
                        className="w-full bg-rose-50 text-rose-500 border border-rose-200 font-bold"
                      >
                        Event Full
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                        onClick={() => registerForEvent(event.id)}
                      >
                        Register
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Secure Grounded Event Assistant widget */}
          <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-xs flex flex-col h-[460px]">
            <div className="flex flex-col gap-2 mb-3 shrink-0 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 tracking-tight">Event Assistant</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Verified Event Intelligence</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-bold uppercase tracking-wider shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Grounded on live event data
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                Answers are generated from the current event information and do not include private user or administrative data.
              </p>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-3 p-1 text-xs">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none font-medium shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 border border-slate-200/50 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-400 px-3.5 py-2 rounded-2xl rounded-tl-none animate-pulse text-xs">
                    Assistant is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask e.g. Is food provided?..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
                className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white placeholder:text-slate-400 text-slate-800 disabled:bg-slate-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || isTyping}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer text-xs flex items-center justify-center"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
export default EventDetailsPage;
