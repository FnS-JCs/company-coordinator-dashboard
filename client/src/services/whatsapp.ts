import type { WhatsAppMessage } from '../types';

export const whatsappService = {
  sendMessage: async (_payload: {
    companyId: string;
    recipientName: string;
    recipientPhone: string;
    messageContent: string;
    userId: string | undefined;
  }): Promise<void> => {
    throw new Error('WhatsApp service not yet implemented');
  },

  getMessages: async (_userId: string | undefined): Promise<WhatsAppMessage[]> => {
    return [];
  },
};
