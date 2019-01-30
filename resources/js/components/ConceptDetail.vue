<template>
    <div class="h-100 d-flex flex-column" v-if="dataLoaded">
        <h4 class="mb-0">
            {{ label }}
            <small>
                {{ $t('detail.title') }}
            </small>
        </h4>
        <div class="d-flex flex-row justify-content-start">
            <code id="concept-url" class="normal text-black-50">{{ concept.concept_url }}</code>
            <a href="" class="pl-2 text-secondary" @click.prevent="copyToClipboard('concept-url')">
                <i class="fas fa-fw fa-copy"></i>
            </a>
        </div>
        <hr class="w-100" />
        <div class="row h-100">
            <div class="col-md-6 d-flex flex-column">
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>
                        {{ $t('detail.broader.title') }}
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="">
                        <div class="form-group">
                            <concept-search
                                :concept="concept"
                                :tree-name="treeName"
                                @select="broaderSelected"
                                ></concept-search>
                        </div>
                    </form>
                    <ul class="list-group list-group-xs scroll-y-auto" v-if="concept.broaders.length">
                        <li class="list-group-item d-flex flex-row justify-content-between" v-for="(broader, i) in concept.broaders" @mouseenter="setHoverState('broaders', i, true)" @mouseleave="setHoverState('broaders', i, false)">
                            <a href="" @click.prevent="gotoConcept(broader.id)">
                                {{ broader.selectedLabel }}
                            </a>
                            <span v-show="hoverStates.broaders[i]" @click="removeBroader(i)">
                                <i class="fas fa-fw fa-times clickable"></i>
                            </span>
                        </li>
                    </ul>
                    <p v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ $t('detail.broader.empty') }}
                    </p>
                </div>
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>
                        {{ $t('detail.narrower.title') }}
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="">
                        <div class="form-group">
                            <concept-search
                                :add-new="true"
                                :concept="concept"
                                :tree-name="treeName"
                                @select="narrowerSelected"
                                ></concept-search>
                        </div>
                    </form>
                    <ul class="list-group list-group-xs scroll-y-auto" v-if="concept.narrowers.length">
                        <li class="list-group-item d-flex flex-row justify-content-between" v-for="(narrower, i) in concept.narrowers" @mouseenter="setHoverState('narrowers', i, true)" @mouseleave="setHoverState('narrowers', i, false)">
                            <a href="" @click.prevent="gotoConcept(narrower.id)">
                                {{ narrower.selectedLabel }}
                            </a>
                            <span v-show="hoverStates.narrowers[i]" @click="removeNarrower(i)">
                                <i class="fas fa-fw fa-times clickable"></i>
                            </span>
                        </li>
                    </ul>
                    <p v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ $t('detail.narrower.empty') }}
                    </p>
                </div>
            </div>
            <div class="col-md-6 d-flex flex-column">
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>
                        {{ $t('detail.label.title') }}
                        <span v-show="prefLabelCount < languages.length" data-toggle="popover" :data-content="$t('detail.label.info-label-missing')" data-trigger="hover" data-placement="bottom">
                            <i class="fas fa-fw fa-info-circle"></i>
                        </span>
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="addLabel(newLabel)">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span>
                                        {{ $ce.flag(newLabel.language.short_name) }}
                                    </span>
                                    <span>
                                        {{ newLabel.language.display_name }}
                                    </span>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" href="" @click.prevent="setPropertyLanguage(newLabel, language)" v-for="language in languages">
                                        <span>
                                            {{ $ce.flag(language.short_name) }}
                                        </span>
                                        <span>
                                            {{ language.display_name }}
                                        </span>
                                    </a>
                                </div>
                            </div>
                            <input type="text" class="form-control" v-model="newLabel.value">
                            <div class="input-group-append">
                                <button class="btn btn-outline-secondary btn-success" type="submit">
                                    <i class="fas fa-fw fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <ul class="list-group list-group-xs col of-hidden pr-0 scroll-y-auto" v-if="concept.labels.length">
                        <li class="list-group-item d-flex flex-row justify-content-between align-items-center" v-for="(label, i) in concept.labels" @mouseenter="setHoverState('labels', i, true)" @mouseleave="setHoverState('labels', i, false)">
                            <div class="col">
                                <span v-if="!(editLabel.active && editLabel.index === i)">
                                    {{ label.label }}
                                </span>
                                <div v-else class="d-flex flex-row align-items-center">
                                    <input type="text" class="form-control" v-model="editLabel.value" />
                                    <button type="button" class="btn btn-outline-success btn-sm ml-2" @click="confirmEditLabel(i)">
                                        <i class="fas fa-fw fa-check"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm ml-2" @click="disableEditMode()">
                                        <i class="fas fa-fw fa-ban"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <span v-show="hoverStates.labels[i] && !(editLabel.active && editLabel.index === i)" @click="enableEditMode(i)">
                                    <i class="fas fa-fw fa-edit clickable"></i>
                                </span>
                                <i v-show="label.concept_label_type == 1" class="fas fa-fw fa-star color-yellow"></i>
                                <span>
                                    {{ $ce.flag(label.language.short_name) }}
                                </span>
                                <span v-show="hoverStates.labels[i] && !(editLabel.active && editLabel.index === i)" @click="deleteLabel(i)">
                                    <i class="fas fa-fw fa-trash text-danger clickable"></i>
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ $t('detail.label.empty') }}
                    </p>
                </div>
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>
                        {{ $t('detail.note.title') }}
                    </h5>
                    <form role="form" class="mb-2" @submit.prevent="addNote(newNote)">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span>
                                        {{ $ce.flag(newNote.language.short_name) }}
                                    </span>
                                    <span>
                                        {{ newNote.language.display_name }}
                                    </span>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" href="" @click.prevent="setPropertyLanguage(newNote, language)" v-for="language in languages">
                                        <span>
                                            {{ $ce.flag(language.short_name) }}
                                        </span>
                                        <span>
                                            {{ language.display_name }}
                                        </span>
                                    </a>
                                </div>
                            </div>
                            <input type="text" class="form-control" v-model="newNote.value">
                            <div class="input-group-append">
                                <button class="btn btn-outline-secondary" type="submit">
                                    <i class="fas fa-fw fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <ul class="list-group list-group-xs col of-hidden pr-0 scroll-y-auto" v-if="concept.notes.length">
                        <li class="list-group-item d-flex flex-row justify-content-between" v-for="(note, i) in concept.notes" @mouseenter="setHoverState('notes', i, true)" @mouseleave="setHoverState('notes', i, false)">
                            <span class="col">
                                {{ note.content }}
                            </span>
                            <div>
                                <span>
                                    {{ $ce.flag(note.language.short_name) }}
                                </span>
                                <span v-show="hoverStates.notes[i]" @click="deleteNote(i)">
                                    <i class="fas fa-fw fa-trash text-danger clickable"></i>
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p v-else>
                        <i class="fas fa-fw fa-times"></i>
                        {{ $t('detail.note.empty') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            languages: {
                required: true,
                type: Array
            },
            eventBus: {
                required: true,
                type: Object
            }
        },
        beforeRouteEnter(to, from, next) {
            $httpQueue.add(() => $http.get(`tree/${to.params.id}?t=${to.query.t}`).then(response => {
                next(vm => vm.init(response.data, to.query.t));
            }));
        },
        beforeRouteUpdate(to, from, next) {
            $httpQueue.add(() => $http.get(`tree/${to.params.id}?t=${to.query.t}`).then(response => {
                this.init(response.data, to.query.t);
                next();
            }));
        },
        mounted() {
            // Enable popovers
            $(function () {
                $('[data-toggle="popover"]').popover()
            });
        },
        created() {
            this.eventBus.$on(`relation-updated-`, this.handleRelationUpdate);
            this.eventBus.$on(`relation-updated-sandbox`, this.handleRelationUpdate);

            this.eventBus.$on(`dc-delete-all-`, this.handleConceptDeleteAll);
            this.eventBus.$on(`dc-delete-all-sandbox`, this.handleConceptDeleteAll);
            this.eventBus.$on(`dc-delete-one-`, this.handleConceptDeleteOneUp);
            this.eventBus.$on(`dc-delete-one-sandbox`, this.handleConceptDeleteOneUp);
        },
        beforeDestroy() {
            this.eventBus.$off(`relation-updated-`);
            this.eventBus.$off(`relation-updated-sandbox`);

            this.eventBus.$off(`dc-delete-all-`);
            this.eventBus.$off(`dc-delete-all-sandbox`);
            this.eventBus.$off(`dc-delete-one-`);
            this.eventBus.$off(`dc-delete-one-sandbox`);
        },
        methods: {
            init(data, treeName) {
                data.broaders.forEach(b => {
                    b.selectedLabel = this.$getLabel(b);
                });
                data.narrowers.forEach(n => {
                    n.selectedLabel = this.$getLabel(n);
                });
                this.concept = data;
                this.treeName = treeName == 'sandbox' ? 'sandbox' : '';
                this.selectedLanguage = this.languages[0];
                this.resetProperty(this.newLabel);
                this.resetProperty(this.newNote);
                this.eventBus.$emit(`concept-selected-${this.treeName}`, {
                    concept: this.concept
                });
                this.dataLoaded = true;
            },
            gotoConcept(id) {
                this.eventBus.$emit('concept-clicked', {
                    id: id,
                    from: this.treeName
                });
            },
            addLabel(label) {
                const data = {
                    content: label.value,
                    lid: label.language.id,
                    cid: this.concept.id,
                    tree_name: this.treeName
                };
                $httpQueue.add(() => $http.put(`tree/label?t=${this.treeName}`, data).then(response => {
                    this.concept.labels.push(response.data);
                    this.resetProperty(label);
                    this.eventBus.$emit(`label-update-${this.treeName}`, {
                        concept_id: this.concept.id,
                        labels: this.concept.labels.slice()
                    });
                }));
            },
            enableEditMode(index) {
                const label = this.concept.labels[index];
                this.editLabel.value = label.label;
                this.editLabel.id = label.id;
                this.editLabel.index = index;
                this.editLabel.active = true;
            },
            confirmEditLabel(index) {
                const label = this.concept.labels[index];
                // If value did not change, simply return to normal state
                if(label.label == this.editLabel.value) {
                    this.disableEditMode();
                }
                const data = {
                    label: this.editLabel.value
                };
                $httpQueue.add(() => $http.patch(`tree/label/${label.id}?t=${this.treeName}`, data).then(response => {
                    const updatedLabel = response.data;
                    label.label = updatedLabel.label;
                    label.updated_at = updatedLabel.updated_at;
                    this.disableEditMode();
                }));
            },
            disableEditMode() {
                this.editLabel.value = null;
                this.editLabel.id = null;
                this.editLabel.index = null;
                this.editLabel.active = false;
            },
            deleteLabel(index) {
                let label = this.concept.labels[index];
                if(!label) return;
                $httpQueue.add(() => $http.delete(`tree/label/${label.id}?t=${this.treeName}`).then(response => {
                    const removed = this.concept.labels.splice(index, 1);
                    if(response.data && response.data.updated) {
                        const updId = response.data.id;
                        const updType = response.data.type;
                        let updLabel = this.concept.labels.find(l => {
                            return l.id == updId;
                        });
                        updLabel.concept_label_type = updType;
                    }
                    this.eventBus.$emit(`label-update-${this.treeName}`, {
                        concept_id: this.concept.id,
                        labels: this.concept.labels.slice()
                    });
                    this.$showToast(
                        this.$t('detail.label.toasts.deleted.title'),
                        this.$t('detail.label.toasts.deleted.message', {
                            label: label.label
                        }),
                        'success'
                    );
                }));
            },
            addNote(note) {
                const data = {
                    content: note.value,
                    lid: note.language.id,
                    cid: this.concept.id,
                    tree_name: this.treeName
                };
                $httpQueue.add(() => $http.put(`tree/note?t=${this.treeName}`, data).then(response => {
                    this.concept.notes.push(response.data);
                    this.resetProperty(note);
                }));
            },
            deleteNote(index) {
                let note = this.concept.notes[index];
                if(!note) return;
                $httpQueue.add(() => $http.delete(`tree/note/${note.id}?t=${this.treeName}`).then(response => {
                    this.concept.notes.splice(index, 1);
                    this.$showToast(
                        this.$t('detail.note.toasts.deleted.title'),
                        this.$t('detail.note.toasts.deleted.message', {
                            note: note.content
                        }),
                        'success'
                    );
                }));
            },
            copyToClipboard(id) {
                const range = document.createRange();
                const selection = window.getSelection();
                const elem = document.getElementById(id);
                range.selectNodeContents(elem);
                selection.removeAllRanges();
                selection.addRange(range);
                try {
                    document.execCommand("copy");
                    selection.removeAllRanges();
                    const title = this.$t('detail.copy_url.title');
                    const msg = this.$t('detail.copy_url.message', {
                        url: elem.innerText
                    });
                    this.$showToast(title, msg, 'info');
                } catch(err) {
                    console.log(err);
                }
            },
            handleConceptDeleteAll(e) {
                if(this.concept.id == e.element.id) {
                    this.$router.push({
                        name: 'home'
                    });
                    return;
                }
                // TODO
            },
            handleConceptDeleteOneUp(e) {
                if(this.concept.id == e.element.id) {
                    this.$router.push({
                        name: 'home'
                    });
                    return;
                }
                // TODO
            },
            handleRelationUpdate(e) {
                switch(e.type) {
                    case 'add':
                        if(e.narrower_id == this.concept.id) {
                            this.concept.broaders.push(e.concept);
                        } else if(e.broader_id == this.concept.id) {
                            this.concept.narrowers.push(e.concept);
                        }
                        break;
                    case 'remove':
                        if(e.narrower_id == this.concept.id) {
                            const idx = this.concept.broaders.findIndex(b => b.id == e.broader_id);
                            this.concept.broaders.splice(idx, 1);
                        } else if(e.broader_id == this.concept.id) {
                            const idx = this.concept.narrowers.findIndex(n => n.id == e.narrower_id);
                            this.concept.narrowers.splice(idx, 1);
                        }
                        break;
                }
            },
            broaderSelected(e) {
                if(!e.concept) return;
                const bid = e.concept.id;
                const id = this.concept.id;
                $httpQueue.add(() => $http.put(`tree/concept/${id}/broader/${bid}?t=${this.treeName}`).then(response => {
                    this.eventBus.$emit(`relation-updated-${this.treeName}`, {
                        type: 'add',
                        concept: e.concept,
                        broader_id: bid,
                        narrower_id: id
                    });
                }));
            },
            removeBroader(index) {
                const broader = this.concept.broaders[index];
                const bid = broader.id;
                const id = this.concept.id;
                $httpQueue.add(() => $http.delete(`tree/concept/${id}/broader/${bid}?t=${this.treeName}`).then(response => {
                    this.eventBus.$emit(`relation-updated-${this.treeName}`, {
                        type: 'remove',
                        broader_id: bid,
                        narrower_id: id
                    });
                }));
            },
            narrowerSelected(e) {
                if(!e.concept) return;
                if(e.concept.is_new) {
                    this.$emit('request-concept', {
                        parent: this.concept,
                        label: e.concept.label,
                        tree: this.treeName
                    });
                } else {
                    const bid = e.concept.id;
                    const id = this.concept.id;
                    $httpQueue.add(() => $http.put(`/tree/concept/${bid}/broader/${id}?t=${this.treeName}`).then(response => {
                        this.eventBus.$emit(`relation-updated-${this.treeName}`, {
                            type: 'add',
                            concept: e.concept,
                            broader_id: id,
                            narrower_id: bid
                        });
                    }));
                }
            },
            removeNarrower(index) {
                const broader = this.concept.narrowers[index];
                const bid = broader.id;
                const id = this.concept.id;
                $httpQueue.add(() => $http.delete(`/tree/concept/${bid}/broader/${id}?t=${this.treeName}`).then(response => {
                    this.eventBus.$emit(`relation-updated-${this.treeName}`, {
                        type: 'remove',
                        broader_id: id,
                        narrower_id: bid
                    });
                }));
            },
            setHoverState(prop, index, state) {
                switch(prop) {
                    case 'labels':
                    case 'notes':
                    case 'broaders':
                    case 'narrowers':
                        break;
                    default:
                        return;
                }
                Vue.set(this.hoverStates[prop], index, state);
            },
            resetProperty(obj) {
                obj.language = this.selectedLanguage;
                obj.value = null;
            },
            setPropertyLanguage(prop, newLanguage) {
                prop.language = newLanguage;
            }
        },
        data() {
            return {
                dataLoaded: false,
                concept: {},
                treeName: '',
                selectedLanguage: {},
                hoverStates: {
                    labels: {},
                    notes: {},
                    broaders: {},
                    narrowers: {}
                },
                newNote: {
                    language: null,
                    value: null
                },
                newLabel: {
                    language: null,
                    value: null
                },
                editLabel: {
                    value: null,
                    id: null,
                    index: null,
                    active: false
                }
            }
        },
        computed: {
            prefLabelCount() {
                if(!this.concept.labels && !this.concept.labels.length) {
                    return 0;
                }
                return this.concept.labels.filter(l => {
                    return l.concept_label_type == 1;
                }).length;
            },
            label() {
                return this.$getLabel(this.concept);
            }
        }
    }
</script>
