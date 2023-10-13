<template>
    <div class="h-100 d-flex flex-column of-hidden" v-if="state.initialized && state.concept">
        <header class="title-header space-below d-flex justify-content-between">
            <h4 class="mb-0 d-flex align-items-center gap-2 justify-content-start">
                {{ state.label }}
                <small>
                    <span class="badge badge-light text-primary" :class="state.badgeClass">
                        {{ t(`tree.${state.tree}.title`) }}
                    </span>
                </small>
            </h4>

            <div class="d-flex flex-row justify-content-start flex-fill overflow-hidden ms-5">
            <code id="concept-url" class="normal text-end text-black-50 ">{{ state.concept.concept_url }}</code>
            <a href="" class="ps-2 text-secondary" @click.prevent="copyToClipboard('concept-url')">
                <i class="fas fa-fw fa-copy"></i>
            </a>
        </div>
        </header>

        <div class="row flex-grow-1 of-hidden">
            <div class="col-md-6 h-100 d-flex flex-column">
                <div class="col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.broader.title') }}
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="">
                        <div class="form-group mb-0">
                            <concept-search :add-option="false" :exclude="[state.concept.id]" :tree-name="state.tree"
                                @select="handleAddBroader" />
                        </div>
                    </form>
                    <ul class="list-group list-group-xs scroll-y-auto">
                        <li :class="{
                            // disabled: state.updatingTopLevelState || state.canDeleteTopLevelState, // This is somehow not visible when state is also active
                            'bg-success': state.concept.is_top_concept,
                            'bg-warning': !state.concept.is_top_concept,

                        }" class="list-group-item d-flex flex-row justify-content-between bg-opacity-10"
                            @mouseenter="setHoverState('broaders', 'isTop', true)"
                            @mouseleave="setHoverState('broaders', 'isTop', false)"
                            :key="`broaders-${state.concept.id}-isTop`">
                            {{ t('detail.is_top_concept_short') }}

                            <span class="help-handle" v-if="!state.canDeleteTopLevelState"
                                :title="t('detail.broader.remove_not_possible')">
                                <i class="fas fa-fw fa-info-circle"></i>
                            </span>


                            <span v-show="state.hoverStates.broaders.isTop && state.canDeleteTopLevelState"
                                @click="updateTopLevelState()">
                                <span v-if="state.concept.is_top_concept" class="clickable">
                                    <i key="top-delete-icon" class="fas fa-fw fa-times"></i>
                                </span>
                                <span v-else class="clickable">
                                    <i key="top-add-icon" class="fas fa-fw fa-plus"></i>
                                </span>
                            </span>
                        </li>
                        <li class="list-group-item d-flex flex-row justify-content-between"
                            v-for="(broader, i) in state.concept.broaders" @mouseenter="setHoverState('broaders', i, true)"
                            @mouseleave="setHoverState('broaders', i, false)" :key="`broaders-${state.concept.id}-${i}`">
                            <a href="" @click.prevent="gotoConcept(broader.id)">
                                {{ getLabel(broader) }}
                            </a>
                            <span class="text-primary help-handle" v-if="!state.canDeleteBroader"
                                :title="t('detail.broader.remove_not_possible')">
                                <i class="fas fa-fw fa-info-circle"></i>
                            </span>
                            <span v-show="state.hoverStates.broaders[i] && state.canDeleteBroader"
                                @click="removeBroader(i)">
                                <i class="fas fa-fw fa-times clickable"></i>
                            </span>
                        </li>
                    </ul>
                    <!-- <p class="mb-0 alert alert-primary px-2 py-1" v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.broader.empty') }}
                    </p> -->
                </div>
                <div class="col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.narrower.title') }}
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="">
                        <div class="form-group mb-0">
                            <concept-search :add-option="true" :exclude="[state.concept.id]" :tree-name="state.tree"
                                @select="handleAddNarrower" @add="handleAddNewConcept" />
                        </div>
                    </form>
                    <ul class="list-group list-group-xs scroll-y-auto" v-if="state.hasNarrowers">
                        <li class="list-group-item d-flex flex-row justify-content-between"
                            v-for="(narrower, i) in state.concept.narrowers"
                            @mouseenter="setHoverState('narrowers', i, true)"
                            @mouseleave="setHoverState('narrowers', i, false)" :key="`narrowers-${state.concept.id}-${i}`">
                            <a href="" @click.prevent="gotoConcept(narrower.id)">
                                {{ getLabel(narrower) }}
                            </a>
                            <span v-show="state.hoverStates.narrowers[i]" @click="removeNarrower(i)">
                                <i class="fas fa-fw fa-times clickable"></i>
                            </span>
                        </li>
                    </ul>
                    <p class="mb-0 alert alert-primary px-2 py-1" v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.narrower.empty') }}
                    </p>
                </div>
            </div>
            <div class="col-md-6 h-100 d-flex flex-column">
                <div class="col px-0 d-flex flex-column mb-2 of-hidden">
                    <header class="d-flex justify-content-between">
                        <h5>
                            {{ t('detail.label.title') }}
                        </h5>
                        <span class="text-danger" v-show="state.prefLabelCount < state.languages.length"
                            :title="t('detail.label.info_label_missing')">
                            <i style="font-size: 1.1rem;" class="fas fa-fw fa-triangle-exclamation"></i>
                        </span>
                    </header>
                    <form role="form" class="mb-2" @submit.prevent="addLabel()">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <div class="d-inline-flex gap-2">
                                        <span>
                                            {{ emojiFlag(state.addLabel.language.short_name) }}
                                        </span>
                                        <span>
                                            {{ state.addLabel.language.display_name }}
                                        </span>
                                    </div>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item d-flex gap-2" href=""
                                        @click.prevent="setLanguageFor('label', language)"
                                        v-for="language in state.languages"
                                        :key="`label-language-item-${language.short_name}`">
                                        <span>
                                            {{ emojiFlag(language.short_name) }}
                                        </span>
                                        <span>
                                            {{ language.display_name }}
                                        </span>
                                    </a>
                                </div>
                            </div>
                            <input type="text" class="form-control" v-model="state.addLabel.value">
                            <div class="input-group-append">
                                <button class="btn btn-success" type="submit" :disabled="!state.addLabelValidated">
                                    <i class="fas fa-fw fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <ul class="list-group list-group-xs col of-hidden pe-0 scroll-y-auto" v-if="state.hasLabels">
                        <li class="list-group-item d-flex flex-row justify-content-between align-items-center gap-2"
                            v-for="(label, i) in state.concept.labels" @mouseenter="setHoverState('labels', i, true)"
                            @mouseleave="setHoverState('labels', i, false)" :key="`labels-${state.concept.id}-${i}`">
                            <div class="col">
                                <span v-if="!(state.editLabel.active && state.editLabel.index === i)">
                                    {{ label.label }}
                                </span>
                                <div v-else class="d-flex flex-row align-items-center">
                                    <input type="text" class="form-control" v-model="state.editLabel.value" />
                                    <button type="button" class="btn btn-outline-success btn-sm ms-2"
                                        @click="updateLabel()">
                                        <i class="fas fa-fw fa-check"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm ms-2"
                                        @click="cancelUpdateLabel()">
                                        <i class="fas fa-fw fa-ban"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="d-flex gap-1">
                                <div
                                    v-show="state.hoverStates.labels[i] && !(state.editLabel.active && state.editLabel.index === i)">
                                    <span @click="setEditMode('label', i, true)">
                                        <i class="fas fa-fw fa-edit clickable"></i>
                                    </span>
                                    <span @click="deleteLabel(label.id)" v-if="state.labelCount > 1">
                                        <i class="fas fa-fw fa-trash text-danger clickable"></i>
                                    </span>
                                </div>
                                <span v-show="label.concept_label_type == 1">
                                    <i class="fas fa-fw fa-star color-yellow"></i>
                                </span>
                                <span>
                                    {{ emojiFlag(label.language.short_name) }}
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p class="mb-0 alert alert-primary px-2 py-1" v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.label.empty') }}
                    </p>
                </div>
                <div class="col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.note.title') }}
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="addNote(state.addNote)">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <div class="d-inline-flex gap-2">
                                        <span>
                                            {{ emojiFlag(state.addNote.language.short_name) }}
                                        </span>
                                        <span>
                                            {{ state.addNote.language.display_name }}
                                        </span>
                                    </div>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item d-flex gap-2" href=""
                                        @click.prevent="setLanguageFor('note', language)"
                                        v-for="language in state.languages"
                                        :key="`note-language-item-${language.short_name}`">
                                        <span>
                                            {{ emojiFlag(language.short_name) }}
                                        </span>
                                        <span>
                                            {{ language.display_name }}
                                        </span>
                                    </a>
                                </div>
                            </div>
                            <input type="text" class="form-control" v-model="state.addNote.value">
                            <div class="input-group-append">
                                <button class="btn btn-success" type="submit" :disabled="!state.addNoteValidated">
                                    <i class="fas fa-fw fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <ul class="list-group list-group-xs col of-hidden pe-0 scroll-y-auto" v-if="state.hasNotes">
                        <li class="list-group-item d-flex flex-row justify-content-between align-items-center gap-2"
                            v-for="(note, i) in state.concept.notes" @mouseenter="setHoverState('notes', i, true)"
                            @mouseleave="setHoverState('notes', i, false)" :key="`note-${state.concept.id}-${i}`">
                            <span class="col">
                                <span v-if="!(state.editNote.active && state.editNote.index === i)">
                                    {{ note.content }}
                                </span>
                                <div v-else class="d-flex flex-row align-items-center">
                                    <input type="text" class="form-control" v-model="state.editNote.value" />
                                    <button type="button" class="btn btn-outline-success btn-sm ms-2" @click="updateNote()">
                                        <i class="fas fa-fw fa-check"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm ms-2"
                                        @click="cancelUpdateNote()">
                                        <i class="fas fa-fw fa-ban"></i>
                                    </button>
                                </div>
                            </span>
                            <div class="d-flex gap-1">
                                <div
                                    v-show="state.hoverStates.notes[i] && !(state.editNote.active && state.editNote.index === i)">
                                    <span @click="setEditMode('note', i, true)">
                                        <i class="fas fa-fw fa-edit clickable"></i>
                                    </span>
                                    <span @click="deleteNote(note.id)">
                                        <i class="fas fa-fw fa-trash text-danger clickable"></i>
                                    </span>
                                </div>
                                <span>
                                    {{ emojiFlag(note.language.short_name) }}
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p class="mb-0 alert alert-primary px-2 py-1" v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.note.empty') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    computed,
    reactive,
    watch,
} from 'vue';

import {
    onBeforeRouteLeave,
    useRoute,
} from 'vue-router';

import { useI18n } from 'vue-i18n';

import store from '@/bootstrap/store.js';

import { useToast } from '@/plugins/toast.js';

import {
    putAddLabel,
    toggleTopLevelState,
    patchLabel,
    deleteLabel as deleteLabelApi,
    putAddNote,
    patchNote,
    deleteNote as deleteNoteApi,
    addRelation,
    removeRelation,
} from '@/api.js';

import {
    showCreateConcept,
} from '@/helpers/modal.js';

import {
    emojiFlag,
    gotoConcept,
} from '@/helpers/helpers.js';

import {
    getLabel,
} from '@/helpers/tree.js';

export default {
    setup(props, context) {
        const { t } = useI18n();
        const route = useRoute();
        const toast = useToast();
        // FETCH
        store.dispatch('setSelectedConcept', {
            concept_id: route.params.id,
            tree: route.query.t,
        }).then(_ => {
            state.initialized = true;
        });
        // FUNCTIONS
        const setHoverState = (prop, index, hoverState) => {
            switch (prop) {
                case 'labels':
                case 'notes':
                case 'broaders':
                case 'narrowers':
                    break;
                default:
                    return;
            }
            state.hoverStates[prop][index] = hoverState;
        };
        const handleAddBroader = e => {
            if (!e.option)
                return;
            addRelation(state.concept.id, e.option.id, state.tree);
        };
        const handleAddNarrower = e => {
            if (!e.option)
                return;
            addRelation(e.option.id, state.concept.id, state.tree);
        };
        const handleAddNewConcept = e => {
            showCreateConcept(state.tree, state.concept.id, e.content);
        };
        const updateTopLevelState = _ => {
            if (!state.canDeleteBroader && state.isTopConcept)
                return;
            state.updatingTopLevelState = true;
            toggleTopLevelState(state.tree, state.concept.id).then(_ => {
                state.updatingTopLevelState = false;
            });
        };
        const removeBroader = idx => {
            const broader = state.concept.broaders[idx];
            const nid = state.concept.nid || state.concept.id;
            const bid = broader.nid || broader.id;
            removeRelation(nid, bid, state.tree);
        };
        const removeNarrower = idx => {
            const narrower = state.concept.narrowers[idx];
            const nid = narrower.nid || narrower.id;
            const bid = state.concept.nid || state.concept.id;
            removeRelation(nid, bid, state.tree);
        };
        const setLanguageFor = (type, lang) => {
            let property = '';
            if (type == 'label') {
                property = 'addLabel';
            }
            else if (type == 'note') {
                property = 'addNote';
            }
            else {
                return;
            }
            state[property].language = lang;
        };
        const setEditMode = (type, idx, editState) => {
            if (type == 'label') {
                if (editState) {
                    state.editLabel.index = idx;
                    const label = state.concept.labels[idx];
                    state.editLabel.value = label.label;
                    // disable edit note
                    state.editNote.index = -1;
                    state.editNote.value = null;
                    state.editNote.active = false;
                }
                else {
                    state.editLabel.index = -1;
                    state.editLabel.value = null;
                }
                state.editLabel.active = editState;
            }
            else if (type == 'note') {
                if (editState) {
                    state.editNote.index = idx;
                    const note = state.concept.notes[idx];
                    state.editNote.value = note.content;
                    // disable edit label
                    state.editLabel.index = -1;
                    state.editLabel.value = null;
                    state.editLabel.active = false;
                }
                else {
                    state.editNote.index = -1;
                    state.editNote.value = null;
                }
                state.editNote.active = editState;
            }
        };
        const resetLabel = _ => {
            state.addLabel.language = {};
            state.addLabel.value = '';
        };
        const addLabel = _ => {
            putAddLabel({
                content: state.addLabel.value,
                lid: state.addLabel.language.id,
                cid: state.concept.id,
                tree_name: state.tree,
            }).then(_ => {
                resetLabel();
            });
        };
        const updateLabel = _ => {
            const label = state.concept.labels[state.editLabel.index];
            if (label.label == state.editLabel.value) {
                return;
            }
            patchLabel(label.id, state.editLabel.value, state.concept.id, state.tree).then(_ => {
                setEditMode('label', state.editLabel.index, false);
            });
        };
        const cancelUpdateLabel = _ => {
            setEditMode('label', state.editLabel.index, false);
        };
        const deleteLabel = id => {
            const label = state.concept.labels.find(l => l.id == id);
            deleteLabelApi(id, state.tree, state.concept.id).then(_ => {
                const title = t('detail.label.toasts.deleted.title');
                const msg = t('detail.label.toasts.deleted.message', {
                    label: label.label,
                });
                toast.$toast(msg, title, {
                    channel: 'info',
                    html: true,
                });
            });
        };
        const resetNote = _ => {
            state.addNote.language = {};
            state.addNote.value = '';
        };
        const addNote = _ => {
            putAddNote({
                content: state.addNote.value,
                lid: state.addNote.language.id,
                cid: state.concept.id,
                tree_name: state.tree,
            }).then(_ => {
                resetNote();
            });
        };
        const updateNote = _ => {
            const note = state.concept.notes[state.editNote.index];
            if (note.content == state.editNote.value) {
                return;
            }
            patchNote(note.id, state.editNote.value, state.concept.id, state.tree).then(_ => {
                setEditMode('note', state.editNote.index, false);
            });
        };
        const cancelUpdateNote = _ => {
            setEditMode('note', state.editNote.index, false);
        };
        const deleteNote = id => {
            const note = state.concept.notes.find(n => n.id == id);
            deleteNoteApi(id, state.tree, state.concept.id).then(_ => {
                const title = t('detail.note.toasts.deleted.title');
                const msg = t('detail.note.toasts.deleted.message', {
                    note: note.content,
                });
                toast.$toast(msg, title, {
                    channel: 'info',
                    html: true,
                });
            });
        };
        const copyToClipboard = id => {
            const range = document.createRange();
            const selection = window.getSelection();
            const elem = document.getElementById(id);
            range.selectNodeContents(elem);
            selection.removeAllRanges();
            selection.addRange(range);
            try {
                document.execCommand("copy");
                selection.removeAllRanges();
                const title = t('detail.copy_url.title');
                const msg = t('detail.copy_url.message', {
                    url: elem.innerText
                });
                toast.$toast(msg, title, {
                    channel: 'info',
                    html: true,
                });
            }
            catch (err) {
                console.log(err);
            }
        };
        // DATA
        const state = reactive({
            initialized: false,
            addLabel: {
                language: {},
            },
            addNote: {
                language: {},
            },
            editLabel: {
                active: false,
                index: -1,
                value: null,
            },
            editNote: {
                active: false,
                index: -1,
                value: null,
            },
            hoverStates: {
                labels: {},
                notes: {},
                broaders: {},
                narrowers: {},
            },
            updatingTopLevelState: false,
            addLabelValidated: computed(_ => state.addLabel.language.short_name && state.addLabel.value && state.addLabel.value.length),
            addNoteValidated: computed(_ => state.addNote.language.short_name && state.addNote.value && state.addNote.value.length),
            concept: computed(_ => store.getters.selectedConcept.data),
            tree: computed(_ => store.getters.selectedConcept.from),
            isTopConcept: computed(_ => state.concept.is_top_concept),
            hasBroaders: computed(_ => state.concept.broaders && state.concept.broaders.length > 0),
            canDeleteBroader: computed(_ => state.hasBroaders && (state.concept.broaders.length >= 2 || state.isTopConcept)),
            canDeleteTopLevelState: computed(_ => state.hasBroaders && state.concept.broaders.length >= 0),
            hasNarrowers: computed(_ => state.concept.narrowers && state.concept.narrowers.length > 0),
            hasLabels: computed(_ => state.concept.labels && state.concept.labels.length > 0),
            hasNotes: computed(_ => state.concept.notes && state.concept.notes.length > 0),
            label: computed(_ => getLabel(state.concept)),
            languages: computed(_ => store.getters.languages),
            labelCount: computed(_ => state.hasLabels ? state.concept.labels.length : 0),
            prefLabelCount: computed(_ => {
                if (!state.hasLabels) {
                    return 0;
                }
                return state.concept.labels.filter(l => {
                    return l.concept_label_type == 1;
                }).length;
            }),
            badgeClass: computed(_ => {
                if (state.tree == 'sandbox') {
                    return 'bg-secondary';
                }
                else {
                    return 'bg-primary';
                }
            })
        });
        // ON MOUNTED
        // ON MOUNTED

        // ON MOUNTED

        // WATCHER
        watch(_ => route.params, async (newParams, oldParams) => {
            if (newParams.id == oldParams.id)
                return;
            if (!newParams.id)
                return;
            state.initialized = false;
            store.dispatch('setSelectedConcept', {
                concept_id: newParams.id,
                tree: route.query.t,
            }).then(_ => {
                state.initialized = true;
            });
        });
        // ON BEFORE LEAVE
        onBeforeRouteLeave(async (to, from) => {
            store.dispatch('unsetSelectedConcept');
            return true;
        });
        // RETURN
        return {
            t,
            // HELPERS
            emojiFlag,
            gotoConcept,
            getLabel,
            // LOCAL
            setHoverState,
            handleAddBroader,
            handleAddNarrower,
            handleAddNewConcept,
            updateTopLevelState,
            removeBroader,
            removeNarrower,
            setLanguageFor,
            setEditMode,
            addLabel,
            updateLabel,
            cancelUpdateLabel,
            deleteLabel,
            addNote,
            updateNote,
            cancelUpdateNote,
            deleteNote,
            copyToClipboard,
            // PROPS
            // STATE
            state,

            log: computed((..._) => console.log(..._)),
        };
    }
    // beforeRouteEnter(to, from, next) {
    //     $httpQueue.add(() => $http.get(`tree/${to.params.id}?t=${to.query.t}`).then(response => {
    //         next(vm => vm.init(response.data, to.query.t));
    //     }));
    // },
    // beforeRouteUpdate(to, from, next) {
    //     $httpQueue.add(() => $http.get(`tree/${to.params.id}?t=${to.query.t}`).then(response => {
    //         this.init(response.data, to.query.t);
    //         next();
    //     }));
    // },
    // mounted() {
    //     // Enable popovers
    //     $(function () {
    //         $('[data-toggle="popover"]').popover()
    //     });
    // },
    // created() {
    //     this.eventBus.$on(`relation-updated-`, this.handleRelationUpdate);
    //     this.eventBus.$on(`relation-updated-sandbox`, this.handleRelationUpdate);
    //     this.eventBus.$on(`dc-delete-all-`, this.handleConceptDeleteAll);
    //     this.eventBus.$on(`dc-delete-all-sandbox`, this.handleConceptDeleteAll);
    //     this.eventBus.$on(`dc-delete-one-`, this.handleConceptDeleteOneUp);
    //     this.eventBus.$on(`dc-delete-one-sandbox`, this.handleConceptDeleteOneUp);
    // },
    // beforeDestroy() {
    //     this.eventBus.$off(`relation-updated-`);
    //     this.eventBus.$off(`relation-updated-sandbox`);
    //     this.eventBus.$off(`dc-delete-all-`);
    //     this.eventBus.$off(`dc-delete-all-sandbox`);
    //     this.eventBus.$off(`dc-delete-one-`);
    //     this.eventBus.$off(`dc-delete-one-sandbox`);
    // },
    // methods: {
    //     init(data, treeName) {
    //         data.broaders.forEach(b => {
    //             b.selectedLabel = this.$getLabel(b);
    //         });
    //         data.narrowers.forEach(n => {
    //             n.selectedLabel = this.$getLabel(n);
    //         });
    //         this.concept = data;
    //         this.treeName = treeName == 'sandbox' ? 'sandbox' : '';
    //         this.selectedLanguage = this.languages[0];
    //         this.resetProperty(this.newLabel);
    //         this.resetProperty(this.newNote);
    //         this.eventBus.$emit(`concept-selected-${this.treeName}`, {
    //             concept: this.concept
    //         });
    //         this.dataLoaded = true;
    //     },
    //     gotoConcept(id) {
    //         this.eventBus.$emit('concept-clicked', {
    //             id: id,
    //             from: this.treeName
    //         });
    //     },
    //     addLabel(label) {
    //         const data = {
    //             content: label.value,
    //             lid: label.language.id,
    //             cid: this.concept.id,
    //             tree_name: this.treeName
    //         };
    //         $httpQueue.add(() => $http.put(`tree/label?t=${this.treeName}`, data).then(response => {
    //             this.concept.labels.push(response.data);
    //             this.resetProperty(label);
    //             this.eventBus.$emit(`label-update-${this.treeName}`, {
    //                 concept_id: this.concept.id,
    //                 labels: this.concept.labels.slice()
    //             });
    //         }));
    //     },
    //     enableEditMode(index) {
    //         const label = this.concept.labels[index];
    //         this.editLabel.value = label.label;
    //         this.editLabel.id = label.id;
    //         this.editLabel.index = index;
    //         this.editLabel.active = true;
    //     },
    //     confirmEditLabel(index) {
    //         const label = this.concept.labels[index];
    //         // If value did not change, simply return to normal state
    //         if(label.label == this.editLabel.value) {
    //             this.disableEditMode();
    //         }
    //         const data = {
    //             label: this.editLabel.value
    //         };
    //         $httpQueue.add(() => $http.patch(`tree/label/${label.id}?t=${this.treeName}`, data).then(response => {
    //             const updatedLabel = response.data;
    //             label.label = updatedLabel.label;
    //             label.updated_at = updatedLabel.updated_at;
    //             this.disableEditMode();
    //         }));
    //     },
    //     disableEditMode() {
    //         this.editLabel.value = null;
    //         this.editLabel.id = null;
    //         this.editLabel.index = null;
    //         this.editLabel.active = false;
    //     },
    //     deleteLabel(index) {
    //         let label = this.concept.labels[index];
    //         if(!label) return;
    //         $httpQueue.add(() => $http.delete(`tree/label/${label.id}?t=${this.treeName}`).then(response => {
    //             const removed = this.concept.labels.splice(index, 1);
    //             if(response.data && response.data.updated) {
    //                 const updId = response.data.id;
    //                 const updType = response.data.type;
    //                 let updLabel = this.concept.labels.find(l => {
    //                     return l.id == updId;
    //                 });
    //                 updLabel.concept_label_type = updType;
    //             }
    //             this.eventBus.$emit(`label-update-${this.treeName}`, {
    //                 concept_id: this.concept.id,
    //                 labels: this.concept.labels.slice()
    //             });
    //             this.$showToast(
    //                 this.$t('detail.label.toasts.deleted.title'),
    //                 this.$t('detail.label.toasts.deleted.message', {
    //                     label: label.label
    //                 }),
    //                 'success'
    //             );
    //         }));
    //     },
    //     addNote(note) {
    //         const data = {
    //             content: note.value,
    //             lid: note.language.id,
    //             cid: this.concept.id,
    //             tree_name: this.treeName
    //         };
    //         $httpQueue.add(() => $http.put(`tree/note?t=${this.treeName}`, data).then(response => {
    //             this.concept.notes.push(response.data);
    //             this.resetProperty(note);
    //         }));
    //     },
    //     deleteNote(index) {
    //         let note = this.concept.notes[index];
    //         if(!note) return;
    //         $httpQueue.add(() => $http.delete(`tree/note/${note.id}?t=${this.treeName}`).then(response => {
    //             this.concept.notes.splice(index, 1);
    //             this.$showToast(
    //                 this.$t('detail.note.toasts.deleted.title'),
    //                 this.$t('detail.note.toasts.deleted.message', {
    //                     note: note.content
    //                 }),
    //                 'success'
    //             );
    //         }));
    //     },
    //     copyToClipboard(id) {
    //         const range = document.createRange();
    //         const selection = window.getSelection();
    //         const elem = document.getElementById(id);
    //         range.selectNodeContents(elem);
    //         selection.removeAllRanges();
    //         selection.addRange(range);
    //         try {
    //             document.execCommand("copy");
    //             selection.removeAllRanges();
    //             const title = this.$t('detail.copy_url.title');
    //             const msg = this.$t('detail.copy_url.message', {
    //                 url: elem.innerText
    //             });
    //             this.$showToast(title, msg, 'info');
    //         } catch(err) {
    //             console.log(err);
    //         }
    //     },
    //     handleConceptDeleteAll(e) {
    //         if(this.concept.id == e.element.id) {
    //             this.$router.push({
    //                 name: 'home'
    //             });
    //             return;
    //         }
    //         // TODO
    //     },
    //     handleConceptDeleteOneUp(e) {
    //         if(this.concept.id == e.element.id) {
    //             this.$router.push({
    //                 name: 'home'
    //             });
    //             return;
    //         }
    //         // TODO
    //     },
    //     handleRelationUpdate(e) {
    //         switch(e.type) {
    //             case 'add':
    //                 if(e.narrower_id == this.concept.id) {
    //                     this.concept.broaders.push(e.concept);
    //                 } else if(e.broader_id == this.concept.id) {
    //                     this.concept.narrowers.push(e.concept);
    //                 }
    //                 break;
    //             case 'remove':
    //                 if(e.narrower_id == this.concept.id) {
    //                     const idx = this.concept.broaders.findIndex(b => b.id == e.broader_id);
    //                     this.concept.broaders.splice(idx, 1);
    //                 } else if(e.broader_id == this.concept.id) {
    //                     const idx = this.concept.narrowers.findIndex(n => n.id == e.narrower_id);
    //                     this.concept.narrowers.splice(idx, 1);
    //                 }
    //                 break;
    //         }
    //     },
    //     broaderSelected(e) {
    //         if(!e.concept) return;
    //         const bid = e.concept.id;
    //         const id = this.concept.id;
    //         $httpQueue.add(() => $http.put(`tree/concept/${id}/broader/${bid}?t=${this.treeName}`).then(response => {
    //             this.eventBus.$emit(`relation-updated-${this.treeName}`, {
    //                 type: 'add',
    //                 concept: e.concept,
    //                 broader_id: bid,
    //                 narrower_id: id
    //             });
    //         }));
    //     },
    //     removeBroader(index) {
    //         const broader = this.concept.broaders[index];
    //         const bid = broader.id;
    //         const id = this.concept.id;
    //         $httpQueue.add(() => $http.delete(`tree/concept/${id}/broader/${bid}?t=${this.treeName}`).then(response => {
    //             this.eventBus.$emit(`relation-updated-${this.treeName}`, {
    //                 type: 'remove',
    //                 broader_id: bid,
    //                 narrower_id: id
    //             });
    //         }));
    //     },
    //     narrowerSelected(e) {
    //         if(!e.concept) return;
    //         if(e.concept.is_new) {
    //             this.$emit('request-concept', {
    //                 parent: this.concept,
    //                 label: e.concept.label,
    //                 tree: this.treeName
    //             });
    //         } else {
    //             const bid = e.concept.id;
    //             const id = this.concept.id;
    //             $httpQueue.add(() => $http.put(`/tree/concept/${bid}/broader/${id}?t=${this.treeName}`).then(response => {
    //                 this.eventBus.$emit(`relation-updated-${this.treeName}`, {
    //                     type: 'add',
    //                     concept: e.concept,
    //                     broader_id: id,
    //                     narrower_id: bid
    //                 });
    //             }));
    //         }
    //     },
    //     removeNarrower(index) {
    //         const broader = this.concept.narrowers[index];
    //         const bid = broader.id;
    //         const id = this.concept.id;
    //         $httpQueue.add(() => $http.delete(`/tree/concept/${bid}/broader/${id}?t=${this.treeName}`).then(response => {
    //             this.eventBus.$emit(`relation-updated-${this.treeName}`, {
    //                 type: 'remove',
    //                 broader_id: id,
    //                 narrower_id: bid
    //             });
    //         }));
    //     },
    //     setHoverState(prop, index, state) {
    //         switch(prop) {
    //             case 'labels':
    //             case 'notes':
    //             case 'broaders':
    //             case 'narrowers':
    //                 break;
    //             default:
    //                 return;
    //         }
    //         Vue.set(this.hoverStates[prop], index, state);
    //     },
    //     resetProperty(obj) {
    //         obj.language = this.selectedLanguage;
    //         obj.value = null;
    //     },
    //     setPropertyLanguage(prop, newLanguage) {
    //         prop.language = newLanguage;
    //     }
    // },
    // data() {
    //     return {
    //         dataLoaded: false,
    //         concept: {},
    //         treeName: '',
    //         selectedLanguage: {},
    //         hoverStates: {
    //             labels: {},
    //             notes: {},
    //             broaders: {},
    //             narrowers: {}
    //         },
    //         newNote: {
    //             language: null,
    //             value: null
    //         },
    //         newLabel: {
    //             language: null,
    //             value: null
    //         },
    //         editLabel: {
    //             value: null,
    //             id: null,
    //             index: null,
    //             active: false
    //         }
    //     }
    // },
    // computed: {
    //     prefLabelCount() {
    //         if(!this.concept.labels && !this.concept.labels.length) {
    //             return 0;
    //         }
    //         return this.concept.labels.filter(l => {
    //             return l.concept_label_type == 1;
    //         }).length;
    //     },
    //     label() {
    //         return this.$getLabel(this.concept);
    //     }
    // }
    ,
}
</script>
