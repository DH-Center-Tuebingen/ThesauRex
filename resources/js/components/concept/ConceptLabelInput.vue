<template>
    <div
        class="d-flex flex-row justify-content-between align-items-center gap-2"
        @mouseenter="() => hovered = true"
        @mouseleave="() => hovered = false"
    >
        <div class="flex-fill">
            <span v-if="!editing" class="label-text">
                {{ label.label }}
            </span>
            <div
                v-else
                class="d-flex flex-row align-items-center"
            >
                <input
                    type="text"
                    class="form-control flex-fill"
                    v-model="editValue"
                />
                <button
                    type="button"
                    class="btn btn-outline-success btn-sm ms-2"
                    :disabled="!isDirty()"
                    @click="update()"
                >
                    <i class="fas fa-fw fa-check"></i>
                </button>
                <button
                    type="button"
                    class="btn btn-outline-danger btn-sm ms-2"
                    @click="cancel()"
                >
                    <i class="fas fa-fw fa-ban"></i>
                </button>
            </div>
        </div>
        <div class="d-flex gap-1">
            <div
                class="hover-actions"
                v-show="hovered && !editing"
            >
                <span
                    class="edit-button"
                    @click="edit()"
                >
                    <i class="fas fa-fw fa-edit clickable"></i>
                </span>
                <span
                    class="delete-button"
                    @click="remove(label.id)"
                    v-if="concept.labels.length > 1"
                >
                    <i class="fas fa-fw fa-trash text-danger clickable"></i>
                </span>
            </div>
            <span v-show="label.concept_label_type == 1">
                <i class="fas fa-fw fa-star color-yellow"></i>
            </span>
            <span
                class="lang"
                :data-lang="label.language.short_name"
            >
                {{ emojiFlag(label.language.short_name) }}
            </span>
        </div>
    </div>
</template>

<script>
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useToast } from '@/plugins/toast.js';
    import { useConceptStore } from '@/bootstrap/stores/concept.js';

    import {
        emojiFlag,
    } from '@/helpers/helpers.js';

    export default {
        props: {
            concept: {
                type: Object,
                required: true
            },
            label: {
                type: Object,
                required: true
            },
            tree: {
                type: String,
                required: true
            },
        },
        setup(props) {
            const { t } = useI18n();
            const toast = useToast();
            const editing = ref(false)
            const hovered = ref(false);
            const editValue = ref(null);
            
            const conceptStore = useConceptStore();

            const remove = id => {
                conceptStore.deleteLabel(props.concept.id, props.tree, id).then(_ => {
                    const title = t('detail.label.toasts.deleted.title');
                    const msg = t('detail.label.toasts.deleted.message', {
                        label: props.label.label,
                    });
                    toast.$toast(msg, title, {
                        channel: 'info',
                        html: true,
                    });
                });
            };

            const edit = () => {
                editValue.value = props.label.label;
                editing.value = true;
            };
            const cancel = () => {
                editing.value = false;
                editValue.value = null;
            };
            
            const isDirty = () => {
                return editValue.value !== props.label.label;
            }

            const update = async _ => {
                try {
                    await conceptStore.patchLabel(props.concept.id, props.tree, props.label.id, editValue.value)
                } catch(err) {
                    console.error("Error updating label:", err);
                    return;
                }

                cancel();
            };


            return {
                t,
                cancel,
                editing,
                edit,
                editValue,
                emojiFlag,
                hovered,
                isDirty,
                remove,
                update,
            };
        }
    }
</script>