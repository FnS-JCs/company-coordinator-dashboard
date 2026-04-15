import axios from 'axios'
import type { User } from '../types'
import type { User as FirebaseUser } from 'firebase/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const userService = {
  async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users`, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    })
    return response.data
  },

  async getUser(uid: string): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/users/${uid}`)
    return response.data
  },

  async updateUser(uid: string, data: Partial<User>): Promise<User> {
    const response = await axios.patch(`${API_BASE_URL}/users/${uid}`, data)
    return response.data
  },
}
