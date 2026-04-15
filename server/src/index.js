import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeFirebase } from './config/firebase.js'
import userRoutes from './routes/users.js'
import gmailRoutes from './routes/gmail.js'
import whatsappRoutes from './routes/whatsapp.js'
import webhookRoutes from './routes/webhook.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

initializeFirebase()

app.use(cors())
app.use(express.json())

app.use('/api/users', userRoutes)
app.use('/api/gmail', gmailRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/webhook', webhookRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
