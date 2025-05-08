import { onBeforeUnmount, onMounted } from "vue"
import { onBeforeRouteLeave } from "vue-router"

import {
    subscribeSystemChannel,
    unsubscribeSystemChannel,
    listenToList,
    SYSTEM_CHANNEL_NAME,
} from '@/helpers/websocket.js';

export default function useSystemChannel (listOfEvents = []) {
    onMounted(_ => {
        subscribeSystemChannel();
        listenToList(SYSTEM_CHANNEL_NAME, listOfEvents);
    })

    function unsubscribe(){
        unsubscribeSystemChannel();
    }

    onBeforeUnmount(_ => {
        unsubscribe();
    })

    onBeforeRouteLeave((to, from) => {
        unsubscribe();
    })
}