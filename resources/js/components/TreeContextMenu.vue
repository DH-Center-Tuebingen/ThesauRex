<template>
    <div class="dropdown-menu show">
        <!-- <a href="#" class="dropdown-item disabled" @click.stop.prevent @dblclick.stop.prevent>
            {{ data.data.name }}
        </a> -->
        <a href="#" class="dropdown-item" @click.stop.prevent="onAddItem" @dblclick.stop.prevent>
            <i class="fas fa-fw fa-plus text-success"></i>
            {{ $t('menus.tree-node.add-concept') }}
        </a>
        <a href="#" class="dropdown-item" @click.stop.prevent="onExportItem" @dblclick.stop.prevent>
            <i class="fas fa-fw fa-upload text-info"></i>
            {{ $t('menus.tree-node.export-concept') }}
        </a>
        <a href="#" class="dropdown-item" @click.stop.prevent="onDeleteItem" @dblclick.stop.prevent>
            <i class="fas fa-fw fa-trash text-danger"></i>
            {{ $t('menus.tree-node.delete-concept') }}
        </a>
    </div>
</template>

<script>
export default {
    props: {
        data: {
            required: true,
            type: Object
        }
    },
    mounted() {},
    methods: {
        onAddItem() {
            this.data.data.eventBus.$emit(`cm-item-add-${this.data.data.treeName}`, {
                element: this.data.data
            });
        },
        onExportItem() {
            this.data.data.eventBus.$emit(`cm-item-export-${this.data.data.treeName}`, {
                element: this.data.data
            });
        },
        onDeleteItem() {
            this.data.data.eventBus.$emit(`cm-item-delete-${this.data.data.treeName}`, {
                element: this.data.data
            });
        }
    }
}
</script>
