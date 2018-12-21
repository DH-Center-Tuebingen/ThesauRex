<template>
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">
                {{
                    $t('modals.delete-concept.title', {
                        name: label
                    })
                }}
            </h5>
            <button type="button" class="close" aria-label="Close" @click="abort()">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body col">
            <p class="alert alert-info" v-html="$t('modals.delete-concept.info', {name: label})">
            </p>
        </div>
        <div class="modal-footer d-flex justify-content-between">
            <button type="submit" class="btn btn-outline-danger" @click="deleteOneUp()">
                <span class="fa-stack d-inline">
                    <i class="fas fa-trash"></i>
                    <i class="fas fa-arrow-up" data-fa-transform="shrink-2 left-4 up-5"></i>
                </span>
                <span v-html="$t('modals.delete-concept.delete', {name: label})"></span>
            </button>
            <button type="button" class="btn btn-outline-danger" @click="deleteAll()">
                <i class="fas fa-fw fa-trash"></i>
                {{
                    $t('modals.delete-concept.delete-recursive')
                }}
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="abort()">
                <i class="fas fa-fw fa-times"></i>
                {{ $t('global.close') }}
            </button>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'DeleteConcept',
        props: {
            element: {
                required: true,
                type: Object
            },
            treeName: {
                required: true,
                type: String
            },
            eventBus: {
                required: true,
                type: Object
            }
        },
        methods: {
            abort() {
                this.$emit('close');
            },
            deleteAll() {
                this.eventBus.$emit(`dc-delete-all-${this.treeName}`, {
                    element: this.element
                });
                this.$emit('close');
            },
            deleteOneUp() {
                this.eventBus.$emit(`dc-delete-one-${this.treeName}`, {
                    element: this.element
                });
                this.$emit('close');
            }
        },
        data() {
            return {
            }
        },
        computed: {
            label() {
                return this.$getLabel(this.element);
            }
        }
    }
</script>
