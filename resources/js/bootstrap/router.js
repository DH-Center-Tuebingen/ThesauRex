import {
    createRouter,
    createWebHashHistory,
} from 'vue-router';

import {
    isStandalone,
} from '@/helpers/helpers.js';

// Stores
import { useUserStore } from '@/bootstrap/stores/user.js';

// Pages
import Login from '@/components/Login.vue';
import MainView from '@/components/MainView.vue';
import ConceptDetail from '@/components/ConceptDetail.vue';

// Layouts
import PaddedLayout from '@/components/layouts/PaddedLayout.vue';

// Settings
import Users from '@/components/Users.vue';
import Roles from '@/components/Roles.vue';
import Languages from '@/components/Languages.vue';
import Preferences from '@/components/Preferences.vue';
import UserPreferences from '@/components/UserPreferences.vue';
import UserProfile from '@/components/UserProfile.vue';

export const router = createRouter({
    history: createWebHashHistory(),
    scrollBehavior(to, from, savedPosition) {
        return {
            x: 0,
            y: 0
        };
    },
    routes: [
        {
            path: '/',
            name: 'home',
            component: MainView,
            children: [
                // When visiting /c, the router won't use MainView as route, 
                // but when using c/:id? it will use MainView as parent component.
                // but will render the concept detail without a selected concept.
                // therefore we redirect /c to /. 
                {
                    path: '/c',
                    redirect: '/'
                },
                {
                    path: 'c/:id',
                    name: 'conceptdetail',
                    component: ConceptDetail,
                    children: [],
                },
            ],
            meta: {
                auth: true,
            },
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: {
                auth: false,
            },
        },
        // Settings
        {
            path: '/mg/users',
            name: 'users',
            component: PaddedLayout,
            props: {
                component: Users,
            },
            beforeEnter: (to, from) => {
                return isStandalone;
            },
            meta: {
                auth: true,
            },
        },
        {
            path: '/mg/roles',
            name: 'roles',
            component: PaddedLayout,
            props: {
                component: Roles,
            },
            beforeEnter: (to, from) => {
                return isStandalone;
            },
            meta: {
                auth: true,
            },
        },
        {
            path: '/mg/language',
            name: 'languages',
            component: PaddedLayout,
            props: {
                component: Languages,
            },
            meta: {
                auth: true,
            },
        },
        {
            path: '/preferences',
            name: 'preferences',
            component: PaddedLayout,
            props: {
                component: Preferences,
            },
            meta: {
                auth: true,
            },
        },
        {
            path: '/preferences/u/:id',
            name: 'userpreferences',
            component: PaddedLayout,
            props: {
                component: UserPreferences,
            },
            meta: {
                auth: true,
            },
        },
        {
            path: '/profile',
            name: 'userprofile',
            component: PaddedLayout,
            props: {
                component: UserProfile,
            },
            meta: {
                auth: true,
            },
        },
    ],
});

export function useRouter() {
    return router;
}

router.beforeEach((to, from) => {
    const requiresAuth = to.matched.some(record => record.meta.auth);
    const isLoggedIn = useUserStore().loggedIn;
    
    if(requiresAuth && !isLoggedIn) {
        // User is not logged in but trying to access a restricted page
        toLogin();
    } else if(isLoggedIn && to.name === 'login') {
        // User is logged in but trying to access the login page
        return false;
    } 
});

export function toLogin() {
    const isLogin = router.currentRoute.value.name === 'login';
    // Only append redirect query if from another route than login
    // to prevent recursivly appending current route's full path
    // on reloading login page
    const redirectPath = isLogin ? '' : router.currentRoute.value.fullPath;

    router.push({
        name: 'login',
        query: redirectPath,
    });
}

export function toApp() {
    if(router.currentRoute.value.query.redirectTo) {
        router.push(route.query.redirectTo);
    } else {
        router.push({
            name: 'home',
        });
    }
}

export default router;
