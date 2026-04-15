import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const serviceAccount = JSON.parse(readFileSync(join(__dirname, '../../serviceAccount.json'), 'utf8'))

let db

export function initializeFirebase() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  db = admin.firestore()
}

export function getDb() {
  if (!db) throw new Error('Firebase not initialized')
  return db
}

export function getFirestore() {
  return db
}
