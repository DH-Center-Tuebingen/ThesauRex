<template>
    <ul class="dropdown-menu" :id="`${data.tree}-tree-node-${data.id}-contextmenu`">
        <li>
            <h6 class="dropdown-header" @click.stop.prevent="" @dblclick.stop.prevent="">
                {{ state.label }}
            </h6>
        </li>
        <li v-if="can('thesaurus_write')">
            <a class="dropdown-item py-2" href="#" @click.stop.prevent="onAdd()" @dblclick.stop.prevent="">
                <i class="fas fa-fw fa-plus text-success"></i>
                <span class="ms-2">
                    {{ t('tree.contextmenu.add') }}
                </span>
            </a>
        </li>
        <li v-if="can('thesaurus_share')">
            <a class="dropdown-item py-2" href="#" @click.stop.prevent="onExport()" @dblclick.stop.prevent="">
                <i class="fas fa-fw fa-upload text-primary"></i>
                <span class="ms-2">
                    {{ t('tree.contextmenu.export') }}
                </span>
            </a>
        </li>
        <li v-if="can('thesaurus_delete')">
            <a class="dropdown-item py-2" href="#" @click.stop.prevent="onDelete()" @dblclick.stop.prevent="">
                <i class="fas fa-fw fa-trash text-danger"></i>
                <span class="ms-2">
                    {{ t('tree.contextmenu.delete') }}
                </span>
            </a>
        </li>
        <li v-if="can('thesaurus_write')">
            <a class="dropdown-item py-2" :class="state.disabledAnchorClasses" href="#"
                @click.stop.prevent="onRemoveRelation()" @dblclick.stop.prevent="">
                <i class="fas fa-fw fa-times text-danger"></i>
                <span class="ms-2" v-if="state.hasParent"
                    v-html="t('tree.contextmenu.remove_relation_to', { parent: state.parentLabel })" />
                <span class="ms-2" v-else v-html="t('tree.contextmenu.remove_relation_as_tlc')" />
            </a>
        </li>
    </ul>
</template>

<script>


import { useI18n } from 'vue-i18n';

import {
    Dropdown,
} from 'bootstrap';

import {
    can,
} from '@/helpers/helpers.js';

import {
    getLabel,
    exportTree,
} from '@/helpers/tree.js';

import {
    removeRelation,
} from '@/api.js';

import {
    showCreateConcept,
    showDeleteConcept,
} from '@/helpers/modal.js';
import { reactive } from 'vue';
import { computed } from 'vue';


export default {
    setup(props, context) {

        const { t } = useI18n();

        const onAdd = _ => {
            if (!can('thesaurus_write')) return;
            showCreateConcept(props.data.tree, props.data.id);
        };
        
        const onExport = _ => {
            if (!can('thesaurus_share')) return;
            exportTree(props.data.tree, props.data.id);
        };

        const onDelete = _ => {
            if (!can('thesaurus_delete')) return;
            showDeleteConcept(props.data.tree, props.data.id);
        };

        const onRemoveRelation = _ => {
            if (!can('thesaurus_write') || !state.canDeleteBroader) return;

            const narrower_id = props.data.nid || props.data.id;
            const broader_id = state.parent.nid || parent.id;
            removeRelation(narrower_id, broader_id, props.data.tree);
        };

        const state = reactive({
            label: computed(_ => getLabel(props.data)),
        })

        return {
            t,
            onAdd,
            onExport,
            onDelete,
            onRemoveRelation,
        }
    }
};
</script>

<style lang='scss' scoped></style>