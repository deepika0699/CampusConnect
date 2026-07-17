import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import { CheckCircle2, XCircle, Search, Users, ShieldCheck, Mail, Calendar, Award } from 'lucide-react';

export const CoordinatorRegistrations: React.FC = () => {
  const { currentUser, events, registrations, markAttendance, certificates } = useApp();
  
  // Coordinator's events
  const coordEvents = events.filter(e => e.coordinatorId === currentUser?.id);
  
  const [selectedEventId, setSelectedEventId] = useState<string>(
    coordEvents.length > 0 ? coordEvents[0].id : ''
  );
  const [studentSearch, setStudentSearch] = useState('');

  if (!currentUser) return null;

  const currentEvent = coordEvents.find(e => e.id === selectedEventId);
  
  // Registrations for selected event
  const eventRegs = registrations.filter(
    r => r.eventId === selectedEventId && 
    (r.studentName.toLowerCase().includes(studentSearch.toLowerCase()) || r.studentEmail.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const activeEventRegs = eventRegs.filter(r => r.status !== 'cancelled');

  return (
    <div className="space-y-8 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">On-site Attendance & Check-in Desk</h1>
        <p className="text-xs text-slate-400 font-semibold">Verify admission QR passes, log attendance files, and issue participation fests.</p>
      </div>

      {coordEvents.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No active events to manage</p>
          <p className="text-xs text-slate-400 mt-1">Please create an event first to activate the check-in desk.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Bar */}
          <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <Select
                label="Select Campus Event"
                options={coordEvents.map(e => ({ value: e.id, label: `${e.title} (${e.date})` }))}
                value={selectedEventId}
                onChange={e => {
                  setSelectedEventId(e.target.value);
                  setStudentSearch('');
                }}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter name or university email address..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Roster Sheet */}
          <div className="lg:col-span-12">
            <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50/80 bg-slate-50/30 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-800">Student Admissions Checklist</h3>
                <span className="text-xs text-slate-400 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                  {activeEventRegs.length} total seats reserved
                </span>
              </div>

              {activeEventRegs.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-semibold">No students registered for this event yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Check back later or promote your event across campus forums.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[9px]">
                        <th className="py-3 px-6">Student Information</th>
                        <th className="py-3 px-6">Booked Date</th>
                        <th className="py-3 px-6 text-center">QR Registration Code</th>
                        <th className="py-3 px-6 text-center">Desk Check-in / Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                      {activeEventRegs.map((reg) => {
                        const cert = certificates.find(c => c.registrationId === reg.id);
                        return (
                          <tr key={reg.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{reg.studentName}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Mail className="h-3 w-3 shrink-0" /> {reg.studentEmail}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {new Date(reg.registeredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="font-mono text-[10px] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-slate-500">
                                {reg.id}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  {reg.status === 'attended' ? (
                                    <>
                                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Checked In
                                      </span>
                                      <button
                                        onClick={() => markAttendance(reg.id, false)}
                                        title="Revoke check-in"
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold py-1 px-3"
                                      onClick={() => markAttendance(reg.id, true)}
                                    >
                                      Mark Attended
                                    </Button>
                                  )}
                                </div>
                                {reg.status === 'attended' && (
                                  cert ? (
                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1 shrink-0">
                                      <Award className="h-3 w-3 text-indigo-500" /> Certificate Minted: {cert.verificationCode}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1 shrink-0">
                                      <Award className="h-3 w-3 text-slate-400 animate-pulse" /> Minting Pending
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

        </div>
      )}
    </div>
  );
};
export default CoordinatorRegistrations;
