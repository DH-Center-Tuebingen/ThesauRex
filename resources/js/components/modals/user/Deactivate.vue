<template>
    <vue-final-modal
        class="modal-container modal"
        name="deactivate-user-modal">
        <div class="sp-modal-content sp-modal-content-xs">
            <div class="modal-header">
                <h5 class="modal-title" v-html="t('settings.user.modal.deactivate.title', {name: user.name})"/>
                <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
                </button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info" role="alert">
                    {{ t('settings.user.modal.deactivate.info') }}
                </div>
                <div class="alert alert-danger" role="alert" v-html="t('settings.user.modal.deactivate.desc', {name: user.name})"/>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success" @click="confirmDeactivate()">
                    <i class="fas fa-fw fa-check"></i> {{ t('global.deactivate') }}
                </button>
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
                    <i class="fas fa-fw fa-times"></i> {{ t('global.cancel') }}
                </button>
            </div>
        </div>
    </vue-final-modal>
</template>

<script>
    import {
        computed,
        onMounted,
        reactive,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    export default {
        props: {
            user: {
                required: true,
                type: Object,
            },
        },
        emits: ['deactivate', 'cancel'],
        setup(props, context) {
            const { t } = useI18n();

            const {
                user,
            } = toRefs(props);

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const confirmDeactivate = _ => {
                context.emit('deactivate', false);
            };

            // DATA
            const state = reactive({
            });

            // ON MOUNTED
            onMounted(_ => {
            });

            // RETURN
            return {
                t,
                // HELPERS
                // PROPS
                user,
                // LOCAL
                closeModal,
                confirmDeactivate,
                // STATE
                state,
            }
        },
    }
</script>
