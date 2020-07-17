import Multiselect from 'vue-multiselect';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import Axios from 'axios';
import VueRouter from 'vue-router';
import moment from 'moment';
import auth from '@websanova/vue-auth';
import authBearer from '@websanova/vue-auth/drivers/auth/bearer.js';
import authHttp from './queued-axios-1.x-driver.js';
import authRouter  from '@websanova/vue-auth/drivers/router/vue-router.2.x.js';

// Components
import VeeValidate from 'vee-validate';
import Notifications from 'vue-notification';
import VModal from 'vue-js-modal';
import VueUploadComponent from 'vue-upload-component';

import ConceptTree from './components/ConceptTree.vue';
import ConceptSearch from './components/ConceptSearch.vue';

import VueI18n from 'vue-i18n';
import en from './i18n/en';
import de from './i18n/de';

// Views
import App from './App.vue';
import MainView from './components/MainView.vue';
import Login from './components/Login.vue';
import ConceptDetail from './components/ConceptDetail.vue';
import ErrorModal from './components/ErrorModal.vue';
import ImportingInfoModal from './components/modals/ImportingInfoModal.vue';
import AboutDialog from './components/About.vue';
// Settings
import Users from './components/Users.vue';
import Roles from './components/Roles.vue';
import Languages from './components/Languages.vue';
import Preferences from './components/Preferences.vue';
import UserPreferences from './components/UserPreferences.vue';
// Sites
import DiscardChangesModal from './components/DiscardChangesModal.vue';

library.add(fas, far, fab);
dom.watch(); // search for <i> tags to replace with <svg>

/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

const {default: PQueue} = require('p-queue');
let VueScrollTo = require('vue-scrollto');
require('typeface-raleway');
require('typeface-source-code-pro');
require('popper.js');
require('./bootstrap');

window.Vue = require('vue');
window._debounce = require('lodash/debounce');
$ = jQuery  = window.$ = window.jQuery = require('jquery');

require('./global-functions.js');

window.$httpQueue = new PQueue({concurrency: 1});

Axios.defaults.baseURL = 'api/v1';

Vue.prototype.$httpQueue = window.$httpQueue;
Vue.prototype.$VueScrollTo = VueScrollTo;
Vue.queue = window.$httpQueue;
Vue.prototype.$http = Axios;
Vue.axios = Axios;
Vue.use(VueRouter);
Vue.use(VueI18n);
Vue.use(VeeValidate);
Vue.use(Notifications);
Vue.use(VModal, {
    dynamic: true,
});
Vue.use(VueScrollTo);

const router = new VueRouter({
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
                {
                    path: 'c/:id',
                    name: 'conceptdetail',
                    component: ConceptDetail,
                    children: []
                }
            ],
            meta: {
                auth: true
            }
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: {
                auth: false
            }
        },
        // Settings
        {
            path: '/mg/users',
            name: 'users',
            component: Users,
            meta: {
                auth: true
            }
        },
        {
            path: '/mg/roles',
            name: 'roles',
            component: Roles,
            meta: {
                auth: true
            }
        },
        {
            path: '/mg/lang',
            name: 'languages',
            component: Languages,
            meta: {
                auth: true
            }
        },
        {
            path: '/preferences',
            name: 'preferences',
            component: Preferences,
            meta: {
                auth: true
            }
        },
        {
            path: '/preferences/u/:id',
            name: 'userpreferences',
            component: UserPreferences,
            meta: {
                auth: true
            }
        },
    ]
});

Vue.router = router;
App.router = Vue.router;

// Interceptors
Axios.interceptors.response.use(response => {
    return response;
}, error => {
    if(error.response.status == 401) {
        let redirectQuery = {};
        // Only append redirect query if from another route than login
        // to prevent recursivly appending current route's full path
        // on reloading login page
        if(Vue.router.currentRoute.name != 'login') {
            redirectQuery.redirect = Vue.router.currentRoute.fullPath;
        }
        Vue.auth.logout({
            redirect: {
                name: 'login',
                query: redirectQuery
            }
        });
    } else {
        Vue.prototype.$throwError(error);
    }
    return Promise.reject(error);
});

const messages = {
    en: en,
    de: de
};

const i18n = new VueI18n({
    locale: navigator.language,
    fallbackLocale: 'en',
    messages
});
Vue.i18n = i18n;

/**
 * The following block of code may be used to automatically register your
 * Vue components. It will recursively scan this directory for the Vue
 * components and automatically register them with their "basename".
 *
 * Eg. ./components/ExampleComponent.vue -> <example-component></example-component>
 */

Vue.use(auth, {
   auth: authBearer,
   http: authHttp,
   router: authRouter,
   forbiddenRedirect: {
       name: 'home'
   },
   notFoundRedirect: {
       name: 'home'
   },
});

// const files = require.context('./', true, /\.vue$/i)
// files.keys().map(key => Vue.component(key.split('/').pop().split('.')[0], files(key)))

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

// Imported Components
Vue.component('multiselect', Multiselect);
// Pages
Vue.component('importing-info-modal', ImportingInfoModal);
Vue.component('error-modal', ErrorModal);
Vue.component('about-dialog', AboutDialog);

// Components
Vue.component('concept-tree', ConceptTree);
Vue.component('concept-search', ConceptSearch);
Vue.component('file-upload', VueUploadComponent);

Vue.component('discard-changes-modal', DiscardChangesModal);

// Filters
Vue.filter('date', function(value, format = 'DD.MM.YYYY HH:mm', useLocale = false) {
    if(value) {
        let mom = moment.unix(Number(value));
        if(!useLocale) {
            mom = mom.utc();
        }
        return mom.format(format);
    }
});
Vue.filter('datestring', function(value, useLocale = true) {
    if(value) {
        let mom = moment.unix(Number(value));
        if(useLocale) {
            return mom.toLocaleString();
        }
        return mom.utc().toString();
    }
});

const app = new Vue({
    el: '#app',
    i18n: i18n,
    router: router,
    render: h => {
        return h(App, {
            props: {
                onInit: _ => {
                    app.init();
                }
            }
        })
    },
    beforeMount: function() {
        this.init();
    },
    methods: {
        init() {
            Vue.prototype.$httpQueue.add(() =>
            Axios.get('pre').then(response =>  {
                this.preferences = response.data.preferences;
                app.$auth.load().then(_ => {
                    // Check if user is logged in and set preferred language
                    // instead of browser default
                    if(app.$auth.check()) {
                        Vue.i18n.locale = this.preferences['prefs.gui-language'];
                    }
                });
            }));
        }
    },
    data() {
        return {
            preferences: {},
            onInit: null
        }
    }
});
