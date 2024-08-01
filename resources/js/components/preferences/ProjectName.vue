<template>
    <div class="row">
        <label class="col-md-2 form-label"></label>
        <div class="col-md-10">
            <input
                class="form-control"
                type="text"
                v-model="data"
                :readonly="readonly"
                @input="onChange"
            />
        </div>
    </div>
</template>

<script>
    import {
        toRefs,
    } from 'vue';

    import {
        debounce
    } from '@/helpers/helpers.js';

    export default {
        props: {
            data: {
                required: true,
                type: String,
            },
            readonly: {
                required: false,
                type: Boolean,
                default: false,
            },
        },
        emits: ['changed'],
        setup(props, context) {
            const {
                data,
                readonly,
            } = toRefs(props);

            // FUNCTIONS
            const onChange = debounce(e => {
                if(readonly.value) return;
                context.emit('changed', {
                    value: e.target.value
                });
            }, 250);

            // RETURN
            return {
                // LOCAL
                onChange,
                // PROPS
                data,
                readonly,
                // STATE
            };
        }
    }
</script>
