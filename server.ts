import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to parse Firestore REST API document format into a plain JS object
function parseFirestoreDoc(docJson: any): any {
  if (!docJson || !docJson.fields) return null;

  const parseValue = (v: any): any => {
    if (!v || typeof v !== 'object') return v;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('booleanValue' in v) return Boolean(v.booleanValue);
    if ('timestampValue' in v) return v.timestampValue;
    if ('nullValue' in v) return null;
    if ('mapValue' in v) {
      const fields = v.mapValue.fields || {};
      const obj: any = {};
      for (const key of Object.keys(fields)) {
        obj[key] = parseValue(fields[key]);
      }
      return obj;
    }
    if ('arrayValue' in v) {
      const values = v.arrayValue.values || [];
      return values.map((item: any) => parseValue(item));
    }
    return v;
  };

  const fields = docJson.fields;
  const result: any = {};
  for (const key of Object.keys(fields)) {
    result[key] = parseValue(fields[key]);
  }
  return result;
}

// Fetch event document with Firestore REST API first, falling back to Admin SDK
async function getEventDocument(db: Firestore, eventId: string): Promise<any> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

  // 1. Try Firestore REST API (works seamlessly with browser API key & security rules)
  if (projectId) {
    try {
      const dbPath = databaseId && databaseId !== '(default)' ? databaseId : '(default)';
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents/events/${encodeURIComponent(eventId)}`;
      if (apiKey) {
        url += `?key=${encodeURIComponent(apiKey)}`;
      }
      const restRes = await fetch(url);
      if (restRes.ok) {
        const docJson = await restRes.json();
        const parsed = parseFirestoreDoc(docJson);
        if (parsed) {
          return parsed;
        }
      }
    } catch {
      // Silently fall back
    }
  }

  // 2. Fallback to Firebase Admin SDK
  try {
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (eventDoc.exists) {
      return eventDoc.data();
    }
  } catch {
    // Silently handle if Admin SDK credentials are not present in dev container
  }

  return null;
}

// PART 2: Whitelist Context Builder
function buildEventAIContext(event: any) {
  return {
    title: event.title || '',
    venue: event.venue || '',
    date: event.date || '',
    time: event.time || '',
    address: event.mapLocation?.address || event.mapLocation?.name || event.address || '',
    mapLocation: event.mapLocation ? {
      lat: event.mapLocation.lat,
      lng: event.mapLocation.lng,
      mapLabel: event.mapLocation.mapLabel || ''
    } : null,
    organizerName: event.coordinatorName || event.organizerName || event.organizer || '',
    department: event.department || '',
    capacity: Number(event.maxParticipants) || 0,
    remainingSeats: Math.max(0, (Number(event.maxParticipants) || 0) - (Number(event.currentParticipants) || 0)),
    registrationDeadline: event.registrationDeadline || '',
    registrationFee: event.registrationFee ?? (event.isFree === false ? 'Paid' : 'Free'),
    certificateAvailable: Boolean(event.certificateTemplateId || event.certificateAvailable),
    foodProvided: Boolean(event.foodProvided),
    description: event.description || '',
    additionalInstructions: event.locationDetails || event.additionalInstructions || ''
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser middleware
  app.use(express.json());

  // Initialize firebase-admin
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

  if (getApps().length === 0) {
    initializeApp({
      projectId: projectId,
    });
  }

  let db: Firestore;
  if (databaseId) {
    try {
      db = getFirestore(getApp(), databaseId);
    } catch (err) {
      console.warn("Could not initialize with custom database ID, falling back to default:", err);
      db = getFirestore();
    }
  } else {
    db = getFirestore();
  }

  // API Routes
  app.post('/api/ai/event-assistant', async (req, res) => {
    try {
      const { eventId, question } = req.body || {};

      if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'question is required' });
      }

      const trimmedQuestion = question.trim().slice(0, 500);

      // Fetch ONLY specified event document from Firestore (Admin SDK with REST API fallback)
      const eventData = await getEventDocument(db, eventId);
      if (!eventData) {
        return res.status(404).json({ error: 'Event document not found' });
      }

      const sanitizedContext = buildEventAIContext(eventData);

      // PART 3: GEMINI SYSTEM PROMPT
      const systemInstruction = `You are CampusConnect Event Assistant.

You are provided ONLY with a sanitized event context object.

SECURITY RULES:

* Never claim access to Firestore, Firebase, databases, authentication systems, or user records.
* Never invent student names, emails, phone numbers, registration lists, attendance records, certificate codes, or administrative information.
* Answer only using the provided event context.
* If the requested information is not present in the context, respond exactly:
  "I could not find that information in the event details. Please contact the event coordinator for confirmation."
* If the user asks for private, administrative, or unrelated data, respond exactly:
  "I do not have access to private user or administrative data."
* Do not invent food arrangements, venue changes, schedule changes, eligibility rules, fees, accommodation, transport, or certificate policies.`;

      const prompt = `SANITIZED EVENT CONTEXT:
${JSON.stringify(sanitizedContext, null, 2)}

USER QUESTION:
${trimmedQuestion}`;

      // PART 8: Timeout handling & Graceful failure
      const fetchPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 8000)
      );

      const response: any = await Promise.race([fetchPromise, timeoutPromise]);
      const answerText = response.text?.trim();

      if (!answerText) {
        return res.json({
          answer: 'I could not find that information in the event details. Please contact the event coordinator for confirmation.'
        });
      }

      return res.json({ answer: answerText });
    } catch (error: any) {
      console.error('Event Assistant API Error:', error);
      return res.status(500).json({
        answer: 'The Event Assistant is temporarily unavailable. Please try again later.'
      });
    }
  });

  app.get('/api/verify/:verificationCode', async (req, res) => {
    try {
      const { verificationCode } = req.params;
      if (!verificationCode) {
        return res.status(400).json({ error: 'Verification code is required' });
      }

      const certsRef = db.collection('certificates');
      const qSnapshot = await certsRef.where('verificationCode', '==', verificationCode).limit(1).get();

      if (qSnapshot.empty) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      const certDoc = qSnapshot.docs[0];
      const certData = certDoc.data();

      let collegeName = 'Unknown Institution';
      if (certData.collegeId) {
        const collegeDoc = await db.collection('colleges').doc(certData.collegeId).get();
        if (collegeDoc.exists) {
          collegeName = collegeDoc.data()?.name || 'Unknown Institution';
        }
      }

      const responseData = {
        valid: true,
        studentName: certData.studentName,
        eventTitle: certData.eventTitle,
        collegeName: collegeName,
        department: certData.department,
        issuedAt: certData.issuedAt,
        verificationCode: certData.verificationCode,
        verificationTimestamp: new Date().toISOString()
      };

      return res.json(responseData);
    } catch (error) {
      console.error('API Verification error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
