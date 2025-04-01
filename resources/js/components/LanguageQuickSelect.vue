<template>
    <div class="language-quick-select btn-fab-list d-flex align-items-center gap-1">
        <button
            v-for="language in store.getters.languages"
            :key="language"
            class="text-white btn btn-fab-md rounded-circle d-flex justify-content-center align-items-center"
            :class="getClass(language)"
            @click="selectLanguage(language)"
        >
            <div class="flag">
                {{ language.short_name.toUpperCase() }}
            </div>
        </button>
    </div>
</template>

<script>
    import { useStore } from '@/bootstrap/store';
    import { emojiFlag } from '@/helpers/helpers.js';

    export default {
        setup() {
            const store = useStore();

            const isActive = language => {
                return store.getters.activeLanguage?.id === language?.id;
            }

            const getClass = language => {
                console.log(language, store.getters.activeLanguage, isActive(language));
                return {
                    'active': isActive(language),
                };
            }

            return {
                isActive,
                getClass,
                emojiFlag,
                store,
                selectLanguage(lang) {
                    store.dispatch('setActiveLanguage', lang)
                }
            };
        }
    };
</script>
