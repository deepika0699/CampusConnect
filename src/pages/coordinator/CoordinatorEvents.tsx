import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Textarea, Select } from '../../components/common/Input';
import { BookOpen, Edit, Trash2, Calendar, Users, ShieldAlert, AlertCircle, Megaphone, Lock, Clock, History, ShieldCheck } from 'lucide-react';
import { Event, EventAuditLog } from '../../types';
import { extractCoordinates } from '../../lib/utils';
import { PosterUpload } from '../../components/common/PosterUpload';
import { getEditWindowStatus } from '../../lib/eventUtils';

export const CoordinatorEvents: React.FC = () => {
  const { currentUser, events, registrations, eventAuditLogs, updateEvent, deleteEvent, addNotification, navigateTo } = useApp();
  
  // Audit Trail Modal states
  const [auditModalEvent, setAuditModalEvent] = useState<Event | null>(null);

  // Edit Event Modal states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editMaxCapacity, setEditMaxCapacity] = useState('100');
  const [editDate, setEditDate] = useState('');
  const [editVisibility, setEditVisibility] = useState<'campus_only' | 'open'>('campus_only');
  const [editGmapsLink, setEditGmapsLink] = useState('');
  const [editVenueAddress, setEditVenueAddress] = useState('');
  const [editMapLabel, setEditMapLabel] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editExtractedCoords, setEditExtractedCoords] = useState<{ lat: number; lng: number } | null>(null);

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
    setEditImageUrl(evt.coverImage || evt.imageUrl || '');
    
    // Preload existing mapLocation values
    if (evt.mapLocation) {
      const { lat, lng, address, mapLabel } = evt.mapLocation;
      setEditGmapsLink(`https://www.google.com/maps?q=${lat},${lng}`);
      setEditExtractedCoords({ lat, lng });
      setEditLatitude(lat.toString());
      setEditLongitude(lng.toString());
      setEditVenueAddress(address || '');
      setEditMapLabel(mapLabel || '');
    } else {
      setEditGmapsLink('');
      setEditExtractedCoords(null);
      setEditLatitude('');
      setEditLongitude('');
      setEditVenueAddress('');
      setEditMapLabel('');
    }
  };

  const handleEditGmapsLinkChange = (link: string) => {
    setEditGmapsLink(link);
    if (!link.trim()) {
      setEditExtractedCoords(null);
      return;
    }
    const coords = extractCoordinates(link);
    setEditExtractedCoords(coords);
    if (coords) {
      setEditLatitude(coords.lat.toString());
      setEditLongitude(coords.lng.toString());
    }
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;

    const latNum = parseFloat(editLatitude);
    const lngNum = parseFloat(editLongitude);
    const isLatValid = !isNaN(latNum) && latNum >= -90 && latNum <= 90;
    const isLngValid = !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180;

    let resolvedMapLocation = editingEvent.mapLocation;

    if (isLatValid && isLngValid) {
      resolvedMapLocation = {
        lat: latNum,
        lng: lngNum,
        address: editVenueAddress || editVenue,
        mapLabel: editMapLabel || editTitle || "Event Venue"
      };
    } else if (editExtractedCoords) {
      resolvedMapLocation = {
        lat: editExtractedCoords.lat,
        lng: editExtractedCoords.lng,
        address: editVenueAddress || editVenue,
        mapLabel: editMapLabel || editTitle || "Event Venue"
      };
    } else if (editGmapsLink.trim() === '') {
      resolvedMapLocation = undefined;
    }

    updateEvent(editingEvent.id, {
      title: editTitle,
      venue: editVenue,
      maxParticipants: Number(editMaxCapacity),
      date: editDate,
      visibility: editVisibility,
      imageUrl: editImageUrl || editingEvent.imageUrl,
      coverImage: editImageUrl || editingEvent.coverImage || editingEvent.imageUrl,
      mapLocation: resolvedMapLocation
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
          {coordEvents.map((evt) => {
            const editStatus = getEditWindowStatus(evt);
            const eventLogs = eventAuditLogs.filter(log => log.eventId === evt.id);

            return (
              <Card 
                key={evt.id} 
                className="p-5 bg-white border border-slate-150 rounded-3xl shadow-sm flex flex-col justify-between min-h-[260px]"
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

                  {/* Phase 6D: Post-Approval Coordinator Edit Window Status Badge */}
                  {evt.status === 'approved' && (
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${editStatus.badgeClass}`}>
                        <Clock className="h-3 w-3" />
                        {editStatus.statusLabel}
                      </span>
                      {evt.lastEditedAt && (
                        <p className="text-[9.5px] text-slate-400 font-medium">
                          Last edited {new Date(evt.lastEditedAt).toLocaleDateString()} by {evt.lastEditedBy || 'Coordinator'}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2 text-xs text-slate-500 font-semibold pt-1">
                    <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> {evt.date}</p>
                    <p className="flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" /> {evt.currentParticipants}/{evt.maxParticipants} participants</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 border-t border-slate-50 pt-3 flex-wrap">
                  {evt.status === 'approved' && !editStatus.canEdit ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-w-[65px] bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      leftIcon={<Lock className="h-3.5 w-3.5 text-slate-400" />}
                      onClick={() => {
                        addNotification(
                          'Edit Window Closed',
                          `The 48-hour post-approval edit window for "${evt.title}" has expired or been locked by Admin. Please contact your campus administrator to request an edit unlock extension.`,
                          'warning'
                        );
                      }}
                      title="Post-approval 48-hour edit window expired or locked by Admin"
                    >
                      Locked
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-w-[65px]"
                      leftIcon={<Edit className="h-3.5 w-3.5" />}
                      onClick={() => handleOpenEdit(evt)}
                    >
                      Edit
                    </Button>
                  )}

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

                  {eventLogs.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-w-[65px] border-slate-200 text-slate-600 hover:bg-slate-50"
                      leftIcon={<History className="h-3.5 w-3.5" />}
                      onClick={() => setAuditModalEvent(evt)}
                      title="View audit trail change logs"
                    >
                      Audit
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
            );
          })}
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

          <PosterUpload
            campusId={currentUser?.collegeId || currentUser?.collegeName || 'ANITS'}
            eventId={editingEvent?.id || 'edit-event'}
            currentValue={editImageUrl}
            onUploadComplete={(url) => setEditImageUrl(url)}
            label="Revise Cover Poster (Firebase Storage)"
            helperText="Upload a new cover image or update existing URL."
          />
          <div className="border-t border-slate-100 pt-3 mt-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Venue & Navigation</h4>
            
            <div className="space-y-3">
              <Input
                label="Revise Google Maps Link (Optional)"
                type="url"
                placeholder="e.g. https://www.google.com/maps?q=17.822145,83.342812"
                value={editGmapsLink}
                onChange={e => handleEditGmapsLinkChange(e.target.value)}
                className="bg-slate-50 border-slate-200"
                helperText="Paste a Google Maps link to automatically fill in the coordinates below."
              />

              {editGmapsLink.trim() && (
                <div className="text-xs font-bold -mt-1 pb-1 pl-1 transition-all duration-200">
                  {editExtractedCoords ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      ✓ Coordinates detected: {editExtractedCoords.lat.toFixed(6)}, {editExtractedCoords.lng.toFixed(6)}
                    </span>
                  ) : (editGmapsLink.includes('maps.app.goo.gl') || editGmapsLink.includes('goo.gl')) ? (
                    <span className="text-amber-600 flex items-start gap-1 leading-normal max-w-prose text-[11px]">
                      Mobile share link detected. Open the link in Google Maps and copy the coordinates shown in the search bar if automatic extraction is not available.
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      Could not detect coordinates from this link.
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g. 17.822145"
                  value={editLatitude}
                  onChange={e => setEditLatitude(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  error={
                    editLatitude && (isNaN(parseFloat(editLatitude)) || parseFloat(editLatitude) < -90 || parseFloat(editLatitude) > 90)
                      ? "Latitude must be between -90 and 90"
                      : undefined
                  }
                  helperText="Enter -90 to 90."
                />
                <Input
                  label="Longitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g. 83.342812"
                  value={editLongitude}
                  onChange={e => setEditLongitude(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  error={
                    editLongitude && (isNaN(parseFloat(editLongitude)) || parseFloat(editLongitude) < -180 || parseFloat(editLongitude) > 180)
                      ? "Longitude must be between -180 and 180"
                      : undefined
                  }
                  helperText="Enter -180 to 180."
                />
              </div>

              {/* Quick Tip Helper Card */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-3xl text-[11px] text-slate-600 space-y-2">
                <h5 className="font-extrabold text-slate-800 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                  💡 Quick Tip: Finding Exact Coordinates
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">Desktop:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
                      <li>Right-click on Google Maps</li>
                      <li>Click the coordinates shown</li>
                    </ul>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">Mobile:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
                      <li>Long-press a pin in Maps</li>
                      <li>Copy coordinates in search bar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Revise Venue Address (Optional)"
                  type="text"
                  placeholder="e.g. ANITS Main Auditorium"
                  value={editVenueAddress}
                  onChange={e => setEditVenueAddress(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
                <Input
                  label="Revise Map Label (Optional)"
                  type="text"
                  placeholder="e.g. Tech Fest Venue"
                  value={editMapLabel}
                  onChange={e => setEditMapLabel(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </div>
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

      {/* Audit Trail Modal */}
      <Modal
        isOpen={!!auditModalEvent}
        onClose={() => setAuditModalEvent(null)}
        title={`Audit Trail Logs: ${auditModalEvent?.title}`}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setAuditModalEvent(null)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {auditModalEvent && (
            <>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700">Event Approval Date: </span>
                  <span className="text-slate-600">{auditModalEvent.approvedAt ? new Date(auditModalEvent.approvedAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verified Audit Trail</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {eventAuditLogs
                  .filter(log => log.eventId === auditModalEvent.id)
                  .map((log) => (
                    <div key={log.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <History className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Edited by {log.editedByName || 'User'} ({log.editedByRole})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.editedAt).toLocaleString()}</span>
                      </div>
                      
                      <div className="space-y-1 pl-2 border-l-2 border-indigo-200">
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
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
export default CoordinatorEvents;
