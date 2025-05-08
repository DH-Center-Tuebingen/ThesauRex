<template>
    <div
        class="d-flex flex-column h-100"
        v-dcan="'thesaurus_read'"
    >
        <h4 class="d-flex flex-row gap-2 align-items-center">
            {{ t('settings.language.title') }}
            <button
                type="button"
                class="btn btn-outline-success btn-sm"
                @click="showAddLanguageModal()"
                :disabled="!can('thesaurus_create')"
            >
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
                <tr
                    v-for="(language, i) in state.languages"
                    :key="`language-${i}`"
                >
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
                            <span
                                id="dropdownMenuButton"
                                class="clickable"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <i class="fas fa-fw fa-ellipsis-h"></i>
                            </span>
                            <div
                                class="dropdown-menu"
                                aria-labelledby="dropdownMenuButton"
                            >
                                <a
                                    class="dropdown-item"
                                    href="#"
                                    :disabled="!can('thesaurus_delete')"
                                    @click.prevent="onDeleteLanguage(language.id)"
                                >
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

    import useLanguageStore from '@/bootstrap/stores/language.js';

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


    import {
        handleLanguageAddedEvent,
        handleLanguageDeletedEvent,
        handleLanguageUpdatedEvent,
    } from '../handlers/system';
    import useSystemChannel from '@/composables/system-channel';

    export default {
        setup(props, context) {
            const { t } = useI18n();
            const languageStore = useLanguageStore();

            // FETCH

            // FUNCTIONS
            const showAddLanguageModal = _ => {
                showAddLanguage();
            };
            const onDeleteLanguage = id => {
                showDeleteLanguage(id);
            };

            // DATA
            const state = reactive({
                languages: computed(_ => languageStore.languages),
            });

            useSystemChannel([
                handleLanguageAddedEvent,
                handleLanguageDeletedEvent,
                handleLanguageUpdatedEvent,
            ])

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
        },
    };
</script>
