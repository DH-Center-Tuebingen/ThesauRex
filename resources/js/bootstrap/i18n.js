import { createI18n } from 'vue-i18n';
import * as en from '@/i18n/en.json';
import * as de from '@/i18n/de.json';

const messages = {
    en: en,
    de: de,
}

let defaultLocale = 'en'
const navigatorLanguage = navigator.language.split("-")[0]
if(navigatorLanguage in messages) {
    defaultLocale = navigatorLanguage
}

const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages: messages
});

window.i18n = i18n.global;

export function useI18n() {
    return i18n;
}

export function getSupportedLanguages() {
    return Object.keys(messages);
}

export default i18n;
