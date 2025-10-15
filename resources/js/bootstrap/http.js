import axios from 'axios';
import router from './router.js';
import { trim } from 'lodash';

import {
    throwError,
} from '@/helpers/helpers.js';

/**
 * Helper function to create always the same axios template.
 */
export function createAxios(options = {}) {
    const instance = axios.create();
    instance.defaults.baseURL = options.baseURL || '';
    instance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    instance.defaults.withCredentials = true;
    instance.defaults.withXSRFToken = true;
    
    let xsrfTokenName = "XSRF-TOKEN"
    let appName = import.meta.env.VITE_APP_NAME || '';
    if(appName !== '') {
        const tokenPostFix = appName.toUpperCase().replace(/[^A-Z0-9]/g, '-');
        xsrfTokenName += `-${trim(tokenPostFix, '-')}`;
    }
    xsrfTokenName += "-THESAUREX"; 
    instance.defaults.xsrfCookieName = xsrfTokenName;
    return instance;
}

export const web_http = createAxios();
export const instance = createAxios({ baseURL: 'api/v1' });

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
