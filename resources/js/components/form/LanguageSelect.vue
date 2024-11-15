<template>
    <div
        class="btn-group btn-group-sm"
        role="group"
        aria-label="Basic radio toggle button group"
    >
        <template
            v-for="lang in store.getters.languages"
            :key="lang.id"
        >
            <input
                type="radio"
                class="btn-check"
                name="btnradio"
                :id="radioId(lang)"
                autocomplete="off"
                :checked="isActive(lang)"
                @click="store.dispatch('setActiveLanguage', lang)"
            >
            <label
                class="btn btn-outline-primary"
                :for="radioId(lang)"
            >
                {{ lang.display_name }}
            </label>
        </template>

    </div>
</template>

<script>
    import store from '@/bootstrap/store.js';
    export default {
        setup() {

            function radioId(lang) {
                return `language-${lang.id}`;
            }

            function isActive(lang) {
                const activeLanguageId = store.getters.activeLanguage?.id ?? -1;
                return lang.id === activeLanguageId
            }

            return {
                isActive,
                radioId,
                // State
                store,
            };
        },
    }
</script>