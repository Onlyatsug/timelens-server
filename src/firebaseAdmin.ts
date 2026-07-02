// src/firebaseAdmin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'; // 🔥 Adicionado
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY não definida");
}

function env(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const serviceAccount = {
  type: env("TYPE"),
  project_id: env("PROJECT_ID"),
  private_key_id: env("PRIVATE_KEY_ID"),
  private_key: env("PRIVATE_KEY").replace(/\\n/g, "\n"),
  client_email: env("CLIENT_EMAIL"),
  client_id: env("CLIENT_ID"),
  auth_uri: env("AUTH_URI"),
  token_uri: env("TOKEN_URI"),
  auth_provider_x509_cert_url: env("AUTH_PROVIDER_X509_CERT_URL"),
  client_x509_cert_url: env("CLIENT_X509_CERT_URL"),
  universe_domain: env("UNIVERSE_DOMAIN"),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
export const firebaseAuth = getAuth();
export const db = getFirestore(); // 🔥 Exportando a instância do banco de dados