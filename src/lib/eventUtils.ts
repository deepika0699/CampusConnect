import { Event } from '../types';

export interface EditWindowStatus {
  canEdit: boolean;
  remainingMs: number;
  expired: boolean;
  formattedRemaining: string;
  statusLabel: string;
  badgeClass: string;
}

/**
 * Calculates the status of the 48-hour post-approval coordinator edit window for an event.
 * 
 * Rules:
 * 1. If event is not approved (pending/rejected) -> canEdit = true, expired = false, remainingMs = Infinity
 * 2. If editLocked === true -> canEdit = false, expired = true, remainingMs = 0
 * 3. If approvedAt is missing -> default to open / canEdit = true
 * 4. If editWindowExpiresAt is set: calculate remainingMs = editWindowExpiresAt - now
 * 5. Otherwise calculate remainingMs = (approvedAt + 48h) - now
 */
export function getEditWindowStatus(event: Partial<Event> | null | undefined): EditWindowStatus {
  if (!event) {
    return {
      canEdit: false,
      remainingMs: 0,
      expired: true,
      formattedRemaining: 'Expired',
      statusLabel: 'No Event',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  }

  // Pre-approval events (pending / rejected) remain fully editable by coordinators
  if (event.status !== 'approved') {
    return {
      canEdit: true,
      remainingMs: Infinity,
      expired: false,
      formattedRemaining: 'Editable (Pre-Approval)',
      statusLabel: event.status === 'pending' ? 'Pending Approval' : 'Rejected',
      badgeClass: event.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  // Explicit Admin lock override
  if (event.editLocked) {
    return {
      canEdit: false,
      remainingMs: 0,
      expired: true,
      formattedRemaining: 'Locked by Admin',
      statusLabel: 'Edit Window Locked',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  const now = Date.now();
  let expiresAtMs: number | null = null;

  if (event.editWindowExpiresAt) {
    expiresAtMs = new Date(event.editWindowExpiresAt).getTime();
  } else if (event.approvedAt) {
    expiresAtMs = new Date(event.approvedAt).getTime() + 48 * 60 * 60 * 1000;
  }

  // Backward compatibility: If an event was previously approved without approvedAt timestamp, treat window as active
  if (expiresAtMs === null || isNaN(expiresAtMs)) {
    return {
      canEdit: true,
      remainingMs: 48 * 60 * 60 * 1000,
      expired: false,
      formattedRemaining: '48h Window Active',
      statusLabel: '48h Edit Window Active',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  const remainingMs = expiresAtMs - now;
  if (remainingMs <= 0) {
    return {
      canEdit: false,
      remainingMs: 0,
      expired: true,
      formattedRemaining: 'Expired',
      statusLabel: '48h Edit Window Expired',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200'
    };
  }

  const totalMinutes = Math.floor(remainingMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedRemaining = `${hours}h ${minutes}m remaining`;

  return {
    canEdit: true,
    remainingMs,
    expired: false,
    formattedRemaining,
    statusLabel: `48h Edit Window Active (${formattedRemaining})`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
}

/**
 * Detects modified fields between existing event state and new update payload.
 */
export function detectEventChanges(
  oldEvent: Event,
  updatedFields: Partial<Event>
): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  const ignoreKeys = new Set([
    'updatedAt',
    'lastEditedAt',
    'lastEditedBy',
    'editWindowRemainingMs',
    'editLocked',
    'editWindowExpiresAt'
  ]);

  for (const key of Object.keys(updatedFields) as Array<keyof Event>) {
    if (ignoreKeys.has(key)) continue;

    const oldVal = oldEvent[key];
    const newVal = updatedFields[key];

    if (newVal === undefined) continue;

    const oldStr = JSON.stringify(oldVal ?? null);
    const newStr = JSON.stringify(newVal ?? null);

    if (oldStr !== newStr) {
      changes.push({
        field: key,
        oldValue: oldVal ?? null,
        newValue: newVal ?? null
      });
    }
  }

  return changes;
}
