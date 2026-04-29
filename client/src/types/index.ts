export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'senior_coordinator' | 'junior_coordinator';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Company {
  id: string;
  name: string;
  type: 'placement' | 'internship';
  rounds: Round[];
  seniorCoordinatorEmail: string;
  delegatedToJcEmail: string | null;
  labelSc: string;
  labelCompany: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Round {
  name: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface GmailEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  year?: string;
  body?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface EmailReadStatus {
  id: string;
  userUid: string;
  gmailMessageId: string;
  companyId: string;
  readAt: Date;
}

export interface DevUser {
  uid: string;
  email: string;
  role: 'admin' | 'senior_coordinator' | 'junior_coordinator';
  name: string;
}

export interface WhatsAppMessage {
  id: string;
  recipientName: string;
  recipientPhone: string;
  messageContent: string;
  acknowledgementStatus: 'delivered' | 'failed' | 'pending';
  sentAt: string | Date;
  companyId?: string;
  userId?: string;
}
