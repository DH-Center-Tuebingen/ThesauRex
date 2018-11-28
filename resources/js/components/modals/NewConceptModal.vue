<template>
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">
                <span v-if="parent">
                    {{
                        $t('modals.new-concept.title-parent', {
                            name: parentLabel
                        })
                    }}
                </span>
                <span v-else>
                    {{ $t('modals.new-concept.title') }}
                </span>
            </h5>
            <button type="button" class="close" aria-label="Close" @click="abort()">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body col">
            <form role="form" id="new-concept-form" name="new-concept-form" class="mt-2" @submit.prevent="create()">
                <div class="input-group">
                    <div class="input-group-prepend">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span>
                                {{ $ce.flag(selectedLanguage.short_name) }}
                            </span>
                            <span>
                                {{ selectedLanguage.display_name }}
                            </span>
                        </button>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="" @click.prevent="setLanguage(language)" v-for="language in languages">
                                <span>
                                    {{ $ce.flag(language.short_name) }}
                                </span>
                                <span>
                                    {{ language.display_name }}
                                </span>
                            </a>
                        </div>
                    </div>
                    <input type="text" class="form-control" v-model="labelText">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="submit" class="btn btn-success" form="new-concept-form" :disabled="!validated">
                <i class="fas fa-fw fa-check"></i> {{ $t('global.create') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="abort()">
                <i class="fas fa-fw fa-times"></i> {{ $t('global.close') }}
            </button>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'NewConcept',
        props: {
            languages: {
                required: true,
                type: Array
            },
            onSubmit: {
                required: true,
                type: Function
            },
            parent: {
                required: false,
                type: Object
            },
            label: {
                required: false,
                type: String
            }
        },
        methods: {
            setLanguage(l) {
                this.selectedLanguage = l;
            },
            abort() {
                this.$emit('close');
            },
            create() {
                if(!this.validated) return;
                const c = {
                    label: this.labelText,
                    language: this.selectedLanguage,
                    parent: this.parent
                };
                this.onSubmit(c);
                this.$emit('close');
            }
        },
        data() {
            return {
                labelText: this.label,
                selectedLanguage: this.languages[0]
            }
        },
        computed: {
            validated() {
                return !!this.selectedLanguage && this.labelText && this.labelText.length;
            },
            parentLabel() {
                return this.parent ? this.$getLabel(this.parent) : '';
            }
        }
    }
</script>
