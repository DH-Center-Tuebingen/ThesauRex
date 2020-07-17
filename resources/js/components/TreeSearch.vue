<template>
    <div class="input-group">
        <input type="text"
        autocomplete="off"
        class="form-control"
        v-model="query"
        :placeholder="$t(placeholder)"
        @blur="blur"
        @input="debounce"
        @keydown.down="down"
        @keydown.enter="hit"
        @keydown.esc="clearItem"
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

        <div class="dropdown-menu" style="display: flex; flex-direction: column;" v-show="hasItems">
            <a href="#" class="dropdown-item" v-for="(item, $item) in items" :class="activeClass($item)" @click.prevent="hit" @mousemove="setActive($item)">
                <span>
                    {{ item.selectedLabel }}
                </span>
                <ol class="breadcrumb mb-0 p-0 pb-1 bg-none small">
                    <li class="breadcrumb-item" v-for="p in item.parents">
                        <span>
                            {{ p.selectedLabel }}
                        </span>
                    </li>
                </ol>
            </a>
        </div>
    </div>
</template>

<script>
    import VueTypeahead from 'vue-typeahead';

    export default {
        extends: VueTypeahead,
        props: {
            placeholder: {
                type: String,
                default: 'global.search'
            },
            treeName: {
                required: true,
                type: String
            },
            onMultiselect: {
                type: Function,
                required: false
            },
            onClear: {
                type: Function,
                required: false
            },
            value: {
                type: String,
                required: false
            }
        },
        data () {
            return {
                src: 'search/concept',
                minChars: 2,
                selectFirst: false
            }
        },
        mounted() {
            this.query = this.value;
        },
        methods: {
            onHit(item) {
                const vm = this;
                this.$router.push({
                    name: 'conceptdetail',
                    params: {
                        id: item.id
                    },
                    query: this.$route.query
                });
                this.reset();
            },
            clearItem() {
                if(this.onClear) this.onClear();
                this.reset();
            },
            prepareResponseData(data) {
                data.forEach(c => {
                    c.selectedLabel = this.$getLabel(c, true);
                    c.parents.forEach(p => {
                        p.selectedLabel = this.$getLabel(p);
                    });
                });
                return data;
            },
            hit() {
                if(this.current !== -1) {
                    this.onHit(this.items[this.current]);
                } else {
                    if(this.onMultiselect) {
                        this.onMultiselect(this.items);
                        this.items = [];
                    }
                }
            },
            blur() {
                // if(this.current !== -1) {
                //     this.reset();
                // }
            },
            // override fetch to return queued request
            fetch () {
                if (!this.$http) {
                    return util.warn('You need to provide a HTTP client', this)
                }

                if (!this.src) {
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
            }
        },
        computed: {
            debounce () {
                return _debounce(this.update, 250)
            },
            data() {
                return {
                    t: this.treeName
                };
            },
        }
    }
</script>
