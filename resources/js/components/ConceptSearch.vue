<template>
    <div class="input-group">
        <input
            type="text"
            autocomplete="off"
            class="form-control"
            v-model="query"
            :placeholder="$t(placeholder)"
            @input="debounce"
            @keydown.down="down"
            @keydown.enter="hit"
            @keydown.esc="reset"
            @keydown.up="up"
        />
        <div class="input-group-append">
            <span
                class="input-group-text clickable"
                @click="clearItem"
            >
                <i class="fas fa-fw fa-times"></i>
            </span>
            <span class="input-group-text multiselect-search">
                <LoadingSpinner v-if="true" />
                <template v-else>
                    <i class="fas fa-fw fa-search"></i>
                </template>
            </span>
        </div>

        <div
            class="dropdown-menu"
            style="display: flex; flex-direction: column; max-height: 50vh; overflow-y: auto;"
            v-show="hasItems || hasAddNewOption"
        >
            <a
                href="#"
                class="dropdown-item px-1"
                v-for="(item, k) in items"
                :class="activeClass(k)"
                @click.prevent="hit"
                @mousemove="setActive(k)"
            >
                {{ item.selectedLabel }}
                <ol class="breadcrumb mb-0 p-0 pb-1 bg-none small">
                    <li
                        class="breadcrumb-item"
                        v-for="p in item.parents"
                    >
                        <span>
                            {{ p.selectedLabel }}
                        </span>
                    </li>
                </ol>
            </a>
            <a
                v-if="addNew"
                href="#"
                class="dropdown-item px-1"
                :class="activeClass(items.length)"
                @click.prevent="newItem(query)"
                @mousemove="setActive(items.length)"
            >
                {{ query }} (Add new)
            </a>
        </div>
    </div>
</template>

<script>
    import VueTypeahead from 'vue-typeahead';
    import { LoadingSpinner } from 'dhc-components';

    export default {
        components: {
            LoadingSpinner
        },
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
            // override fetch to return queued request
            fetch() {
                if(!this.$http) {
                    return util.warn('You need to provide a HTTP client', this)
                }

                if(!this.src) {
                    return util.warn('You need to set the `src` property', this)
                }

                const src = this.queryParamName
                    ? this.src
                    : this.src + this.query

                const params = this.queryParamName
                    ? Object.assign({ [this.queryParamName]: this.query }, this.data)
                    : this.data

                let cancel = new Promise((resolve) => this.cancel = resolve)
                let request = this.$httpQueue.add(() => this.$http.get(src, { params }));

                return Promise.race([cancel, request])
            },
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
                let newData = data.filter(c => {
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
                newData.forEach(c => {
                    c.selectedLabel = this.$getLabel(c);
                    c.parents.forEach(p => {
                        p.selectedLabel = this.$getLabel(p);
                    });
                });
                return newData;
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
                // this.items = [];
                // this.loading = false;
                this.reset();
            }
        },
        data() {
            return {
                src: 'search/concept',
                minChars: 3,
                selectFirst: false
            }
        },
        computed: {
            debounce() {
                return _debounce(this.update, 250);
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
