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
                    <router-view @added="addConceptTo('selection')"></router-view>
                    <div
                        v-if="!conceptStore.isConceptSelected"
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

    import { useI18n } from 'vue-i18n';
    import { ResizableColumns } from 'dhc-components';

    import useConceptStore from '@/bootstrap/stores/concept.js';

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

    import useSystemChannel from '@/composables/system-channel';
    import useWebSocketConnectionToast from '../composables/websockets-connection.toast';

    export default {
        components: {
            ResizableColumns,
        },
        setup(props, context) {
            const { t } = useI18n();
            const conceptStore = useConceptStore();

            useWebSocketConnectionToast();

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
                sandboxConcepts: computed(_ => conceptStore.concepts.sandbox),
                projectConcepts: computed(_ => conceptStore.concepts.project),
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

            // RETURN
            return {
                t,
                // HELPERS
                // LOCAL
                columns,
                conceptStore,
                changeDragTarget,
                toggleSandbox,
                // STATE
                state,
            };
        },
    }
</script>
