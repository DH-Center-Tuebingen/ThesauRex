<template>
    <div class="input-group">
        <input type="text"
        autocomplete="off"
        class="form-control"
        v-model="query"
        :placeholder="$t(placeholder)"
        @blur="closeSelect"
        @input="debounce"
        @keydown.down="down"
        @keydown.enter="hit"
        @keydown.esc="reset"
        @keydown.up="up"/>
        <div class="input-group-append">
            <span class="input-group-text clickable" @click="clearItem">
                <i class="fas fa-fw fa-times"></i>
            </span>
            <span class="input-group-text multiselect-search">
                <i class="fas fa-spinner fa-spin" v-if="loading"></i>
                <template v-else>
                    <i class="fas fa-fw fa-search"></i>
                </template>
            </span>
        </div>

        <div class="dropdown-menu" style="display: flex; flex-direction: column; max-height: 50vh; overflow-y: auto;" v-show="hasItems || hasAddNewOption">
            <a href="#" class="dropdown-item px-1" v-for="(item, k) in items" :class="activeClass(k)" @mosedown="hit" @mousemove="setActive(k)">
                {{ $getLabel(item) }}
                <ol class="breadcrumb mb-0 p-0 pb-1 bg-none small">
                    <li class="breadcrumb-item" v-for="p in item.parents">
                        <span>
                            {{ p }}
                        </span>
                    </li>
                </ol>
            </a>
            <a v-if="addNew" href="#" class="dropdown-item px-1" :class="activeClass(items.length)" @mosedown="newItem(query)" @mousemove="setActive(items.length)">
                {{ query }} (Add new)
            </a>
        </div>
    </div>
</template>

<script>
    import VueTypeahead from 'vue-typeahead';
    import debounce from 'debounce';

    export default {
        extends: VueTypeahead,
        props: {
            placeholder: {
                type: String,
                default: 'global.search'
            },
            concept: {
                required: true,
                type: Object
            },
            treeName: {
                required: true,
                type: String
            },
            addNew: {
                required: false,
                type: Boolean
            },
            value: {
                type: String,
                required: false
            }
        },
        mounted() {
            this.query = this.value;
        },
        methods: {
            update() {
                this.cancel();

                if(!this.query) {
                    return this.reset();
                }

                if(this.minChars) {
                    if(this.query.length < this.minChars) {
                        return;
                    }
                }

                this.loading = true;

                this.fetch().then((response) => {
                    if(response && this.query) {
                        let data = response.data;
                        data = this.prepareResponseData ? this.prepareResponseData(data) : data;
                        this.items = data;
                        this.current = -1;
                        this.loading = false;

                        if(this.selectFirst) {
                            this.down();
                        }
                    }
                });
            },
            prepareResponseData(data) {
                return data.filter(c => {
                    if(c.id == this.concept.id) {
                        return false;
                    }
                    if(this.broaderIds.includes(c.id)) {
                        return false;
                    }
                    if(this.narrowerIds.includes(c.id)) {
                        return false;
                    }

                    return true;
                });
            },
            onHit(item) {
                if(item) {
                    this.query = item.name;
                } else {
                    this.query = '';
                }
                this.$emit('select', {
                    concept: item
                });
                this.closeSelect();
            },
            newItem(label) {
                const item = {
                    is_new: true,
                    label: label
                };
                this.onHit(item);
            },
            clearItem() {
                this.onHit();
            },
            closeSelect() {
                this.items = [];
                this.loading = false;
            }
        },
        data () {
            return {
                src: 'search/concept',
                minChars: 3,
                selectFirst: false
            }
        },
        computed: {
            debounce() {
                return debounce(this.update, 250)
            },
            broaderIds() {
                return this.concept.broaders.map(b => {
                    return b.id;
                });
            },
            narrowerIds() {
                return this.concept.narrowers.map(n => {
                    return n.id;
                });
            },
            data() {
                return {
                    t: this.treeName
                };
            },
            hasAddNewOption() {
                return this.addNew &&
                    this.query &&
                    (
                        !this.minChars ||
                        (this.query.length >= this.minChars)
                    );
            }
        }
    }
</script>
