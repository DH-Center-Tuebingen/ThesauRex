<template>
    <table class="table table-striped table-hover" v-if="initFinished">
        <thead class="thead-light">
            <tr>
                <th>{{ $t('global.preference') }}</th>
                <th>{{ $t('global.value') }}</th>
                <th>{{ $t('global.save') }}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $t('settings.preference.key.language') }}</strong>
                </td>
                <td>
                    <form class="form-mb-0">
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label py-0">
                                <button type="button" class="btn btn-outline-primary" @click="preferences['prefs.gui-language'].value = browserLanguage" :disabled="!preferences['prefs.gui-language'].allow_override">
                                    Set to {{ browserLanguage }}
                                </button>
                            </label>
                            <div class="col-md-10">
                                <input type="text" :readonly="!preferences['prefs.gui-language'].allow_override" :class="[preferences['prefs.gui-language'].allow_override ? 'form-control' : 'form-control-plaintext']" v-model="preferences['prefs.gui-language'].value" />
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <button type="button" class="btn btn-success" @click.prevent="savePreference(preferences['prefs.gui-language'])" :disabled="!preferences['prefs.gui-language'].allow_override">
                        <i class="fas fa-fw fa-check"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>
                    <strong>{{ $t('settings.preference.key.tooltips') }}</strong>
                </td>
                <td>
                    <form class="form-mb-0">
                        <div class="form-group row">
                            <div class="col-md-2"></div>
                            <div class="col-md-10">
                                <div class="form-check">
                                    <input class="form-check-input" id="show-tooltips" type="checkbox" :disabled="!preferences['prefs.show-tooltips'].allow_override" v-model="preferences['prefs.show-tooltips'].value" />
                                </div>
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <button type="button" class="btn btn-success" @click.prevent="savePreference(preferences['prefs.show-tooltips'])" :disabled="!preferences['prefs.show-tooltips'].allow_override">
                        <i class="fas fa-fw fa-check"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>
                    <strong>{{ $t('settings.preference.key.link-thesaurex') }}</strong>
                </td>
                <td>
                    <form class="form-mb-0">
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label"></label>
                            <div class="col-md-10">
                                <input type="text" :readonly="!preferences['prefs.link-to-thesaurex'].allow_override" :class="[preferences['prefs.link-to-thesaurex'].allow_override ? 'form-control' : 'form-control-plaintext']" v-model="preferences['prefs.link-to-thesaurex'].value" />
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <button type="button" class="btn btn-success" @click.prevent="savePreference(preferences['prefs.link-to-thesaurex'])" :disabled="!preferences['prefs.link-to-thesaurex'].allow_override">
                        <i class="fas fa-fw fa-check"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>
                    <strong>{{ $t('settings.preference.key.project.name') }}</strong>
                </td>
                <td>
                    <form class="form-mb-0">
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label"></label>
                            <div class="col-md-10">
                                <input type="text" :readonly="!preferences['prefs.project-name'].allow_override" :class="[preferences['prefs.project-name'].allow_override ? 'form-control' : 'form-control-plaintext']" v-model="preferences['prefs.project-name'].value" />
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <button type="button" class="btn btn-success" @click.prevent="savePreference(preferences['prefs.project-name'])" :disabled="!preferences['prefs.project-name'].allow_override">
                        <i class="fas fa-fw fa-check"></i>
                    </button>
                </td>
            </tr>
            <tr>
                <td>
                    <strong>{{ $t('settings.preference.key.project.maintainer') }}</strong>
                </td>
                <td>
                    <form class="form-mb-0">
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label">{{ $t('global.name') }}:</label>
                            <div class="col-md-10">
                                <input type="text" :readonly="!preferences['prefs.project-maintainer'].allow_override" :class="[preferences['prefs.project-maintainer'].allow_override ? 'form-control' : 'form-control-plaintext']" v-model="preferences['prefs.project-maintainer'].value.name" />
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label">{{ $t('global.email') }}:</label>
                            <div class="col-md-10">
                                <input type="text" :readonly="!preferences['prefs.project-maintainer'].allow_override" :class="[preferences['prefs.project-maintainer'].allow_override ? 'form-control' : 'form-control-plaintext']" v-model="preferences['prefs.project-maintainer'].value.email" />
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label">{{ $t('global.description') }}:</label>
                            <div class="col-md-10">
                                <input type="text" :readonly="!preferences['prefs.project-maintainer'].allow_override" :class="[preferences['prefs.project-maintainer'].allow_override ? 'form-control' : 'form-control-plaintext']" v-model="preferences['prefs.project-maintainer'].value.description" />
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label" for="public">{{ $t('settings.preference.key.project.public') }}:</label>
                            <div class="col-md-10">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="public" :disabled="!preferences['prefs.project-maintainer'].allow_override" v-model="preferences['prefs.project-maintainer'].value.public" />
                                </div>
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <button type="button" class="btn btn-success" @click.prevent="savePreference(preferences['prefs.project-maintainer'])" :disabled="!preferences['prefs.project-maintainer'].allow_override">
                        <i class="fas fa-fw fa-check"></i>
                    </button>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
    export default {
        beforeRouteEnter(to, from, next) {
            $httpQueue.add(() => $http.get(`preference/${to.params.id}`).then(response => {
                next(vm => vm.init(response.data));
            }));
        },
        mounted() {},
        methods: {
            init(preferences) {
                this.initFinished = false;
                this.preferences = preferences;
                // get language code of browser's default language
                //
                this.browserLanguage = navigator.language ? navigator.language.split('-')[0] : 'en';
                this.initFinished = true;
            },
            savePreference(pref) {
                let data = {};
                data.label = pref.label;
                data.value = pref.value;
                if(typeof data.value === 'object') data.value = JSON.stringify(data.value);
                data.user_id = this.$auth.user().id;
                $http.patch('preference/' + pref.id, data).then(response => {
                    if(pref.label == 'prefs.gui-language') {
                        Vue.i18n.locale = pref.value;
                    }
                    const label = this.$t(`settings.preference.labels.${pref.label}`);
                    this.$showToast(
                        this.$t('settings.preference.toasts.updated.title'),
                        this.$t('settings.preference.toasts.updated.msg', {
                            name: label
                        }),
                        'success'
                    );
                });
            }
        },
        data() {
            return {
                preferences: {},
                browserLanguage: 'en',
                initFinished: false
            }
        },
    }
</script>
