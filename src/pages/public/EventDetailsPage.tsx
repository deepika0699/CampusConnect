import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Send, Sparkles, MessageSquare, Compass, Award, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const EventDetailsPage: React.FC = () => {
  const { currentPath, events, currentUser, registrations, registerForEvent, cancelRegistration, navigateTo } = useApp();

  // Extract ID from path like /events/evt_01
  const getEventId = () => {
    const parts = currentPath.split('/');
    return parts[parts.length - 1] || '';
  };

  const eventId = getEventId();
  const event = events.find(e => e.id === eventId);

  // Chatbot states
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: 'Hi! I am your Event Coordinator Assistant. Feel free to ask me anything about schedules, catering, prerequisites, or parking for this event!' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Directions state
  const [directionsQuery, setDirectionsQuery] = useState('');
  const [directionSteps, setDirectionSteps] = useState<string[]>([]);
  const [isRouting, setIsRouting] = useState(false);

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

  // Handle Event Chatbot Logic (Instant AI simulation responding to queries about this event)
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userText = chatMessage;
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setChatMessage('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I'm checking that with the CSE planning committee. Generally, we recommend wearing casual clothes and bringing a notebook!";
      const textLower = userText.toLowerCase();

      if (textLower.includes('food') || textLower.includes('catering') || textLower.includes('eat') || textLower.includes('lunch') || textLower.includes('drink')) {
        reply = `Yes, snacks and refreshing beverages will be provided throughout the event at the ${event.venue}. Vegan and gluten-free items will also be available.`;
      } else if (textLower.includes('where') || textLower.includes('location') || textLower.includes('room') || textLower.includes('get to') || textLower.includes('directions')) {
        reply = `This event takes place in the ${event.venue}. ${event.locationDetails || 'Please use the central quad stairs to access.'}`;
      } else if (textLower.includes('cost') || textLower.includes('price') || textLower.includes('free') || textLower.includes('pay')) {
        reply = `Registration for "${event.title}" is entirely free for authorized student ID holders of CampusConnect!`;
      } else if (textLower.includes('deadline') || textLower.includes('until') || textLower.includes('last day')) {
        reply = `The registration window locks on ${new Date(event.registrationDeadline).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}. We suggest reserving your seat promptly!`;
      } else if (textLower.includes('who') || textLower.includes('major') || textLower.includes('eligibility') || textLower.includes('major')) {
        reply = `This event is organized by the ${event.department} department. It is open to all registered campus students, though CSE and engineering majors will find it particularly tailored!`;
      } else if (textLower.includes('certificate') || textLower.includes('award') || textLower.includes('cred')) {
        reply = `Yes! Full participation guarantees a verifiably cryptographically secure credential issued instantly under your Profile upon checked attendance.`;
      }

      setChatLog(prev => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 600);
  };

  // Handle Directions Navigation Logic
  const handleGetDirections = () => {
    if (!directionsQuery.trim()) return;
    setIsRouting(true);
    setTimeout(() => {
      setDirectionSteps([
        `Departing from ${directionsQuery}`,
        'Take campus shuttle line B north towards central circle',
        `Disembark at the quad amphitheater and head right for ${event.venue}`,
        `You have arrived at ${event.venue}. Proceed to the check-in desk for QR check-in.`
      ]);
      setIsRouting(false);
    }, 500);
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
            <div className="relative w-full h-72 sm:h-96">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              {/* Overlay Content */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600/95 font-bold text-xs uppercase tracking-widest text-white border border-indigo-400/20">
                    {event.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                    {event.clubOrg}
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
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Time</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Clock className="h-4.5 w-4.5 text-indigo-500" />
                    {event.time}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-r border-slate-200/50 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Campus Venue</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-800 truncate" title={event.venue}>
                    <MapPin className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                    {event.venue}
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
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Event Description</h2>
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
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Faculty Coordinator</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">{event.facultyCoordinator}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Student Coordinator</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">{event.studentCoordinator}</span>
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
                      <span className="text-slate-400 font-medium">Participant Ceiling</span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">{event.maxParticipants} students max</span>
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

          {/* Location Details & Directions Section */}
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <Compass className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Location Details & Navigation</h3>
                <p className="text-[10px] text-slate-400">Discover precise instructions to reach {event.venue}.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
                  <p className="font-bold text-slate-700">Detailed Venue Note:</p>
                  <p className="text-slate-500 font-medium leading-relaxed">{event.locationDetails}</p>
                </div>

                {/* Directions input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Enter your starting point (e.g. Student Dorms B, West Gate)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Dormitory Complex..."
                      value={directionsQuery}
                      onChange={e => setDirectionsQuery(e.target.value)}
                      className="flex-1 px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white placeholder:text-slate-400 text-slate-800"
                    />
                    <Button variant="outline" size="sm" onClick={handleGetDirections} disabled={!directionsQuery.trim()}>
                      Route
                    </Button>
                  </div>
                </div>
              </div>

              {/* Directions Response Steps */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 text-xs text-slate-300 font-mono flex flex-col justify-between min-h-[160px]">
                <div className="space-y-2.5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Active Navigation Terminal</p>
                  {directionSteps.length === 0 ? (
                    <p className="text-slate-500 italic mt-4">Input starting reference coordinates on the left to trace navigation routes...</p>
                  ) : (
                    <div className="space-y-2">
                      {directionSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-emerald-400">
                          <span>{idx + 1}.</span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-600 mt-4 block text-right">GPS Core Engine v1.02</span>
              </div>
            </div>
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

            {currentUser === null ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  You are viewing this event as a guest. Please sign in to book your seat.
                </p>
                <Button variant="primary" size="sm" className="w-full" onClick={() => navigateTo('/login')}>
                  Sign In to Register
                </Button>
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

                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 rounded-full bg-indigo-100/30 text-indigo-700">
                        Status: {userReg.status.toUpperCase()}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold"
                      onClick={() => cancelRegistration(userReg.id)}
                    >
                      Cancel Reservation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Available seats:</span>
                      <span className="text-slate-800 font-bold">{event.maxParticipants - event.currentParticipants} slots left</span>
                    </div>

                    {isDeadlinePassed ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-center font-bold rounded-2xl text-xs">
                        Registration Locked: Deadline passed on {event.registrationDeadline}
                      </div>
                    ) : isFull ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-center font-bold rounded-2xl text-xs">
                        This event is completely fully booked.
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => registerForEvent(event.id)}
                      >
                        Confirm My Seat
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* AI Event Chatbot widget */}
          <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-3 shrink-0 pb-3 border-b border-slate-50">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Event Chatbot Assistant</h4>
                <p className="text-[8px] text-slate-400">Ask about prerequisites, catering, and updates.</p>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-3 p-1 text-xs">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-700 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-400 px-3 py-2 rounded-2xl rounded-tl-none animate-pulse">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask e.g. Is lunch free?..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white placeholder:text-slate-400 text-slate-800"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
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
