import { readFileSync } from 'fs';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function loadServiceAccount(): Record<string, unknown> {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (path) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Could not read FIREBASE_SERVICE_ACCOUNT_PATH at "${path}". Use an absolute path to your JSON key file.`,
      );
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH (recommended) or FIREBASE_SERVICE_ACCOUNT_KEY in .env.local.',
    );
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON. Use one single line, or set FIREBASE_SERVICE_ACCOUNT_PATH to the JSON file instead.',
    );
  }
}

function initAdmin(): App {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

export function getAdminDb() {
  return getFirestore(initAdmin());
}
