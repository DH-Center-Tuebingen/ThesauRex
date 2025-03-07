<template>
    <div
        class="h-100 d-flex flex-column"
        v-dcan="'thesaurus_write'"
    >
        <h3 class="d-flex flex-row gap-2 align-items-center">
            {{ t('global.preference', 2) }}
            <button
                type="button"
                class="btn btn-outline-success btn-sm"
                @click="savePreferences()"
            >
                <i class="fas fa-fw fa-save" />
                {{ t('global.save') }}
            </button>
        </h3>
        <div class="table-responsive scroll-x-hidden">
            <table
                v-if="state.prefsLoaded"
                class="table table-light table-striped table-hover mb-0"
            >
                <thead class="sticky-top">
                    <tr class="text-nowrap">
                        <th>{{ t('global.preference') }}</th>
                        <th
                            class="text-end"
                            style="width: 99%;"
                        >
                            {{ t('global.value') }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>
                                {{ t('settings.preference.key.language') }}
                            </strong>
                        </td>
                        <td>
                            <gui-language-preference
                                :data="state.preferences['prefs.gui-language'].value"
                                @changed="e => trackChanges('prefs.gui-language', e)"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>{{ t('settings.preference.key.password_reset_link') }}</strong>
                        </td>
                        <td>
                            <reset-email-preference
                                :data="state.preferences['prefs.enable-password-reset-link'].value"
                                @changed="e => trackChanges('prefs.enable-password-reset-link', e)"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>{{ t('settings.preference.key.project_name') }}</strong>
                        </td>
                        <td>
                            <project-name-preference
                                :data="state.preferences['prefs.project-name'].value"
                                @changed="e => trackChanges('prefs.project-name', e)"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>{{ t('settings.preference.key.link_spacialist') }}</strong>
                        </td>
                        <td>
                            <spacialist-link-preference
                                :data="state.preferences['prefs.link-to-spacialist'].value"
                                @changed="e => trackChanges('prefs.link-to-spacialist', e)"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>{{ t('settings.preference.key.import_config') }}</strong>
                        </td>
                        <td>
                            <import-config-preference
                                :data="state.preferences['prefs.import-config'].value"
                                @changed="e => trackChanges('prefs.import-config', e)"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import store from '@/bootstrap/store.js';

    import { useToast } from '@/plugins/toast.js';

    import { patchPreferences } from '@/api.js';

    import {
        can,
    } from '@/helpers/helpers.js';

    import GuiLanguage from './preferences/GuiLanguage.vue';
    import ResetEmail from './preferences/ResetEmail.vue';
    import ProjectName from './preferences/ProjectName.vue';
    import SpacialistLink from './preferences/SpacialistLink.vue';
    import ImportConfig from './preferences/ImportConfig.vue';

    export default {
        components: {
            'gui-language-preference': GuiLanguage,
            'reset-email-preference': ResetEmail,
            'project-name-preference': ProjectName,
            'spacialist-link-preference': SpacialistLink,
            'import-config-preference': ImportConfig,
        },
        setup(props, context) {
            const { t } = useI18n();
            const toast = useToast();

            // FUNCTIONS
            const trackChanges = (label, data) => {
                state.dirtyData[label] = {
                    value: data.value,
                };
            };
            const savePreferences = _ => {
                if(!state.hasDirtyData) return;

                let entries = [];
                let updatedLanguage = null;
                for(let k in state.dirtyData) {
                    const dd = state.dirtyData[k];
                    if(k == 'prefs.gui-language') {
                        const userLang = store.getters.preferenceByKey('prefs.gui-language');
                        const sysLang = state.preferences['prefs.gui-language'];
                        // if user pref language does not differ from sys pref language
                        if(userLang === sysLang) {
                            // update current language in Spacialist
                            updatedLanguage = dd.value;
                        }
                    }
                    entries.push({
                        value: dd.value,
                        label: k,
                    });
                }
                const data = {
                    changes: entries,
                };
                patchPreferences(data).then(data => {
                    // Update language if value has changed
                    if(!!updatedLanguage) {
                        locale.value = updatedLanguage;
                    }
                    state.dirtyData = {};

                    const label = t('settings.preference.toasts.updated.msg');
                    toast.$toast(label, '', {
                        channel: 'success',
                        simple: true,
                    });
                });
            };

            // DATA
            const state = reactive({
                dirtyData: {},
                hasDirtyData: computed(_ => Object.keys(state.dirtyData).length > 0),
                preferences: computed(_ => store.getters.systemPreferences),
                prefsLoaded: computed(_ => !!state.preferences),
            });

            // RETURN
            return {
                t,
                // HELPERS
                can,
                // LOCAL
                trackChanges,
                savePreferences,
                // PROPS
                // STATE
                state,
            };
        },
    }
</script>
