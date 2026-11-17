import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
const localConfigModules = import.meta.glob<{ default: Record<string, string> }>(
  '../firebase-applet-config.json',
  { eager: true }
);
const firebaseConfig: Record<string, string> =
  localConfigModules['../firebase-applet-config.json']?.default || {};

const config = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || '',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '',
};

export const firebaseConfigError: string | null =
  !config.apiKey || !config.projectId
    ? 'Firebase-Konfiguration fehlt auf diesem Server. Bitte entweder die VITE_FIREBASE_* Umgebungsvariablen in Render hinterlegen oder die Konfigurationsdatei mit hochladen.'
    : null;

const app = initializeApp(
  firebaseConfigError
    ? {
        apiKey: 'missing-config',
        authDomain: 'missing-config.firebaseapp.com',
        projectId: 'missing-config',
      }
    : config
);
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by skill guidelines
export async function testFirestoreConnection() {
  if (firebaseConfigError) return;
  try {
    await getDocFromServer(doc(db, 'metadata', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore: Please check your Firebase configuration or connectivity.');
    }
  }
}
testFirestoreConnection();
