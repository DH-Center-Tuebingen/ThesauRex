<template>
    <modal :name="name" width="40%" height="auto" :scrollable="true" @before-open="init">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ $t('global.discard.title') }}</h5>
                <button type="button" class="close" aria-label="Close" @click="cancel">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p class="alert alert-info" v-html="$t('global.discard.msg', {name: reference})">
                </p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-warning" @click="discard">
                    <i class="fas fa-fw fa-undo"></i> {{ $t('global.discard.confirm') }}
                </button>
                <button type="button" class="btn btn-success" @click="save">
                    <i class="fas fa-fw fa-check"></i> {{ $t('global.discard.confirmpos') }}
                </button>
                <button type="button" class="btn btn-secondary" @click="cancel">
                    <i class="fas fa-fw fa-times"></i> {{ $t('global.cancel') }}
                </button>
            </div>
        </div>
    </modal>
</template>

<script>
    export default {
        props: {
            name: {
                required: true,
                type: String
            }
        },
        methods: {
            init(event) {
                Vue.set(this, 'onDiscard', event.params.onDiscard);
                Vue.set(this, 'onSave', event.params.onSave);
                Vue.set(this, 'onCancel', event.params.onCancel);
                Vue.set(this, 'reference', event.params.reference);
            },
            discard() {
                if(this.onDiscard) this.onDiscard();
                this.hide();
            },
            save() {
                if(this.onSave) this.onSave();
                this.hide();
            },
            cancel() {
                if(this.onCancel) this.onCancel();
                this.hide();
            },
            hide() {
                this.$modal.hide(this.name);
            }
        },
        data() {
            return {
                onDiscard: undefined,
                onSave: undefined,
                onCancel: undefined,
                reference: "",
            }
        }
    }
</script>
