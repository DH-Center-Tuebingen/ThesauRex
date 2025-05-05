import { defineStore } from 'pinia';

import useConceptStore from './concept.js';
import useLanguageStore from './language.js';
import useUserStore from './user.js';

import {
    fetchPreData,
    fetchUser,
    fetchUsers,
    fetchVersion,
    patchPreferences,
} from '@/api.js';

import {
    slugify,
} from '@/helpers/helpers.js';

const resetState = ctx => {
    ctx.appInitialized = false;
    ctx.preferences = {};
    ctx.version = {};
};

export const useSystemStore = defineStore('system', {
    state: _ => ({
        appInitialized: false,
        preferences: {},
        version: {},
        standalone: true,
    }),
    getters: {
        getPreference: state => key => {
            return useUserStore().getPreferenceByKey(key);
        },
        hasPreference: state => (key, property) => {
            const preference = this.getPreference(key);
            if(preference) {
                return preference[property] || preference;
            }
            return false;
        },
        getProjectName: state => slug => {
            const projectName = this.getPreference('prefs.project-name');
            return slug ? slugify(projectName) : projectName;
        },
    },
    actions: {
        setAppState(state) {
            this.appInitialized = state;
        },
        async initialize(locale) {
            resetState(this);

            const userStore = useUserStore();
            const conceptStore = useConceptStore();

            const userData = await fetchUser();

            const loginSuccessful = userData.status == 'success';
            userStore.setLoginState(loginSuccessful);
            userStore.setActiveUser(loginSuccessful ? userData.data : {});

            const preData = await fetchPreData();
            this.standalone = preData.standalone;
            this.preferences = preData.system_preferences;
            userStore.setPreferences(preData.preferences);

            const usersData = await fetchUsers();
            userStore.setUsers(usersData.user.users, usersData.user.deleted_users);
            userStore.setRoles(usersData.role.roles, usersData.role.permissions, usersData.role.presets);

            conceptStore.initialize();

            await useLanguageStore().initialize(locale);

            const versionData = await fetchVersion();
            this.version = versionData;

            this.appInitialized = true;
        },
        async patchPreferences(changedPreferences, uid) {
            return await patchPreferences(changedPreferences, uid);
        },
    },
});

export default useSystemStore;
