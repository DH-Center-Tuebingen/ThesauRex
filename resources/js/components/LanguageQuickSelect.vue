<template>
    <div class="language-quick-select btn-fab-list d-flex align-items-center gap-1">
        <button
            v-for="language in shownLanguages"
            :key="language"
            class="btn btn-fab-md rounded-circle d-flex justify-content-center align-items-center"
            :class="getClass(language)"
            :title="`${emojiFlag(language.short_name)} ${language.display_name}`"
            @click="selectLanguage(language)"
        >
            <div class="flag">
                {{ language.short_name.toUpperCase() }}
            </div>
        </button>
        <div
            class="dropdown"
            v-if="dropdownLanguages.length > 0"
        >
            <a
                href="#"
                class="dropdown-toggle text-secondary"
                data-bs-toggle="dropdown"
            >
            </a>
            <ul class="dropdown-menu">
                <li
                    v-for="language in dropdownLanguages"
                    :key="language"
                    :class="getClass(language)"
                    @click="selectLanguage(language)"
                >
                    <a
                        class="dropdown-item d-flex flex-row gap-2"
                        href="#"
                        @click.prevent="selectLanguage(language)"
                    >
                        {{ emojiFlag(language.short_name) }}
                        <span>
                            {{ language.display_name }}
                        </span>
                        <span class="text-muted">
                            {{ language.short_name.toUpperCase() }}
                        </span>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import {
        computed,
    } from 'vue';

    import {useStore} from '@/bootstrap/store.js';

    import {emojiFlag} from '@/helpers/helpers.js';

    export default {
        props: {
            maxButtons: {
                type: Number,
                default: 3,
            },
        },
        setup(props) {
            const store = useStore();

            const isActive = language => {
                return store.getters.activeLanguage?.id === language?.id;
            };

            const getClass = language => {
                const active = isActive(language);
                return {
                    'active': active,
                    'text-white': active,
                    'text-secondary': !active,
                };
            };

            const selectLanguage = lang => {
                store.dispatch('setActiveLanguage', lang);
            };

            const shownLanguages = computed(_ => {
                const activeIdx = store.getters.languages.findIndex(language => isActive(language));
                if(activeIdx >= props.maxButtons) {
                    return [
                        store.getters.languages[activeIdx],
                        ...store.getters.languages.slice(0, props.maxButtons - 1),
                    ];
                } else {
                    return store.getters.languages.slice(0, props.maxButtons);
                }
            });
            const dropdownLanguages = computed(_ => {
                const activeIdx = store.getters.languages.findIndex(language => isActive(language));
                if(activeIdx >= props.maxButtons) {
                    return store.getters.languages.slice(props.maxButtons - 1).filter(language => !isActive(language));
                } else {
                    return store.getters.languages.slice(props.maxButtons);
                }
            });

            return {
                isActive,
                getClass,
                selectLanguage,
                shownLanguages,
                dropdownLanguages,
                emojiFlag,
            };
        }
    };
</script>
