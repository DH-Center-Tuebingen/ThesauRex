import { defineStore } from 'pinia';

import {
    fetchLanguages,
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
        },
        addLanguage(data) {
            this.languages.push(data);
        },
        removeLanguage(id) {
            const idx = this.languages.findIndex(l => l.id == id);
            if(idx > -1) {
                this.languages.splice(idx, 1);
            }
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
