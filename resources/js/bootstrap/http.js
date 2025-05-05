import axios from 'axios';
import router from './router.js';

import {
    throwError,
} from '@/helpers/helpers.js';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

export const web_http = axios.create();

const instance = axios.create({
    baseURL: '/api/v1',
});

// These errors need to be handled manually.
export const unhandledErrors = [400, 422];

export function isUnhandledError(axiosError) {
    if(!axiosError?.response?.status) throw Error('Response object is missing status property');
    const status = axiosError.response.status;
    // If status is below 400, we don't need to handle it.
    if(status < 400) return false;
    return unhandledErrors.includes(status);
}

// Some errors are handled by the system.
// If we handle those again, we have e.g. multiple error popups.
// This allows us to just catch the errors that are not handled by
// the system.
export function handleUnhandledErrors(axiosError, callback) {
    if(isUnhandledError(axiosError)) {
        return callback(axiosError);
    }
}

instance.interceptors.response.use(response => {
    return response;
}, error => {
    if(isUnhandledError(error)) {
        return Promise.reject(error);
    }
    const code = error.response.status;
    switch(code) {
        case 401:
            // Only append redirect query if from another route than login
            // to prevent recursivly appending current route's full path
            // on reloading login page
            if(router.currentRoute.value.name != 'login') {
                const redirectPath = router.currentRoute.value.fullPath;
                const query = {
                    redirectTo: redirectPath,
                };
                router.push({
                    name: 'login',
                    query: query,
                });
            }
            break;
        default:
            throwError(error);
            break;
    }
    return Promise.reject(error);
});

export function useHttp() {
    return instance;
};

export default instance;
