<template>
    <div class="d-flex flex-fill overflow-hidden">
        <div class="row h-100 overflow-hidden flex-grow-1">
            <div class="col-md-12 h-100">

                <div class="row h-100">
                    <ResizableColumns v-model="columns">
                        <!-- Left Column -->
                        <template #tree>
                            <div class="h-100 d-flex flex-row gap-4">
                                <concept-tree
                                    v-for="(tree, index) in state.activeTrees"
                                    :key="tree"
                                    class="flex-grow-1 overflow-y-auto"
                                    :drag-target="state.dragTarget"
                                    :tree-data="tree === 'sandbox' ? state.sandboxConcepts : state.projectConcepts"
                                    :tree-name="tree"
                                    @added="addConceptTo(tree)"
                                    @change-drag-target="changeDragTarget"
                                >
                                    <template #actions>
                                        <div
                                            v-if="!state.isColumns || index === 0"
                                            class="btn btn-sm"
                                            @click="state.isSandbox = !state.isSandbox"
                                            :class="(state.isSandbox) ? 'btn-primary' : 'btn-secondary-outline'"
                                        >
                                            <span v-if="state.isColumns">
                                                <i class="fas fa-fw fa-right-left" />
                                            </span>
                                            <span v-else>
                                                <i class="fas fa-fw fa-umbrella-beach" />
                                            </span>
                                        </div>
                                        <div
                                            v-if="!state.isColumns || index === 1"
                                            class="btn btn-sm"
                                            @click="state.isColumns = !state.isColumns"
                                            :class="(state.isColumns) ? 'btn-primary' : 'btn-secondary-outline'"
                                        >
                                            <span>
                                                <i class="fas fa-fw fa-table-columns"></i>
                                            </span>
                                        </div>
                                    </template>
                                    <template #title>
                                        <h4>
                                            {{ t(`tree.${tree}.title`) }}
                                        </h4>
                                    </template>
                                </concept-tree>
                            </div>
                        </template>

                        <!-- Right Column -->
                        <template #detail>
                            <div class="flex-fill h-100">
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
            </div>
        </div>
    </div>
</template>

<script>
    import {
        computed,
        onMounted,
        reactive,
    } from 'vue';

    import {useI18n} from 'vue-i18n';

    import store from '@/bootstrap/store.js';
    import {fetchTreeData} from '@/api.js';

    import {ResizableColumns} from 'dhc-components';

    export default {
        components: {
            ResizableColumns
        },
        setup(props, context) {
            const {t} = useI18n();

            // FUNCTIONS
            const changeDragTarget = e => {
                state.dragTarget = e;
            };

            // DATA
            const state = reactive({
                isColumns: false,
                isSandbox: false,
                activeTrees: computed(_ => {
                    let columns = ['project', 'sandbox'];
                    if(state.isSandbox) {
                        columns.reverse();
                    }
                    return (state.isColumns) ? columns : [columns[0]];
                }),
                sandboxConcepts: computed(_ => store.getters.sandboxConcepts),
                projectConcepts: computed(_ => store.getters.projectConcepts),
                concept: computed(_ => store.getters.selectedConcept),
                conceptSelected: computed(_ => state.concept.from != null && Object.keys(state.concept.data || {}).length > 0),
            });

            onMounted(_ => {
                fetchTreeData();
            })

            const columns = reactive([{
                name: 'tree',
                width: 300,
                minWidth: 100,
                maxWidth: 500,
            }, {
                name: 'detail',
                width: 700,
            }])

            // RETURN
            return {
                t,
                // HELPERS
                // LOCAL
                changeDragTarget,
                // PROPS
                // STATE
                state,
                columns,
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


<style scoped>
    .fade-in {
        animation: slide-in 0.5s ease-out;
    }


    @keyframes slide-in {
        0% {
            transform: translateX(-100%);
        }

        100% {
            transform: translateX(0);
        }
    }
</style>