import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Event, Registration, Certificate, Notification, UserRole, Institution } from '../types';
import { MOCK_USERS, INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_CERTIFICATES, INITIAL_NOTIFICATIONS, INITIAL_COLLEGES } from '../data/mockData';

interface AppContextProps {
  currentUser: User | null;
  users: User[];
  events: Event[];
  registrations: Registration[];
  certificates: Certificate[];
  notifications: Notification[];
  colleges: Institution[];
  currentPath: string;
  navigateTo: (path: string) => void;
  loginAs: (role: UserRole | 'guest', collegeName?: string) => void;
  loginWithEmail: (email: string, collegeName: string) => boolean;
  signUpUser: (name: string, email: string, role: UserRole, department: string, collegeName: string) => void;
  registerInstitution: (name: string, domain?: string, departments?: string[]) => Institution;
  updateUserCollege: (collegeName: string) => void;
  updateUserProfile: (name: string, bio: string, department: string) => void;
  logout: () => void;
  registerForEvent: (eventId: string) => boolean;
  cancelRegistration: (registrationId: string) => void;
  createEvent: (eventData: Partial<Event>) => Event;
  updateEvent: (eventId: string, updatedData: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  approveEvent: (eventId: string) => void;
  rejectEvent: (eventId: string) => void;
  markAttendance: (registrationId: string, attended: boolean) => void;
  clearNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'certificate') => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Routing Logic ---
  const getHashPath = () => {
    const hash = window.location.hash;
    if (!hash) return '/';
    return hash.replace(/^#/, '');
  };

  const [currentPath, setCurrentPath] = useState<string>(getHashPath());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getHashPath());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  // --- Core States ---
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Real empty SaaS platform start state (guest first)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('cc_users');
    let loaded: User[] = saved ? JSON.parse(saved) : [];
    loaded = loaded.filter(Boolean);
    // Filter out users belonging to the duplicate college (ANITS Engineering Campus, or any college containing ANITS but not exactly ANITS)
    const originalLength = loaded.length;
    loaded = loaded.filter(u => {
      const colUpper = (u && u.collegeName || '').trim().toUpperCase();
      return !(colUpper.includes('ANITS') && colUpper !== 'ANITS');
    });
    if (loaded.length !== originalLength) {
      localStorage.setItem('cc_users', JSON.stringify(loaded));
    }
    return loaded;
  });
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('cc_events');
    let loaded: Event[] = saved ? JSON.parse(saved) : INITIAL_EVENTS;
    loaded = loaded.filter(Boolean);
    // Filter out events belonging to the duplicate college
    const originalLength = loaded.length;
    loaded = loaded.filter(e => {
      const colUpper = (e && e.collegeName || '').trim().toUpperCase();
      return !(colUpper.includes('ANITS') && colUpper !== 'ANITS');
    });
    if (loaded.length !== originalLength) {
      localStorage.setItem('cc_events', JSON.stringify(loaded));
    }
    return loaded;
  });
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem('cc_registrations');
    let loaded: Registration[] = saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
    loaded = loaded.filter(Boolean);
    
    // Clean up registrations: filter by clean events and users (not belonging to duplicate ANITS)
    const savedEventsRaw = localStorage.getItem('cc_events');
    const savedUsersRaw = localStorage.getItem('cc_users');
    const savedEvents: Event[] = savedEventsRaw ? JSON.parse(savedEventsRaw) : INITIAL_EVENTS;
    const savedUsers: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];

    const cleanEventIds = new Set(
      (savedEvents || [])
        .filter(Boolean)
        .filter(e => {
          const colUpper = (e && e.collegeName || '').trim().toUpperCase();
          return !(colUpper.includes('ANITS') && colUpper !== 'ANITS');
        })
        .map(e => e.id)
    );
    const cleanUserEmails = new Set(
      (savedUsers || [])
        .filter(Boolean)
        .filter(u => {
          const colUpper = (u && u.collegeName || '').trim().toUpperCase();
          return !(colUpper.includes('ANITS') && colUpper !== 'ANITS');
        })
        .map(u => (u && u.email || '').toLowerCase())
    );

    const originalLength = loaded.length;
    loaded = loaded.filter(r => {
      return r && r.eventId && r.studentEmail && cleanEventIds.has(r.eventId) && cleanUserEmails.has(r.studentEmail.toLowerCase());
    });

    if (loaded.length !== originalLength) {
      localStorage.setItem('cc_registrations', JSON.stringify(loaded));
    }
    return loaded;
  });
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('cc_certificates');
    let loaded: Certificate[] = saved ? JSON.parse(saved) : INITIAL_CERTIFICATES;
    loaded = loaded.filter(Boolean);

    const savedEventsRaw = localStorage.getItem('cc_events');
    const savedEvents: Event[] = savedEventsRaw ? JSON.parse(savedEventsRaw) : INITIAL_EVENTS;
    const cleanEventIds = new Set(
      (savedEvents || [])
        .filter(Boolean)
        .filter(e => {
          const colUpper = (e && e.collegeName || '').trim().toUpperCase();
          return !(colUpper.includes('ANITS') && colUpper !== 'ANITS');
        })
        .map(e => e.id)
    );

    const originalLength = loaded.length;
    loaded = loaded.filter(c => cleanEventIds.has(c.eventId));

    if (loaded.length !== originalLength) {
      localStorage.setItem('cc_certificates', JSON.stringify(loaded));
    }
    return loaded;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('cc_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [colleges, setColleges] = useState<Institution[]>(() => {
    const saved = localStorage.getItem('cc_colleges');
    let loaded: Institution[] = saved ? JSON.parse(saved) : INITIAL_COLLEGES;
    loaded = loaded.filter(Boolean);
    
    // Filter out any duplicate or other ANITS record like "ANITS Engineering Campus"
    const originalLength = loaded.length;
    loaded = loaded.filter(c => {
      const nameUpper = (c && c.name || '').trim().toUpperCase();
      // Keep only the main "ANITS" institution, discard any other institution containing "ANITS" but not exactly "ANITS"
      if (nameUpper.includes('ANITS') && nameUpper !== 'ANITS') {
        return false;
      }
      return true;
    });
    let updated = loaded.length !== originalLength;

    // Ensure ANITS has the updated departments list (existing 4 + the 5 missing ones)
    const missingAnitsDepts = [
      'Computer Science and Design (CSD)',
      'Computer Science and Machine Learning (CSM)',
      'Information Technology (IT)',
      'Civil Engineering',
      'Cyber Security'
    ];

    // Seeding fallback if ANITS doesn't exist at all in current list
    const hasAnits = loaded.some(c => (c && c.name || '').trim().toUpperCase() === 'ANITS');
    if (!hasAnits) {
      loaded.push({
        id: 'col_anits',
        name: 'ANITS',
        domain: 'anits.edu',
        departments: [
          'Computer Science and Engineering (CSE)',
          'Electronics and Communication Engineering (ECE)',
          'Electrical and Electronics Engineering (EEE)',
          'Mechanical Engineering',
          ...missingAnitsDepts
        ]
      });
      updated = true;
    }

    loaded = loaded.map(c => {
      if ((c && c.name || '').trim().toUpperCase() === 'ANITS') {
        const departmentsSet = new Set(c.departments || []);
        const originalSize = departmentsSet.size;
        missingAnitsDepts.forEach(dept => departmentsSet.add(dept));
        if (departmentsSet.size !== originalSize) {
          updated = true;
          return {
            ...c,
            departments: Array.from(departmentsSet)
          };
        }
      }
      return c;
    });

    if (updated) {
      localStorage.setItem('cc_colleges', JSON.stringify(loaded));
    }

    return loaded;
  });

  // Save to localStorage whenever data changes to preserve state across reloads
  useEffect(() => {
    localStorage.setItem('cc_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('cc_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('cc_registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('cc_certificates', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('cc_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('cc_colleges', JSON.stringify(colleges));
  }, [colleges]);

  // --- Notification Helper ---
  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'certificate'
  ) => {
    const newNot: Notification = {
      id: `not_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNot, ...prev]);
  };

  // --- Auth Handlers ---
  const loginAs = (role: UserRole | 'guest', collegeName?: string) => {
    if (role === 'guest') {
      setCurrentUser(null);
      navigateTo('/');
    } else {
      const defaultCollege = collegeName || colleges[0]?.name || 'GITAM University';
      const foundUser = users.find(u => u.role === role && u.collegeName === defaultCollege);
      
      if (foundUser) {
        setCurrentUser(foundUser);
        addNotification('Welcome back!', `Logged in successfully as ${foundUser.name} (${role.toUpperCase()}) at ${defaultCollege}.`, 'success');
        
        if (role === 'student') navigateTo('/student/dashboard');
        else if (role === 'coordinator') navigateTo('/coordinator/dashboard');
        else if (role === 'admin') navigateTo('/admin/dashboard');
      } else {
        addNotification(
          'No Account Found',
          `There is no registered ${role} at ${defaultCollege} yet. Please register a profile first.`,
          'warning'
        );
      }
    }
  };

  const loginWithEmail = (email: string, collegeName: string): boolean => {
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.collegeName === collegeName
    );
    if (foundUser) {
      setCurrentUser(foundUser);
      addNotification('Welcome back!', `Logged in successfully as ${foundUser.name}.`, 'success');
      
      if (foundUser.role === 'student') navigateTo('/student/dashboard');
      else if (foundUser.role === 'coordinator') navigateTo('/coordinator/dashboard');
      else if (foundUser.role === 'admin') navigateTo('/admin/dashboard');
      return true;
    }
    return false;
  };

  const signUpUser = (name: string, email: string, role: UserRole, department: string, collegeName: string) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      department,
      collegeName,
      studentId: role === 'student' ? `STU-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      avatarUrl: `https://images.unsplash.com/photo-${role === 'student' ? '1534528741775-53994a69daeb' : '1573496359142-b8d87734a5a2'}?auto=format&fit=crop&q=80&w=200`,
      bio: `${role === 'student' ? 'Student' : 'Staff'} at ${collegeName}`
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    addNotification('Account Created!', `Welcome to CampusConnect, ${name}! You are registered at ${collegeName}.`, 'success');
    
    if (role === 'student') navigateTo('/student/dashboard');
    else if (role === 'coordinator') navigateTo('/coordinator/dashboard');
    else if (role === 'admin') navigateTo('/admin/dashboard');
  };

  const registerInstitution = (name: string, domain?: string, departments?: string[]): Institution => {
    const nameTrimmed = (name || '').trim();
    const nameUpper = nameTrimmed.toUpperCase();

    // Check if it is a duplicate ANITS name (excluding exact "ANITS")
    if (nameUpper.includes('ANITS') && nameUpper !== 'ANITS') {
      const existingAnits = colleges.find(c => (c && c.name || '').trim().toUpperCase() === 'ANITS');
      if (existingAnits) {
        addNotification('Institution Exists', 'ANITS is already registered as a single consolidated campus.', 'info');
        return existingAnits;
      }
    }

    // Check if already registered exactly
    const existing = colleges.find(c => c && c.name && c.name.toLowerCase() === nameTrimmed.toLowerCase());
    if (existing) {
      return existing;
    }

    const newInst: Institution = {
      id: `col_${Date.now()}`,
      name: nameTrimmed,
      domain: domain || `${nameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
      departments: departments || []
    };
    setColleges(prev => [...prev, newInst]);
    addNotification('Institution Registered!', `"${nameTrimmed}" is now on CampusConnect SaaS network.`, 'success');
    return newInst;
  };

  const updateUserCollege = (collegeName: string) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, collegeName } : null);
      addNotification('Context Switched', `Now viewing as a member of ${collegeName}.`, 'info');
    }
  };

  const updateUserProfile = (name: string, bio: string, department: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, name, bio, department };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }
  };

  const logout = () => {
    const prevName = currentUser?.name || 'User';
    setCurrentUser(null);
    addNotification('Goodbye!', `${prevName} logged out successfully.`, 'info');
    navigateTo('/');
  };

  // --- Student Actions ---
  const registerForEvent = (eventId: string): boolean => {
    if (!currentUser) {
      navigateTo('/login');
      return false;
    }

    const eventObj = events.find(e => e.id === eventId);
    if (!eventObj) return false;

    // Check if already registered
    const alreadyRegistered = registrations.some(
      r => r.eventId === eventId && r.studentId === currentUser.id && r.status !== 'cancelled'
    );
    if (alreadyRegistered) return false;

    // Check limits
    if (eventObj.currentParticipants >= eventObj.maxParticipants) {
      addNotification('Registration Failed', `"${eventObj.title}" is currently fully booked.`, 'warning');
      return false;
    }

    // Register
    const newReg: Registration = {
      id: `reg_${Date.now()}`,
      eventId,
      eventTitle: eventObj.title,
      eventDate: eventObj.date,
      eventVenue: eventObj.venue,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CC-REG-${eventId}-${currentUser.id}-registered`
    };

    setRegistrations(prev => [newReg, ...prev]);
    
    // Update count
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e
      )
    );

    addNotification(
      'Registration Confirmed!',
      `You have registered for "${eventObj.title}". Your digital QR pass is ready.`,
      'success'
    );
    return true;
  };

  const cancelRegistration = (registrationId: string) => {
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return;

    setRegistrations(prev =>
      prev.map(r => r.id === registrationId ? { ...r, status: 'cancelled' } : r)
    );

    // Decrement participants
    setEvents(prev =>
      prev.map(e =>
        e.id === reg.eventId ? { ...e, currentParticipants: Math.max(0, e.currentParticipants - 1) } : e
      )
    );

    addNotification(
      'Registration Cancelled',
      `Your reservation for "${reg.eventTitle}" was cancelled.`,
      'info'
    );
  };

  // --- Coordinator Actions ---
  const createEvent = (eventData: Partial<Event>): Event => {
    if (!currentUser || currentUser.role !== 'coordinator') {
      throw new Error('Only authorized department coordinators can construct events.');
    }

    const newEvent: Event = {
      id: `evt_${Date.now()}`,
      title: eventData.title || 'Untitled Campus Event',
      description: eventData.description || '',
      longDescription: eventData.longDescription || '',
      department: eventData.department || currentUser.department || 'Computer Science and Engineering (CSE)',
      coordinatorId: currentUser.id,
      coordinatorName: currentUser.name,
      venue: eventData.venue || 'Central Amphitheater',
      locationDetails: eventData.locationDetails || '',
      collegeName: eventData.collegeName || 'GITAM University',
      clubOrg: eventData.clubOrg || 'Student Activities Council',
      facultyCoordinator: eventData.facultyCoordinator || currentUser.name,
      studentCoordinator: eventData.studentCoordinator || 'Alex Rivera',
      mapLocation: eventData.mapLocation || { lat: 17.7813, lng: 83.3776, name: 'GITAM Campus' }, // coordinates for Visakhapatnam GITAM/ANITS area (approx)
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || '10:00',
      registrationDeadline: eventData.registrationDeadline || new Date().toISOString().split('T')[0],
      maxParticipants: Number(eventData.maxParticipants) || 100,
      currentParticipants: 0,
      imageUrl: eventData.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
      category: eventData.category || 'tech',
      tags: eventData.tags || [],
      status: 'pending', // Pending Admin approval
      attendanceTracked: false
    };

    setEvents(prev => [newEvent, ...prev]);
    addNotification(
      'Event Submitted',
      `"${newEvent.title}" has been submitted for administration review.`,
      'info'
    );

    return newEvent;
  };

  const updateEvent = (eventId: string, updatedData: Partial<Event>) => {
    setEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, ...updatedData } : e)
    );
    addNotification('Event Updated', 'Event details have been successfully revised.', 'success');
  };

  const deleteEvent = (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
    // also mark associated registrations cancelled
    setRegistrations(prev =>
      prev.map(r => r.eventId === eventId ? { ...r, status: 'cancelled' } : r)
    );
    addNotification('Event Removed', `"${ev?.title}" has been deleted from the catalog.`, 'warning');
  };

  // --- Admin Actions ---
  const approveEvent = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, status: 'approved' } : e)
    );
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      addNotification(
        'Event Approved',
        `"${ev.title}" is now published and open for registrations.`,
        'success'
      );
    }
  };

  const rejectEvent = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, status: 'rejected' } : e)
    );
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      addNotification(
        'Event Rejected',
        `"${ev.title}" was declined by the administrator.`,
        'warning'
      );
    }
  };

  // --- Attendance & Verification Engine ---
  const markAttendance = (registrationId: string, attended: boolean) => {
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return;

    if (attended) {
      // Mark as Attended
      setRegistrations(prev =>
        prev.map(r =>
          r.id === registrationId
            ? { ...r, status: 'attended', attendedAt: new Date().toISOString() }
            : r
        )
      );

      // Check if certificate already exists
      const hasCertificate = certificates.some(c => c.registrationId === registrationId);
      if (!hasCertificate) {
        // Mint certificate
        const eventObj = events.find(e => e.id === reg.eventId);
        const certId = `cert_${Date.now()}`;
        const newCert: Certificate = {
          id: certId,
          registrationId: reg.id,
          eventId: reg.eventId,
          eventTitle: reg.eventTitle,
          eventDate: reg.eventDate,
          studentId: reg.studentId,
          studentName: reg.studentName,
          issuedAt: new Date().toISOString(),
          verificationCode: `CC-VERT-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
          department: eventObj?.department || 'University Division',
          coordinatorName: eventObj?.coordinatorName || 'Department Head'
        };

        setCertificates(prev => [...prev, newCert]);
        
        // Bind cert ID back to registration
        setRegistrations(prev =>
          prev.map(r => r.id === registrationId ? { ...r, certificateId: certId } : r)
        );

        addNotification(
          'Certificate Issued!',
          `Digital certificate minted for ${reg.studentName} for attending "${reg.eventTitle}".`,
          'certificate'
        );
      }
    } else {
      // Revert to Registered
      setRegistrations(prev =>
        prev.map(r =>
          r.id === registrationId
            ? { ...r, status: 'registered', attendedAt: undefined, certificateId: undefined }
            : r
        )
      );
      // Remove certificate if exists
      setCertificates(prev => prev.filter(c => c.registrationId !== registrationId));
    }
  };

  // --- Clear/Read Notifications ---
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        events,
        registrations,
        certificates,
        notifications,
        colleges,
        currentPath,
        navigateTo,
        loginAs,
        loginWithEmail,
        signUpUser,
        registerInstitution,
        updateUserCollege,
        updateUserProfile,
        logout,
        registerForEvent,
        cancelRegistration,
        createEvent,
        updateEvent,
        deleteEvent,
        approveEvent,
        rejectEvent,
        markAttendance,
        clearNotification,
        markNotificationRead,
        addNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
