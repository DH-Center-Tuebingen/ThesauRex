<template>
    <div class="language-dropdown">
        <button
            class="btn btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
        >
            <div class="d-inline-flex gap-2">
                <span>
                    {{ emojiFlag(shortName) }}
                </span>
                <span>
                    {{ displayName }}
                </span>
            </div>
        </button>
        <div class="dropdown-menu">
            <a
                class="dropdown-item d-flex gap-2"
                href=""
                @click.prevent="select(language)"
                v-for="language in store.getters.languages"
                :key="`label-language-item-${language.short_name}`"
            >
                <span>
                    {{ emojiFlag(language.short_name) }}
                </span>
                <span>
                    {{ language.display_name }}
                </span>
            </a>
        </div>
    </div>
</template>

<script>
    import { computed } from 'vue'
    import { useStore } from '../bootstrap/store';

    import {
        emojiFlag,
    } from '@/helpers/helpers.js';

    export default {
        emits: ['update:modelValue'],
        props: {
            modelValue: {
                type: Object,
                required: true,
            },
        }, setup(props, context) {

            const select = (language) => {
                context.emit('update:modelValue', language);
            }

            const shortName = computed(() => {
                return props.modelValue?.short_name ?? '';
            });

            const displayName = computed(() => {
                return props.modelValue?.display_name ?? '';
            });

            return {
                displayName,
                emojiFlag,
                select,
                shortName,
                store: useStore(),
            };
        }
    }
</script>