import {
    createVNode,
    provide,
    render,
} from 'vue';

import {
    Toast,
} from 'bootstrap';

import {
    getTs,
    only,
} from '@/helpers/helpers.js';

import ToastComponent from '@/components/Toast.vue';

const store = {
    wrapper: null,
};

const defaultConfig = {
    duration: 5000,
    autohide: true,
    channel: 'default',
    icon: false,
    simple: false,
    container: 'toast-container',
    container_classes: 'position-absolute start-0 bottom-0',
    is_tag: true,
    html: false,
};

const perToastConfig = ['duration', 'autohide', 'channel', 'icon', 'simple', 'html'];

export function addToast(message, title, config) {
    const toastId = `toast-${getTs()}`;
    const toastContainer = document.createElement('div');
    const finalConfig = reduceToastConfig({...defaultConfig, ...config});
    render(createVNode(ToastComponent, {
        message: message,
        title: title,
        id: toastId,
        ...finalConfig,
    }), toastContainer);
    store.wrapper.appendChild(toastContainer);
    const toastElem = document.getElementById(toastId);
    toastElem.addEventListener('hidden.bs.toast', e => {
        e.target.parentNode.remove();
    });
    const bsToast = new Toast(toastElem);
    bsToast.show();
}

function initializeWrapper(config) {
    let wrapper;
    if(config.is_tag) {
        const containers = document.getElementsByTagName(config.container);
        if(!containers || containers.length < 1) {
            throw new Error(`Could not find elements with tag ${config.container} in DOM!`);
        }
        wrapper = containers[0];
        const toastContainer = document.createElement('div');
        toastContainer.classList.add(['toast-container']);
        wrapper.appendChild(toastContainer);
    } else {
        wrapper = document.getElementById(config.container);
        if(!wrapper) {
            throw new Error(`Could not find element with ID ${config.container} in DOM!`);
        }
    }
    wrapper.classList.add(...config.container_classes.split(' '));
    store.wrapper = wrapper;
}

function reduceGlobalConfig(config) {
    return only(config, Object.keys(defaultConfig));
}

function reduceToastConfig(config) {
    return only(config, perToastConfig);
}

const createToast = config => ({
    config: config,
    $toast(message, title, config = {}) {
        const reducedLocal = reduceToastConfig(config);
        const combined = reduceToastConfig({...this.config, ...reducedLocal});
        addToast(message, title, combined);
    },
});

const toastSymbol = Symbol();
let toastInstance = null;

export function provideToast(toastConfig = {}) {
    const reducedConfig = reduceGlobalConfig({...defaultConfig, ...toastConfig});
    const toast = createToast(reducedConfig);
    toastInstance = toast;
    provide(toastSymbol, toast);
}

export function useToast() {
    // const toast = inject(toastSymbol);
    const toast = toastInstance;
    if (!toast) throw new Error('No toast provided!');

    if(!store.wrapper) {
        initializeWrapper(toast.config);
    }

    return toast;
}
