import { addToast } from '@/plugins/toast.js';

export const handleTestEvent = {
    'TestEvent': e => {
        const message = 'Successfully received Test Event! ' + JSON.stringify(e);
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};
