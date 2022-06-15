<template>
    <div class="d-flex flex-column h-100" v-dcan="'thesaurus_read'">
        <h4 class="d-flex flex-row gap-2 align-items-center">
            {{ t('settings.language.title') }}
            <button type="button" class="btn btn-outline-success btn-sm" @click="showAddLanguageModal()" :disabled="!can('thesaurus_create')">
                <i class="fas fa-fw fa-plus"></i>
                {{ t('settings.language.add_button') }}
            </button>
        </h4>
        <table class="table table-striped table-hover">
            <thead class="thead-light">
                <tr>
                    <th>{{ t('global.short_name') }}</th>
                    <th>{{ t('global.display_name') }}</th>
                    <th>{{ t('global.created_at') }}</th>
                    <th>{{ t('global.updated_at') }}</th>
                    <th>{{ t('global.options') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(language, i) in state.languages" :key="`language-${i}`">
                    <td class="align-middle">
                        <div class="d-flex gap-2">
                            <span>
                                {{ emojiFlag(language.short_name) }}
                            </span>
                            <span>
                                {{ language.short_name }}
                            </span>
                        </div>
                    </td>
                    <td>
                        <span>
                            {{ language.display_name }}
                        </span>
                    </td>
                    <td>
                        {{ date(language.created_at) }}
                    </td>
                    <td>
                        {{ date(language.updated_at) }}
                    </td>
                    <td>
                        <div class="dropdown">
                            <span id="dropdownMenuButton" class="clickable" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-fw fa-ellipsis-h"></i>
                            </span>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <a class="dropdown-item" href="#" :disabled="!can('thesaurus_delete')" @click.prevent="onDeleteLanguage(language.id)">
                                    <i class="fas fa-fw fa-trash text-danger"></i> {{ t('global.delete') }}
                                </a>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
    import {
        computed,
        onMounted,
        onUnmounted,
        reactive
    } from 'vue';
    // import { mapFields } from 'vee-validate';
    import { useI18n } from 'vue-i18n';

    import store from '@/bootstrap/store.js';

    import {
        can,
        getValidClass,
        emojiFlag,
    } from '@/helpers/helpers.js';

    import {
        date,
    } from '@/helpers/filters.js';

    import {
        showAddLanguage,
        showDeleteLanguage,
    } from '@/helpers/modal.js';

    export default {
        setup(props, context) {
            const { t } = useI18n();

            // FETCH

            // FUNCTIONS
            const showAddLanguageModal = () => {
                showAddLanguage();
            };
            const onDeleteLanguage = id => {
                showDeleteLanguage(id);
            };

            // DATA
            const state = reactive({
                languages: computed(_ => store.getters.languages),
            });

            // ON MOUNTED

            return {
                t,
                // HELPERS
                can,
                getValidClass,
                emojiFlag,
                date,
                // LOCAL
                showAddLanguageModal,
                onDeleteLanguage,
                // STATE
                state,
            };
        }
        // beforeRouteEnter(to, from, next) {
        //     $httpQueue.add(() => $http.get('language').then(response => {
        //         next(vm => vm.init(response.data));
        //     }));
        // },
        // beforeRouteLeave: function(to, from, next) {
        //     let loadNext = () => {
        //         next();
        //     }
        //     if(this.isOneDirty) {
        //         let discardAndContinue = () => {
        //             loadNext();
        //         };
        //         let saveAndContinue = () => {
        //             let patching = async _ => {
        //                 await this.$asyncFor(this.userList, async u => {
        //                     await this.onPatchLanguage(u.id);
        //                 });
        //                 loadNext();
        //             };
        //             patching();
        //         };
        //         this.$modal.show(this.discardModal, {reference: this.$t('global.settings.languages'), onDiscard: discardAndContinue, onSave: saveAndContinue, onCancel: _ => next(false)})
        //     } else {
        //         loadNext();
        //     }
        // },
        // mounted() {},
        // methods: {
        //     init(languages) {
        //         this.languageList = languages;
        //     },
        //     updateShortName(language, value, id) {
        //         language.short_name = value.code;
        //         this.fields[`short_${language.id}`].dirty = true;
        //     },
        //     showNewLangModal() {
        //         if(!this.$can('edit_concepts_th')) return;
        //         this.$modal.show('add-language-modal');
        //     },
        //     hideNewLangModal() {
        //         this.$modal.hide('add-language-modal');
        //         this.newLang = {};
        //     },
        //     onAddLanguage(newLang) {
        //         if(!this.$can('edit_concepts_th')) return;
        //         $http.post('language', newLang).then(response => {
        //             this.languageList.push(response.data);
        //             this.hideNewLangModal();
        //         }).catch(e => {
        //             this.$getErrorMessages(e, this.error);
        //         });
        //     },
        //     onPatchLanguage(id) {
        //         if(!this.$can('edit_concepts_th')) return new Promise(r => r());
        //         if(!this.langDirty(id)) return new Promise(r => r());
        //         let data = {};
        //         let lang = this.languageList.find(l => l.id == id);
        //         if(this.isDirty(`display_${id}`)) {
        //             data.display_name = lang.display_name;
        //         }
        //         if(this.isDirty(`short_${id}`)) {
        //             data.short_name = lang.short_name;
        //         }
        //         return $httpQueue.add(() => $http.patch(`language/${id}`, data).then(response => {
        //             this.setLanguagePristine(id);
        //             lang.updated_at = response.data.updated_at;
        //             this.$showToast(
        //                 this.$t('settings.language.toasts.updated.title'),
        //                 this.$t('settings.language.toasts.updated.msg', {
        //                     name: lang.display_name
        //                 }),
        //                 'success'
        //             );
        //         }).catch(e => {
        //             this.$getErrorMessages(e, this.error, `_${id}`);
        //         }));
        //     },
        //     showDeleteLanguageModal() {
        //         if(!this.$can('edit_concepts_th')) return;
        //         this.$modal.show('confirm-delete-language-modal');
        //     },
        //     hideDeleteLanguageModal() {
        //         this.$modal.hide('confirm-delete-language-modal');
        //         this.selectedLanguage = {};
        //     },
        //     requestDeleteLanguage(id) {
        //         if(!this.$can('edit_concepts_th')) return;
        //         this.selectedLanguage = this.languageList.find(l => l.id == id);
        //         this.showDeleteLanguageModal();
        //     },
        //     deleteLanguage(id) {
        //         if(!this.$can('edit_concepts_th')) return;
        //         if(!id) return;
        //         $http.delete(`language/${id}`).then(response => {
        //             const index = this.languageList.findIndex(l => l.id == id);
        //             if(index > -1) this.languageList.splice(index, 1);
        //             this.hideDeleteLanguageModal();
        //         });
        //     },
        //     isDirty(fieldname) {
        //         if(this.fields[fieldname]) {
        //             return this.fields[fieldname].dirty;
        //         }
        //         return false;
        //     },
        //     langDirty(uid) {
        //         return this.isDirty(`display_${uid}`) || this.isDirty(`short_${uid}`);
        //     },
        //     setPristine(fieldname) {
        //         this.$validator.flag(fieldname, {
        //             dirty: false,
        //             pristine: true
        //         });
        //     },
        //     setLanguagePristine(uid) {
        //         this.setPristine(`display_${uid}`);
        //         this.setPristine(`short_${uid}`);
        //     }
        // },
        // data() {
        //     return {
        //         languageList: [],
        //         selectedLanguage: {},
        //         newLang: {},
        //         error: {},
        //         discardModal: 'discard-changes-modal'
        //     }
        // },
        // computed: {
        //     isOneDirty() {
        //         return Object.keys(this.fields).some(key => this.fields[key].dirty);
        //     },
        //     languageCodes() {
        //         const c = this.$ce.countries;
        //         let list = [];
        //         for(let k in c) {
        //             let labels = c[k];
        //             let label;
        //             if(Array.isArray(labels)) {
        //                 label = labels[0];
        //             } else {
        //                 label = labels;
        //             }
        //             list.push({
        //                 id: list.length + 1,
        //                 code: k.toLowerCase(),
        //                 label: label
        //             });
        //         }
        //         return list;
        //     }
        // }
    }
</script>
