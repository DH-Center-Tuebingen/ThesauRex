<template>
    <div class="row h-100 of-hidden">
        <div class="col-md-3 h-100 d-flex flex-column">
            <h4>
                {{ t('tree.sandbox.title') }}
            </h4>
            <concept-tree
                class="flex-grow-1 of-hidden"
                :drag-target="state.dragTarget"
                :tree-data="state.sandboxConcepts"
                :tree-name="'sandbox'"
                @added="addConceptTo('sandbox')"
                @change-drag-target="changeDragTarget">
            </concept-tree>
        </div>
        <div class="col-md-3 h-100 d-flex flex-column">
            <h4>
                {{ t('tree.project.title') }}
            </h4>
            <concept-tree
                class="flex-grow-1 of-hidden"
                :drag-target="state.dragTarget"
                :tree-data="state.projectConcepts"
                :tree-name="'project'"
                @added="addConceptTo('project')"
                @change-drag-target="changeDragTarget">
            </concept-tree>
        </div>
        <div class="col-md-6 h-100">
            <router-view
                @added="addConceptTo('selection')"
            ></router-view>
            <div v-if="!state.conceptSelected" class="alert alert-info">
                {{ t('tree.detail.none_selected') }}
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

    import { useI18n } from 'vue-i18n';

    import store from '@/bootstrap/store.js';

    export default {
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const changeDragTarget = e => {
                state.dragTarget = e;
            };

            // DATA
            const state = reactive({
                sandboxConcepts: computed(_ => store.getters.sandboxConcepts),
                projectConcepts: computed(_ => store.getters.projectConcepts),
                concept: computed(_ => store.getters.selectedConcept),
                conceptSelected: computed(_ => state.concept.from != null && Object.keys(state.concept.data || {}).length > 0),
            });

            // RETURN
            return {
                t,
                // HELPERS
                // LOCAL
                changeDragTarget,
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
