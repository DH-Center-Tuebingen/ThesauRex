<template>
    <vue-final-modal
        classes="modal-container modal"
        content-class="sp-modal-content sp-modal-content-sm"
        v-model="state.show"
        name="about-modal">
        <div class="modal-header">
            <h5 class="modal-title">
                {{
                    t('global.discard.title')
                }}
            </h5>
            <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
            </button>
        </div>
        <div class="modal-body">
            <div class="alert alert-warning" role="alert">
                {{ t('global.discard.msg') }}
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-warning" @click="confirm()">
                <i class="fas fa-fw fa-undo"></i> {{ t('global.discard.confirm') }}
            </button>
            <button type="button" class="btn btn-outline-success" @click="saveConfirm()">
                <i class="fas fa-fw fa-check"></i> {{ t('global.discard.confirm_and_save') }}
            </button>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
                <i class="fas fa-fw fa-times"></i> {{ t('global.cancel') }}
            </button>
        </div>
    </vue-final-modal>
</template>

<script>
    import {
        onMounted,
        reactive,
    } from 'vue';
    import { useI18n } from 'vue-i18n';

    export default {
        props: {
        },
        emits: ['cancel', 'confirm', 'saveConfirm'],
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const confirm = _ => {
                state.show = false;
                context.emit('confirm', false);
            };
            const saveConfirm = _ => {
                state.show = false;
                context.emit('saveConfirm', false);
            };
            const closeModal = _ => {
                state.show = false;
                context.emit('cancel', false);
            };

            // DATA
            const state = reactive({
                show: false,
            });

            // ON MOUNTED
            onMounted(_ => {
                state.show = true;
            });

            // RETURN
            return {
                t,
                // HELPERS
                // PROPS
                // LOCAL
                confirm,
                saveConfirm,
                closeModal,
                // STATE
                state,
            }
        },
    }
</script>
