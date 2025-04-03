<template>
    <vue-final-modal
        class="modal-container modal"
        name="create-concept-modal"
    >
        <div class="sp-modal-content sp-modal-content-sm">
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
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <button
                                class="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <div class="d-inline-flex gap-2">
                                    <span>
                                        {{ emojiFlag(state.concept.language.short_name) }}
                                    </span>
                                    <span>
                                        {{ state.concept.language.display_name }}
                                    </span>
                                </div>
                            </button>
                            <div class="dropdown-menu">
                                <a
                                    class="dropdown-item d-flex gap-2"
                                    href=""
                                    @click.prevent="setLanguage(language)"
                                    v-for="language in state.languages"
                                    :key="`create-concept-language-item-${language.short_name}`"
                                >
                                    <span>
                                        {{ emojiFlag(language.short_name) }}
                                    </span>
                                    <span>
                                        {{ language.display_name }}
                                    </span>
                                </a>
                            </div>
                        </div>
                        <input
                            ref="inputField"
                            type="text"
                            class="form-control"
                            v-model="state.concept.label"
                        >
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button
                    ref="submitButton"
                    type="submit"
                    class="btn btn-outline-success"
                    :disabled="!state.conceptValidated"
                    form="create-concept-form"
                >
                    <i class="fas fa-fw fa-plus"></i> {{ t('global.add') }}
                </button>
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    @click="closeModal()"
                >
                    <i class="fas fa-fw fa-times"></i> {{ t('global.cancel') }}
                </button>
            </div>
        </div>
    </vue-final-modal>
</template>

<script>
    import {
        computed,
        nextTick,
        onMounted,
        reactive,
        ref,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';
    import { useStore } from '@/bootstrap/store.js';

    import {
        emojiFlag,
        getPreference,
    } from '@/helpers/helpers.js';

    import {
        getLabel,
    } from '@/helpers/tree.js';

    export default {
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
        },
        emits: ['add', 'cancel'],
        setup(props, context) {
            const {
                tree,
                parentId,
                initialValue,
            } = toRefs(props);
            const { t } = useI18n();
            const store = useStore();

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const onAdd = _ => {
                if(!state.conceptValidated) return;

                context.emit('add', state.concept);
            };
            const setLanguage = language => {
                state.concept.language = language;
            };

            // DATA
            const state = reactive({
                concept: {
                    language: {},
                    label: initialValue.value,
                },
                hasParent: computed(_ => parentId.value > 0),
                parentConcept: computed(_ => state.hasParent ? store.getters.conceptsFromMap(tree.value)[parentId.value] : null),
                conceptValidated: computed(_ => state.concept.language.short_name && state.concept.label && state.concept.label.length),
                languages: computed(_ => store.getters.languages),
            });

            const submitButton = ref(null);
            const inputField = ref(null);

            // ON MOUNTED
            onMounted(_ => {
                state.concept.language = store.getters.activeLanguage;
                nextTick(_ => {
                    inputField.value.focus();
                })
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
                setLanguage,
                inputField,
                submitButton,
                // STATE
                state,
            };
        },
    }
</script>
