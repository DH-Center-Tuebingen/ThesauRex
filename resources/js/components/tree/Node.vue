<!-- eslint-disable vue/multi-word-component-names -->
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
            @contextmenu.stop.prevent="openContextMenu()"
            class="text-body text-decoration-none disabled"
            data-bs-toggle="dropdown"
            :data-path="join(data.path)"
        >
            <span :class="{ selected: state.isSelected, 'fw-bold': state.isSelected }">
                {{ state.label }}
            </span>
        </a>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
        ref,
    } from 'vue';




    import { getNodeFromPath } from 'tree-component';

    import store from '@/bootstrap/store.js';

    import {
        getLabel,
        exportTree,
        toggleTreeNode,
    } from '@/helpers/tree.js';

    import {
        debounce,
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

            // FETCH

            // FUNCTIONS
            const openContextMenu = _ => {
                store.dispatch('contextMenu/toggleActive');
            };

            const onDragEnter = _ => {
                state.asyncToggle.cancel();
                state.asyncToggle();
            };
            const onDragLeave = _ => {
                state.asyncToggle.cancel();
            };


            // DATA
            const nodeRef = ref({});
            const state = reactive({
                ddDomElem: null,
                bsElem: null,
                ddVisible: false,
                label: computed(_ => getLabel(props.data)),
                concept: computed(_ => store.getters.selectedConcept.data),
                isTopConcept: computed(_ => state.concept.is_top_concept),
                hasBroaders: computed(_ => state.concept.broaders && state.concept.broaders.length > 0),
                canDeleteBroader: computed(_ => state.hasBroaders && (state.concept.broaders.length >= 2 || state.isTopConcept)),
                hasParent: computed(_ => !!state.parent),
                parent: computed(_ => {
                    if(!nodeRef.value || !nodeRef.value.parentElement) return;

                    const path = nodeRef.value.parentElement.getAttribute('data-path').split(',');
                    // pop element itself, because we want parent node
                    path.pop();
                    if(path.length == 0) return;
                    return getNodeFromPath(store.getters.conceptsFromTree(props.data.tree), path);
                }),
                parentLabel: computed(_ => getLabel(state.parent)),
                isSelected: computed(_ => state.concept && state.concept.id === props.data.nid),
                asyncToggle: computed(_ => debounce(() => toggleTreeNode(props.data, props.data.tree), 500)),
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

            // RETURN
            return {
                // HELPERS
                join,
                // LOCAL
                onDragEnter,
                onDragLeave,
                openContextMenu,
                // STATE
                nodeRef,
                state,
            };
        },

    }
</script>
