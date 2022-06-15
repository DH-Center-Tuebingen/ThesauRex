import { createApp } from 'vue';

// Third-Party Libs
import PQueue from 'p-queue';

// Helpers/Filter

// Reusable Components
import ConceptTree from './components/tree/Concept.vue';
import UserAvatar from './components/UserAvatar.vue';
import Alert from './components/Alert.vue';

// TODO Start
// Views
// import ImportingInfoModal from './components/modals/ImportingInfoModal.vue';
// // Sites
// import Discard from './components/modals/system/Discard.vue';
// TODO End

// Init Libs
// PQueue, httpQueue
const queue = new PQueue({concurrency: 1});
window.$httpQueue = queue;

// Third-Party Components
import Multiselect from '@vueform/multiselect';
import VueUploadComponent from 'vue-upload-component';
import draggable from 'vuedraggable';
import { Tree, Node, } from "tree-vue-component";
import TreeView from "@grapoza/vue-tree"
import VueFinalModal from 'vue-final-modal';

// Init required libs
import {
  can,
} from '@/helpers/helpers.js';
// Vuex
import store from '@/bootstrap/store.js';
// Vue-Router
import router from '@/bootstrap/router.js';
// Axios
import '@/bootstrap/http.js';
// Vue-Auth
import vueAuth from '@/bootstrap/auth.js';
// vue-i18n
import i18n from '@/bootstrap/i18n.js';
// Font Awesome
import '@/bootstrap/font.js';

// Components
import App from './App.vue';

const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(store);
app.use(vueAuth);
app.use(VueFinalModal());

// Directives
app.directive('dcan', {
    terminal: true,
    beforeMount(el, bindings) {
        const canI = can(bindings.value, bindings.modifiers.one);

        if(!canI) {
            const warningElem = document.createElement('p');
            warningElem.className = 'alert alert-warning v-can-warning';
            warningElem.innerHTML = i18n.global.t('global.page_access_denied');
            for(let i=0; i<el.children.length; i++) {
                let c = el.children[i];
                c.classList.add('v-can-hidden');
            }
            el.appendChild(warningElem);
        }
    },
    unmounted(el) {
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

// Components
app.component('concept-tree', ConceptTree);
app.component('user-avatar', UserAvatar);
app.component('alert', Alert);
// Third-Party components
app.component('multiselect', Multiselect);
app.component('file-upload', VueUploadComponent);
app.component('draggable', draggable);
app.component('node', Node);
app.component('tree', Tree);
app.component('tree-view', TreeView);

// Mount Vue
app.mount('#app');
