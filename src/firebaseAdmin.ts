// src/firebaseAdmin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'; // 🔥 Adicionado

const serviceAccount = require('./base/timelens.json');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firebaseAuth = getAuth();
export const db = getFirestore(); // 🔥 Exportando a instância do banco de dados