import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Event, Registration, Certificate, Notification, UserRole, Institution } from '../types';
import { MOCK_USERS, INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_CERTIFICATES, INITIAL_NOTIFICATIONS, INITIAL_COLLEGES } from '../data/mockData';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
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
  getDocs,
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  query,
  where,
  runTransaction
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
  loginAs: (role: UserRole | 'guest', collegeName?: string, email?: string) => void;
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
  registerForEvent: (eventId: string) => Promise<boolean>;
  cancelRegistration: (registrationId: string) => Promise<void>;
  createEvent: (eventData: Partial<Event>) => Event;
  updateEvent: (eventId: string, updatedData: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  approveEvent: (eventId: string) => void;
  rejectEvent: (eventId: string) => void;
  markAttendance: (registrationId: string, attended: boolean) => void;
  clearNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (title: string, message: string, type: string, userId?: string, collegeId?: string, relatedEventId?: string) => Promise<void>;
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
  const [myCollegeEvents, setMyCollegeEvents] = useState<Event[]>([]);
  const [openEvents, setOpenEvents] = useState<Event[]>([]);
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

  // --- Real-Time Colleges Subscription ---
  useEffect(() => {
    const unsubColleges = onSnapshot(collection(db, 'colleges'), async (snapshot) => {
      if (snapshot.empty) {
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'colleges');
    });

    return () => unsubColleges();
  }, []);

  // --- Merge Events from My College and Open Events ---
  useEffect(() => {
    if (!currentUser) {
      setEvents(openEvents);
    } else {
      const mergedMap = new Map<string, Event>();
      openEvents.forEach(e => mergedMap.set(e.id, e));
      myCollegeEvents.forEach(e => mergedMap.set(e.id, e)); // myCollegeEvents overrides because it has status (pending, etc)
      setEvents(Array.from(mergedMap.values()));
    }
  }, [myCollegeEvents, openEvents, currentUser]);

  // --- Real-Time Firestore Collection Subscriptions with Tenant Isolation ---
  useEffect(() => {
    let unsubUsers = () => {};
    let unsubEvents = () => {};
    let unsubEventsOpen = () => {};
    let unsubRegs = () => {};
    let unsubCerts = () => {};
    let unsubNotifs = () => {};
    let unsubCoordinatorEvents = () => {};
    let unsubCoordinatorRegs = () => {};
    let unsubCoordinatorCerts = () => {};

    if (!currentUser) {
      // Subscriptions for guest/logged-out state
      // Security: Guest cannot read users. Set empty list to prevent PERMISSION_DENIED.
      setUsers([]);

      // Secure subscription to ONLY approved and open events for guests
      const qEventsOpen = query(
        collection(db, 'events'),
        where('visibility', '==', 'open'),
        where('status', '==', 'approved')
      );
      unsubEventsOpen = onSnapshot(qEventsOpen, (snapshot) => {
        const loaded: Event[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as Event);
        });
        setOpenEvents(loaded);
        setMyCollegeEvents([]);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'events-open-guest');
      });

      setRegistrations([]);
      setCertificates([]);
      setNotifications([]);
    } else {
      // Determined tenant-isolated collegeId
      const activeCollegeId = currentUser.collegeId || colleges.find(c => c.name === currentUser.collegeName)?.id || '';

      if (!activeCollegeId) {
        console.warn("Tenant isolation warning: No college ID resolved for user", currentUser.name);
        return;
      }

      // 1. Users Sync - Enforces query filtering based on roles to align with security rules
      if (currentUser.role === 'admin') {
        const qUsers = query(collection(db, 'users'), where('collegeId', '==', activeCollegeId));
        unsubUsers = onSnapshot(qUsers, (snapshot) => {
          const loaded: User[] = [];
          snapshot.forEach((d) => {
            loaded.push(d.data() as User);
          });
          setUsers(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users?collegeId=${activeCollegeId}`);
        });
      } else {
        // Students and coordinators subscribe only to their own /users/{uid} document.
        const userDocRef = doc(db, 'users', currentUser.id);
        unsubUsers = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data() as User;
            setUsers([userData]);
            
            // Safe profile update: keeps context updated when background modifications occur
            setCurrentUser(userData);
          } else {
            setUsers([]);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.id}`);
        });
      }

      // 2. Events Sync (My College) - Enforces query filtering by collegeId
      const qEventsMyCollege = query(collection(db, 'events'), where('collegeId', '==', activeCollegeId));
      unsubEvents = onSnapshot(qEventsMyCollege, (snapshot) => {
        const loaded: Event[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as Event);
        });
        setMyCollegeEvents(loaded);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `events?collegeId=${activeCollegeId}`);
      });

      // 2b. Open Events Sync (Cross-College fests) - Approved open events from all colleges
      const qEventsOpen = query(
        collection(db, 'events'),
        where('visibility', '==', 'open'),
        where('status', '==', 'approved')
      );
      unsubEventsOpen = onSnapshot(qEventsOpen, (snapshot) => {
        const loaded: Event[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as Event);
        });
        setOpenEvents(loaded);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'events-open-logged-in');
      });

      // 3. Registrations Sync - Student queries their own; admin queries by collegeId; coordinator queries by owned events
      if (currentUser.role === 'student') {
        const qRegs = query(collection(db, 'registrations'), where('studentId', '==', currentUser.id));
        unsubRegs = onSnapshot(qRegs, (snapshot) => {
          const loaded: Registration[] = [];
          snapshot.forEach((d) => {
            loaded.push(d.data() as Registration);
          });
          setRegistrations(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'registrations');
        });
      } else if (currentUser.role === 'admin') {
        const qRegs = query(collection(db, 'registrations'), where('collegeId', '==', activeCollegeId));
        unsubRegs = onSnapshot(qRegs, (snapshot) => {
          const loaded: Registration[] = [];
          snapshot.forEach((d) => {
            loaded.push(d.data() as Registration);
          });
          setRegistrations(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'registrations');
        });
      }

      // 4. Certificates Sync - Student queries their own; admin queries by collegeId; coordinator queries by owned events
      if (currentUser.role === 'student') {
        const qCerts = query(collection(db, 'certificates'), where('studentId', '==', currentUser.id));
        unsubCerts = onSnapshot(qCerts, (snapshot) => {
          const loaded: Certificate[] = [];
          snapshot.forEach((d) => {
            loaded.push(d.data() as Certificate);
          });
          setCertificates(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'certificates');
        });
      } else if (currentUser.role === 'admin') {
        const qCerts = query(collection(db, 'certificates'), where('collegeId', '==', activeCollegeId));
        unsubCerts = onSnapshot(qCerts, (snapshot) => {
          const loaded: Certificate[] = [];
          snapshot.forEach((d) => {
            loaded.push(d.data() as Certificate);
          });
          setCertificates(loaded);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'certificates');
        });
      }

      // Coordinator specific combined subscriptions
      if (currentUser.role === 'coordinator') {
        const qCoordEvents = query(collection(db, 'events'), where('coordinatorId', '==', currentUser.id));
        unsubCoordinatorEvents = onSnapshot(qCoordEvents, (eventsSnapshot) => {
          const eventIds = eventsSnapshot.docs.map(doc => doc.id);
          
          // Clean up previous registration and certificate subscriptions
          unsubCoordinatorRegs();
          unsubCoordinatorCerts();
          
          if (eventIds.length === 0) {
            setRegistrations([]);
            setCertificates([]);
            return;
          }

          // Firestore 'in' query supports up to 30 values.
          const chunks: string[][] = [];
          for (let i = 0; i < eventIds.length; i += 30) {
            chunks.push(eventIds.slice(i, i + 30));
          }

          // --- Registrations ---
          const regResults: { [chunkIndex: number]: Registration[] } = {};
          const regUnsubs: (() => void)[] = [];

          chunks.forEach((chunk, index) => {
            const qRegsChunk = query(collection(db, 'registrations'), where('eventId', 'in', chunk));
            const unsubChunk = onSnapshot(qRegsChunk, (snapshot) => {
              const loaded: Registration[] = [];
              snapshot.forEach((d) => {
                loaded.push(d.data() as Registration);
              });
              regResults[index] = loaded;
              
              const allRegs: Registration[] = [];
              chunks.forEach((_, idx) => {
                if (regResults[idx]) {
                  allRegs.push(...regResults[idx]);
                }
              });
              setRegistrations(allRegs);
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `coordinator-registrations-chunk-${index}`);
            });
            regUnsubs.push(unsubChunk);
          });

          unsubCoordinatorRegs = () => {
            regUnsubs.forEach(unsub => unsub());
          };

          // --- Certificates ---
          const certResults: { [chunkIndex: number]: Certificate[] } = {};
          const certUnsubs: (() => void)[] = [];

          chunks.forEach((chunk, index) => {
            const qCertsChunk = query(collection(db, 'certificates'), where('eventId', 'in', chunk));
            const unsubChunk = onSnapshot(qCertsChunk, (snapshot) => {
              const loaded: Certificate[] = [];
              snapshot.forEach((d) => {
                loaded.push(d.data() as Certificate);
              });
              certResults[index] = loaded;

              const allCerts: Certificate[] = [];
              chunks.forEach((_, idx) => {
                if (certResults[idx]) {
                  allCerts.push(...certResults[idx]);
                }
              });
              setCertificates(allCerts);
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `coordinator-certificates-chunk-${index}`);
            });
            certUnsubs.push(unsubChunk);
          });

          unsubCoordinatorCerts = () => {
            certUnsubs.forEach(unsub => unsub());
          };

        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'coordinator-events');
        });
      }

      // 5. Notifications Sync - Query alignment to fetch personal and broadcast notifications safely
      let personalNotifs: Notification[] = [];
      let broadcastNotifs: Notification[] = [];

      const mergeAndSetNotifs = () => {
        const combined = [...personalNotifs, ...broadcastNotifs];
        const seen = new Set<string>();
        const unique: Notification[] = [];
        combined.forEach(n => {
          if (n && n.id && !seen.has(n.id)) {
            // Client-side filter to omit any legacy login, logout, or session notifications
            const isLegacyAuth = 
              (n.title && (
                n.title.toLowerCase().includes('welcome back') ||
                n.title.toLowerCase().includes('goodbye') ||
                n.title.toLowerCase().includes('context switched') ||
                n.title.toLowerCase().includes('login')
              )) ||
              (n.message && (
                n.message.toLowerCase().includes('logged in') ||
                n.message.toLowerCase().includes('logged out') ||
                n.message.toLowerCase().includes('session') ||
                n.message.toLowerCase().includes('dashboard')
              ));

            if (!isLegacyAuth) {
              seen.add(n.id);
              unique.push(n);
            }
          }
        });
        unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(unique);
      };

      const qPersonal = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.id)
      );
      const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
        personalNotifs = [];
        snapshot.forEach((d) => {
          personalNotifs.push(d.data() as Notification);
        });
        mergeAndSetNotifs();
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `notifications?userId=${currentUser.id}`);
      });

      const qBroadcast = query(
        collection(db, 'notifications'),
        where('collegeId', '==', activeCollegeId),
        where('userId', '==', '')
      );
      const unsubBroadcast = onSnapshot(qBroadcast, (snapshot) => {
        broadcastNotifs = [];
        snapshot.forEach((d) => {
          broadcastNotifs.push(d.data() as Notification);
        });
        mergeAndSetNotifs();
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `notifications?collegeId=${activeCollegeId}&userId=`);
      });

      unsubNotifs = () => {
        unsubPersonal();
        unsubBroadcast();
      };
    }

    return () => {
      unsubUsers();
      unsubEvents();
      unsubEventsOpen();
      unsubRegs();
      unsubCerts();
      unsubNotifs();
      unsubCoordinatorEvents();
      unsubCoordinatorRegs();
      unsubCoordinatorCerts();
    };
  }, [currentUser?.id, currentUser?.collegeId, currentUser?.collegeName, currentUser?.role, colleges]);

  // --- Notification Helper ---
  const addNotification = async (
    title: string,
    message: string,
    type: string,
    userId?: string,
    collegeId?: string,
    relatedEventId?: string
  ) => {
    // Robust filter to completely prevent writing auth, session, or dashboard access notifications to Firestore
    const isAuthNotification = 
      (title && (
        title.toLowerCase().includes('welcome back') ||
        title.toLowerCase().includes('goodbye') ||
        title.toLowerCase().includes('context switched') ||
        title.toLowerCase().includes('login')
      )) ||
      (message && (
        message.toLowerCase().includes('logged in') ||
        message.toLowerCase().includes('logged out') ||
        message.toLowerCase().includes('session') ||
        message.toLowerCase().includes('dashboard')
      ));

    if (isAuthNotification) {
      console.log('Skipping auth/session/dashboard notification creation in Firestore:', title, message);
      return;
    }

    const newNot: Notification = {
      id: `not_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      collegeId: collegeId || currentUser?.collegeId || '',
      userId: userId || '',
      relatedEventId: relatedEventId || ''
    };
    try {
      await setDoc(doc(db, 'notifications', newNot.id), cleanObj(newNot));
    } catch (e) {
      console.error("Error creating notification document:", e);
    }
  };

  // --- Auth Handlers ---
  const loginAs = (role: UserRole | 'guest', collegeName?: string, email?: string) => {
    if (role === 'guest') {
      setCurrentUser(null);
      navigateTo('/');
    } else {
      const defaultCollege = collegeName || colleges[0]?.name || 'ANITS';
      const foundUser = email
        ? users.find(u => u.email.toLowerCase() === email.toLowerCase())
        : users.find(u => u.role === role && u.collegeName === defaultCollege);
      
      if (foundUser) {
        const userPassword = foundUser.password || 'password';
        signInWithEmailAndPassword(auth, foundUser.email, userPassword)
          .then(() => {
            setCurrentUser(foundUser);
            // addNotification('Welcome back!', `Logged in successfully as ${foundUser.name} (${foundUser.role.toUpperCase()}) at ${foundUser.collegeName}.`, 'success');
            if (foundUser.role === 'student') navigateTo('/student/dashboard');
            else if (foundUser.role === 'coordinator') navigateTo('/coordinator/dashboard');
            else if (foundUser.role === 'admin') navigateTo('/admin/dashboard');
          })
          .catch(async (err) => {
            console.error("loginAs Auth failed, trying self-healing signup:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, foundUser.email, userPassword);
                const newUid = userCredential.user.uid;
                
                if (newUid !== foundUser.id) {
                  const migratedUser = {
                    ...foundUser,
                    id: newUid,
                    uid: newUid
                  };
                  await setDoc(doc(db, 'users', newUid), cleanObj(migratedUser));
                  try {
                    await deleteDoc(doc(db, 'users', foundUser.id));
                  } catch (delErr) {
                    console.warn("Could not delete old user document during UID migration:", delErr);
                  }
                  setCurrentUser(migratedUser);
                } else {
                  setCurrentUser(foundUser);
                }
                
                // addNotification('Welcome back!', `Successfully restored login as ${foundUser.name}.`, 'success');
                if (foundUser.role === 'student') navigateTo('/student/dashboard');
                else if (foundUser.role === 'coordinator') navigateTo('/coordinator/dashboard');
                else if (foundUser.role === 'admin') navigateTo('/admin/dashboard');
              } catch (signUpErr: any) {
                console.error("Self-healing signup also failed:", signUpErr);
                addNotification('Login Error', `Incorrect password or credential repair failed: ${signUpErr.message}`, 'warning');
              }
            } else {
              addNotification('Login Error', `Firebase Auth failed: ${err.message}`, 'warning');
            }
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
      
      const cleanEmail = (email || '').trim();
      const cleanPassword = (password || '').trim();
      
      let foundUser: User | undefined = undefined;
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matchedDocs: User[] = [];
          snap.forEach(d => {
            matchedDocs.push(d.data() as User);
          });
          foundUser = matchedDocs.find(u => u.collegeName === collegeName);
        }
      } catch (findErr) {
        console.warn("Could not pre-fetch user doc for login:", findErr);
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (authErr: any) {
        if ((authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/user-not-found') && foundUser && (foundUser.password || '').trim() === cleanPassword) {
          console.log("loginWithEmail auth mismatch, attempting self-healing repair...");
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            const newUid = userCredential.user.uid;
            
            if (newUid !== foundUser.id) {
              const migratedUser = {
                ...foundUser,
                id: newUid,
                uid: newUid
              };
              await setDoc(doc(db, 'users', newUid), cleanObj(migratedUser));
              try {
                await deleteDoc(doc(db, 'users', foundUser.id));
              } catch (delErr) {
                console.warn("Could not delete old user document during UID migration:", delErr);
              }
              setCurrentUser(migratedUser);
            } else {
              setCurrentUser(foundUser);
            }
            // addNotification('Welcome back!', `Logged in successfully as ${foundUser.name}.`, 'success');
            if (foundUser.role === 'student') navigateTo('/student/dashboard');
            else if (foundUser.role === 'coordinator') navigateTo('/coordinator/dashboard');
            else if (foundUser.role === 'admin') navigateTo('/admin/dashboard');
            return { success: true };
          } catch (signUpErr: any) {
            console.error("Self-healing signup failed:", signUpErr);
            return { success: false, error: `Credential repair failed: ${signUpErr.message}` };
          }
        }
        throw authErr;
      }

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
      // addNotification('Welcome back!', `Logged in successfully as ${profile.name}.`, 'success');
      
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

      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const uid = userCredential.user.uid;

      const collegeObj = colleges.find(c => c.name === collegeName);
      const collegeId = collegeObj ? collegeObj.id : `col_${Date.now()}`;
      const departmentId = (role !== 'admin' && department) ? `dept_${department.replace(/\s+/g, '_').toLowerCase()}` : undefined;

      const newUser: User = {
        id: uid,
        uid: uid,
        name: (name || '').trim(),
        email: cleanEmail,
        role,
        department: role !== 'admin' ? department : undefined,
        departmentId,
        collegeName,
        collegeId,
        password: cleanPassword,
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
        // addNotification('Context Switched', `Now viewing as a member of ${collegeName}.`, 'info');
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
    // addNotification('Goodbye!', `${prevName} logged out successfully.`, 'info');
    navigateTo('/');
  };

  // --- Student Actions ---
  const registerForEvent = async (eventId: string): Promise<boolean> => {
    if (!currentUser) {
      navigateTo('/login');
      return false;
    }

    try {
      // Deterministic ID ensures duplicate protection at the Firestore document level
      const registrationId = `reg_${eventId}_${currentUser.id}`;
      const regDocRef = doc(db, 'registrations', registrationId);

      const success = await runTransaction(db, async (transaction) => {
        // Read the event document
        const eventDocRef = doc(db, 'events', eventId);
        const eventSnapshot = await transaction.get(eventDocRef);
        if (!eventSnapshot.exists()) {
          throw new Error('Event does not exist');
        }
        const eventObj = eventSnapshot.data() as Event;

        // Verify college ownership/validity
        if (!eventObj.collegeId) {
          throw new Error('Event belongs to an invalid college');
        }

        // Verify the event is approved
        if (eventObj.status !== 'approved') {
          throw new Error('This event has not been approved for registrations yet');
        }

        // Verify registration is still open (seats are available)
        const currentParticipants = eventObj.currentParticipants || 0;
        const maxParticipants = eventObj.maxParticipants || 0;
        if (currentParticipants >= maxParticipants) {
          throw new Error('This event is currently fully booked');
        }

        // Verify student is not already registered
        const regSnapshot = await transaction.get(regDocRef);
        if (regSnapshot.exists()) {
          const existingReg = regSnapshot.data() as Registration;
          if (existingReg.status === 'registered') {
            throw new Error('You are already registered for this event');
          }
        }

        // Build the registration object
        const newReg: Registration = {
          id: registrationId,
          eventId,
          eventTitle: eventObj.title,
          eventDate: eventObj.date,
          eventVenue: eventObj.venue,
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentEmail: currentUser.email,
          registeredAt: new Date().toISOString(),
          status: 'registered',
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CC-REG-${eventId}-${currentUser.id}-registered`,
          collegeId: currentUser.collegeId
        };

        // Create/Update the registration document
        transaction.set(regDocRef, cleanObj(newReg));

        // Increment event participant count atomically
        transaction.update(eventDocRef, {
          currentParticipants: currentParticipants + 1
        });

        return true;
      });

      // Notify user
      const eventObj = events.find(e => e.id === eventId);
      const title = eventObj ? eventObj.title : 'Event';
      addNotification(
        'Registration Confirmed!',
        `You have registered for "${title}". Your digital QR pass is ready.`,
        'success',
        currentUser.id,
        currentUser.collegeId
      );

      return success;
    } catch (error: any) {
      console.error('Registration transaction failed:', error);
      const message = error.message || 'Transaction error';
      if (message.includes('already registered') || message.includes('fully booked') || message.includes('not been approved')) {
        addNotification('Registration Failed', message, 'warning');
      } else {
        handleFirestoreError(error, OperationType.CREATE, `registrations/${eventId}`);
      }
      return false;
    }
  };

  const cancelRegistration = async (registrationId: string): Promise<void> => {
    if (!currentUser) return;

    try {
      await runTransaction(db, async (transaction) => {
        const regDocRef = doc(db, 'registrations', registrationId);
        const regSnapshot = await transaction.get(regDocRef);
        if (!regSnapshot.exists()) {
          throw new Error('Registration record not found');
        }

        const regData = regSnapshot.data() as Registration;

        // Verify the registration belongs to the authenticated student
        if (currentUser.role === 'student' && regData.studentId !== currentUser.id) {
          throw new Error('Unauthorized registration access');
        }

        // Delete the registration document
        transaction.delete(regDocRef);

        // Decrement event participant count atomically, preventing negative counts
        if (regData.eventId) {
          const eventDocRef = doc(db, 'events', regData.eventId);
          const eventSnapshot = await transaction.get(eventDocRef);
          if (eventSnapshot.exists()) {
            const eventData = eventSnapshot.data() as Event;
            const currentParticipants = eventData.currentParticipants || 0;
            const newCount = Math.max(0, currentParticipants - 1);
            transaction.update(eventDocRef, {
              currentParticipants: newCount
            });
          }
        }
      });

      const reg = registrations.find(r => r.id === registrationId);
      const title = reg ? reg.eventTitle : 'Event';
      addNotification(
        'Registration Cancelled',
        `Your reservation for "${title}" was cancelled.`,
        'info',
        currentUser.id,
        currentUser.collegeId
      );
    } catch (error: any) {
      console.error('Cancellation transaction failed:', error);
      handleFirestoreError(error, OperationType.DELETE, `registrations/${registrationId}`);
    }
  };

  // --- Coordinator Actions ---
  const createEvent = (eventData: Partial<Event>): Event => {
    if (!currentUser || currentUser.role !== 'coordinator') {
      throw new Error('Only authorized department coordinators can construct events.');
    }

    const nowStr = new Date().toISOString();
    const eventDateVal = eventData.eventDate || eventData.date || nowStr.split('T')[0];
    const startTimeVal = eventData.startTime || eventData.time || '10:00';
    const endTimeVal = eventData.endTime || '12:00';
    const departmentVal = eventData.department || currentUser.department || 'Computer Science and Engineering (CSE)';

    const newEvent: Event = {
      id: `evt_${Date.now()}`,
      title: eventData.title || 'Untitled Campus Event',
      description: eventData.description || '',
      longDescription: eventData.longDescription || '',
      department: departmentVal,
      coordinatorId: currentUser.id,
      coordinatorName: currentUser.name,
      venue: eventData.venue || 'Central Amphitheater',
      locationDetails: eventData.locationDetails || '',
      collegeName: currentUser.collegeName || eventData.collegeName || 'GITAM University',
      collegeId: currentUser.collegeId || '',
      clubOrg: eventData.clubOrg || 'Student Activities Council',
      facultyCoordinator: eventData.facultyCoordinator || currentUser.name,
      studentCoordinator: eventData.studentCoordinator || 'Alex Rivera',
      mapLocation: eventData.mapLocation || { lat: 17.7813, lng: 83.3776, name: 'GITAM Campus' },
      date: eventDateVal,
      time: startTimeVal,
      registrationDeadline: eventData.registrationDeadline || eventDateVal,
      maxParticipants: Number(eventData.maxParticipants) || 100,
      currentParticipants: 0,
      imageUrl: eventData.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
      category: eventData.category || 'tech',
      tags: eventData.tags || [],
      status: 'pending', // Pending Admin approval
      attendanceTracked: false,
      visibility: eventData.visibility || 'campus_only',

      // Phase 1 Additional Fields
      departmentId: eventData.departmentId || departmentVal,
      createdBy: currentUser.id,
      eventDate: eventDateVal,
      startTime: startTimeVal,
      endTime: endTimeVal,
      createdAt: nowStr,
      updatedAt: nowStr
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
    const changeData = {
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'events', eventId), changeData);
    
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      // Find all students registered for this event
      const registeredStudents = registrations.filter(r => r.eventId === eventId && r.status === 'registered');
      for (const reg of registeredStudents) {
        await addNotification(
          'Event Updated',
          `The details for "${ev.title}" have been revised. Please check the event page.`,
          'info',
          reg.studentId,
          ev.collegeId
        );
      }
      
      if (currentUser) {
        await addNotification(
          'Event Updated',
          `Event "${ev.title}" details have been successfully revised.`,
          'success',
          currentUser.id,
          ev.collegeId
        );
      }
    }
  };

  const deleteEvent = async (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
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
        
        // Notify each registered student
        for (const reg of associatedRegs) {
          if (reg.status === 'registered') {
            await addNotification(
              'Event Cancelled',
              `Unfortunately, "${ev.title}" has been cancelled. Your registration is refunded/invalidated.`,
              'warning',
              reg.studentId,
              ev.collegeId
            );
          }
        }
      } catch (e) {
        console.error("Error cancelling associated registrations:", e);
      }
    }

    if (currentUser) {
      addNotification(
        'Event Removed',
        `"${ev.title}" has been deleted from the catalog.`,
        'warning',
        currentUser.id,
        ev.collegeId
      );
    }
  };

  // --- Admin Actions ---
  const approveEvent = async (eventId: string) => {
    await updateDoc(doc(db, 'events', eventId), { status: 'approved' });
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      addNotification(
        'Event Approved',
        `"${ev.title}" is now published and open for registrations.`,
        'success',
        ev.createdBy || ev.coordinatorId,
        ev.collegeId
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
        'warning',
        ev.createdBy || ev.coordinatorId,
        ev.collegeId
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
          coordinatorName: eventObj?.coordinatorName || 'Department Head',
          collegeId: reg.collegeId
        };

        await setDoc(doc(db, 'certificates', certId), newCert);

        // Bind cert ID back to registration
        await updateDoc(doc(db, 'registrations', registrationId), {
          certificateId: certId
        });

        addNotification(
          'Certificate Issued!',
          `Digital certificate minted for ${reg.studentName} for attending "${reg.eventTitle}".`,
          'certificate',
          reg.studentId,
          reg.collegeId
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
