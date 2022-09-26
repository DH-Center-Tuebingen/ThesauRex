<template>
    <div>
        <span v-show="state.hasUnknownState">
            <i class="fas fa-fw fa-minus"></i>
        </span>
        <span v-show="state.hasAcceptState">
            <i class="fas fa-fw fa-check"></i>
        </span>
        <span v-show="state.hasNonAcceptState">
            <i class="fas fa-fw fa-ban"></i>
        </span>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
        toRefs,
    } from 'vue';

    export default {
        props: {
            status: {
                type: Number,
                required: true,
            }
        },
        setup(props, context) {
            const {
                status,
            } = toRefs(props);

            // FUNCTIONS

            // DATA
            const state = reactive({
                hasUnknownState: computed(_ => status.value > 1),
                hasAcceptState: computed(_ => status.value === 1),
                hasNonAcceptState: computed(_ => status.value === 0),
            });

            // RETURN
            return {
                // HELPERS
                // PROPS
                status,
                // LOCAL
                // STATE
                state,
            }
        },
    }
</script>