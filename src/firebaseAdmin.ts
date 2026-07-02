// src/firebaseAdmin.ts
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

console.log("PROJECT_ID:", process.env.PROJECT_ID);
console.log("CLIENT_EMAIL:", process.env.CLIENT_EMAIL);
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);

function env(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const serviceAccount: ServiceAccount = {
  projectId: env("PROJECT_ID"),
  clientEmail: env("CLIENT_EMAIL"),
  privateKey: env("PRIVATE_KEY").replace(/\\n/g, "\n"),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firebaseAuth = getAuth();
export const db = getFirestore();