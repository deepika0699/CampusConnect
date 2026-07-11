import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';

export const StudentCalendar: React.FC = () => {
  const { currentUser, registrations, events, navigateTo } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-07-01')); // Hardcode current timeframe matching metadata

  if (!currentUser) return null;

  // Registered events list
  const activeRegs = registrations.filter(
    r => r.studentId === currentUser.id && r.status === 'registered'
  );

  const registeredEvents = activeRegs.map(r => events.find(e => e.id === r.eventId)).filter(Boolean);

  // Hardcode July 2026 grid cells
  const daysInMonth = 31;
  const startDayOffset = 3; // July 2026 starts on Wednesday (3)

  const monthYearStr = 'July 2026';

  const categoryStyles = {
    tech: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    cultural: 'bg-pink-50 border-pink-200 text-pink-700',
    academic: 'bg-amber-50 border-amber-200 text-amber-700',
    sports: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    career: 'bg-sky-50 border-sky-200 text-sky-700',
  };

  return (
    <div className="space-y-8 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Academic Activity Calendar</h1>
        <p className="text-xs text-slate-400 font-semibold">Stay updated on schedules, timings, and venues for your registered events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid card */}
        <div className="lg:col-span-8">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            {/* Header selector */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-800">{monthYearStr}</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 cursor-not-allowed" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 cursor-not-allowed" disabled>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-widest gap-2 mb-4">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-2.5">
              {/* Offsets */}
              {Array.from({ length: startDayOffset }).map((_, idx) => (
                <div key={`offset-${idx}`} className="h-20 bg-slate-50/40 border border-transparent rounded-2xl shrink-0" />
              ))}

              {/* Day slots */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedDate = `2026-07-${dayNum.toString().padStart(2, '0')}`;
                
                // Check if any registered event on this date
                const dayEvents = registeredEvents.filter(e => e?.date === formattedDate);

                return (
                  <div 
                    key={dayNum} 
                    className={`h-24 p-2 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-slate-200`}
                  >
                    <span className="text-xs font-black text-slate-700">{dayNum}</span>
                    
                    {dayEvents.map(evt => {
                      if (!evt) return null;
                      const styleClass = categoryStyles[evt.category] || 'bg-slate-50 text-slate-700';
                      return (
                        <div
                          key={evt.id}
                          onClick={() => navigateTo(`/events/${evt.id}`)}
                          className={`px-1.5 py-0.5 border text-[9px] font-bold rounded-lg truncate cursor-pointer hover:scale-[1.02] transition-transform ${styleClass}`}
                          title={`${evt.title} at ${evt.time}`}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Schedule List Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 mb-4 border-b border-slate-50 pb-3">Upcoming Schedules</h3>
            
            {registeredEvents.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No registered events on schedule.</p>
            ) : (
              <div className="space-y-4">
                {registeredEvents.map(evt => {
                  if (!evt) return null;
                  return (
                    <div 
                      key={evt.id} 
                      onClick={() => navigateTo(`/events/${evt.id}`)}
                      className="p-3 border border-slate-100 hover:border-indigo-400 rounded-2xl cursor-pointer shadow-sm transition-all flex gap-3 group"
                    >
                      <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 font-bold text-xs uppercase leading-none">
                        <span className="text-[10px] text-indigo-400">{new Date(evt.date).toLocaleDateString([], { month: 'short' })}</span>
                        <span>{new Date(evt.date).toLocaleDateString([], { day: 'numeric' })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{evt.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-semibold mt-1">
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {evt.time}</span>
                          <span className="flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3" /> {evt.venue}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default StudentCalendar;
