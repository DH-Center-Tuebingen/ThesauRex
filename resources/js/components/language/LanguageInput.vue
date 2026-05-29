<template>
    <div class="input-group">
        <template v-if="languages.length > 1">
            <button
                class="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
            >
                <div class="d-inline-flex gap-2">
                    <span>
                        {{ emojiFlag(data.language.short_name) }}
                    </span>
                    <span>
                        {{ data.language.display_name }}
                    </span>
                </div>
            </button>
            <div class="dropdown-menu">
                <a
                    class="dropdown-item d-flex gap-2"
                    href=""
                    @click.prevent="setLanguage(language)"
                    v-for="language in languages"
                    :key="`create-concept-language-item-${language.short_name}`"
                >
                    <span>
                        {{ emojiFlag(language.short_name) }}
                    </span>
                    <span>
                        {{ language.display_name }}
                    </span>
                </a>
            </div>
        </template>
        <button
            v-else
            class="btn btn-outline-secondary disabled"
        >
            <div
                class="d-inline-flex gap-2"
            >
                <span>
                    {{ emojiFlag(data.language.short_name) }}
                </span>
                <span>
                    {{ data.language.display_name }}
                </span>
            </div>
        </button>
        <input
            ref="inputField"
            type="text"
            class="form-control"
            v-model="data.content"
            @input="labelChanged"
        >
        <button
            v-if="addButton"
            class="btn btn-success"
            type="button"
            :disabled="!hasContent"
            @click="emitAdd"
        >
            <i class="fas fa-fw fa-plus"></i>
        </button>
    </div>
</template>

<script>
    import {
        computed,
        nextTick,
        onMounted,
        ref,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import useLanguageStore from '@/bootstrap/stores/language.js';

    import {
        emojiFlag,
    } from '@/helpers/helpers.js';

    import {
        getLabel,
    } from '@/helpers/tree.js';

    export default {
        props: {
            initialValue: {
                type: String,
                required: false,
                default: '',
            },
            addButton: {
                type: Boolean,
                required: false,
                default: false,
            },
        },
        emits: ['change', 'add'],
        setup(props, context) {
            const { t } = useI18n();
            const languageStore = useLanguageStore();

            // FUNCTIONS
            const setLanguage = language => {
                data.value.language = language;
                context.emit('change', data.value);
            };

            const labelChanged = () => {
                context.emit('change', data.value);
            };

            const emitAdd = () => {
                context.emit('add', data.value);
            };

            // DATA
            const data = ref({
                language: {},
                content: props.initialValue,
            });
            const languages = computed(_ => languageStore.languages);
            const hasContent = computed(_ => !!data.value.content);

            const inputField = ref(null);

            // ON MOUNTED
            onMounted(_ => {
                data.value.language = languageStore.activeLanguage;
                // // wrap in two nextTick, to make sure modal is really rendered
                // // using only one nextTick might fail on some systems
                nextTick(_ => {
                    nextTick(_ => {
                        console.log(inputField)
                        // inputField.value.focus();
                    });
                });
            });

            // RETURN
            return {
                t,
                // HELPERS
                emojiFlag,
                getLabel,
                // PROPS
                // LOCAL
                setLanguage,
                labelChanged,
                emitAdd,
                // STATE
                data,
                languages,
                hasContent,
            };
        },
    }
</script>
