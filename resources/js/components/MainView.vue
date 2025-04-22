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
                        v-if="!state.conceptSelected"
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
        onMounted,
        reactive,
    } from 'vue';

    import {
        onBeforeRouteLeave,
    } from 'vue-router';

    import {useI18n} from 'vue-i18n';
    import {ResizableColumns} from 'dhc-components';

    import useConceptStore from '@/bootstrap/stores/concept.js';

    import {
        subscribeSystemChannel,
        unsubscribeSystemChannel,
        listenToList,
    } from '@/helpers/websocket.js';

    import {
        handleTestEvent,
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
        handleConceptRelationUpdatedEvent,
        handleLanguageAddedEvent,
        handleLanguageDeletedEvent,
        handleLanguageUpdatedEvent,
    } from '@/handlers/system.js';

    export default {
        components: {
            ResizableColumns,
        },
        setup(props, context) {
            const {t} = useI18n();
            const conceptStore = useConceptStore();

            // FUNCTIONS
            const changeDragTarget = e => {
                state.dragTarget = e;
            };

            const toggleSandbox =_ => {
                state.showSandbox = !state.showSandbox;
            };

            // DATA
            const state = reactive({
                showSandbox: false,
                sandboxConcepts: computed(_ => conceptStore.concepts.sandbox),
                projectConcepts: computed(_ => conceptStore.concepts.project),
                concept: computed(_ => conceptStore.concept),
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

            const channels = {};

            onMounted(_ => {
                channels.system = subscribeSystemChannel();
                listenToList(channels.system, [
                    handleTestEvent,
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
                    handleConceptRelationUpdatedEvent,
                    handleLanguageAddedEvent,
                    handleLanguageDeletedEvent,
                    handleLanguageUpdatedEvent,
                ]);
            });
            onBeforeRouteLeave((to, from) => {
                unsubscribeSystemChannel();
            });

            // RETURN
            return {
                t,
                // HELPERS
                // LOCAL
                columns,
                changeDragTarget,
                toggleSandbox,
                // PROPS
                // STATE
                state,
            };
        },
        // beforeRouteEnter(to, from, next) {
        //     let projectConcepts, sandboxConcepts;
        //     $httpQueue.add(() => $http.get('tree?t=').then(response => {
        //         projectConcepts = response.data;
        //         return $http.get('tree?t=sandbox');
        //         }).then(response => {
        //             sandboxConcepts = response.data
        //             return $http.get(`language`);
        //         }).then(response => {
        //             next(vm => vm.init(projectConcepts, sandboxConcepts, response.data));
        //         })
        //     );
        // },
        // mounted() {
        //     this.eventBus.$on('concept-clicked', this.handleConceptClick);
        // },
        // methods: {
        //     changeDragTarget(e) {
        //         this.dragTarget = e;
        //     },
        //     init(projectData, sandboxData, languages) {
        //         this.languages = [];
        //         languages.forEach(l => {
        //             this.languages.push(l);
        //         });
        //         this.concepts = [];
        //         projectData.forEach(d => {
        //             this.concepts.push(d);
        //         });
        //         sandboxData.forEach(d => {
        //             this.sandbox.concepts.push(d);
        //         });
        //         this.dataLoaded = true;
        //     },
        //     // openNewConceptModal(e) {
        //     //     const opts = {
        //     //         languages: this.languages,
        //     //         onSubmit: c => this.createNewConceptModal(c)
        //     //     };
        //     //     const props = Object.assign({}, e, opts);
        //     //     this.$modal.show(NewConceptModal, props);
        //     // },
        //     // createNewConceptModal(concept) {
        //     //     let data = {
        //     //         label: concept.label,
        //     //         language_id: concept.language.id
        //     //     };
        //     //     if(concept.parent) {
        //     //         data.parent_id = concept.parent.id;
        //     //     }
        //     //     $httpQueue.add(() => $http.put(`/tree/concept?t=${concept.tree}`, data).then(response => {
        //     //         this.eventBus.$emit(`concept-created-${concept.tree}`, {
        //     //             parent_id: concept.parent ? concept.parent.id : undefined,
        //     //             concept: response.data
        //     //         });
        //     //     }));
        //     // },
        //     handleConceptClick(e) {
        //         this.$router.push({
        //             name: 'conceptdetail',
        //             params: {
        //                 id: e.id
        //             },
        //             query: Object.assign({}, this.$route.query, {
        //                 t: e.from
        //             })
        //         });
        //     }
        // },
        // data() {
        //     return {
        //         dataLoaded: false,
        //         concepts: [],
        //         eventBus: new Vue(),
        //         languages: [],
        //         // selectedConcept: {
        //         //     from: '',
        //         //     element: {}
        //         // },
        //         sandbox: {
        //             concepts: []
        //         },
        //         dragTarget: {}
        //     }
        // }
    }
</script>
