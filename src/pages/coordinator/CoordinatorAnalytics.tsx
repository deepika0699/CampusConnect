import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { BarChart3, TrendingUp, Users, Calendar, Award } from 'lucide-react';

export const CoordinatorAnalytics: React.FC = () => {
  const { currentUser, events, registrations, colleges } = useApp();
  const [selectedDept, setSelectedDept] = useState('all');

  if (!currentUser) return null;

  // Find college departments
  const myCollegeObj = colleges.find(c => c.name === currentUser.collegeName);
  const myCollegeDepts = myCollegeObj ? myCollegeObj.departments : [];

  // Filter events managed by this coordinator
  const coordEvents = events
    .filter(e => e.coordinatorId === currentUser.id)
    .filter(e => selectedDept === 'all' || e.department === selectedDept);

  const totalRegs = registrations.filter(r => coordEvents.some(e => e.id === r.eventId));
  const attendedCount = totalRegs.filter(r => r.status === 'attended').length;

  // Registrations by Category statistics
  const categoriesCount = {
    tech: 0,
    academic: 0,
    cultural: 0,
    sports: 0,
    career: 0
  };

  coordEvents.forEach(e => {
    const regCount = registrations.filter(r => r.eventId === e.id && r.status !== 'cancelled').length;
    if (e.category in categoriesCount) {
      categoriesCount[e.category] += regCount;
    }
  });

  const categoryMax = Math.max(...Object.values(categoriesCount), 1);

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Department Activity Analytics</h1>
          <p className="text-xs text-slate-400 font-semibold">Track registrations trajectories, fests occupancy indexes, and credentials metrics.</p>
        </div>

        <div className="w-full md:w-72 shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Filtered View</span>
            <span className="block text-[10px] font-black text-slate-600 truncate">{currentUser.collegeName}</span>
          </div>
          <div className="w-40">
            {myCollegeDepts.length === 0 ? (
              <div className="px-2 py-1 bg-amber-50 border border-amber-100/50 rounded-lg text-[9px] font-bold text-amber-700 text-center">
                No Departments
              </div>
            ) : (
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Departments ({myCollegeDepts.length})</option>
                {myCollegeDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 1. Category-wise Seats Distribution (CSS Bar Chart) */}
        <div className="lg:col-span-6">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm h-full flex flex-col justify-between">
            <div className="space-y-1 pb-4 border-b border-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="h-5 w-5 text-indigo-500" /> Seats Booked by Category
              </h3>
              <p className="text-[10px] text-slate-400">Total volume of active tickets partitioned by academic/cultural fests.</p>
            </div>

            <div className="space-y-4 my-6">
              {[
                { label: 'Technology', id: 'tech', val: categoriesCount.tech, color: 'bg-indigo-600' },
                { label: 'Academic', id: 'academic', val: categoriesCount.academic, color: 'bg-amber-500' },
                { label: 'Cultural', id: 'cultural', val: categoriesCount.cultural, color: 'bg-pink-600' },
                { label: 'Athletics', id: 'sports', val: categoriesCount.sports, color: 'bg-emerald-600' },
                { label: 'Careers', id: 'career', val: categoriesCount.career, color: 'bg-sky-500' }
              ].map((c) => {
                const widthPercent = (c.val / categoryMax) * 100;
                return (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>{c.label}</span>
                      <span>{c.val} seats</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${c.color}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <span className="text-[9px] text-slate-400 font-medium">* Metrics represent live active seat bookings database logs.</span>
          </Card>
        </div>

        {/* 2. Occupancy Quotient Heat list */}
        <div className="lg:col-span-6">
          <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm h-full flex flex-col justify-between">
            <div className="space-y-1 pb-4 border-b border-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Event Fill-Quotient Ratios
              </h3>
              <p className="text-[10px] text-slate-400">Percentage of max capacities successfully booked per event.</p>
            </div>

            <div className="divide-y divide-slate-50 space-y-4 my-6 overflow-y-auto max-h-72">
              {coordEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No events on record.</p>
              ) : (
                coordEvents.map((evt) => {
                  const fillRatio = Math.round((evt.currentParticipants / evt.maxParticipants) * 100);
                  return (
                    <div key={evt.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{evt.title}</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{fillRatio}%</p>
                          <p className="text-[9px] text-slate-400">{evt.currentParticipants}/{evt.maxParticipants} slots</p>
                        </div>
                        <div className="h-8 w-2 rounded-full bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                          <div 
                            className={`w-full rounded-full transition-all ${
                              fillRatio >= 90 ? 'bg-rose-500' : fillRatio >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ height: `${fillRatio}%`, marginTop: `${100 - fillRatio}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <span className="text-[9px] text-slate-400 font-medium">* Over-allocated seating buffers are deactivated in current build version.</span>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default CoordinatorAnalytics;
