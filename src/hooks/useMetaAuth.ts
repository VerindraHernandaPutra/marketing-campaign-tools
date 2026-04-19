import { useCallback } from 'react';
import { useUserRole } from '../auth/UserContext';
import { useNotification } from '../context/NotificationContext';

const META_CLIENT_ID = import.meta.env.VITE_META_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/integrations/meta-callback`;

export function useMetaAuth(sourcePlatform: 'instagram' | 'messenger') {
    const { currentOrgId } = useUserRole();
    const notify = useNotification();

    const handleConnectFacebook = useCallback(() => {
        if (!META_CLIENT_ID) {
            notify.error('Configuration Error', 'VITE_META_CLIENT_ID is not configured in your environment.');
            return;
        }

        // Standard Facebook Business Login OAuth scopes
        const scopes = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_manage_engagement',
            'pages_manage_metadata',
            'read_insights',
            'instagram_basic',
            'instagram_content_publish',
            'instagram_manage_insights',
            'instagram_manage_messages',
            'pages_messaging', 
            'business_management' 
        ].join(',');

        // Pass the organization ID AND the source platform so the callback knows where to redirect
        const returnTo = encodeURIComponent(window.location.origin);
        const statePayload = `${currentOrgId}|${sourcePlatform}|${returnTo}`;

        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(statePayload)}&auth_type=rerequest&return_scopes=true`;
        
        // Redirect to Meta's Login Page
        window.location.href = oauthUrl;
    }, [currentOrgId, sourcePlatform, notify]);

    return { handleConnectFacebook };
}
