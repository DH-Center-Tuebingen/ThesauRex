<template>
    <div
        :ref="el => nodeRef = el"
        @dragenter="onDragEnter"
        @dragleave="onDragLeave"
        :id="`${data.tree}-tree-node-${data.id}`"
        class="dropdown"
        v-show="!data.is_placeholder"
    >
        <a
            href=""
            :id="`${data.tree}-tree-node-cm-toggle-${data.id}`"
            @click.prevent
            @contextmenu.stop.prevent="togglePopup()"
            class="text-body text-decoration-none disabled"
            data-bs-toggle="dropdown"
            :data-path="join(data.path)"
        >
            <span :class="{ 'fw-bold': data.isSelected() }">
                {{ data.getLabel() }}
            </span>
        </a>
        <ul
            class="dropdown-menu"
            :id="`${data.tree}-tree-node-${data.id}-contextmenu`"
        >
            <li>
                <h6
                    class="dropdown-header"
                    @click.stop.prevent=""
                    @dblclick.stop.prevent=""
                >
                    {{ data.getLabel() }}
                </h6>
            </li>
            <li v-if="can('thesaurus_write')">
                <a
                    class="dropdown-item py-2"
                    href="#"
                    @click.stop.prevent="exec(onAdd)"
                    @dblclick.stop.prevent=""
                >
                    <i class="fas fa-fw fa-plus text-success"></i>
                    <span class="ms-2">
                        {{ t('tree.contextmenu.add') }}
                    </span>
                </a>
            </li>
            <li v-if="can('thesaurus_share')">
                <a
                    class="dropdown-item py-2"
                    href="#"
                    @click.stop.prevent="exec(onExport)"
                    @dblclick.stop.prevent=""
                >
                    <i class="fas fa-fw fa-upload text-primary"></i>
                    <span class="ms-2">
                        {{ t('tree.contextmenu.export') }}
                    </span>
                </a>
            </li>
            <li v-if="can('thesaurus_delete')">
                <a
                    class="dropdown-item py-2"
                    href="#"
                    @click.stop.prevent="exec(onDelete)"
                    @dblclick.stop.prevent=""
                >
                    <i class="fas fa-fw fa-trash text-danger"></i>
                    <span class="ms-2">
                        {{ t('tree.contextmenu.delete') }}
                    </span>
                </a>
            </li>
            <li v-if="can('thesaurus_write')">
                <a
                    class="dropdown-item py-2"
                    :class="state.disabledAnchorClasses"
                    href="#"
                    @click.stop.prevent="exec(onRemoveRelation)"
                    @dblclick.stop.prevent=""
                >
                    <i class="fas fa-fw fa-times text-danger"></i>
                    <span
                        class="ms-2"
                        v-if="state.hasParent"
                        v-html="t('tree.contextmenu.remove_relation_to', { parent: state.parentLabel })"
                    />
                    <span
                        class="ms-2"
                        v-else
                        v-html="t('tree.contextmenu.remove_relation_as_tlc')"
                    />
                </a>
            </li>
        </ul>
    </div>
</template>

<script>
    import {
        computed,
        nextTick,
        onBeforeUnmount,
        onMounted,
        reactive,
        ref,
    } from 'vue';

    import {
        Dropdown,
    } from 'bootstrap';

    import { useI18n } from 'vue-i18n';

    import { getNodeFromPath } from 'tree-component';

    import useConceptStore from '@/bootstrap/stores/concept.js';

    import {
        showCreateConcept,
        showDeleteConcept,
    } from '@/helpers/modal.js';

    import {
        getLabel,
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
            const conceptStore = useConceptStore();

            // FETCH

            // FUNCTIONS
            const doToggle = async _ => {
                console.log("Toggling node", props.data.nid, props.data.tree);
                await props.data.toggle();
                context.emit('Ended');
            };
            const hidePopup = _ => {
                state.bsElem.hide();
                state.ddVisible = false;

                nodeRef.value.classList.add('disabled');
            };
            const showPopup = _ => {
                state.ddVisible = true;
                nextTick(_ => {
                    // To prevent opening the dropdown on normal click on Node,
                    // the DD toggle must have class 'disabled'
                    // This also prevents BS API call .show() to work...
                    // Thus we remove the 'disabled' class before the API call and add it back on hide
                    nodeRef.value.classList.remove('disabled');
                    state.bsElem.show();
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

                showCreateConcept(props.data.tree, props.data.nid);
            };
            const onExport = _ => {
                if(!can('thesaurus_share')) return;

                conceptStore.export(props.data.tree, props.data.id);
            };
            const onDelete = _ => {
                if(!can('thesaurus_delete')) return;

                showDeleteConcept(props.data.tree, props.data.nid);
            };
            const onRemoveRelation = _ => {
                if(!can('thesaurus_write') || !props.data.canDeleteBroader) return;

                const narrower_id = props.data.nid || props.data.id;
                const broader_id = state.parent.nid || parent.id;
                conceptStore.removeRelation(narrower_id, broader_id, props.data.tree);
            };

            const exec = fn => {
                fn();
                hidePopup();
            };

            // DATA
            const nodeRef = ref({});
            const state = reactive({
                bsElem: null,
                ddVisible: false,
                label: computed(_ => getLabel(props.data)),
                hasParent: computed(_ => !!state.parent),
                parent: computed(_ => {
                    if(!nodeRef || !nodeRef.value.parentElement) return;

                    const path = nodeRef.value.parentElement.getAttribute('data-path').split(',');
                    // pop element itself, because we want parent node
                    path.pop();
                    if(path.length == 0) return;
                    
                    return getNodeFromPath(conceptStore.tree[props.data.tree], path);
                }),
                parentLabel: computed(_ => getLabel(state.parent)),
                asyncToggle: computed(_ => _debounce(doToggle, 500)),
                disabledAnchorClasses: computed(_ => {
                    if(props.data.canDeleteBroader) {
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

            let closeDropdown = _ => {
                if(state.bsElem) {
                    state.bsElem.hide();
                }
            };
            closeDropdown = closeDropdown.bind(this);

            // ON MOUNTED
            onMounted(_ => {
                nodeRef.value.addEventListener('hidden.bs.dropdown', _ => {
                    hidePopup();
                });
                state.bsElem = new Dropdown(nodeRef.value);

                window.document.body.addEventListener('click', closeDropdown);
            });

            onBeforeUnmount(_ => {
                window.document.body.removeEventListener('click', closeDropdown);
            });

            // RETURN
            return {
                t,
                // HELPERS
                can,
                join,
                // LOCAL
                exec,
                togglePopup,
                onDragEnter,
                onDragLeave,
                onAdd,
                onExport,
                onDelete,
                onRemoveRelation,
                // STATE
                nodeRef,
                state,
            };
        },
    }
</script>
