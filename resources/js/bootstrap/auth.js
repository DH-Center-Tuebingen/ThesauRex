import { createAuth } from '@websanova/vue-auth';
import driverAuthBearer from '@websanova/vue-auth/dist/drivers/auth/bearer.esm.js';
import driverHttpAxios from '@websanova/vue-auth/dist/drivers/http/axios.1.x.esm.js';
import driverRouterVueRouter from '@websanova/vue-auth/dist/drivers/router/vue-router.2.x.esm.js';

import axios from '@/bootstrap/http.js';
import router from '@/bootstrap/router.js';

export const vueAuth = createAuth({
    plugins: {
        http: axios,
        router: router,
    },
    drivers: {
        http: driverHttpAxios,
        auth: driverAuthBearer,
        router: driverRouterVueRouter,
    },
    options: {
        forbiddenRedirect: {
            name: 'home'
        },
        notFoundRedirect: {
            name: 'home'
        },
    }
});

export function useAuth() {
    return vueAuth;
}

export default vueAuth;
