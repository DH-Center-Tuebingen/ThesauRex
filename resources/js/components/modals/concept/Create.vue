<template>
    <vue-final-modal
        class="modal-container modal"
        name="create-concept-modal"
    >
        <div class="sp-modal-content sp-modal-content-xs">
            <div class="modal-header">
                <h5 class="modal-title">
                    <span v-if="state.hasParent">
                        {{
                            t('modals.new_concept.title_parent', {
                                name: getLabel(state.parentConcept)
                            })
                        }}
                    </span>
                    <span v-else>
                        {{ t('modals.new_concept.title') }}
                    </span>
                </h5>
                <button
                    type="button"
                    class="btn-close"
                    aria-label="Close"
                    data-bs-dismiss="modal"
                    @click="closeModal()"
                >
                </button>
            </div>
            <div class="modal-body nonscrollable">
                <form
                    role="form"
                    class="mb-2"
                    id="create-concept-form"
                    name="create-concept-form"
                    @submit.prevent="onAdd()"
                >
                    <LanguageInput
                        :initial-value="initialValue"
                        @change="conceptChanged"
                    />
                </form>
            </div>
            <div class="modal-footer">
                <LoadingButton
                    color="success"
                    :outlined="true"
                    :loading="loading"
                    :disabled="!state.conceptValidated"
                    form="create-concept-form"
                >
                    <template #icon>
                        <i class="fas fa-fw fa-plus" />
                    </template>
                    <span>
                        {{ t('global.add') }}
                    </span>
                </LoadingButton>
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    @click="closeModal()"
                >
                    <i class="fas fa-fw fa-times" /> {{ t('global.cancel') }}
                </button>
            </div>
        </div>
    </vue-final-modal>
</template>

<script>
    import {
        computed,
        reactive,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import { LoadingButton } from 'dhc-components';
    import LanguageInput from '@/components/language/LanguageInput.vue';

    import useLanguageStore from '@/bootstrap/stores/language.js';
    import useConceptStore from '@/bootstrap/stores/concept.js';

    import {
        emojiFlag,
    } from '@/helpers/helpers.js';

    import {
        getLabel,
    } from '@/helpers/tree.js';

    export default {
        components: {
            LoadingButton,
            LanguageInput,
        },
        props: {
            tree: {
                type: String,
                required: true,
            },
            parentId: {
                type: Number,
                required: false,
            },
            initialValue: {
                type: String,
                required: false,
                default: '',
            },
            loading: {
                type: Boolean,
                required: false,
            },
        },
        emits: ['add', 'cancel'],
        setup(props, context) {
            const {
                tree,
                parentId,
                initialValue,
            } = toRefs(props);
            const { t } = useI18n();
            const conceptStore = useConceptStore();
            const languageStore = useLanguageStore();

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const onAdd = _ => {
                if(!state.conceptValidated) return;

                context.emit('add', state.concept);
            };
            const conceptChanged = data => {
                state.concept.language = data.language;
                state.concept.label = data.content;
            };

            // DATA
            const state = reactive({
                concept: {
                    language: {},
                    label: initialValue.value,
                },
                hasParent: computed(_ => parentId.value > 0),
                parentConcept: computed(_ => state.hasParent ? conceptStore.dictionary[tree.value][parentId.value] : null),
                conceptValidated: computed(_ => state.concept.label && state.concept.label.length),
                languages: computed(_ => languageStore.languages),
            });

            // RETURN
            return {
                t,
                // HELPERS
                emojiFlag,
                getLabel,
                // PROPS
                // LOCAL
                closeModal,
                onAdd,
                conceptChanged,
                // STATE
                state,
            };
        },
    }
</script>
