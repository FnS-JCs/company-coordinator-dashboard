export interface User {
  uid: string
  email: string
  displayName: string
  role: 'senior_coordinator' | 'junior_coordinator'
  assignedCompanies: string[]
  photoURL?: string
}

export interface Company {
  id: string
  name: string
  industry: string
  status: 'active' | 'withdrawn' | 'pending'
  coordinatorId: string
  coordinatorName: string
  createdAt: Date
  updatedAt: Date
}

export interface GmailWithdrawal {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
  date: Date
  companyId?: string
  isRead: boolean
  labelIds: string[]
}

export interface WhatsAppMessage {
  id: string
  companyId: string
  recipientName: string
  recipientPhone: string
  messageContent: string
  sentAt: Date
  acknowledgementStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  sheetsRowId?: string
}
