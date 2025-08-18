<template>
    <div
        class="concept-detail h-100 d-flex flex-column of-hidden"
        v-if="state.concept"
    >
        <h4 class="mb-0 d-flex align-items-center gap-2 justify-content-start">
            {{ state.label }}
            <small>
                {{ t('detail.title') }}
            </small>
            <small>
                <span
                    class="badge"
                    :class="state.badgeClass"
                >
                    {{ t(`tree.${state.tree}.title`) }}
                </span>
            </small>
        </h4>
        <div class="d-flex flex-row justify-content-start">
            <code
                id="concept-url"
                class="normal text-black-50 truncate-text-start"
            >{{ state.concept.concept_url }}</code>
            <a
                href=""
                class="ps-2 text-secondary"
                @click.prevent="copyToClipboard('concept-url')"
            >
                <i class="fas fa-fw fa-copy"></i>
            </a>
        </div>
        <div class="form-check form-switch mx-2 pt-2">
            <span v-show="state.updatingTopLevelState">
                <i class="fas fa-fw fa-spinner fa-spin"></i>
            </span>
            <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="concept-detail-tlc-switch"
                :disabled="state.updatingTopLevelState || (!state.canDeleteBroader && state.isTopConcept)"
                v-model="state.concept.is_top_concept"
                @click.prevent="updateTopLevelState()"
            >
            <label
                class="form-check-label"
                for="concept-detail-tlc-switch"
            >
                {{ t('detail.is_top_concept') }}
            </label>
            <span
                class="text-danger help-handle ms-2"
                v-if="(!state.canDeleteBroader && state.isTopConcept)"
                :title="t('detail.broader.remove_not_possible')"
            >
                <i class="fas fa-fw fa-info-circle"></i>
            </span>
        </div>
        <hr class="w-100" />
        <div class="row flex-grow-1 of-hidden">
            <div class="col-md-6 h-100 d-flex flex-column">
                <div class="broaders col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.broader.title') }}
                    </h5>
                    <form
                        role="form"
                        class="mb-2"
                        @submit.prevent=""
                    >
                        <div class="form-group mb-0">
                            <ConceptSearch
                                :add-option="false"
                                :exclude="[state.concept.id]"
                                :tree-name="state.tree"
                                @select="handleAddBroader"
                            />
                        </div>
                    </form>
                    <ul
                        class="list-group list-group-xs scroll-y-auto"
                        v-if="state.hasBroaders"
                    >
                        <li
                            class="list-group-item d-flex flex-row justify-content-between"
                            v-for="(broader, i) in state.concept.broaders"
                            @mouseenter="setHoverState('broaders', i, true)"
                            @mouseleave="setHoverState('broaders', i, false)"
                            :key="`broaders-${state.concept.id}-${i}`"
                        >
                            <a
                                href=""
                                @click.prevent="gotoConcept(broader.id)"
                            >
                                {{ getLabel(broader) }}
                            </a>
                            <span
                                class="remove-not-possible text-danger help-handle"
                                v-if="!state.canDeleteBroader"
                                :title="t('detail.broader.remove_not_possible')"
                            >
                                <i class="fas fa-fw fa-info-circle"></i>
                            </span>
                            <span
                                v-show="state.hoverStates.broaders[i] && state.canDeleteBroader"
                                class="remove-broader-btn"
                                @click="removeBroader(i)"
                            >
                                <i class="fas fa-fw fa-times clickable"></i>
                            </span>
                        </li>
                    </ul>
                    <p
                        class="mb-0 alert alert-info px-2 py-1"
                        v-else
                    >
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.broader.empty') }}
                    </p>
                </div>
                <div class="narrowers col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.narrower.title') }}
                    </h5>
                    <form
                        role="form"
                        class="mb-2"
                        @submit.prevent=""
                    >
                        <div class="form-group mb-0">
                            <ConceptSearch
                                :add-option="true"
                                :exclude="[state.concept.id]"
                                :tree-name="state.tree"
                                @add="handleAddNewConcept"
                                @select="handleAddNarrower"
                            />
                        </div>
                    </form>
                    <ul
                        class="list-group list-group-xs scroll-y-auto"
                        v-if="state.hasNarrowers"
                    >
                        <li
                            class="list-group-item d-flex flex-row justify-content-between"
                            v-for="(narrower, i) in sortByLabels(state.concept.narrowers)"
                            @mouseenter="setHoverState('narrowers', i, true)"
                            @mouseleave="setHoverState('narrowers', i, false)"
                            :key="`narrowers-${state.concept.id}-${i}`"
                        >
                            <a
                                href=""
                                @click.prevent="gotoConcept(narrower.id)"
                            >
                                {{ getLabel(narrower) }}
                            </a>
                            <span
                                v-show="isHovered('narrowers', i,) && canRemoveNarrower(narrower)"
                                class="remove-narrower-btn"
                                @click="removeNarrower(narrower)"
                            >
                                <i class="fas fa-fw fa-times clickable"></i>
                            </span>
                            <span
                                v-show="isHovered('narrowers', i,) && !canRemoveNarrower(narrower)"
                                class="not-allowed-handle"
                                :title="t('detail.narrower.remove_not_possible')"
                            >
                                <i class="fas fa-fw fa-ban"></i>
                            </span>
                        </li>
                    </ul>
                    <p
                        class="mb-0 alert alert-info px-2 py-1"
                        v-else
                    >
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.narrower.empty') }}
                    </p>
                </div>
            </div>
            <div class="col-md-6 h-100 d-flex flex-column">
                <div class="labels col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.label.title') }}
                        <span
                            v-show="state.prefLabelCount < state.languages.length"
                            :title="t('detail.label.info_label_missing')"
                        >
                            <i class="fas fa-fw fa-info-circle"></i>
                        </span>
                    </h5>
                    <form
                        role="form"
                        class="mb-2"
                        @submit.prevent="addLabel()"
                    >
                        <div class="input-group">
                            <button
                                class="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
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
                                <a
                                    class="dropdown-item d-flex gap-2"
                                    href=""
                                    @click.prevent="setLanguageFor('label', language)"
                                    v-for="language in state.languages"
                                    :key="`label-language-item-${language.short_name}`"
                                >
                                    <span>
                                        {{ emojiFlag(language.short_name) }}
                                    </span>
                                    <span>
                                        {{ language.display_name }}
                                    </span>
                                </a>
                            </div>
                            <input
                                type="text"
                                class="form-control"
                                v-model="state.addLabel.value"
                            >
                            <button
                                class="btn btn-success"
                                type="submit"
                                :disabled="!state.addLabelValidated"
                            >
                                <i class="fas fa-fw fa-plus"></i>
                            </button>
                        </div>
                    </form>
                    <ul
                        class="list-group list-group-xs col of-hidden pe-0 scroll-y-auto"
                        v-if="state.hasLabels"
                    >
                        <li
                            class="list-group-item"
                            style="padding: 0 !important;"
                            v-for="(label, i) in state.concept.labels"
                            :key="`labels-${state.concept.id}-${i}`"
                        >
                            <ConceptLabelInput
                                class="col px-3 py-2"
                                :concept="state.concept"
                                :label="label"
                                :tree="state.tree"
                            />
                        </li>
                    </ul>
                    <p
                        class="mb-0 alert alert-info px-2 py-1"
                        v-else
                    >
                        <i class="fas fa-fw fa-times"></i>
                        {{ t('detail.label.empty') }}
                    </p>
                </div>
                <div class="notes col px-0 d-flex flex-column mb-2 of-hidden">
                    <h5>
                        {{ t('detail.note.title') }}
                    </h5>
                    <form
                        role="form"
                        class="mb-2"
                        @submit.prevent="addNote(state.addNote)"
                    >
                        <div class="input-group">
                            <button
                                class="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
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
                                <a
                                    class="dropdown-item d-flex gap-2"
                                    href=""
                                    @click.prevent="setLanguageFor('note', language)"
                                    v-for="language in state.languages"
                                    :key="`note-language-item-${language.short_name}`"
                                >
                                    <span>
                                        {{ emojiFlag(language.short_name) }}
                                    </span>
                                    <span>
                                        {{ language.display_name }}
                                    </span>
                                </a>
                            </div>
                            <input
                                type="text"
                                class="form-control"
                                v-model="state.addNote.value"
                            >
                            <button
                                class="btn btn-success"
                                type="submit"
                                :disabled="!state.addNoteValidated"
                            >
                                <i class="fas fa-fw fa-plus"></i>
                            </button>
                        </div>
                    </form>
                    <ul
                        class="list-group list-group-xs col of-hidden pe-0 scroll-y-auto"
                        v-if="state.hasNotes"
                    >
                        <li
                            class="list-group-item d-flex flex-row justify-content-between align-items-center gap-2"
                            v-for="(note, i) in state.concept.notes"
                            @mouseenter="setHoverState('notes', i, true)"
                            @mouseleave="setHoverState('notes', i, false)"
                            :key="`note-${state.concept.id}-${i}`"
                        >
                            <span class="col">
                                <span v-if="!(state.editNote.active && state.editNote.index === i)">
                                    {{ note.content }}
                                </span>
                                <form
                                    v-else
                                    class="d-flex flex-row align-items-center"
                                    @submit.prevent="updateNote()"
                                >
                                    <input
                                        v-model="state.editNote.value"
                                        type="text"
                                        class="form-control"
                                    >
                                    <button
                                        type="submit"
                                        class="btn btn-outline-success btn-sm ms-2"
                                    >
                                        <i class="fas fa-fw fa-check"></i>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-outline-danger btn-sm ms-2"
                                        @click="cancelUpdateNote()"
                                    >
                                        <i class="fas fa-fw fa-ban"></i>
                                    </button>
                                </form>
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
                    <p
                        class="mb-0 alert alert-info px-2 py-1"
                        v-else
                    >
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
        onMounted,
        reactive,
        watch,
    } from 'vue';

    import {
        useRoute,
        onBeforeRouteUpdate,
    } from 'vue-router';

    import { useI18n } from 'vue-i18n';

    import useConceptStore from '@/bootstrap/stores/concept.js';
    import useLanguageStore from '@/bootstrap/stores/language.js';

    import { useToast } from '@/plugins/toast.js';

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

    import ConceptLabelInput from '@/components/concept/ConceptLabelInput.vue';

    export default {
        components: {
            ConceptLabelInput
        },
        setup(props, context) {
            const { t } = useI18n();
            const route = useRoute();
            const toast = useToast();
            const conceptStore = useConceptStore();
            const languageStore = useLanguageStore();

            const resetLanguageToDefault = _ => {
                state.addLabel.language = languageStore.activeLanguage;
                state.addNote.language = languageStore.activeLanguage;
            };
            const isHovered = (prop, index) => {
                switch(prop) {
                    case 'labels':
                    case 'notes':
                    case 'broaders':
                    case 'narrowers':
                        return state.hoverStates[prop][index];
                    default:
                        return false;
                }
            };
            const setHoverState = (prop, index, hoverState) => {
                switch(prop) {
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
                if(!e.option) return;
                conceptStore.addRelation(state.concept.id, e.option.id, state.tree);
            };
            const handleAddNarrower = e => {
                if(!e.option) return;
                conceptStore.addRelation(e.option.id, state.concept.id, state.tree);
            };
            const handleAddNewConcept = e => {
                showCreateConcept(state.tree, state.concept.id, e.content);
            };
            const updateTopLevelState = _ => {
                if(!state.canDeleteBroader && state.isTopConcept) return;

                state.updatingTopLevelState = true;
                conceptStore.toggleTopLevelState(state.concept.id, state.tree).then(_ => {
                    state.updatingTopLevelState = false;
                });
            };
            const removeBroader = idx => {
                const broader = state.concept.broaders[idx];
                if(!broader || !state.canDeleteBroader) return;
                conceptStore.removeRelation(state.concept.id, broader.id, state.tree);
            };

            const canRemoveNarrower = narrower => {
                return narrower.broaders_count > 1 || (narrower.broaders_count > 0 && narrower.is_top_concept);
            }
            const removeNarrower = narrower => {
                if(!canRemoveNarrower(narrower)) return;
                conceptStore.removeRelation(narrower.id, state.concept.id, state.tree);
            };
            const setLanguageFor = (type, lang) => {
                let property = '';
                if(type == 'label') {
                    property = 'addLabel';
                } else if(type == 'note') {
                    property = 'addNote';
                } else {
                    return;
                }
                state[property].language = lang;
            };
            const setEditMode = (type, idx, editState) => {
                if(type == 'note') {
                    if(editState) {
                        state.editNote.index = idx;
                        const note = state.concept.notes[idx];
                        state.editNote.value = note.content;
                        // disableEditLabel();
                    } else {
                        state.editNote.index = -1;
                        state.editNote.value = null;
                    }
                    state.editNote.active = editState;
                } else {
                    console.error("Unknown edit type:", type);
                    return;
                }
            };
            const resetLabel = _ => {
                // state.addLabel.language = {};
                state.addLabel.value = '';
            };
            const addLabel = _ => {
                conceptStore.addLabel(state.concept.id, state.tree, state.addLabel.value, state.addLabel.language.id).then(_ => {
                    resetLabel();
                });
            };

            const resetNote = _ => {
                // state.addNote.language = {};
                state.addNote.value = '';
            };
            const addNote = _ => {
                conceptStore.addNote(state.concept.id, state.tree, state.addNote.value, state.addNote.language.id).then(_ => {
                    resetNote();
                });
            };
            const updateNote = _ => {
                const note = state.concept.notes[state.editNote.index];
                if(note.content == state.editNote.value) {
                    return;
                }
                conceptStore.patchNote(state.concept.id, state.tree, note.id, state.editNote.value).then(_ => {
                    setEditMode('note', state.editNote.index, false);
                });
            };
            const cancelUpdateNote = _ => {
                setEditMode('note', state.editNote.index, false);
            };
            const deleteNote = id => {
                const note = state.concept.notes.find(n => n.id == id);
                conceptStore.deleteNote(state.concept.id, state.tree, id).then(_ => {
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
                } catch(err) {
                    console.error(err);
                }
            };

            function sortByLabels(list) {
                return list.toSorted((a, b) => {
                    const labelA = getLabel(a).toLowerCase();
                    const labelB = getLabel(b).toLowerCase();
                    return labelA.localeCompare(labelB);
                });
            }

            // DATA
            const state = reactive({
                // initialized: false,
                addLabel: {
                    language: {},
                },
                addNote: {
                    language: {},
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
                concept: computed(_ => conceptStore.selected.data),
                tree: computed(_ => conceptStore.selected.from),
                isTopConcept: computed(_ => state.concept.is_top_concept),
                hasBroaders: computed(_ => state.concept.broaders && state.concept.broaders.length > 0),
                canDeleteBroader: computed(_ => state.hasBroaders && (state.concept.broaders.length >= 2 || state.isTopConcept)),
                hasNarrowers: computed(_ => state.concept.narrowers && state.concept.narrowers.length > 0),
                hasLabels: computed(_ => state.concept.labels && state.concept.labels.length > 0),
                hasNotes: computed(_ => state.concept.notes && state.concept.notes.length > 0),
                label: computed(_ => getLabel(state.concept)),
                languages: computed(_ => languageStore.languages),
                prefLabelCount: computed(_ => {
                    if(!state.hasLabels) {
                        return 0;
                    }
                    return state.concept.labels.filter(l => {
                        return l.concept_label_type == 1;
                    }).length;
                }),
                badgeClass: computed(_ => {
                    if(state.tree == 'sandbox') {
                        return 'bg-secondary';
                    } else {
                        return 'bg-primary';
                    }
                })
            });

            // ON MOUNTED
            onMounted(_ => {
                resetLanguageToDefault();
            });

            // WATCHER
            watch(_ => languageStore.activeLanguage,
                (newLang, oldLang) => {
                    if(newLang == oldLang) return;
                    state.addLabel.language = newLang;
                    state.addNote.language = newLang;
                }
            );

            // Resets the language to default when moving to a different concept.
            onBeforeRouteUpdate(async (to, from) => {
                if(to.params.id == from.params.id) return;
                resetLanguageToDefault();
            });

            // RETURN
            return {
                t,
                // HELPERS
                emojiFlag,
                gotoConcept,
                getLabel,
                // LOCAL
                addLabel,
                addNote,
                cancelUpdateNote,
                canRemoveNarrower,
                copyToClipboard,
                deleteNote,
                handleAddBroader,
                handleAddNarrower,
                handleAddNewConcept,
                isHovered,
                removeBroader,
                removeNarrower,
                setEditMode,
                setHoverState,
                setLanguageFor,
                sortByLabels,
                updateNote,
                updateTopLevelState,
                // Data
                state,
                conceptStore,
            };
        }
    }
</script>
