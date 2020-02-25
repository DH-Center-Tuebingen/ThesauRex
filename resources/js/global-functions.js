const {flag, code, name, countries} = require('country-emoji');

// Validators
Vue.prototype.$validateObject = function(value) {
    // concepts is valid if it is either an object
    // or an empty array
    // (empty assoc arrays are simple arrays in php)
    return typeof value == 'object' || (typeof value == 'array' && value.length == 0);
};

// Directives
Vue.directive('can', {
    terminal: true,
    bind: function(el, bindings) {
        const canI = this.Vue.prototype.$can(bindings.value, bindings.modifiers.one);

        if(!canI) {
            this.warning = document.createElement('p');
            this.warning.className = 'alert alert-warning v-can-warning';
            this.warning.innerHTML = 'You do not have permission to access this page';
            for(let i=0; i<el.children.length; i++) {
                let c = el.children[i];
                c.classList.add('v-can-hidden');
            }
            el.appendChild(this.warning);
        }
    },
    unbind: function(el) {
        if(!el.children) return;
        for(let i=0; i<el.children.length; i++) {
            let c = el.children[i];
            // remove our warning elem
            if(c.classList.contains('v-can-warning')) {
                el.removeChild(c);
                continue;
            }
            if(c.classList.contains('v-can-hidden')) {
                c.classList.remove('v-can-hidden');
            }
        }
    }
});

// Prototype
Vue.prototype.$can = function(permissionString, oneOf) {
    oneOf = oneOf || false;
    const user = this.$auth.user();
    if(!user) return false;
    const permissions = permissionString.split('|');
    const hasPermission = function(permission) {
        return user.permissions[permission] === 1;
    };

    if(oneOf) {
        return permissions.some(hasPermission);
    } else {
        return permissions.every(hasPermission);
    }
}

// type can be one of: success, info, warn, error
// duration is in ms
Vue.prototype.$showToast = function(title, text, type = 'info', duration = 2000) {
    this.$notify({
        group: 'thesaurex',
        title: title,
        text: text,
        type: type,
        duration: duration
    });
};


Vue.prototype.$ce = {
    flag: code => {
        if(code == 'en') {
            code = 'gb';
        }
        return flag(code);
    },
    code: code,
    name: name,
    countries: countries
};

Vue.prototype.$throwError = function(error) {
    if(error.response) {
        const r = error.response;
        const req = {
            status: r.status,
            url: r.config.url,
            method: r.config.method.toUpperCase()
        };
        this.$showErrorModal(r.data, r.headers, req);
    } else if(error.request) {
        this.$showErrorModal(error.request);
    } else {
        this.$showErrorModal(error.message || error);
    }
};

Vue.prototype.$getErrorMessages = function(error, msgObject, suffix = '') {
    for(let k in msgObject) {
        delete msgObject[k];
    }
    const r = error.response;
    if(r.status == 422) {
        if(r.data.errors) {
            for(let k in r.data.errors) {
                Vue.set(msgObject, `${k}${suffix}`, r.data.errors[k]);
            }
        }
    } else if(r.status == 400) {
        Vue.set(msgObject, 'global', r.data.error);
    }
}

Vue.prototype.$showErrorModal = function(errorMsg, headers, request) {
    this.$modal.show('error-modal', {msg: errorMsg, headers: headers, request: request});
};

Vue.prototype.$createDownloadLink = function(content, filename, base64 = false, contentType = 'text/plain') {
    var link = document.createElement("a");
    let url;
    if(base64) {
        url = `data:${contentType};base64,${content}`;
    } else {
        url = window.URL.createObjectURL(new Blob([content]));
    }
    link.setAttribute("target", "_blank");
    link.setAttribute("href", url);
    link.setAttribute("type", contentType);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
}

Vue.prototype.$rgb2hex = function(rgb) {
    let colors = rgb.substring(1);
    let r = parseInt(colors.substring(0, 2), 16);
    let g = parseInt(colors.substring(2, 4), 16);
    let b = parseInt(colors.substring(4, 6), 16);
    return [r, g, b];
}

Vue.prototype.$getLabel = function(node, displayForeign = false) {
    if(!node) return 'No Title';
    if(!node.labels || !node.labels.length) return node.concept_url;
    const prefLang = this.$getPreference('prefs.gui-language');
    if(node.labels.length > 1) {
        let sortIndex = l => {
            let idx = 0;
            if(l.language.short_name == prefLang) {
                idx -= 50;
            } else if(l.language.short_name == 'en') {
                idx -= 25;
            }
            if(l.concept_label_type === 1) {
                idx -= 10;
            }
            return idx;
        };
        node.labels.sort((a, b) => {
            return sortIndex(a) - sortIndex(b);
        });
    }
    const bestLabel = node.labels[0];
    let label = bestLabel.label;
    if(displayForeign && bestLabel.language.short_name != prefLang) {
        label += ' ' + Vue.prototype.$ce.flag(bestLabel.language.short_name);
    }
    return label;
}

Vue.prototype.$hasConcept = function(url) {
    if(!url) return false;
    return !!this.$root.$data.concepts[url];
}

Vue.prototype.$getPreference = function(prefKey) {
    const pref = this.$root.$data.preferences[prefKey];
    if(!pref) return {};
    return pref;
}

Vue.prototype.$getValidClass = function(msgObject, field) {
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
