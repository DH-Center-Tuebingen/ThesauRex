<template>
    <div class="input-group">
        <LanguageDropdown
            class="input-group-prepend"
            :modelValue="modelLanguage"
            @update:modelValue="(value) => $emit('update:modelLanguage', value)"
        />
        <input
            type="text"
            class="form-control"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
        >
        <slot name="after">

        </slot>
    </div>
</template>

<script>
    import LanguageDropdown from './LanguageDropdown.vue';

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
        }
    }
</script>