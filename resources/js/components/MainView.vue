<template>
    <div class="row h-100 of-hidden">
        <ResizableColumns v-model="columns">
            <!-- Left Column -->
            <template #tree>
                <div class="d-flex h-100 gap-4 p-3 pb-0">
                    <div
                        v-if="state.showSandbox"
                        class="h-100 col d-flex flex-row gap-4"
                        style="width: 0;"
                    >
                        <concept-tree
                            class="flex-grow-1 of-hidden"
                            :drag-target="state.dragTarget"
                            :tree-data="state.sandboxConcepts"
                            :tree-name="'sandbox'"
                            @added="addConceptTo('sandbox')"
                            @change-drag-target="changeDragTarget"
                            @toggle-sandbox="toggleSandbox"
                        >
                            <template #title>
                                <h4 class="my-0 text-truncate">
                                    {{ t('tree.sandbox.title') }}
                                </h4>
                            </template>
                        </concept-tree>
                    </div>
                    <div
                        class="h-100 col d-flex flex-column"
                        style="width: 0;"
                    >
                        <concept-tree
                            class="flex-fill h-100"
                            :drag-target="state.dragTarget"
                            :tree-data="state.projectConcepts"
                            :tree-name="'project'"
                            @added="addConceptTo('project')"
                            @change-drag-target="changeDragTarget"
                            @toggle-sandbox="toggleSandbox"
                        >
                            <template #title>
                                <h4 class="my-0 text-truncate">
                                    {{ t('tree.project.title') }}
                                </h4>
                            </template>
                        </concept-tree>
                    </div>
                </div>
            </template>

            <!-- Right Column -->
            <template #detail>
                <div class="h-100 p-3">
                    <router-view
                        v-if="state.conceptSelected"
                        @added="addConceptTo('selection')"
                    ></router-view>
                    <div
                        v-else
                        class="alert alert-info"
                    >
                        {{ t('detail.none_selected') }}
                    </div>
                </div>
            </template>
        </ResizableColumns>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
    } from 'vue';

    import {
        onBeforeRouteLeave,
        onBeforeRouteUpdate,
        useRoute,
    } from 'vue-router';
    
    import { useI18n } from 'vue-i18n';
    import { ResizableColumns } from 'dhc-components';

    import useConceptStore from '@/bootstrap/stores/concept.js';

    import useSystemChannel from '@/composables/system-channel.js';

    import {
        handleSystemMessageEvent,
        handleConceptAddedEvent,
        handleConceptDeletedEvent,
        handleConceptUpdatedEvent,
        handleConceptLabelAddedEvent,
        handleConceptLabelDeletedEvent,
        handleConceptLabelUpdatedEvent,
        handleConceptNoteAddedEvent,
        handleConceptNoteDeletedEvent,
        handleConceptNoteUpdatedEvent,
        handleConceptRelationAddedEvent,
        handleConceptRelationDeletedEvent,
        handleLanguageAddedEvent,
        handleLanguageDeletedEvent,
    } from '@/handlers/system.js';
    
    import { onMounted } from 'vue';

    export default {
        components: {
            ResizableColumns,
        },
        setup(props, context) {
            const { t } = useI18n();
            const conceptStore = useConceptStore();

            // FUNCTIONS
            const changeDragTarget = e => {
                state.dragTarget = e;
            };

            const toggleSandbox = _ => {
                state.showSandbox = !state.showSandbox;
            };

            // DATA
            const state = reactive({
                showSandbox: false,
                sandboxConcepts: computed(_ => conceptStore.tree.sandbox),
                projectConcepts: computed(_ => conceptStore.tree.project),
                concept: computed(_ => conceptStore.selected),
                conceptSelected: computed(_ => state.concept.from != null && Object.keys(state.concept.data || {}).length > 0),
            });

            const columns = reactive([{
                name: 'tree',
                width: 300,
                minWidth: 100,
                maxWidth: 500,
            }, {
                name: 'detail',
                width: 700,
            }]);

            useSystemChannel([
                handleSystemMessageEvent,
                handleConceptAddedEvent,
                handleConceptDeletedEvent,
                handleConceptUpdatedEvent,
                handleConceptLabelAddedEvent,
                handleConceptLabelDeletedEvent,
                handleConceptLabelUpdatedEvent,
                handleConceptNoteAddedEvent,
                handleConceptNoteDeletedEvent,
                handleConceptNoteUpdatedEvent,
                handleConceptRelationAddedEvent,
                handleConceptRelationDeletedEvent,
                handleLanguageAddedEvent,
                handleLanguageDeletedEvent,
            ])

            const currentRoute = useRoute();

            // Open only the paths. the concept will be selected in the concept detail.
            onMounted(async () => {
                if(currentRoute.params.id && currentRoute.query.t) {
                    await conceptStore.openAllConceptPaths(currentRoute.query.t, currentRoute.params.id);
                    await conceptStore.setSelected(currentRoute.params.id, currentRoute.query.t);
                }
            });

            onBeforeRouteUpdate(async (to, from) => {
                const fromTree = from.query.t || 'project';
                const toTree = to.query.t || 'project';
                if(toTree != fromTree || to.params.id != from.params.id) {
                    await conceptStore.setSelected(to.params.id, toTree);
                }
            });

            // ON BEFORE LEAVE
            onBeforeRouteLeave(async (to, from) => {
                await conceptStore.setSelected();
                return true;
            });

            // RETURN
            return {
                t,
                // HELPERS
                // LOCAL
                columns,
                changeDragTarget,
                toggleSandbox,
                // STATE
                state,
            };
        },
    }
</script>
