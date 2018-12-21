<template>
    <div>
        <table class="table table-striped table-hover" v-can="'view_users'">
            <thead class="thead-light">
                <tr>
                    <th></th>
                    <th>{{ $t('global.short_name') }}</th>
                    <th>{{ $t('global.display_name') }}</th>
                    <th>{{ $t('global.created-at') }}</th>
                    <th>{{ $t('global.updated-at') }}</th>
                    <th>{{ $t('global.options') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="language in languageList">
                    <td>
                        {{ $ce.flag(language.short_name) }}
                    </td>
                    <td>
                        <multiselect
                            label="label"
                            track-by="id"
                            v-model="language.short_name"
                            v-validate=""
                            :allowEmpty="false"
                            :closeOnSelect="true"
                            :hideSelected="false"
                            :multiple="false"
                            :name="`short_${language.id}`"
                            :options="languageCodes"
                            :placeholder="$t('settings.language.set_short_placeholder')"
                            :select-label="$t('global.select.select')"
                            :deselect-label="$t('global.select.deselect')"
                            @input="(value, id) => updateShortName(language, value, id)">
                            <template slot="singleLabel" slot-scope="props">
                                <span class="option__desc">
                                    <span class="option__title">
                                        {{ props.option }}
                                    </span>
                                </span>
                            </template>
                            <template slot="option" slot-scope="props">
                                <div class="option__desc">
                                    <span class="option__title">
                                        {{ $ce.flag(props.option.code) }}
                                        {{ props.option.label }}
                                    </span>
                                </div>
                            </template>
                        </multiselect>
                    </td>
                    <td>
                        <input type="text" min="2" max="2" class="form-control" :class="$getValidClass(error, `display_${language.id}`)" v-model="language.display_name" v-validate="" :name="`display_${language.id}`" />

                        <div class="invalid-feedback">
                            <span v-for="msg in error[`display_${language.id}`]">
                                {{ msg }}
                            </span>
                        </div>
                    </td>
                    <td>
                        {{ language.created_at }}
                    </td>
                    <td>
                        {{ language.updated_at }}
                    </td>
                    <td>
                        <div class="dropdown">
                            <span id="dropdownMenuButton" class="clickable" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-fw fa-ellipsis-h"></i>
                                <sup class="notification-info" v-if="langDirty(language.id)">
                                    <i class="fas fa-fw fa-xs fa-circle text-warning"></i>
                                </sup>
                            </span>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <a class="dropdown-item" href="#" v-if="langDirty(language.id)" :disabled="!$can('add_remove_role')" @click.prevent="onPatchLanguage(language.id)">
                                    <i class="fas fa-fw fa-check text-success"></i> {{ $t('global.save') }}
                                </a>
                                <a class="dropdown-item" href="#" :disabled="!$can('delete_users')" @click.prevent="requestDeleteLanguage(language.id)">
                                    <i class="fas fa-fw fa-trash text-danger"></i> {{ $t('global.delete') }}
                                </a>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <button type="button" class="btn btn-success" @click="showNewLangModal" :disabled="!$can('create_users')">
            <i class="fas fa-fw fa-plus"></i> {{ $t('settings.language.add-button') }}
        </button>

        <modal name="add-language-modal" height="auto" :scrollable="true">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('settings.language.modal.new.title') }}</h5>
                    <button type="button" class="close" aria-label="Close" @click="hideNewLangModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newLangForm" name="newLangForm" role="form" v-on:submit.prevent="onAddLanguage(newLang)">
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="display_name">
                                {{ $t('global.name') }}
                                <span class="text-danger">*</span>:
                            </label>
                            <div class="col-md-9">
                                <input class="form-control" :class="$getValidClass(error, 'name')" type="text" id="display_name" v-model="newLang.display_name" required />

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.name">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-form-label col-md-3" for="short_name">
                                {{ $t('global.short_name') }}
                                <span class="text-danger">*</span>:
                            </label>
                            <div class="col-md-9">
                                <multiselect
                                    label="label"
                                    track-by="id"
                                    v-model="newLang.short_name"
                                    v-validate=""
                                    :allowEmpty="false"
                                    :closeOnSelect="true"
                                    :hideSelected="false"
                                    :multiple="false"
                                    :name="`short_${newLang.id}`"
                                    :options="languageCodes"
                                    :placeholder="$t('settings.language.set_short_placeholder')"
                                    :select-label="$t('global.select.select')"
                                    :deselect-label="$t('global.select.deselect')"
                                    @input="(value, id) => updateShortName(newLang, value, id)">
                                    <template slot="singleLabel" slot-scope="props">
                                        <span class="option__desc">
                                            <span class="option__title">
                                                {{ props.option }}
                                            </span>
                                        </span>
                                    </template>
                                    <template slot="option" slot-scope="props">
                                        <div class="option__desc">
                                            <span class="option__title">
                                                {{ $ce.flag(props.option.code) }}
                                                {{ props.option.label }}
                                            </span>
                                        </div>
                                    </template>
                                </multiselect>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-success" form="newLangForm">
                        <i class="fas fa-fw fa-plus"></i> {{ $t('global.add') }}
                    </button>
                    <button type="button" class="btn btn-danger"     @click="hideNewLangModal">
                        <i class="fas fa-fw fa-ban"></i> {{ $t('global.cancel') }}
                    </button>
                </div>
            </div>
        </modal>

        <modal name="confirm-delete-language-modal" height="auto" :scrollable="true">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('global.delete_name.title', {name: selectedLanguage.display_name}) }}</h5>
                    <button type="button" class="close" aria-label="Close" @click="hideDeleteLanguageModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <span v-html="$t('global.delete_name.desc', {name: selectedLanguage.display_name})"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" @click="deleteLanguage(selectedLanguage.id)">
                        <i class="fas fa-fw fa-check"></i> {{ $t('global.delete') }}
                    </button>
                    <button type="button" class="btn btn-danger" @click="hideDeleteLanguageModal">
                        <i class="fas fa-fw fa-ban"></i> {{ $t('global.cancel') }}
                    </button>
                </div>
            </div>
        </modal>
        <discard-changes-modal :name="discardModal"/>
    </div>
</template>

<script>
    import { mapFields } from 'vee-validate';

    export default {
        beforeRouteEnter(to, from, next) {
            $httpQueue.add(() => $http.get('language').then(response => {
                next(vm => vm.init(response.data));
            }));
        },
        beforeRouteLeave: function(to, from, next) {
            let loadNext = () => {
                next();
            }
            if(this.isOneDirty) {
                let discardAndContinue = () => {
                    loadNext();
                };
                let saveAndContinue = () => {
                    let patching = async _ => {
                        await this.$asyncFor(this.userList, async u => {
                            await this.onPatchLanguage(u.id);
                        });
                        loadNext();
                    };
                    patching();
                };
                this.$modal.show(this.discardModal, {reference: this.$t('global.settings.languages'), onDiscard: discardAndContinue, onSave: saveAndContinue, onCancel: _ => next(false)})
            } else {
                loadNext();
            }
        },
        mounted() {},
        methods: {
            init(languages) {
                this.languageList = languages;
            },
            updateShortName(language, value, id) {
                language.short_name = value.code;
                this.fields[`short_${language.id}`].dirty = true;
            },
            showNewLangModal() {
                if(!this.$can('edit_concepts_th')) return;
                this.$modal.show('add-language-modal');
            },
            hideNewLangModal() {
                this.$modal.hide('add-language-modal');
                this.newLang = {};
            },
            onAddLanguage(newLang) {
                if(!this.$can('edit_concepts_th')) return;
                $http.post('language', newLang).then(response => {
                    this.languageList.push(response.data);
                    this.hideNewLangModal();
                }).catch(e => {
                    this.$getErrorMessages(e, this.error);
                });
            },
            onPatchLanguage(id) {
                if(!this.$can('edit_concepts_th')) return new Promise(r => r());
                if(!this.langDirty(id)) return new Promise(r => r());
                let data = {};
                let lang = this.languageList.find(l => l.id == id);
                if(this.isDirty(`display_${id}`)) {
                    data.display_name = lang.display_name;
                }
                if(this.isDirty(`short_${id}`)) {
                    data.short_name = lang.short_name;
                }
                return $httpQueue.add(() => $http.patch(`language/${id}`, data).then(response => {
                    this.setLanguagePristine(id);
                    lang.updated_at = response.data.updated_at;
                    this.$showToast(
                        this.$t('settings.language.toasts.updated.title'),
                        this.$t('settings.language.toasts.updated.msg', {
                            name: lang.display_name
                        }),
                        'success'
                    );
                }).catch(e => {
                    this.$getErrorMessages(e, this.error, `_${id}`);
                }));
            },
            showDeleteLanguageModal() {
                if(!this.$can('edit_concepts_th')) return;
                this.$modal.show('confirm-delete-language-modal');
            },
            hideDeleteLanguageModal() {
                this.$modal.hide('confirm-delete-language-modal');
                this.selectedLanguage = {};
            },
            requestDeleteLanguage(id) {
                if(!this.$can('edit_concepts_th')) return;
                this.selectedLanguage = this.languageList.find(l => l.id == id);
                this.showDeleteLanguageModal();
            },
            deleteLanguage(id) {
                if(!this.$can('edit_concepts_th')) return;
                if(!id) return;
                $http.delete(`language/${id}`).then(response => {
                    const index = this.languageList.findIndex(l => l.id == id);
                    if(index > -1) this.languageList.splice(index, 1);
                    this.hideDeleteLanguageModal();
                });
            },
            isDirty(fieldname) {
                if(this.fields[fieldname]) {
                    return this.fields[fieldname].dirty;
                }
                return false;
            },
            langDirty(uid) {
                return this.isDirty(`display_${uid}`) || this.isDirty(`short_${uid}`);
            },
            setPristine(fieldname) {
                this.$validator.flag(fieldname, {
                    dirty: false,
                    pristine: true
                });
            },
            setLanguagePristine(uid) {
                this.setPristine(`display_${uid}`);
                this.setPristine(`short_${uid}`);
            }
        },
        data() {
            return {
                languageList: [],
                selectedLanguage: {},
                newLang: {},
                error: {},
                discardModal: 'discard-changes-modal'
            }
        },
        computed: {
            isOneDirty() {
                return Object.keys(this.fields).some(key => this.fields[key].dirty);
            },
            languageCodes() {
                const c = this.$ce.countries;
                let list = [];
                for(let k in c) {
                    let labels = c[k];
                    let label;
                    if(Array.isArray(labels)) {
                        label = labels[0];
                    } else {
                        label = labels;
                    }
                    list.push({
                        id: list.length + 1,
                        code: k.toLowerCase(),
                        label: label
                    });
                }
                return list;
            }
        }
    }
</script>
