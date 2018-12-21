<template>
    <table class="table table-striped table-hover" v-if="initFinished" v-can="'edit_preferences'">
        <thead class="thead-light">
            <tr>
                <th>{{ $t('global.preference') }}</th>
                <th>{{ $t('global.value') }}</th>
                <th>{{ $t('global.allow-override') }}</th>
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
                            <label class="col-md-2 col-form-label"></label>
                            <div class="col-md-10">
                                <input class="form-control" type="text" v-model="preferences['prefs.gui-language'].value" />
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <input type="checkbox"  v-model="preferences['prefs.gui-language'].allow_override" />
                </td>
                <td>
                    <button type="button" class="btn btn-success" :disabled="!$can('edit_preferences')" @click.prevent="savePreference(preferences['prefs.gui-language'])">
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
                                    <input class="form-check-input" id="show-tooltips" type="checkbox" v-model="preferences['prefs.show-tooltips'].value" />
                                </div>
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <input type="checkbox" v-model="preferences['prefs.show-tooltips'].allow_override" />
                </td>
                <td>
                    <button type="button" class="btn btn-success" :disabled="!$can('edit_preferences')" @click.prevent="savePreference(preferences['prefs.show-tooltips'])">
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
                                <input class="form-control" type="text" v-model="preferences['prefs.link-to-thesaurex'].value" />
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <input type="checkbox" v-model="preferences['prefs.link-to-thesaurex'].allow_override" />
                </td>
                <td>
                    <button type="button" class="btn btn-success" :disabled="!$can('edit_preferences')" @click.prevent="savePreference(preferences['prefs.link-to-thesaurex'])">
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
                                <input class="form-control" type="text" v-model="preferences['prefs.project-name'].value" />
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <input type="checkbox" v-model="preferences['prefs.project-name'].allow_override" />
                </td>
                <td>
                    <button type="button" class="btn btn-success" :disabled="!$can('edit_preferences')" @click.prevent="savePreference(preferences['prefs.project-name'])">
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
                                <input class="form-control" type="text" v-model="preferences['prefs.project-maintainer'].value.name" />
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label">{{ $t('global.email') }}:</label>
                            <div class="col-md-10">
                                <input class="form-control" type="text" v-model="preferences['prefs.project-maintainer'].value.email" />
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label">{{ $t('global.description') }}:</label>
                            <div class="col-md-10">
                                <input class="form-control" type="text" v-model="preferences['prefs.project-maintainer'].value.description" />
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-2 col-form-label" for="public">{{ $t('settings.preference.key.project.public') }}:</label>
                            <div class="col-md-10">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="public" v-model="preferences['prefs.project-maintainer'].value.public" />
                                </div>
                            </div>
                        </div>
                    </form>
                </td>
                <td>
                    <input type="checkbox" v-model="preferences['prefs.project-maintainer'].allow_override" />
                </td>
                <td>
                    <button type="button" class="btn btn-success" :disabled="!$can('edit_preferences')" @click.prevent="savePreference(preferences['prefs.project-maintainer'])">
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
            if(!Vue.prototype.$can('edit_preferences')) {
                next(vm => vm.init({}));
            }
            $httpQueue.add(() => $http.get('preference').then(response => {
                next(vm => vm.init(response.data));
            }));
        },
        mounted() {},
        methods: {
            init(preferences) {
                this.initFinished = false;
                this.preferences = preferences;
                this.initFinished = true;
            },
            savePreference(pref) {
                if(!this.$can('edit_preferences')) return;
                let data = {};
                data.label = pref.label;
                data.value = pref.value;
                if(typeof data.value === 'object') data.value = JSON.stringify(data.value);
                data.allow_override = pref.allow_override;
                $http.patch(`preference/${pref.id}`, data).then(response => {
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
                initFinished: false
            }
        },
    }
</script>
