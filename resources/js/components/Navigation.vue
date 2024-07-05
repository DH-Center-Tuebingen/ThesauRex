<template>
    <nav class="navbar navbar-expand-lg overlay-all">
        <div class="container-fluid">
            <!-- Branding Image -->
            <router-link :to="{ name: 'home' }" class="navbar-brand">
                <img src="favicon.png" class="logo me-3 bb-1" alt="spacialist logo" />
                <span>
                    {{ getPreference('prefs.project-name') }}
                </span>
            </router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <!-- Left Side Of Navbar -->
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                    </li>
                </ul>

                <!-- Right Side Of Navbar -->
                <ul class="nav navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" target="_blank"
                            href="https://github.com/DH-Center-Tuebingen/Spacialist/wiki/User-manual">
                            <i class="far fa-fw fa-question-circle"></i>
                        </a>
                    </li>
                    <!-- Authentication Links -->
                    <li class="nav-item" v-if="!state.loggedIn">
                        <router-link :to="{ name: 'login' }" class="nav-link">
                            {{ t('global.login') }}
                        </router-link>
                    </li>
                    <li class="nav-item" v-if="hasPreference('prefs.link-to-spacialist')">
                        <a :href="getPreference('prefs.link-to-spacialist')" class="nav-link" target="_blank">
                            {{ t('global.spacialist') }}
                            <sup>
                                <i class="fas fa-fw fa-sm fa-fw fa-external-link-alt"></i>
                            </sup>
                        </a>
                    </li>
                    <li class="nav-item dropdown" v-if="state.loggedIn">
                        <a href="#" class="nav-link dropdown-toggle" id="settings-dropdown" data-bs-toggle="dropdown"
                            role="button" aria-expanded="false" aria-haspopup="true">
                            <i class="fas fa-fw fa-sliders-h"></i>
                            {{ t('global.settings.title') }}
                        </a>
                        <div class="dropdown-menu" aria-labelledby="settings-dropdown">
                            <router-link :to="{ name: 'users' }" class="dropdown-item" v-if="state.isStandalone">
                                <i class="fas fa-fw fa-users"></i>
                                {{ t('global.settings.users') }}
                            </router-link>
                            <router-link :to="{ name: 'roles' }" class="dropdown-item" v-if="state.isStandalone">
                                <i class="fas fa-fw fa-shield-alt"></i>
                                {{ t('global.settings.roles') }}
                            </router-link>
                            <router-link :to="{ name: 'languages' }" class="dropdown-item">
                                <i class="fas fa-fw fa-language"></i>
                                {{ t('global.settings.languages') }}
                            </router-link>
                            <router-link :to="{ name: 'preferences' }" class="dropdown-item">
                                <i class="fas fa-fw fa-cog"></i>
                                {{ t('global.settings.system') }}
                            </router-link>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#" @click="showAboutModal">
                                <i class="fas fa-fw fa-info-circle"></i>
                                {{ t('global.settings.about') }}
                            </a>
                        </div>
                    </li>
                    <li class="nav-item dropdown" v-if="state.loggedIn">
                        <a href="#" class="nav-link dropdown-toggle" id="user-dropdown" data-bs-toggle="dropdown"
                            role="button" aria-expanded="false" aria-haspopup="true">
                            <user-avatar :user="state.authUser" :size="20" class="align-middle"></user-avatar>
                            {{ state.authUser.name }}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="user-dropdown">
                            <router-link :to="{ name: 'userprofile' }" class="dropdown-item" v-if="state.isStandalone">
                                <i class="fas fa-fw fa-id-badge"></i>
                                {{ t('global.user.profile') }}
                            </router-link>
                            <router-link :to="{ name: 'userpreferences', params: { id: state.authUser.id } }"
                                class="dropdown-item" v-if="state.authUser.id">
                                <i class="fas fa-fw fa-user-cog"></i>
                                {{ t('global.user.settings') }}
                            </router-link>
                            <a class="dropdown-item" href="#" @click="logout">
                                <i class="fas fa-fw fa-sign-out-alt"></i>
                                {{ t('global.user.logout') }}
                            </a>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script>

import {
    reactive,
    computed,
    watch,
} from 'vue';


import {
    router,
} from '@/bootstrap/router.js';

import {
    getPreference,
    hasPreference,
} from '@/helpers/helpers.js';

import auth from '@/bootstrap/auth.js';

import {
    showAbout,
} from '@/helpers/modal.js';

import {
    searchParamsToObject
} from '@/helpers/routing.js';

import { useI18n } from 'vue-i18n';
import store from '../bootstrap/store';

export default {
    setup() {

        const { t, locale } = useI18n();

        // FUNCTIONS
        const logout = _ => {
            auth.logout({
                makeRequest: true,
                redirect: '/login'
            });
        };
        const showAboutModal = _ => {
            showAbout();
        };

        const state = reactive({
            auth: auth,
            appName: computed(_ => getProjectName()),
            init: computed(_ => store.getters.appInitialized),
            loggedIn: computed(_ => store.getters.isLoggedIn),
            authUser: computed(_ => store.getters.user),
            isStandalone: computed(_ => store.getters.isStandalone),
        });

        // WATCHER
        watch(_ => state.loggedIn, (newValue, oldValue) => {
            if (newValue && !oldValue) {
                const route = router.currentRoute.value;
                if (route.query.redirect) {
                    // get path without potential query params
                    const path = route.query.redirect.split('?')[0];
                    // extract query params to explicitly set in new route
                    const query = searchParamsToObject(route.query.redirect);
                    router.push({
                        path: path,
                        query: query,
                    });
                }
            }
        });
        watch(state.auth, () => {
            store.commit('setUser', state.auth.user());
        })

        return {
            t,
            store,
            state,
            getPreference,
            hasPreference,
            logout,
            showAboutModal,
        }
    },
};
</script>
