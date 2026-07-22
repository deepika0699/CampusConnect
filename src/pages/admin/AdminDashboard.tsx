import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { ShieldAlert, CheckCircle2, Clock, Users, Award, ShieldCheck, Mail, Calendar, Megaphone, Lock, Unlock, History, FileText } from 'lucide-react';
import { getEditWindowStatus } from '../../lib/eventUtils';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    events, 
    registrations, 
    certificates, 
    eventAuditLogs, 
    approveEvent, 
    rejectEvent, 
    unlockEventEditing, 
    lockEventEditing, 
    addNotification 
  } = useApp();

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) return;

    setIsPosting(true);
    try {
      // Empty student ID means it will broadcast to the whole collegeId
      await addNotification(
        announcementTitle.trim(),
        announcementMessage.trim(),
        'campus_announcement',
        '', // Broadcast recipient
        currentUser.collegeId
      );

      // Local success feedback to the admin themself
      await addNotification(
        'Announcement Posted!',
        `Your campus announcement "${announcementTitle.trim()}" is now live for all users.`,
        'success',
        currentUser.id,
        currentUser.collegeId
      );

      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } catch (err) {
      console.error("Error creating campus announcement:", err);
    } finally {
      setIsPosting(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  // Telemetry counts
  const publishedCount = events.filter(e => e.status === 'approved').length;
  const pendingEvents = events.filter(e => e.status === 'pending');
  const certificatesCount = certificates.length;

  return (
    <div className="space-y-8 py-6">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">University Activity Administration</h1>
        <p className="text-xs text-slate-400 font-semibold">Oversee coordinator listings, approve pending events, and manage facility queues.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="System Core Users"
          value={3} // Student, Coordinator, Admin
          icon={Users}
          iconColorClass="text-indigo-600"
          iconBgClass="bg-indigo-50"
          trend={{ value: 'Stable', isPositive: true, label: 'mock records' }}
          delay={0.1}
        />
        <StatCard
          title="Published Events"
          value={publishedCount}
          icon={CheckCircle2}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
          trend={{ value: 'Live on feeds', isPositive: true, label: 'active' }}
          delay={0.2}
        />
        <StatCard
          title="Reviews Pending"
          value={pendingEvents.length}
          icon={Clock}
          iconColorClass="text-amber-600"
          iconBgClass="bg-amber-50"
          trend={{ value: 'Action required', isPositive: false, label: 'items' }}
          delay={0.3}
        />
        <StatCard
          title="Verifications Issued"
          value={certificatesCount}
          icon={Award}
          iconColorClass="text-violet-600"
          iconBgClass="bg-violet-50"
          trend={{ value: 'Cryptographic', isPositive: true, label: 'certificates' }}
          delay={0.4}
        />
      </div>

      {/* Grid containing review queue and announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review Queue (left 2 cols on lg) */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden h-full flex flex-col justify-between">
            <div>
              <div className="px-6 py-4.5 border-b border-slate-50/80 bg-slate-50/30 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-800">Review Queue Approvals</h3>
                {pendingEvents.length > 0 && (
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 animate-pulse" /> {pendingEvents.length} critical review tasks
                  </span>
                )}
              </div>

              {pendingEvents.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <ShieldCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-semibold">Queue is perfectly clear!</p>
                  <p className="text-[10px] text-slate-400 mt-1">All coordinator events have been reviewed and resolved.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[9px]">
                        <th className="py-3.5 px-6">Event & Department Details</th>
                        <th className="py-3.5 px-6">Event Date & Venue</th>
                        <th className="py-3.5 px-6">Coordinator Info</th>
                        <th className="py-3.5 px-6 text-center">Administration Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                      {pendingEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-50/10 transition-colors">
                          <td className="py-4 px-6 max-w-xs">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-800 text-sm">{evt.title}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1">{evt.description}</span>
                              <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase self-start mt-1 font-bold">
                                {evt.category}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {evt.date}</span>
                              <span className="text-slate-400">{evt.venue}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{evt.coordinatorName}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{evt.department}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold py-1 px-3"
                                onClick={() => approveEvent(evt.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="bg-rose-600 hover:bg-rose-700 text-[11px] font-bold py-1 px-3"
                                onClick={() => rejectEvent(evt.id)}
                              >
                                Decline
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Create Campus Announcement (right 1 col on lg) */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden h-full flex flex-col justify-between">
            <div className="px-6 py-4.5 border-b border-slate-50/80 bg-slate-50/30 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-indigo-500" /> Campus Announcement
              </h3>
            </div>
            
            <form onSubmit={handlePostAnnouncement} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Target Audience</h4>
                  <p className="text-xs text-indigo-750 font-semibold leading-relaxed">
                    Announcements are sent to <span className="font-bold">all students and coordinators</span> registered under <span className="font-extrabold underline">{currentUser.collegeName}</span>.
                  </p>
                </div>

                <Input
                  label="Announcement Heading"
                  placeholder="e.g., ANITS Tech Fest registrations open tomorrow"
                  value={announcementTitle}
                  onChange={e => setAnnouncementTitle(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  required
                />

                <Textarea
                  label="Announcement Details"
                  placeholder="Type the message body or instructions..."
                  value={announcementMessage}
                  onChange={e => setAnnouncementMessage(e.target.value)}
                  rows={4}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 font-bold flex items-center justify-center gap-2"
                  disabled={isPosting || !announcementTitle.trim() || !announcementMessage.trim()}
                >
                  {isPosting ? 'Posting...' : 'Publish Announcement'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Phase 6D: Post-Approval Coordinator Edit Window Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Approved Events Edit Window Management */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4.5 border-b border-slate-50/80 bg-slate-50/30 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" /> 48-Hour Coordinator Edit Window Management
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {events.filter(e => e.status === 'approved').length} Approved Events
              </span>
            </div>

            {events.filter(e => e.status === 'approved').length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-semibold">No approved events found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[9px]">
                      <th className="py-3 px-5">Event Title</th>
                      <th className="py-3 px-5">Coordinator</th>
                      <th className="py-3 px-5">Edit Window Status</th>
                      <th className="py-3 px-5 text-center">Admin Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {events.filter(e => e.status === 'approved').map((evt) => {
                      const editStatus = getEditWindowStatus(evt);
                      return (
                        <tr key={evt.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 px-5 font-bold text-slate-800">{evt.title}</td>
                          <td className="py-3.5 px-5 text-slate-500">{evt.coordinatorName}</td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${editStatus.badgeClass}`}>
                              {editStatus.statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            {editStatus.canEdit ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] font-bold py-1 px-2.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                                leftIcon={<Lock className="h-3 w-3" />}
                                onClick={() => lockEventEditing(evt.id)}
                              >
                                Lock Window
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] font-bold py-1 px-2.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                leftIcon={<Unlock className="h-3 w-3" />}
                                onClick={() => unlockEventEditing(evt.id)}
                              >
                                Unlock 48h Window
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Audit Trail System Logs */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4.5 border-b border-slate-50/80 bg-slate-50/30 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" /> Immutable Audit Trail System Logs
              </h3>
              <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                {eventAuditLogs.length} Records
              </span>
            </div>

            {eventAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-semibold">No edit audit records logged yet</p>
                <p className="text-[10px] bg-slate-50 text-slate-500 mt-1 inline-block px-2 py-0.5 rounded">All coordinator edits post-approval are tracked automatically.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                {eventAuditLogs.slice(0, 15).map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50/60 border border-slate-150 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="text-indigo-600">[{log.eventTitle}]</span>
                        <span>by {log.editedByName || 'User'} ({log.editedByRole})</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-semibold">{new Date(log.editedAt).toLocaleString()}</span>
                    </div>

                    <div className="space-y-1 pl-2 border-l-2 border-indigo-300">
                      {log.changes.map((ch, idx) => (
                        <div key={idx} className="text-[11px] text-slate-600">
                          <span className="font-bold capitalize text-slate-700">{ch.field}: </span>
                          <span className="line-through text-slate-400 mr-1">{String(ch.oldValue ?? 'None')}</span>
                          <span className="font-semibold text-emerald-700">→ {String(ch.newValue ?? 'None')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default AdminDashboard;
