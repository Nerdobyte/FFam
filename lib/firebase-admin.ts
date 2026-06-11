import { readFileSync } from 'fs';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");

  return JSON.parse(raw);
}

function initAdmin(): App {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

export function getAdminDb() {
  return getFirestore(initAdmin());
}
