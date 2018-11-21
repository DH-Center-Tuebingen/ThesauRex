<template>
    <div @dragenter="onDragEnter" @dragleave="onDragLeave" :id="`tree-node-${data.id}`">
        <span>{{ $getLabel(data) }}</span>
    </div>
</template>

<script>
    import debounce from 'debounce';

    export default {
        props: {
            data: {
                required: true,
                type: Object
            }
        },
        methods: {
            onDragEnter() {
                if(!this.data.dragAllowed()) return;
                this.asyncToggle.clear();
                this.asyncToggle();
            },
            onDragLeave(item) {
            },
            doToggle() {
                if(!this.data.state.opened && this.data.state.openable) {
                    this.data.onToggle({data: this.data});
                }
            }
        },
        data() {
            return {
            }
        },
        computed: {
            asyncToggle() {
                return debounce(this.doToggle, this.data.dragDelay || 500);
            },
        }
    }
</script>
