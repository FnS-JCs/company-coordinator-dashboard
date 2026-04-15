import { getFirestore } from '../config/firebase.js'

export async function getOrCreateUser(firebaseUid, email, displayName, photoURL) {
  const db = getFirestore()
  const usersRef = db.collection('users')
  
  const existingUser = await usersRef.where('uid', '==', firebaseUid).limit(1).get()
  
  if (!existingUser.empty) {
    return { id: existingUser.docs[0].id, ...existingUser.docs[0].data() }
  }

  const isSenior = email.includes('senior') || email.startsWith('srcc.')
  const userData = {
    uid: firebaseUid,
    email,
    displayName: displayName || email.split('@')[0],
    photoURL: photoURL || null,
    role: isSenior ? 'senior_coordinator' : 'junior_coordinator',
    assignedCompanies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const docRef = await usersRef.add(userData)
  return { id: docRef.id, ...userData }
}

export async function getUserByUid(uid) {
  const db = getFirestore()
  const usersRef = db.collection('users')
  const snapshot = await usersRef.where('uid', '==', uid).limit(1).get()
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

export async function updateUser(uid, data) {
  const db = getFirestore()
  const usersRef = db.collection('users')
  const snapshot = await usersRef.where('uid', '==', uid).limit(1).get()
  
  if (snapshot.empty) {
    throw new Error('User not found')
  }
  
  const docId = snapshot.docs[0].id
  await usersRef.doc(docId).update({
    ...data,
    updatedAt: new Date(),
  })
  
  return getUserByUid(uid)
}

export async function assignCompaniesToUser(uid, companyIds) {
  return updateUser(uid, { assignedCompanies: companyIds })
}
