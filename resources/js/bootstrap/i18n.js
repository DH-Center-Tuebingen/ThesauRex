import { createI18n } from 'vue-i18n';
import * as en from '@/i18n/en.json';
import * as de from '@/i18n/de.json';

const messages = {
    en: en,
    de: de,
}
const i18n = createI18n({
    legacy: false,
    locale: navigator.language,
    fallbackLocale: 'en',
    messages: messages
});

export function useI18n() {
    return i18n;
}

export function getSupportedLanguages() {
    return Object.keys(messages);
}

export default i18n;
