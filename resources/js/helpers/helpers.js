import auth from '@/bootstrap/auth.js';
import store from '@/bootstrap/store.js';
import router from '@/bootstrap/router.js';

import {
    flag,
    countries,
} from 'country-emoji';

import {
    fetchPreData,
    fetchTreeData,
    fetchUsers,
    fetchLanguages,
    fetchVersion,
} from '@/api.js';

import {
    showError,
} from '@/helpers/modal.js';

export const cloneDeep = import('lodash/cloneDeep');
export const debounce = import('lodash/debounce');
export const throttle = import('lodash/throttle');
export const orderBy = import('lodash/orderBy');

export const _cloneDeep = cloneDeep
export const _debounce = debounce
export const _throttle = throttle
export const _orderBy = orderBy

export const multiselectResetClasslist = { clear: 'multiselect-clear multiselect-clear-reset' };

export async function initApp(locale) {
    store.dispatch('setAppState', false);
    await fetchPreData(locale);
    await fetchTreeData();
    await fetchUsers();
    await fetchLanguages();
    determineActiveLanguage();
    await fetchVersion();
    store.dispatch('setAppState', true);
    return new Promise(r => r(null));
}

function determineActiveLanguage() {
    const storedLanguageCode = localStorage.getItem('thesaurex-user-lang') ?? 'en';
    let activeLanguage = store.getters.languages.find(l => l.short_name == storedLanguageCode)
    if(!activeLanguage) {
        activeLanguage = store.getters.languages[0];
    }
    if(activeLanguage) {
        store.dispatch('setActiveLanguage', activeLanguage);
    }
}

export function can(permissionString, oneOf) {
    oneOf = oneOf || false;
    const user = store.getters.user;
    if(!user) return false;
    const permissions = permissionString.split('|');
    const hasPermission = permission => {
        return user.permissions[permission] === 1;
    };

    if(oneOf) {
        return permissions.some(hasPermission);
    } else {
        return permissions.every(hasPermission);
    }
}

export function getErrorMessages(error, suffix = '') {
    let msgObject = {};
    const r = error.response;
    if(r.status == 422) {
        if(r.data.errors) {
            for(let k in r.data.errors) {
                msgObject[`${k}${suffix}`] = r.data.errors[k];
            }
        }
    } else if(r.status == 400) {
        msgObject.global = r.data.error;
    }
    return msgObject;
}

export function getTs() {
    const d = new Date();
    return d.getTime();
}

export function hasPreference(prefKey, prop) {
    const ps = store.getters.preferenceByKey(prefKey);
    if(ps) {
        return ps[prop] || ps;
    }
}

export function getPreference(prefKey) {
    return store.getters.preferenceByKey(prefKey);
}

export function getProjectName(slug = false) {
    const name = getPreference('prefs.project-name');
    return slug ? slugify(name) : name;
}

export function slugify(s, delimiter = '-') {
    var char_map = {
        // Latin
        'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE', 'Ç': 'C',
        'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
        'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Å': 'O',
        'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Å°': 'U', 'Ý': 'Y', 'Þ': 'TH',
        'ß': 'ss',
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'Å': 'o',
        'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'Å±': 'u', 'ý': 'y', 'þ': 'th',
        'ÿ': 'y',

        // Latin symbols
        '©': '(c)',

        // Greek
        'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': '8',
        'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': '3', 'Ο': 'O', 'Π': 'P',
        'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'X', 'Ψ': 'PS', 'Ω': 'W',
        'Î': 'A', 'Î': 'E', 'Î': 'I', 'Î': 'O', 'Î': 'Y', 'Î': 'H', 'Î': 'W', 'Îª': 'I',
        'Î«': 'Y',
        'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': '8',
        'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': '3', 'ο': 'o', 'π': 'p',
        'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'x', 'ψ': 'ps', 'ω': 'w',
        'Î¬': 'a', 'Î­': 'e', 'Î¯': 'i', 'Ï': 'o', 'Ï': 'y', 'Î®': 'h', 'Ï': 'w', 'ς': 's',
        'Ï': 'i', 'Î°': 'y', 'Ï': 'y', 'Î': 'i',

        // Turkish
        'Å': 'S', 'Ä°': 'I', /* 'Ç': 'C', 'Ü': 'U', 'Ö': 'O' ,*/ 'Ä': 'G',
        'Å': 's', 'Ä±': 'i', /* 'ç': 'c', 'ü': 'u', 'ö': 'o', */ 'Ä': 'g',

        // Russian
        'Ð': 'A', 'Ð': 'B', 'Ð': 'V', 'Ð': 'G', 'Ð': 'D', 'Ð': 'E', 'Ð': 'Yo', 'Ð': 'Zh',
        'Ð': 'Z', 'Ð': 'I', 'Ð': 'J', 'Ð': 'K', 'Ð': 'L', 'Ð': 'M', 'Ð': 'N', 'Ð': 'O',
        'Ð': 'P', 'Ð ': 'R', 'Ð¡': 'S', 'Ð¢': 'T', 'Ð£': 'U', 'Ð¤': 'F', 'Ð¥': 'H', 'Ð¦': 'C',
        'Ð§': 'Ch', 'Ð¨': 'Sh', 'Ð©': 'Sh', 'Ðª': '', 'Ð«': 'Y', 'Ð¬': '', 'Ð­': 'E', 'Ð®': 'Yu',
        'Ð¯': 'Ya',
        'Ð°': 'a', 'Ð±': 'b', 'Ð²': 'v', 'Ð³': 'g', 'Ð´': 'd', 'Ðµ': 'e', 'Ñ': 'yo', 'Ð¶': 'zh',
        'Ð·': 'z', 'Ð¸': 'i', 'Ð¹': 'j', 'Ðº': 'k', 'Ð»': 'l', 'Ð¼': 'm', 'Ð½': 'n', 'Ð¾': 'o',
        'Ð¿': 'p', 'Ñ': 'r', 'Ñ': 's', 'Ñ': 't', 'Ñ': 'u', 'Ñ': 'f', 'Ñ': 'h', 'Ñ': 'c',
        'Ñ': 'ch', 'Ñ': 'sh', 'Ñ': 'sh', 'Ñ': '', 'Ñ': 'y', 'Ñ': '', 'Ñ': 'e', 'Ñ': 'yu',
        'Ñ': 'ya',

        // Ukrainian
        'Ð': 'Ye', 'Ð': 'I', 'Ð': 'Yi', 'Ò': 'G',
        'Ñ': 'ye', 'Ñ': 'i', 'Ñ': 'yi', 'Ò': 'g',

        // Czech
        'Ä': 'C', 'Ä': 'D', 'Ä': 'E', 'Å': 'N', 'Å': 'R', 'Š': 'S', 'Å¤': 'T', 'Å®': 'U',
        'Å½': 'Z',
        'Ä': 'c', 'Ä': 'd', 'Ä': 'e', 'Å': 'n', 'Å': 'r', 'š': 's', 'Å¥': 't', 'Å¯': 'u',
        'Å¾': 'z',

        // Polish
        'Ä': 'A', 'Ä': 'C', 'Ä': 'e', 'Å': 'L', 'Å': 'N', /* 'Ó': 'o', */ 'Å': 'S', 'Å¹': 'Z',
        'Å»': 'Z',
        'Ä': 'a', 'Ä': 'c', 'Ä': 'e', 'Å': 'l', 'Å': 'n', /* 'ó': 'o', */ 'Å': 's', 'Åº': 'z',
        'Å¼': 'z',

        // Latvian
        'Ä': 'A', /* 'Ä': 'C', */ 'Ä': 'E', 'Ä¢': 'G', 'Äª': 'i', 'Ä¶': 'k', 'Ä»': 'L', 'Å': 'N',
        /* 'Š': 'S', */ 'Åª': 'u', /* 'Å½': 'Z', */
        'Ä': 'a', /* 'Ä': 'c', */ 'Ä': 'e', 'Ä£': 'g', 'Ä«': 'i', 'Ä·': 'k', 'Ä¼': 'l', 'Å': 'n',
        /* 'š': 's', */ 'Å«': 'u'/* , 'Å¾': 'z' */
    };

    // Transliterate characters to ASCII
    for(var k in char_map) {
        s = s.replace(RegExp(k, 'g'), char_map[k]);
    }

    // Replace non-alphanumeric characters with our delimiter
    var alnum = RegExp('[^a-z0-9]+', 'ig');
    s = s.replace(alnum, delimiter);

    // Remove duplicate delimiters
    s = s.replace(RegExp('[' + delimiter + ']{2,}', 'g'), delimiter);

    // Remove delimiter from ends
    s = s.replace(RegExp('(^' + delimiter + '|' + delimiter + '$)', 'g'), '');

    return s.toLowerCase();
}

export function createDownloadLink(content, filename, base64 = false, contentType = 'text/plain') {
    var link = document.createElement('a');
    let url;
    if(base64) {
        url = `data:${contentType};base64,${content}`;
    } else {
        url = window.URL.createObjectURL(new Blob([content]));
    }
    link.setAttribute('href', url);
    link.setAttribute('type', contentType);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
}

export function isLoggedIn() {
    return auth.check();
}

export function getUser() {
    return isLoggedIn() ? auth.user() : {};
}

export function userId() {
    return getUser().id || -1;
}

export function getUsers() {
    const fallback = [];
    if(isLoggedIn()) {
        return store.getters.users || fallback;
    } else {
        return fallback;
    }
}

export function getRoles(withPermissions = false) {
    const fallback = [];
    if(isLoggedIn()) {
        return store.getters.roles(!withPermissions) || fallback;
    } else {
        return fallback;
    }
}

export function getUserBy(value, attr = 'id') {
    if(isLoggedIn()) {
        const isNum = !isNaN(value);
        const lValue = isNum ? value : value.toLowerCase();
        if(attr == 'id' && value == userId()) {
            return getUser();
        } else {
            return getUsers().find(u => isNum ? (u[attr] == lValue) : (u[attr].toLowerCase() == lValue));
        }
    } else {
        return null;
    }
}

export function getRoleBy(value, attr = 'id', withPermissions = false) {
    if(isLoggedIn()) {
        const isNum = !isNaN(value);
        const lValue = isNum ? value : value.toLowerCase();
        return getRoles(withPermissions).find(r => isNum ? (r[attr] == lValue) : (r[attr].toLowerCase() == lValue));
    } else {
        return null;
    }
}

export function isStandalone() {
    return store.getters.isStandalone;
}

export function throwError(error) {
    if(error.response) {
        const r = error.response;
        const req = {
            status: r.status,
            url: r.config.url,
            method: r.config.method.toUpperCase()
        };
        showErrorModal(r.data, r.headers, req);
    } else if(error.request) {
        showErrorModal(error.request);
    } else {
        showErrorModal(error.message || error);
    }
}

export function showErrorModal(errorMsg, headers, request) {
    showError({
        msg: errorMsg,
        headers: headers,
        request: request,
    });
}

export function only(object, allows = []) {
    return Object.keys(object)
        .filter(key => allows.includes(key))
        .reduce((obj, key) => {
            return {
                ...obj,
                [key]: object[key]
            };
        }, {});
}

export function except(object, excepts = []) {
    return Object.keys(object)
        .filter(key => !excepts.includes(key))
        .reduce((obj, key) => {
            return {
                ...obj,
                [key]: object[key]
            };
        }, {});
}

export function isArray(arr) {
    return Array.isArray(arr);
}

export function firstOrPlain(value) {
    return isArray(value) ? value[0] : value;
}

export function getValidClass(msgObject, field) {
    // TODO remove if
    if(!msgObject) return;

    let isInvalid = false;
    field.split('|').forEach(f => {
        if(!!msgObject[f]) {
            isInvalid = true;
        }
    });

    return {
        // 'is-valid': !msgObject[field],
        'is-invalid': isInvalid
    };
}

export function getClassByValidation(errorList) {
    return {
        // 'is-valid': !msgObject[field],
        'is-invalid': !!errorList && errorList.length > 0,
    };
}

export function emojiFlag(code) {
    if(code == 'en') {
        code = 'gb';
    }
    return flag(code)
}

export function getLanguage(id) {
    return store.getters.languages.find(l => l.id == id);
}

export function languageList() {
    const list = [];
    for(let k in countries) {
        list.push({
            id: list.length + 1,
            code: k.toLowerCase(),
            label: firstOrPlain(countries[k]),
        });
    }
    return list;
}

export function gotoConcept(id, tree = null) {
    const query = tree ? { ...router.currentRoute.value.query, t: tree } : router.currentRoute.value.query;
    router.push({
        name: 'conceptdetail',
        params: {
            id: id
        },
        query: query,
    });
}
