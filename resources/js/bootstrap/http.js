import axios from 'axios';
import router from './router.js';

import {
    throwError,
} from '@/helpers/helpers.js';

const instance = axios.create();

instance.defaults.baseURL = 'api/v1';
instance.defaults.withCredentials = true;
instance.interceptors.response.use(response => {
    return response;
}, error => {
    const code = error.response.status;
    switch(code) {
        case 401:
            // Only append redirect query if from another route than login
            // to prevent recursivly appending current route's full path
            // on reloading login page
            if(router.currentRoute.name != 'login' && !!router.currentRoute.value.redirectedFrom) {
                const redirectPath = router.currentRoute.value.redirectedFrom.fullPath;
                router.push({
                    name: 'login',
                    query: {
                        ...router.currentRoute.value.query,
                        redirect: redirectPath,
                    },
                });
            }
            break;
        case 400:
        case 422:
            // don't do anything. Handle these types at caller
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
