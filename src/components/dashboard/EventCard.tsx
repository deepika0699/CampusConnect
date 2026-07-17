import React from 'react';
import { Event, User } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Calendar, MapPin, Users, Clock, Edit3, Trash2, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

interface EventCardProps {
  event: Event;
  user: User | null;
  isRegistered?: boolean;
  onRegister?: (eventId: string) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string) => void;
  onClickDetails?: (eventId: string) => void;
  delay?: number;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  user,
  isRegistered = false,
  onRegister,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onClickDetails,
  delay = 0
}) => {
  const isFull = event.currentParticipants >= event.maxParticipants;
  const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();

  // Color mappings for categories
  const categoryStyles = {
    tech: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Tech' },
    cultural: { bg: 'bg-pink-50 text-pink-700 border-pink-100', label: 'Cultural' },
    academic: { bg: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Academic' },
    sports: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Sports' },
    career: { bg: 'bg-sky-50 text-sky-700 border-sky-100', label: 'Career' }
  };

  const style = categoryStyles[event.category] || { bg: 'bg-slate-50 text-slate-700 border-slate-100', label: 'General' };

  const fillPercentage = Math.min(100, (event.currentParticipants / event.maxParticipants) * 100);

  return (
    <Card hoverable animate delay={delay} className="flex flex-col h-full bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden group">
      {/* Event Header Image */}
      <div className="relative w-full h-48 overflow-hidden bg-slate-900 shrink-0">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border backdrop-blur-md shadow-sm ${style.bg}`}>
            {style.label}
          </span>
          {event.status === 'pending' && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-white border-transparent flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending Review
            </span>
          )}
          {event.status === 'rejected' && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white border-transparent">
              Declined
            </span>
          )}
        </div>

        {/* Date overlay card */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md text-center flex flex-col min-w-[50px]">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {new Date(event.date).toLocaleDateString([], { month: 'short' })}
          </span>
          <span className="text-lg font-extrabold text-slate-800 leading-none">
            {new Date(event.date).toLocaleDateString([], { day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Dept & Host info */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="text-indigo-600 font-extrabold">{event.collegeName}</span>
            <span>•</span>
            <span className="text-slate-600">{event.department}</span>
            <span>•</span>
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-normal normal-case">{event.clubOrg}</span>
            <span>•</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-normal uppercase ${
              event.visibility === 'open' 
                ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold' 
                : 'bg-slate-100 border border-slate-100 text-slate-600'
            }`}>
              {event.visibility === 'open' ? 'Open' : 'Campus-Only'}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
            {event.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium text-slate-500 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate" title={event.venue}>{event.venue}</span>
            </div>
          </div>

          {/* Registration occupancy meter */}
          <div className="space-y-1.5 pt-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-slate-400" /> Capacity
              </span>
              <span>{event.currentParticipants}/{event.maxParticipants} slots</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  fillPercentage >= 90 ? 'bg-rose-500' : fillPercentage >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          {/* Details button is always available */}
          {onClickDetails && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onClickDetails(event.id)}
            >
              Details
            </Button>
          )}

          {/* Role specific dynamic controllers */}
          {((user === null && event.visibility === 'open') || user?.role === 'student') && onRegister && (
            <>
              {isRegistered ? (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1 flex-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Registered
                </div>
              ) : isDeadlinePassed ? (
                <div className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 font-medium text-xs flex items-center justify-center gap-1 flex-1 cursor-not-allowed">
                  Deadline Passed
                </div>
              ) : isFull ? (
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-semibold text-xs flex items-center justify-center gap-1 flex-1 cursor-not-allowed">
                  Fully Booked
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => onRegister(event.id)}
                >
                  Register
                </Button>
              )}
            </>
          )}

          {user?.role === 'coordinator' && user.id === event.coordinatorId && (
            <div className="flex items-center gap-1.5 w-1/2">
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  title="Edit Details"
                  className="p-2 border border-slate-200 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-colors bg-white cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(event.id)}
                  title="Delete Event"
                  className="p-2 border border-slate-200 rounded-lg hover:border-rose-500 hover:text-rose-500 transition-colors bg-white cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {user?.role === 'admin' && event.status === 'pending' && (
            <div className="flex items-center gap-1.5 w-full">
              {onApprove && (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onApprove(event.id)}
                >
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                  onClick={() => onReject(event.id)}
                >
                  Decline
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
