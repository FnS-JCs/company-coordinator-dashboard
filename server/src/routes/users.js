import { Router } from 'express'
import { getOrCreateUser, getUserByUid, updateUser, assignCompaniesToUser } from '../services/userService.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body
    const user = await getOrCreateUser(uid, email, displayName, photoURL)
    res.json(user)
  } catch (error) {
    console.error('User creation error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.get('/:uid', async (req, res) => {
  try {
    const user = await getUserByUid(req.params.uid)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error('User fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.patch('/:uid', async (req, res) => {
  try {
    const user = await updateUser(req.params.uid, req.body)
    res.json(user)
  } catch (error) {
    console.error('User update error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.post('/:uid/assign-companies', async (req, res) => {
  try {
    const { companyIds } = req.body
    const user = await assignCompaniesToUser(req.params.uid, companyIds)
    res.json(user)
  } catch (error) {
    console.error('Assign companies error:', error)
    res.status(500).json({ error: 'Failed to assign companies' })
  }
})

export default router
