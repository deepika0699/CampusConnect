import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
