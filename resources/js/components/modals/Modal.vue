<template>
    <vue-final-modal
        class="modal-container modal"
        content-class="sp-modal-content sp-modal-content-sm"
        :modalName="modalName"
        v-model="state.show"
    >
        <div class="modal-header">
            <h5 class="modal-title">
                <slot name="title">
                    {{ title ?? '' }}
                </slot>
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
            <slot focusRef="setFocusRef" />
        </div>
        <div class="modal-footer">
            <slot name="footer">
                <button
                    type="submit"
                    class="btn btn-outline-success"
                    :disabled="valid"
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
    </vue-final-modal>
</template>

<script>
    import {
        computed,
        nextTick,
        onMounted,
        reactive,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import store from '@/bootstrap/store.js';

    import {
        emojiFlag,
        getPreference,
    } from '@/helpers/helpers.js';

    import {
        getLabel,
    } from '@/helpers/tree.js';
    import useForceFocus from '@/composables/useForceFocus';

    export default {
        props: {
            title: {
                type: String,
                required: false,
            },
            modalName: {
                type: String,
                required: true,
            },
            tree: {
                type: String,
                required: true,
            },
            valid: {
                type: Boolean,
                required: false,
                default: true,
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
            focusRef: {
                type: Object,
                required: false,
            },
            onClose: {
                type: Function,
                required: false,
            },
            onSubmit: {
                type: Function,
                required: false,
            },
        },
        setup(props, context) {
            const {
                tree,
                parentId,
                initialValue,
            } = toRefs(props);
            const { t } = useI18n();

            // FUNCTIONS
            const closeModal = _ => {
                state.show = false;
                if(props.onClose)
                    props.onClose();
            };

            const onAdd = _ => {
                if(!state.conceptValidated) return;

                state.show = false;
                if(props.onSubmit)
                    props.onSubmit(state.concept);
            };
            const setLanguage = language => {
                state.concept.language = language;
            };

            // DATA
            const state = reactive({
                show: false,
                concept: {
                    language: {},
                    label: initialValue.value,
                },
                hasParent: computed(_ => parentId.value > 0),
                parentConcept: computed(_ => state.hasParent ? store.getters.conceptsFromMap(tree.value)[parentId.value] : null),
                conceptValidated: computed(_ => state.concept.language?.short_name && state.concept.label && state.concept.label.length),
                languages: computed(_ => store.getters.languages),
            });

            const { focusedInputRef, forceFocus } = useForceFocus();


            // ON MOUNTED
            onMounted(_ => {
                state.show = true;
                const userLanguage = getPreference('prefs.gui-language');
                const conceptLang = state.languages.find(l => l.short_name == userLanguage);
                if(conceptLang) {
                    state.concept.language = conceptLang;
                } else {
                    state.concept.language = state.languages[0];
                }

                nextTick(_ => {

                    // For some reason (probably because of the vue-final-modal) the focus is not set correctly
                    nextTick(_ => {
                        forceFocus();
                        console.log('focusedInputRef', focusedInputRef);
                    });

                    // setTimeout(_ => {
                    //     forceFocus();
                    //     console.log('focusedInputRef', focusedInputRef);
                    // }, 1);
                });
            });

            const setFocusRef = ref => {
                focusedInputRef.value = ref;
            };


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
                setFocusRef,
                // STATE
                state,
                focusedInputRef,
            };
        },
    }
</script>
