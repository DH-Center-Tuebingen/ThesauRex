
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import {
    getState,
    getConnection,
} from '@/helpers/websocket.js';


export default function useWebSocketConnection() {
    const t = useI18n().t;
    const status = ref(getState());
    const message = computed(_ => {
        if(isConnected.value) {
            return t('websockets.service_available');
        } else {
            return t('websockets.service_unavailable');
        }
    });
    
    const isConnected = computed(_ => {
        switch(status.value) {
            case 'connected':
                return true;
            case 'connecting':
            case 'initialized':
            case 'unavailable':
            case 'disconnected':
            case 'failed':
            default:
                return false;
        }
    });

    const updateState = _ => {
        status.value = getState();
    };

    onMounted(_ => {
        const connection = getConnection();
        if(!connection) {
            console.error('Could not get connection object');
        } else {
            connection.bind('state_change', function (states) {
                updateState();
            });
        }
    });

    onBeforeUnmount(_ => {
        const connection = getConnection();
        if(!connection) {
            console.error('Could not get connection object');
        } else {
            connection.unbind('state_change ', updateState);
        }
    });
    
    return {
        message,
        isConnected,
    }
}
