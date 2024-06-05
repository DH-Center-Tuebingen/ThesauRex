<template>
    <button
        class="btn"
        role="button"
        :disabled="loading"
    >
        <span
            v-if="loading"
            class="me-1"
        >
            <i class="fas fa-fw fa-circle-notch fa-spin" />
        </span>
        <slot
            v-else
            name="icon"
        />

        <slot />
    </button>
</template>

<script>
    export default {
        props: {
            loading: {
                type: Boolean,
                required: true,
            },
        },
    };
</script>