<template>
    <div :ref="el => nodeRef = el" @dragenter="onDragEnter" @dragleave="onDragLeave"
        :id="`${data.tree}-tree-node-${data.id}`" v-show="!data.is_placeholder">
        <a href="" :id="`${data.tree}-tree-node-cm-toggle-${data.id}`" @click.prevent @contextmenu.stop.prevent="togglePopup()"
            class="text-body text-decoration-none disabled" data-bs-toggle="dropdown" data-bs-auto-close="true"
            aria-expanded="false" :data-path="join(data.path)">
            <span :class="{'fw-bold': state.isSelected}">
                {{ state.label }}
            </span>
        </a>
        <ul class="dropdown-menu" :id="`${data.tree}-tree-node-${data.id}-contextmenu`" v-if="state.ddVisible">
            <li>
                <h6 class="dropdown-header" @click.stop.prevent="" @dblclick.stop.prevent="">
                    {{ state.label }}
                </h6>
            </li>
            <li v-if="can('thesaurus_write')">
                <a class="dropdown-item py-2" href="#" @click.stop.prevent="onAdd()" @dblclick.stop.prevent="">
                    <i class="fas fa-fw fa-plus text-success"></i>
                    <span class="ms-2">
                        {{ t('tree.contextmenu.add') }}
                    </span>
                </a>
            </li>
            <li v-if="can('thesaurus_share')">
                <a class="dropdown-item py-2" href="#" @click.stop.prevent="onExport()" @dblclick.stop.prevent="">
                    <i class="fas fa-fw fa-upload text-primary"></i>
                    <span class="ms-2">
                        {{ t('tree.contextmenu.export') }}
                    </span>
                </a>
            </li>
            <li v-if="can('thesaurus_delete')">
                <a class="dropdown-item py-2" href="#" @click.stop.prevent="onDelete()" @dblclick.stop.prevent="">
                    <i class="fas fa-fw fa-trash text-danger"></i>
                    <span class="ms-2">
                        {{ t('tree.contextmenu.delete') }}
                    </span>
                </a>
            </li>
            <li v-if="can('thesaurus_write')">
                <a class="dropdown-item py-2" :class="state.disabledAnchorClasses" href="#" @click.stop.prevent="onRemoveRelation()"
                    @dblclick.stop.prevent="">
                    <i class="fas fa-fw fa-times text-danger"></i>
                    <span class="ms-2" v-if="state.hasParent" v-html="t('tree.contextmenu.remove_relation_to', {parent: state.parentLabel})" />
                    <span class="ms-2" v-else v-html="t('tree.contextmenu.remove_relation_as_tlc')" />
                </a>
            </li>
        </ul>
    </div>
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

    import {
        Dropdown,
    } from 'bootstrap';

    import { useI18n } from 'vue-i18n';

    import { getNodeFromPath } from 'tree-component';

    import store from '@/bootstrap/store.js';

    import {
        removeRelation,
    } from '@/api.js';

    import {
        showCreateConcept,
        showDeleteConcept,
    } from '@/helpers/modal.js';

    import {
        getLabel,
        exportTree,
        toggleTreeNode,
    } from '@/helpers/tree.js';

    import {
        can,
        _debounce,
    } from '@/helpers/helpers.js';

    import {
        join,
    } from '@/helpers/filters.js';

    export default {
        props: {
            data: {
                required: true,
                type: Object
            }
        },
        emits: ['toggle'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                data,
            } = toRefs(props);

            // FETCH

            // FUNCTIONS
            const doToggle = _ => {
                toggleTreeNode(data.value, data.value.tree);
            };
            const hidePopup = _ => {
                state.bsElem.hide();
                state.bsElem.dispose();
                state.bsElem = null;
                state.ddVisible = false;
            };
            const showPopup = _ => {
                state.ddVisible = true;
                nextTick(_ => {
                    // To prevent opening the dropdown on normal click on Node,
                    // the DD toggle must have class 'disabled'
                    // This also prevents BS API call .show() to work...
                    // Thus we remove the 'disabled' class before the API call and add it back afterwards
                    state.bsElem = new Dropdown(state.ddDomElem);
                    state.ddDomElem.classList.remove('disabled');
                    state.bsElem.show();
                    state.ddDomElem.classList.add('disabled');
                })
            };
            const togglePopup = _ => {
                if(state.ddVisible) {
                    hidePopup();
                } else {
                    showPopup();
                }
            };
            const onDragEnter = _ => {
                state.asyncToggle.cancel();
                state.asyncToggle();
            };
            const onDragLeave = _ => {
                state.asyncToggle.cancel();
            };
            const onAdd = _ => {
                if(!can('thesaurus_write')) return;

                showCreateConcept(data.value.tree, data.value.id);
            };
            const onExport = _ => {
                if(!can('thesaurus_share')) return;

                exportTree(data.value.tree, data.value.id);
            };
            const onDelete = _ => {
                if(!can('thesaurus_delete')) return;

                showDeleteConcept(data.value.tree, data.value.id);
            };
            const onRemoveRelation = _ => {
                if(!can('thesaurus_write') || !state.canDeleteBroader) return;

                const narrower_id = data.value.nid || data.value.id;
                const broader_id = state.parent.nid || parent.id;
                removeRelation(narrower_id, broader_id, data.value.tree);
            };

            // DATA
            const nodeRef = ref({});
            const state = reactive({
                ddDomElem: null,
                bsElem: null,
                ddVisible: false,
                label: computed(_ => getLabel(data.value)),
                concept: computed(_ => store.getters.selectedConcept.data),
                isTopConcept: computed(_ => state.concept.is_top_concept),
                hasBroaders: computed(_ => state.concept.broaders && state.concept.broaders.length > 0),
                canDeleteBroader: computed(_ => state.hasBroaders && (state.concept.broaders.length >= 2 || state.isTopConcept)),
                hasParent: computed(_ => !!state.parent),
                parent: computed(_ => {
                    if(!nodeRef) return;

                    const path = nodeRef.value.parentElement.getAttribute('data-path').split(',');
                // pop element itself, because we want parent node
                    path.pop();
                    if(path.length == 0) return;
                    return getNodeFromPath(store.getters.conceptsFromTree(data.value.tree), path);
                }),
                parentLabel: computed(_ => getLabel(state.parent)),
                isSelected: computed(_ => state.concept && state.concept.id === data.value.nid),
                asyncToggle: computed(_ => _debounce(doToggle, 500)),
                disabledAnchorClasses: computed(_ => {
                    if(state.canDeleteBroader) {
                        return [];
                    } else {
                        return [
                            'not-allowed-handle',
                            'text-muted',
                            'bg-transparent',
                        ];
                    }
                }),
            });

            // ON MOUNTED
            onMounted(_ => {
                state.ddDomElem = document.getElementById(`${data.value.tree}-tree-node-cm-toggle-${data.value.id}`);
                state.ddDomElem.addEventListener('hidden.bs.dropdown', _ => {
                    hidePopup();
                });
            });

            // RETURN
            return {
                t,
                // HELPERS
                can,
                join,
                // LOCAL
                togglePopup,
                onDragEnter,
                onDragLeave,
                onAdd,
                onExport,
                onDelete,
                onRemoveRelation,
                // PROPS
                data,
                // STATE
                nodeRef,
                state,
            };
        },
        // methods: {
        //     onDragEnter() {
        //         if(!this.data.dragAllowed()) return;
        //         this.asyncToggle.clear();
        //         this.asyncToggle();
        //     },
        //     onDragLeave(item) {
        //     },
        //     doToggle() {
        //         if(!this.data.state.opened && this.data.state.openable) {
        //             this.data.onToggle({data: this.data});
        //         }
        //     }
        // },
        // data() {
        //     return {
        //     }
        // },
        // computed: {
        //     asyncToggle() {
        //         return _debounce(this.doToggle, this.data.dragDelay || 500);
        //     },
        //     label() {
        //         return this.$getLabel(this.data);
        //     }
        // }
    }
</script>
