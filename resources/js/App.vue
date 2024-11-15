<template>
    <div class="d-flex flex-column h-100">
        <Navigation />
        <div class="container-fluid my-3 col">
            <template v-if="state.init">
                <router-view></router-view>
            </template>
            <template v-else>
                <div class="h-100 d-flex flex-column justify-content-center align-items-center">
                    <LoadingSpinner />
                </div>
            </template>
        </div>
        <importing-info-modal></importing-info-modal>
        <ModalsContainer />
        <div
            class="toast-container ps-3 pb-3"
            id="toast-container"
        >
        </div>
        <ContextMenu v-if="store.getters['contextMenu/active']" />
    </div>
</template>

<script>
    import {
        reactive,
        computed,
        onMounted,
    } from 'vue';

    import store from '@/bootstrap/store.js';
    import { useI18n } from 'vue-i18n';
    import { provideToast, useToast } from '@/plugins/toast.js';

import {
    initApp,
    throwError,
} from '@/helpers/helpers.js';

    import LoadingSpinner from './components/LoadingSpinner.vue';
    import Navigation from './components/Navigation.vue';
    import ContextMenu from './components/ContextMenu.vue';
    import { showCreateConcept } from './helpers/modal';
    import { ModalsContainer } from 'vue-final-modal';

    export default {
        components: {
            ContextMenu,
            LoadingSpinner,
            Navigation,
            ModalsContainer,
        },
        setup(props) {
            const { t, locale } = useI18n();

        // FETCH
        initApp(locale).then(_ => {
            store.dispatch('setAppState', true);
        }).catch(e => {
            if(e.response.status == 401) {
                store.dispatch('setAppState', true);
            } else {
                throwError(e);
            }
        });

        // DATA
        const state = reactive({
            init: computed(_ => store.getters.appInitialized),
        });



        // ON MOUNTED
        onMounted(_ => {
            provideToast({
                duration: 2500,
                autohide: true,
                channel: 'success',
                icon: true,
                simple: false,
                is_tag: false,
                container: 'toast-container',
            });
            useToast();
        });

        // RETURN
        return {
            t,
            // HELPERS
            // LOCAL
            // PROPS
            // STATE
            state,
            store,
        };
    }
}
</script>
