import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Textarea, Select } from '../../components/common/Input';
import { BookOpen, Edit, Trash2, Calendar, Users, ShieldAlert, AlertCircle, Megaphone } from 'lucide-react';
import { Event } from '../../types';

export const CoordinatorEvents: React.FC = () => {
  const { currentUser, events, registrations, updateEvent, deleteEvent, addNotification, navigateTo } = useApp();
  
  // Edit Event Modal states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editMaxCapacity, setEditMaxCapacity] = useState('100');
  const [editDate, setEditDate] = useState('');
  const [editVisibility, setEditVisibility] = useState<'campus_only' | 'open'>('campus_only');

  // Broadcast Modal states
  const [broadcastEvent, setBroadcastEvent] = useState<Event | null>(null);
  const [broadcastCategory, setBroadcastCategory] = useState('Venue Changed');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!currentUser) return null;

  // Managed events
  const coordEvents = events.filter(e => e.coordinatorId === currentUser.id);

  const handleOpenEdit = (evt: Event) => {
    setEditingEvent(evt);
    setEditTitle(evt.title);
    setEditVenue(evt.venue);
    setEditMaxCapacity(evt.maxParticipants.toString());
    setEditDate(evt.date);
    setEditVisibility(evt.visibility || 'campus_only');
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;
    updateEvent(editingEvent.id, {
      title: editTitle,
      venue: editVenue,
      maxParticipants: Number(editMaxCapacity),
      date: editDate,
      visibility: editVisibility
    });
    setEditingEvent(null);
  };

  const handleOpenBroadcast = (evt: Event) => {
    if (evt.coordinatorId !== currentUser.id) return;
    setBroadcastEvent(evt);
    setBroadcastCategory('Venue Changed');
    setBroadcastMessage('');
  };

  const handleSendBroadcast = async () => {
    if (!broadcastEvent) return;
    if (broadcastEvent.coordinatorId !== currentUser.id) return;

    // Find all registrations for this specific event that are not cancelled
    const registeredForEvent = registrations.filter(
      r => r.eventId === broadcastEvent.id && r.status === 'registered'
    );

    if (registeredForEvent.length === 0) {
      addNotification(
        'Broadcast Not Sent',
        'There are currently no active registered students for this event to receive notifications.',
        'warning',
        currentUser.id,
        currentUser.collegeId
      );
      setBroadcastEvent(null);
      return;
    }

    setIsSending(true);
    try {
      // Map broadcastCategory to the supported notification types:
      // registration_success, registration_cancelled, attendance_confirmed, certificate_ready, event_update, venue_changed, event_cancelled
      let notificationType = 'event_update';
      if (broadcastCategory === 'Venue Changed') {
        notificationType = 'venue_changed';
      }

      const broadcastTitle = `[${broadcastCategory}] ${broadcastEvent.title}`;

      // Create a notification doc for each registered student of the event
      for (const reg of registeredForEvent) {
        if (reg.collegeId === currentUser.collegeId) {
          await addNotification(
            broadcastTitle,
            broadcastMessage,
            notificationType,
            reg.studentId,
            currentUser.collegeId,
            broadcastEvent.id
          );
        }
      }

      addNotification(
        'Broadcast Dispatched',
        `Your broadcast was successfully sent to ${registeredForEvent.length} registered students.`,
        'success',
        currentUser.id,
        currentUser.collegeId
      );

      setBroadcastEvent(null);
      setBroadcastMessage('');
    } catch (err) {
      console.error("Error dispatching broadcast:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manage Managed Events</h1>
          <p className="text-xs text-slate-400 font-semibold">Track approvals, edit details, or remove events from registries.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigateTo('/coordinator/create-event')}
        >
          Publish New Event
        </Button>
      </div>

      {coordEvents.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No events published yet</p>
          <p className="text-xs text-slate-400 mt-1">Tap the button above to publish your first academic event.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coordEvents.map((evt) => (
            <Card 
              key={evt.id} 
              className="p-5 bg-white border border-slate-150 rounded-3xl shadow-sm flex flex-col justify-between min-h-[230px]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${
                      evt.status === 'approved' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : evt.status === 'rejected' 
                        ? 'bg-rose-50 border-rose-100 text-rose-700' 
                        : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {evt.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${
                      evt.visibility === 'open' 
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}>
                      {evt.visibility === 'open' ? 'Open' : 'Campus-Only'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{evt.category}</span>
                </div>
                
                <h3 className="text-sm font-extrabold text-slate-800 line-clamp-1">{evt.title}</h3>
                
                <div className="space-y-2 text-xs text-slate-500 font-semibold pt-1">
                  <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> {evt.date}</p>
                  <p className="flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" /> {evt.currentParticipants}/{evt.maxParticipants} participants</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 border-t border-slate-50 pt-3 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 min-w-[65px]"
                  leftIcon={<Edit className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEdit(evt)}
                >
                  Edit
                </Button>
                {evt.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 min-w-[85px] border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                    leftIcon={<Megaphone className="h-3.5 w-3.5" />}
                    onClick={() => handleOpenBroadcast(evt)}
                  >
                    Broadcast
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 min-w-[65px] text-rose-600 hover:bg-rose-50"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => deleteEvent(evt.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Event Details Modal */}
      <Modal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        title="Revise Event Settings"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEdit}>Save Edits</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Revise Heading"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="bg-slate-50 border-slate-200"
          />
          <Input
            label="Revise Room / Venue"
            value={editVenue}
            onChange={e => setEditVenue(e.target.value)}
            className="bg-slate-50 border-slate-200"
          />
          <Select
            label="Revise Event Visibility Tier"
            options={[
              { value: 'campus_only', label: 'Campus-Only (Restricted)' },
              { value: 'open', label: 'Open Inter-College (Public)' }
            ]}
            value={editVisibility}
            onChange={e => setEditVisibility(e.target.value as any)}
            className="bg-slate-50 border-slate-200"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Revise Date"
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="bg-slate-50 border-slate-200 text-xs font-semibold"
            />
            <Input
              label="Revise Seating Limit"
              type="number"
              value={editMaxCapacity}
              onChange={e => setEditMaxCapacity(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </Modal>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={!!broadcastEvent}
        onClose={() => setBroadcastEvent(null)}
        title="Send Event Broadcast Announcement"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBroadcastEvent(null)} disabled={isSending}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSendBroadcast} 
              disabled={isSending || !broadcastMessage.trim()}
            >
              {isSending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Target Audience</h4>
            <p className="text-xs text-indigo-750 font-semibold leading-relaxed">
              This message will be sent in real-time as a personal notification to all <span className="font-extrabold underline">{broadcastEvent ? registrations.filter(r => r.eventId === broadcastEvent.id && r.status === 'registered').length : 0} students</span> currently registered for <span className="font-extrabold">"{broadcastEvent?.title}"</span>.
            </p>
          </div>

          <Select
            label="Announcement Category"
            options={[
              { value: 'Venue Changed', label: 'Venue Changed' },
              { value: 'Schedule Changed', label: 'Schedule Changed' },
              { value: 'Important Announcement', label: 'Important Announcement' },
              { value: 'Custom Message', label: 'Custom Message' }
            ]}
            value={broadcastCategory}
            onChange={e => setBroadcastCategory(e.target.value)}
            className="bg-slate-50 border-slate-200"
          />

          <Textarea
            label="Broadcast Message"
            placeholder="Type your message to registered participants..."
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            rows={4}
            className="bg-slate-50 border-slate-200"
          />
        </div>
      </Modal>
    </div>
  );
};
export default CoordinatorEvents;
