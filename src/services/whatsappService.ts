import { supabase } from '../supabaseClient';

export interface WhatsAppMessage {
    id: number;
    phone: string;
    message: string;
    status: 'scheduling' | 'sent' | 'failed';
    created_at: string;
}

export const whatsappService = {
    /**
     * Queues a message to be sent via the WhatsApp Gateway
     */
    async queueMessage(phone: string, organizationId: string, message: string = 'hello_world') {
        // Ensure phone number has country code but no '+' if existing logic prefers that,
        // though usually Supabase stores it as is.
        // Clean string: remove non-digits
        const cleanPhone = phone.replace(/[^\d]/g, '');

        const { data, error } = await supabase
            .from('whatsapp_outbox')
            .insert([
                {
                    organization_id: organizationId,
                    phone: cleanPhone,
                    message,
                    status: 'scheduling'
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Subscribe to changes for real-time updates in UI
     */
    subscribeToMessage(messageId: number, onUpdate: (payload: unknown) => void) {
        return supabase
            .channel(`message-${messageId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'whatsapp_outbox', filter: `id=eq.${messageId}` },
                (payload) => onUpdate(payload.new)
            )
            .subscribe();
    }
};
