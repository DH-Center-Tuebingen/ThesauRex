<template>
    <div class="row h-100 of-hidden" v-if="dataLoaded">
        <div class="col-md-3 d-flex flex-column">
            <h4>Sandbox Tree</h4>
            <concept-tree
                :event-bus="eventBus"
                :tree-data="sandbox.concepts"
                :tree-name="'sandbox'">
            </concept-tree>
        </div>
        <div class="col-md-3 d-flex flex-column">
            <h4>Project Tree</h4>
            <concept-tree
                :event-bus="eventBus"
                :tree-data="concepts"
                :tree-name="''">
            </concept-tree>
        </div>
        <div class="col-md-6">
            <router-view
                @label-update="handleLabelUpdate"
            ></router-view>
        </div>
    </div>
</template>

<script>
    export default {
        beforeRouteEnter(to, from, next) {
            let projectConcepts;
            $httpQueue.add(() => $http.get('tree?t=').then(response => {
                projectConcepts = response.data;
                return $http.get('tree?t=sandbox');
                }).then(response => {
                    next(vm => vm.init(projectConcepts, response.data));
                })
            );
        },
        mounted() {
            this.eventBus.$on('concept-clicked', this.handleConceptClick);
        },
        methods: {
            init(projectData, sandboxData) {
                this.concepts = [];
                projectData.forEach(d => {
                    this.concepts.push(d);
                });
                sandboxData.forEach(d => {
                    this.sandbox.concepts.push(d);
                });
                this.dataLoaded = true;
            },
            handleLabelUpdate(e) {
                console.log("Label updated!");
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
