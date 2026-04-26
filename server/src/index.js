import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import companiesRouter from './routes/companies.js'
import gmailRouter from './routes/gmail.js'
import settingsRouter from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/gmail', gmailRouter)
app.use('/api/settings', settingsRouter)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    devMode: process.env.DEV_AUTH_BYPASS === 'true',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    console.log('DEV MODE: Auth bypass enabled')
  }
})
