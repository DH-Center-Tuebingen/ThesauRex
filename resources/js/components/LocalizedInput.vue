<template>
    <div class="localized-input input-group">
        <LanguageDropdown
            class="input-group-prepend"
            :modelValue="modelLanguage"
            @update:modelValue="(value) => $emit('update:modelLanguage', value)"
        />
        <input
            type="text"
            class="form-control"
            ref="focusTarget"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            @blur="log"
        >
        <slot name="after">

        </slot>
    </div>
</template>

<script>
    import { computed } from 'vue';
    import LanguageDropdown from './LanguageDropdown.vue';
    import store from '../bootstrap/store';
    import useFocus from '../composables/useFocus';

    export default {
        components: {
            LanguageDropdown,
        },
        emits: ['submit'],
        props: {
            modelLanguage: {
                type: Object,
                required: true,
            },
            modelValue: {
                type: String,
                required: true,
            },
        },
        setup(props, context) {

            const {
                focus,
                focusTarget,
            } = useFocus(10)

            return {
                // State
                store,
                focusTarget,
                // External
                focus,
                log: e => console.log('blurred', e, document.activeElement)
            };
        }
    }
</script>