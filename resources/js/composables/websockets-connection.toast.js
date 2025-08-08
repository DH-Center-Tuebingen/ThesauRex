/**
 * TODO: DHC: DHC-Components
 * This is a copy of a spacialist composable.
 * This should be moved to the DHC-Components!
 */

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
import { useToast } from '@/plugins/toast.js';


export default function useWebSocketConnectionToast() {
    const toast = useToast();
    const t = useI18n().t;
    const status = ref(getState());
    const message = computed(_ => {
        if(isConnected.value) {
            return t('websockets.service_available_again');
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

    const bsToast = ref(null);
    function createToastIfNecessary() {
        if(!bsToast.value) {
            bsToast.value = toast.$toast(message.value, '', {
                autohide: false,
                channel: isConnected.value ? 'info' : 'danger',
                simple: true,
            });
        }
    }

    if(!isConnected.value) {
        createToastIfNecessary();
    }

    watch(isConnected, (newVal, oldVal) => {
        if(newVal === oldVal) {
            return;
        }
        if(bsToast.value?._element) {
            bsToast.value._element.remove();
            bsToast.value = null;
        }
        createToastIfNecessary();
    });
}
