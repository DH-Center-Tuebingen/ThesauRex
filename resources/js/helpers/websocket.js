const activeChannels = {};

export const SYSTEM_CHANNEL_NAME = 'channel.system';

function listen(channelname, event, callback) {
    const channel = activeChannels[channelname];
    if(!channel) return;

    channel.listen(event, callback);
}

// Subscribe to public/private channel and optionally listen to an event
export function subscribeTo(channelname, isPrivate = false, listenTo = null, callback = null) {
    const channel = isPrivate ? window.Echo.private(channelname) : window.Echo.channel(channelname);
    if(!activeChannels[channelname]) {
        activeChannels[channelname] = channel;
    }
    if(listenTo && callback) {
        channel.listen(listenTo, callback);
    }
}

export function unsubscribeFrom(channelname) {
    window.Echo.leave(channelname);
}

// Listen for a specific event of an already subscribed channel
// If only event is provided it is interpreted as reaction event object
export function listenTo(channelname, event, callback = null) {
    if(!callback) {
        for(let k in event) {
            listen(channelname, k, event[k]);
        }
    } else {
        listen(channelname, event, callback);
    }
}

// Listen to a list of reaction events
export function listenToList(channelname, eventHandlerList) {
    eventHandlerList.forEach(eventHandlers => {
        for(let k in eventHandlers) {
            listen(channelname, k, eventHandlers[k]);
        }
    });
}

// Join a presence channel
export function join(roomname, callbacks) {
    const room = window.Echo.join(roomname)
        .here(callbacks.init)
        .joining(callbacks.join)
        .leaving(callbacks.leave)
        .error(callbacks.error);
    if(!activeChannels[roomname]) {
        activeChannels[roomname] = room;
    }
}

export function stopListeningTo(channelname, event) {
    const channel = activeChannels[channelname];
    if(!channel) return;

    channel.stopListening(event);
}

export function subscribeSystemChannel() {
    const channelname = SYSTEM_CHANNEL_NAME;
    subscribeTo(channelname, true);
    return channelname;
}

export function unsubscribeSystemChannel() {
    unsubscribeFrom(SYSTEM_CHANNEL_NAME);
}

/**
 * Gets the active pusher connection.
 * @returns {connection | null} - The pusher connection object or null if not available
 */
export function getConnection(){
    return window.Echo?.connector?.pusher?.connection ?? null;
}

/**
 *
 * @returns {string} - The current state of the websocket connection can be one of the following: 'initialized', 'connecting', 'connected', 'unavailable', 'disconnected', 'failed'
 */
export function getState() {
    return getConnection().state ?? 'unavailable';
}
