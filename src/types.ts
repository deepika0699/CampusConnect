/**
 * CampusConnect Types Definition
 */

export type UserRole = 'student' | 'coordinator' | 'admin';

export interface Institution {
  id: string;
  name: string;
  domain?: string;
  departments: string[];
  logoUrl?: string;
}

export interface User {
  id: string;
  uid?: string; // Standardized uid representation
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  departmentId?: string;
  avatarUrl?: string;
  studentId?: string; // e.g., "STU2026042"
  bio?: string;
  collegeName: string; // Every user belongs to a college
  collegeId?: string;
  password?: string;
  createdAt?: string;
  yearOfStudy?: string;
  designation?: string;
  collegeOwnership?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  department: string;
  coordinatorId: string;
  coordinatorName: string;
  venue: string;
  locationDetails?: string; // details on how to get there
  collegeName: string; // e.g., "GITAM University" or "ANITS"
  collegeId?: string;
  clubOrg: string; // e.g., "CSI Student Chapter", "Student Council"
  facultyCoordinator: string; // Faculty lead
  studentCoordinator: string; // Student lead
  mapLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  registrationDeadline: string; // YYYY-MM-DD
  maxParticipants: number;
  currentParticipants: number;
  imageUrl: string;
  category: 'academic' | 'cultural' | 'sports' | 'tech' | 'career';
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  attendanceTracked: boolean;
  visibility?: 'campus_only' | 'open';
  photos?: string[]; // Post-event photo gallery
  
  // Phase 1 Additional Fields
  departmentId?: string;
  createdBy?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  registeredAt: string;
  status: 'registered' | 'attended' | 'cancelled';
  qrCodeUrl: string; // Mock QR Code reference string
  attendedAt?: string;
  certificateId?: string;
  collegeId?: string;
}

export interface Certificate {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  studentId: string;
  studentName: string;
  issuedAt: string;
  verificationCode: string; // e.g., "CC-VERT-XXXXX"
  department: string;
  coordinatorName: string;
  collegeId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'certificate' | 'registration_success' | 'registration_cancelled' | 'attendance_confirmed' | 'certificate_ready' | 'event_update' | 'venue_changed' | 'event_cancelled' | 'campus_announcement' | string;
  read: boolean;
  createdAt: string;
  collegeId?: string;
  userId?: string;
  relatedEventId?: string;
}

export interface AppState {
  currentUser: User | null;
  events: Event[];
  registrations: Registration[];
  certificates: Certificate[];
  notifications: Notification[];
}
