<template>
    <div class="row h-100 of-hidden" v-if="dataLoaded">
        <div class="col-md-3 d-flex flex-column">
            <h4>
                {{ $t('tree.sandbox.title') }}
            </h4>
            <concept-tree
                :event-bus="eventBus"
                :tree-data="sandbox.concepts"
                :tree-name="'sandbox'"
                @request-concept="openNewConceptModal">
            </concept-tree>
        </div>
        <div class="col-md-3 d-flex flex-column">
            <h4>
                {{ $t('tree.project.title') }}
            </h4>
            <concept-tree
                :event-bus="eventBus"
                :tree-data="concepts"
                :tree-name="''"
                @request-concept="openNewConceptModal">
            </concept-tree>
        </div>
        <div class="col-md-6">
            <router-view
                :event-bus="eventBus"
                :languages="languages"
                @request-concept="openNewConceptModal"
            ></router-view>
        </div>
    </div>
</template>

<script>
    import NewConceptModal from './modals/NewConceptModal.vue';

    export default {
        beforeRouteEnter(to, from, next) {
            let projectConcepts, sandboxConcepts;
            $httpQueue.add(() => $http.get('tree?t=').then(response => {
                projectConcepts = response.data;
                return $http.get('tree?t=sandbox');
                }).then(response => {
                    sandboxConcepts = response.data
                    return $http.get(`language`);
                }).then(response => {
                    next(vm => vm.init(projectConcepts, sandboxConcepts, response.data));
                })
            );
        },
        mounted() {
            this.eventBus.$on('concept-clicked', this.handleConceptClick);
        },
        methods: {
            init(projectData, sandboxData, languages) {
                this.languages = [];
                languages.forEach(l => {
                    this.languages.push(l);
                });
                this.concepts = [];
                projectData.forEach(d => {
                    this.concepts.push(d);
                });
                sandboxData.forEach(d => {
                    this.sandbox.concepts.push(d);
                });
                this.dataLoaded = true;
            },
            openNewConceptModal(e) {
                const opts = {
                    languages: this.languages,
                    onSubmit: c => this.createNewConceptModal(c)
                };
                const props = Object.assign({}, e, opts);
                this.$modal.show(NewConceptModal, props);
            },
            createNewConceptModal(concept) {
                let data = {
                    label: concept.label,
                    language_id: concept.language.id
                };
                if(concept.parent) {
                    data.parent_id = concept.parent.id;
                }
                $httpQueue.add(() => $http.put(`/tree/concept?t=${concept.tree}`, data).then(response => {
                    this.eventBus.$emit(`concept-created-${concept.tree}`, {
                        parent_id: concept.parent ? concept.parent.id : undefined,
                        concept: response.data
                    });
                }));
            },
            handleConceptClick(e) {
                this.$router.push({
                    name: 'conceptdetail',
                    params: {
                        id: e.id
                    },
                    query: Object.assign({}, this.$route.query, {
                        t: e.from
                    })
                });
            }
        },
        data() {
            return {
                dataLoaded: false,
                concepts: [],
                eventBus: new Vue(),
                languages: [],
                // selectedConcept: {
                //     from: '',
                //     element: {}
                // },
                sandbox: {
                    concepts: []
                }
            }
        }
    }
</script>
