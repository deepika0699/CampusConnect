import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Event, Registration, Certificate, Notification, UserRole, Institution } from '../types';
import { MOCK_USERS, INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_CERTIFICATES, INITIAL_NOTIFICATIONS, INITIAL_COLLEGES } from '../data/mockData';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

interface AppContextProps {
  currentUser: User | null;
  authLoading: boolean;
  users: User[];
  events: Event[];
  registrations: Registration[];
  certificates: Certificate[];
  notifications: Notification[];
  colleges: Institution[];
  currentPath: string;
  navigateTo: (path: string) => void;
  loginAs: (role: UserRole | 'guest', collegeName?: string) => void;
  loginWithEmail: (email: string, collegeName: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUpUser: (
    name: string,
    email: string,
    role: UserRole,
    department: string,
    collegeName: string,
    password?: string,
    extraData?: {
      yearOfStudy?: string;
      designation?: string;
      collegeOwnership?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
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

// Helper to strip undefined values from an object before writing to Firestore
const cleanObj = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [colleges, setColleges] = useState<Institution[]>(INITIAL_COLLEGES);

  // --- Firebase Auth Session Synchronization ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            setCurrentUser(null);
          }
        } catch (e) {
          console.error("Error retrieving user profile from Firestore:", e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Real-Time Firestore Collection Subscriptions ---
  useEffect(() => {
    // 1. Colleges Sync
    const unsubColleges = onSnapshot(collection(db, 'colleges'), async (snapshot) => {
      if (snapshot.empty) {
        // Seed INITIAL_COLLEGES if empty
        try {
          const batch = writeBatch(db);
          INITIAL_COLLEGES.forEach((col) => {
            const docRef = doc(db, 'colleges', col.id);
            batch.set(docRef, col);
          });
          await batch.commit();
        } catch (e) {
          console.error("Error seeding initial colleges:", e);
        }
      } else {
        const loaded: Institution[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as Institution);
        });
        setColleges(loaded);
      }
    });

    // 2. Users Sync
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loaded: User[] = [];
      snapshot.forEach((d) => {
        loaded.push(d.data() as User);
      });
      setUsers(loaded);
    });

    // 3. Events Sync
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const loaded: Event[] = [];
      snapshot.forEach((d) => {
        loaded.push(d.data() as Event);
      });
      setEvents(loaded);
    });

    // 4. Registrations Sync
    const unsubRegs = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      const loaded: Registration[] = [];
      snapshot.forEach((d) => {
        loaded.push(d.data() as Registration);
      });
      setRegistrations(loaded);
    });

    // 5. Certificates Sync
    const unsubCerts = onSnapshot(collection(db, 'certificates'), (snapshot) => {
      const loaded: Certificate[] = [];
      snapshot.forEach((d) => {
        loaded.push(d.data() as Certificate);
      });
      setCertificates(loaded);
    });

    // 6. Notifications Sync
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const loaded: Notification[] = [];
      snapshot.forEach((d) => {
        loaded.push(d.data() as Notification);
      });
      // Sort notifications by date/time (latest first)
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(loaded);
    });

    return () => {
      unsubColleges();
      unsubUsers();
      unsubEvents();
      unsubRegs();
      unsubCerts();
      unsubNotifs();
    };
  }, []);

  // --- Notification Helper ---
  const addNotification = async (
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
    try {
      await setDoc(doc(db, 'notifications', newNot.id), newNot);
    } catch (e) {
      console.error("Error creating notification document:", e);
    }
  };

  // --- Auth Handlers ---
  const loginAs = (role: UserRole | 'guest', collegeName?: string) => {
    if (role === 'guest') {
      setCurrentUser(null);
      navigateTo('/');
    } else {
      const defaultCollege = collegeName || colleges[0]?.name || 'ANITS';
      const foundUser = users.find(u => u.role === role && u.collegeName === defaultCollege);
      
      if (foundUser) {
        signInWithEmailAndPassword(auth, foundUser.email, foundUser.password || 'password')
          .then(() => {
            setCurrentUser(foundUser);
            addNotification('Welcome back!', `Logged in successfully as ${foundUser.name} (${role.toUpperCase()}) at ${defaultCollege}.`, 'success');
            if (role === 'student') navigateTo('/student/dashboard');
            else if (role === 'coordinator') navigateTo('/coordinator/dashboard');
            else if (role === 'admin') navigateTo('/admin/dashboard');
          })
          .catch((err) => {
            console.error("loginAs Auth failed", err);
            addNotification('Login Error', `Firebase Auth failed for ${foundUser.name}.`, 'warning');
          });
      } else {
        addNotification(
          'No Account Found',
          `There is no registered ${role} at ${defaultCollege} yet. Please register a profile first.`,
          'warning'
        );
      }
    }
  };

  const loginWithEmail = async (email: string, collegeName: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!password) {
        return { success: false, error: "Password is required for secure authentication." };
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        return { success: false, error: "Your user profile could not be found in the database." };
      }

      const profile = userDoc.data() as User;
      if (profile.collegeName !== collegeName) {
        await signOut(auth);
        return { success: false, error: `You are registered under "${profile.collegeName}", not "${collegeName}".` };
      }

      setCurrentUser(profile);
      addNotification('Welcome back!', `Logged in successfully as ${profile.name}.`, 'success');
      
      if (profile.role === 'student') navigateTo('/student/dashboard');
      else if (profile.role === 'coordinator') navigateTo('/coordinator/dashboard');
      else if (profile.role === 'admin') navigateTo('/admin/dashboard');
      return { success: true };
    } catch (e: any) {
      console.error("Login error:", e);
      let errMsg = e.message || "Login failed. Please check your credentials.";
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-email') {
        errMsg = "Incorrect password or email. Please check your credentials and try again.";
      } else if (e.code === 'auth/user-not-found') {
        errMsg = `No registered account found with email "${email}".`;
      }
      return { success: false, error: errMsg };
    }
  };

  const signUpUser = async (
    name: string,
    email: string,
    role: UserRole,
    department: string,
    collegeName: string,
    password?: string,
    extraData?: {
      yearOfStudy?: string;
      designation?: string;
      collegeOwnership?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!password) {
        return { success: false, error: "Password is required for registration." };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const collegeObj = colleges.find(c => c.name === collegeName);
      const collegeId = collegeObj ? collegeObj.id : `col_${Date.now()}`;
      const departmentId = (role !== 'admin' && department) ? `dept_${department.replace(/\s+/g, '_').toLowerCase()}` : undefined;

      const newUser: User = {
        id: uid,
        uid: uid,
        name,
        email,
        role,
        department: role !== 'admin' ? department : undefined,
        departmentId,
        collegeName,
        collegeId,
        password,
        createdAt: new Date().toISOString(),
        studentId: role === 'student' ? `STU-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        avatarUrl: `https://images.unsplash.com/photo-${role === 'student' ? '1534528741775-53994a69daeb' : '1573496359142-b8d87734a5a2'}?auto=format&fit=crop&q=80&w=200`,
        bio: `${role === 'student' ? 'Student' : role === 'coordinator' ? 'Coordinator' : 'Admin'} at ${collegeName}`,
        yearOfStudy: role === 'student' ? extraData?.yearOfStudy : undefined,
        designation: role === 'coordinator' ? extraData?.designation : undefined,
        collegeOwnership: role === 'admin' ? (extraData?.collegeOwnership || collegeName) : undefined
      };

      const cleanedUser = cleanObj(newUser);
      await setDoc(doc(db, 'users', uid), cleanedUser);
      setCurrentUser(cleanedUser);
      addNotification('Account Created!', `Welcome to CampusConnect, ${name}! You are registered at ${collegeName}.`, 'success');
      
      if (role === 'student') navigateTo('/student/dashboard');
      else if (role === 'coordinator') navigateTo('/coordinator/dashboard');
      else if (role === 'admin') navigateTo('/admin/dashboard');
      return { success: true };
    } catch (e: any) {
      console.error("Signup error:", e);
      let errMsg = e.message || "Registration failed.";
      if (e.code === 'auth/email-already-in-use') {
        errMsg = `The email address "${email}" is already registered.`;
      } else if (e.code === 'auth/weak-password') {
        errMsg = "The password is too weak. Please choose a stronger password (at least 6 characters).";
      }
      return { success: false, error: errMsg };
    }
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
    
    setDoc(doc(db, 'colleges', newInst.id), newInst);
    addNotification('Institution Registered!', `"${nameTrimmed}" is now on CampusConnect SaaS network.`, 'success');
    return newInst;
  };

  const updateUserCollege = async (collegeName: string) => {
    if (currentUser) {
      const updated = { ...currentUser, collegeName };
      setCurrentUser(updated);
      try {
        await setDoc(doc(db, 'users', currentUser.id), updated);
        addNotification('Context Switched', `Now viewing as a member of ${collegeName}.`, 'info');
      } catch (e) {
        console.error("Error switching college context:", e);
      }
    }
  };

  const updateUserProfile = async (name: string, bio: string, department: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, name, bio, department };
      setCurrentUser(updatedUser);
      try {
        await setDoc(doc(db, 'users', currentUser.id), updatedUser);
        addNotification('Profile Updated', 'Profile updated successfully.', 'success');
      } catch (e) {
        console.error("Error updating user profile:", e);
      }
    }
  };

  const logout = async () => {
    const prevName = currentUser?.name || 'User';
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Signout error:", e);
    }
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

    setDoc(doc(db, 'registrations', newReg.id), newReg);
    
    // Update participant count
    updateDoc(doc(db, 'events', eventId), {
      currentParticipants: eventObj.currentParticipants + 1
    });

    addNotification(
      'Registration Confirmed!',
      `You have registered for "${eventObj.title}". Your digital QR pass is ready.`,
      'success'
    );
    return true;
  };

  const cancelRegistration = async (registrationId: string) => {
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return;

    await updateDoc(doc(db, 'registrations', registrationId), {
      status: 'cancelled'
    });

    // Decrement participants
    if (reg.eventId) {
      const eventObj = events.find(e => e.id === reg.eventId);
      if (eventObj) {
        await updateDoc(doc(db, 'events', reg.eventId), {
          currentParticipants: Math.max(0, eventObj.currentParticipants - 1)
        });
      }
    }

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
      mapLocation: eventData.mapLocation || { lat: 17.7813, lng: 83.3776, name: 'GITAM Campus' },
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

    setDoc(doc(db, 'events', newEvent.id), newEvent);

    addNotification(
      'Event Submitted',
      `"${newEvent.title}" has been submitted for administration review.`,
      'info'
    );

    return newEvent;
  };

  const updateEvent = async (eventId: string, updatedData: Partial<Event>) => {
    await updateDoc(doc(db, 'events', eventId), updatedData);
    addNotification('Event Updated', 'Event details have been successfully revised.', 'success');
  };

  const deleteEvent = async (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    await deleteDoc(doc(db, 'events', eventId));
    
    // Also mark associated registrations as cancelled
    const associatedRegs = registrations.filter(r => r.eventId === eventId);
    if (associatedRegs.length > 0) {
      try {
        const batch = writeBatch(db);
        associatedRegs.forEach(reg => {
          batch.update(doc(db, 'registrations', reg.id), { status: 'cancelled' });
        });
        await batch.commit();
      } catch (e) {
        console.error("Error cancelling associated registrations:", e);
      }
    }

    addNotification('Event Removed', `"${ev?.title}" has been deleted from the catalog.`, 'warning');
  };

  // --- Admin Actions ---
  const approveEvent = async (eventId: string) => {
    await updateDoc(doc(db, 'events', eventId), { status: 'approved' });
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      addNotification(
        'Event Approved',
        `"${ev.title}" is now published and open for registrations.`,
        'success'
      );
    }
  };

  const rejectEvent = async (eventId: string) => {
    await updateDoc(doc(db, 'events', eventId), { status: 'rejected' });
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
  const markAttendance = async (registrationId: string, attended: boolean) => {
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return;

    if (attended) {
      // Mark as Attended
      await updateDoc(doc(db, 'registrations', registrationId), {
        status: 'attended',
        attendedAt: new Date().toISOString()
      });

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

        await setDoc(doc(db, 'certificates', certId), newCert);

        // Bind cert ID back to registration
        await updateDoc(doc(db, 'registrations', registrationId), {
          certificateId: certId
        });

        addNotification(
          'Certificate Issued!',
          `Digital certificate minted for ${reg.studentName} for attending "${reg.eventTitle}".`,
          'certificate'
        );
      }
    } else {
      // Revert to Registered
      await updateDoc(doc(db, 'registrations', registrationId), {
        status: 'registered',
        attendedAt: null,
        certificateId: null
      });

      // Remove certificate if exists
      const cert = certificates.find(c => c.registrationId === registrationId);
      if (cert) {
        await deleteDoc(doc(db, 'certificates', cert.id));
      }
    }
  };

  // --- Clear/Read Notifications ---
  const clearNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const markNotificationRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), {
      read: true
    });
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
