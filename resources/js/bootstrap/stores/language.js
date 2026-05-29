import { defineStore } from 'pinia';

import useUserStore from './user.js';

import {
    fetchLanguages,
    addLanguage,
    deleteLanguage,
} from '@/api.js';

const resetState = ctx => {
    ctx.languages = [];
    ctx.activeLanguage = {};
};

export const useLanguageStore = defineStore('language', {
    state: _ => ({
        languages: [],
        activeLanguage: {},
    }),
    actions: {
        async initialize(locale) {
            resetState(this);

            const languages = await fetchLanguages();
            this.setLanguages(languages);
            if(locale?.value) {
                locale.value = useUserStore().getPreferenceByKey('prefs.gui-language') ?? 'en';
            }
        },
        pushLanguage(languageData) {
            this.languages.push(languageData);
        },
        removeLanguage(languageId) {
            const idx = this.languages.findIndex(language => language.id == languageId);
            if(idx > -1) {
                // make sure to switch to another language if removed language
                // is current active language
                if(this.activeLanguage.id == languageId) {
                    const firstAvailableIndex = idx == 0 ? 1 : 0;
                    this.setActiveLanguage(this.languages[firstAvailableIndex]);
                }
                this.languages.splice(idx, 1);
            }
        },
        async addLanguage(languageData) {
            const language = await addLanguage(languageData);
            this.pushLanguage(language);
        },
        async deleteLanguage(languageId) {
            await deleteLanguage(languageId);
            this.removeLanguage(languageId);
        },
        setActiveLanguage(language) {
            this.activeLanguage = language;
        },
        setLanguages(data) {
            this.languages = data;
            this.setActiveLanguage(data[0]);
        },
    },
});

export default useLanguageStore;
