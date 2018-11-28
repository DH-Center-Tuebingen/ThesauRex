// import Multiselect from 'vue-multiselect';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import Axios from 'axios';
import VueRouter from 'vue-router';
import moment from 'moment';

// Components
import Notifications from 'vue-notification';
import VModal from 'vue-js-modal';
import VueUploadComponent from 'vue-upload-component';

import VueI18n from 'vue-i18n';
import en from './i18n/en';
import de from './i18n/de';

// Views
import App from './App.vue';
import MainView from './components/MainView.vue';
import Login from './components/Login.vue';
import ConceptDetail from './components/ConceptDetail.vue';

library.add(fas, far, fab);
dom.watch(); // search for <i> tags to replace with <svg>

/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

const PQueue = require('p-queue');
require('typeface-raleway');
require('typeface-source-code-pro');
require('popper.js');
require('./bootstrap');

window.Vue = require('vue');
window._ = require('lodash');
$ = jQuery  = window.$ = window.jQuery = require('jquery');

require('./global-functions.js');

window.$httpQueue = new PQueue({concurrency: 1});

Axios.defaults.baseURL = 'api/v1';

Vue.prototype.$httpQueue = window.$httpQueue;
Vue.queue = window.$httpQueue;
Vue.prototype.$http = Axios;
Vue.axios = Axios;
Vue.use(VueRouter);
Vue.use(VueI18n);
Vue.use(Notifications);
Vue.use(VModal, {dynamic: true});

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

Vue.use(require('@websanova/vue-auth'), {
   auth: require('@websanova/vue-auth/drivers/auth/bearer.js'),
   http: require('./queued-axios-1.x-driver.js'),
   router: require('@websanova/vue-auth/drivers/router/vue-router.2.x.js'),
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

// Pages
Vue.component('error-modal', require('./components/ErrorModal.vue'));
Vue.component('about-dialog', require('./components/About.vue'));

// Components
Vue.component('concept-tree', require('./components/ConceptTree.vue'));
Vue.component('concept-search', require('./components/ConceptSearch.vue'));
Vue.component('file-upload', VueUploadComponent);

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
                app.$auth.ready(_ => {
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
