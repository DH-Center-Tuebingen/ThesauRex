<template>
    <div class="h-100 d-flex flex-column" v-if="dataLoaded">
        <h4 class="mb-0">{{ $getLabel(concept) }} <small>Concept Details</small></h4>
        <code class="normal text-black-50">{{ concept.concept_url }}</code>
        <hr class="w-100" />
        <div class="row h-100">
            <div class="col-md-6 d-flex flex-column">
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>Broader Concepts</h5>
                    <ul class="list-group list-group-xs">
                        <li class="list-group-item" v-for="broader in concept.broaders">
                            {{ broader.concept_url }}
                        </li>
                    </ul>
                </div>
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>Narrower Concepts</h5>
                    <ul class="list-group list-group-xs">
                        <li class="list-group-item" v-for="narrower in concept.narrowers">
                            {{ narrower.concept_url }}
                        </li>
                    </ul>
                </div>
            </div>
            <div class="col-md-6 d-flex flex-column">
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>Labels</h5>
                    <ul class="list-group list-group-xs col of-hidden pr-0 mb-2 scroll-y-auto">
                        <li class="list-group-item d-flex flex-row justify-content-between" v-for="label in concept.labels">
                            <span class="col">
                                {{ label.label }}
                            </span>
                            <div>
                                <i v-show="label.concept_label_type == 1" class="fas fa-fw fa-star color-yellow"></i>
                                <span>
                                    {{ ce.flag(label.language.short_name) }}
                                </span>
                            </div>
                        </li>
                    </ul>
                    <form role="form" @submit.prevent="addLabel(newLabel)">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span>
                                        {{ ce.flag(newLabel.language.short_name) }}
                                    </span>
                                    <span>
                                        {{ newLabel.language.display_name }}
                                    </span>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" href="" @click.prevent="setPropertyLanguage(newLabel, language)" v-for="language in languages">
                                        <span>
                                            {{ ce.flag(language.short_name) }}
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
                </div>
                <div class="col px-0 d-flex flex-column mb-2">
                    <h5>Notes</h5>
                    <ul class="list-group list-group-xs col of-hidden pr-0 mb-2 scroll-y-auto">
                        <li class="list-group-item d-flex flex-row justify-content-between" v-for="note in concept.notes">
                            <span class="col">
                                {{ note.content }}
                            </span>
                            <span>
                                {{ ce.flag(note.language.short_name) }}
                            </span>
                        </li>
                    </ul>
                    <form role="form" @submit.prevent="addNote(newNote)">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span>
                                        {{ ce.flag(newNote.language.short_name) }}
                                    </span>
                                    <span>
                                        {{ newNote.language.display_name }}
                                    </span>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" href="" @click.prevent="setPropertyLanguage(newNote, language)" v-for="language in languages">
                                        <span>
                                            {{ ce.flag(language.short_name) }}
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
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    const {flag, code, name} = require('country-emoji');

    export default {
        props: {
        },
        beforeRouteEnter(to, from, next) {
            let cncpt;
            $httpQueue.add(() => $http.get(`tree/${to.params.id}?t=${to.query.t}`).then(response => {
                cncpt = response.data;
                $httpQueue.add(() => $http.get(`tree/languages`).then(response => {
                    next(vm => vm.init(cncpt, response.data, to.query.t));
                }));
            }));
        },
        beforeRouteUpdate(to, from, next) {
            $httpQueue.add(() => $http.get(`tree/${to.params.id}?t=${to.query.t}`).then(response => {
                this.init(response.data, undefined, to.query.t);
                next();
            }));
        },
        methods: {
            init(data, languages, treeName) {
                this.concept = data;
                this.treeName = treeName == 'sandbox' ? 'sandbox' : '';
                if(!!languages) {
                    this.languages = [];
                    languages.forEach(l => {
                        this.languages.push(l);
                    });
                    this.selectedLanguage = this.languages[0];
                }
                this.resetProperty(this.newLabel);
                this.resetProperty(this.newNote);
                this.dataLoaded = true;
            },
            addLabel(label) {
                const data = {
                    content: label.value,
                    lid: label.language.id,
                    cid: this.concept.id,
                    tree_name: this.treeName
                };
                $httpQueue.add(() => $http.put(`tree/label`, data).then(response => {
                    this.concept.labels.push(response.data);
                    this.resetProperty(label);
                    this.$emit('label-update');
                }));
            },
            addNote(note) {
                const data = {
                    content: note.value,
                    lid: note.language.id,
                    cid: this.concept.id,
                    tree_name: this.treeName
                };
                $httpQueue.add(() => $http.put(`tree/note`, data).then(response => {
                    this.concept.notes.push(response.data);
                    this.resetProperty(note);
                }));
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
                languages: [],
                newNote: {
                    language: null,
                    value: null
                },
                newLabel: {
                    language: null,
                    value: null
                },
                ce: {
                    flag: code => {
                        if(code == 'en') {
                            code = 'gb';
                        }
                        return flag(code);
                    },
                    code: code,
                    name: name
                }
            }
        }
    }
</script>
