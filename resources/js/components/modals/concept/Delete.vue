<template>
    <vue-final-modal
        class="modal-container modal"
        name="delete-concept-modal">
        <div class="sp-modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    {{
                    t('modals.delete_concept.title', {
                    name: getLabel(state.concept)
                    })
                    }}
                </h5>
                <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
                </button>
            </div>
            <div class="modal-body">
                <form role="form" class="mb-2" id="delete-concept-form" name="delete-concept-form"
                    @submit.prevent="onConfirm()">
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="delete-concept-action-cascade" value="cascade"
                            v-model="state.action">
                        <label class="form-check-label" for="delete-concept-action-cascade">
                            <div class="d-flex flex-row gap-1 align-items-center">
                                <i class="fas fa-fw fa-stairs fa-flip-vertical text-danger"></i>
                                <span class="fs-5">
                                    {{ t('modals.delete_concept.actions.cascade.title') }}
                                </span>
                            </div>
                            <p class="text-muted">
                                {{ t('modals.delete_concept.actions.cascade.description') }}
                            </p>
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="delete-concept-action-level" value="level"
                            v-model="state.action">
                        <label class="form-check-label" for="delete-concept-action-level">
                            <div class="d-flex flex-row gap-1 align-items-center">
                                <i class="fas fa-fw fa-arrow-up text-danger"></i>
                                <span class="fs-5">
                                    {{ t('modals.delete_concept.actions.level.title') }}
                                </span>
                            </div>
                            <p class="text-muted" v-html="t('modals.delete_concept.actions.level.description')" />
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="delete-concept-action-top" value="top"
                            v-model="state.action">
                        <label class="form-check-label" for="delete-concept-action-top">
                            <div class="d-flex flex-row gap-1 align-items-center">
                                <i class="fas fa-fw fa-arrow-turn-up text-danger"></i>
                                <span class="fs-5">
                                    {{ t('modals.delete_concept.actions.top.title') }}
                                </span>
                            </div>
                            <p class="text-muted" v-html="t('modals.delete_concept.actions.top.description')" />
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="delete-concept-action-rerelate" value="rerelate" v-model="state.action">
                        <label class="form-check-label" for="delete-concept-action-rerelate">
                            <div class="d-flex flex-row gap-1 align-items-center">
                                <i class="fas fa-fw fa-code-pull-request text-danger"></i>
                                <span class="fs-5">
                                    {{ t('modals.delete_concept.actions.rerelate.title') }}
                                </span>
                            </div>
                            <p class="text-muted mb-0" v-html="t('modals.delete_concept.actions.rerelate.description')" />
                        </label>
                        <div v-if="state.action == 'rerelate'">
                            <hr class="my-2" />
                            <div class="d-flex flex-row align-items-center gap-2 pb-2" v-if="state.relateConcept">
                                <span>
                                    {{ t('modals.delete_concept.actions.rerelate.selection') }}
                                </span>
                                <span class="fw-bold">
                                    {{ getLabel(state.relateConcept) }}
                                </span>
                            </div>
                            <div class="py-1" v-else></div>
                            <div class="d-flex flex-row align-items-center gap-2">
                                <div>
                                    <span>
                                        {{ t('modals.delete_concept.actions.rerelate.search') }}
                                    </span>
                                    <span class="text-danger fw-bold">*</span>
                                    :
                                </div>
                                <concept-search
                                    class="m-0 w-50"
                                    :add-option="false"
                                    :exclude="[state.concept.id]"
                                    :tree-name="state.tree"
                                    @select="handleConnect"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-outline-danger" :disabled="!state.isValid" form="delete-concept-form">
                    <i class="fas fa-fw fa-trash"></i> {{ t('global.delete') }}
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
        watch,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import store from '@/bootstrap/store.js';

    import {
        emojiFlag,
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
            conceptId: {
                type: Number,
                required: false,
            },
        },
        emits: ['confirm', 'cancel'],
        setup(props, context) {
            const {
                tree,
                conceptId,
            } = toRefs(props);
            const { t } = useI18n();

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const onConfirm = _ => {
                context.emit('confirm', {
                    nid: state.concept.nid,
                    action: state.action,
                    params: state.params,
                });
            };
            const handleConnect = e => {
                if(!e.option) return;

                if(state.action == 'rerelate') {
                    state.relateConcept = e.option;
                    state.params.p = e.option.id;
                }
            };

            // DATA
            const state = reactive({
                action: 'cascade',
                relateConcept: null,
                params: {},
                concept: computed(_ => store.getters.conceptsFromMap(tree.value)[conceptId.value]),
                isValid: computed(_ => !!state.action && (state.action != 'rerelate' || !!state.relateConcept)),
            });

            // ON MOUNTED
            onMounted(_ => {
            });

            // WATCHER
            watch(_ => state.action, (newValue, oldValue) => {
                if(newValue != 'rerelate') {
                    state.relateConcept = null;
                    state.params = {};
                }
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
                onConfirm,
                handleConnect,
                // STATE
                state,
            };
        },
    }
</script>
