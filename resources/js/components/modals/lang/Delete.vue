<template>
  <vue-final-modal
    classes="modal-container modal"
    content-class="sp-modal-content sp-modal-content-xs"
    v-model="state.show"
    name="add-role-modal">
    <div class="modal-header">
        <h5 class="modal-title">
            {{
                t('modals.language.delete.title', {
                    name: state.language.display_name,
                    flag: emojiFlag(state.language.short_name),
                })
            }}
        </h5>
        <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
        </button>
    </div>
    <div class="modal-body">
        <span v-html="t('modals.language.delete.message', {name: state.language.display_name, flag: emojiFlag(state.language.short_name)})"></span>
    </div>
    <div class="modal-footer">
        <button type="submit" class="btn btn-outline-danger" @click="onDelete()">
            <i class="fas fa-fw fa-trash"></i> {{ t('global.delete') }}
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
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import {
        emojiFlag,
        getLanguage,
    } from '@/helpers/helpers.js';

    export default {
        props: {
            languageId: {
                type: Number,
                required: true,
            },
        },
        emits: ['delete', 'cancel'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                languageId,
            } = toRefs(props);

            // FUNCTIONS
            const closeModal = _ => {
                state.show = false;
                context.emit('cancel', false);
            };
            const onDelete = _ => {
                state.show = false;
                context.emit('delete', true);
            };

            // DATA
            const state = reactive({
                show: false,
                language: getLanguage(languageId.value),
            });

            // ON MOUNTED
            onMounted(_ => {
                state.show = true;
            });

            // RETURN
            return {
                t,
                // HELPERS
                emojiFlag,
                // PROPS
                // LOCAL
                closeModal,
                onDelete,
                // STATE
                state,
            };
        },
    }
</script>
