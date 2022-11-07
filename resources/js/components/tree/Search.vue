<template>
    <multiselect
        v-model="state.entry"
        :name="state.id"
        :id="state.id"
        :object="true"
        :label="'id'"
        :track-by="'id'"
        :valueProp="'id'"
        :mode="'single'"
        :options="query => search(query)"
        :hideSelected="false"
        :filterResults="false"
        :resolveOnLoad="false"
        :clearOnSearch="true"
        :clearOnSelect="true"
        :caret="false"
        :minChars="0"
        :searchable="true"
        :delay="delay"
        :limit="limit"
        :ref="el => msRef = el"
        :placeholder="t('tree.search.placeholder')"
        @select="optionSelected"
    >
        <template v-slot:singlelabel="{ value }">
            <div class="multiselect-single-label">
                {{ value.name }}
            </div>
        </template>
        <template v-slot:option="{ option }">
            <div class="d-flex flex-column fs-6 numbered-list-wrapper">
                <span class="fw-bold">
                    {{ getLabel(option, true) }}
                </span>
                <div class="d-flex align-items-center pb-1 ms-2" :class="{'numbered-list': option.parents.length > 1}" v-for="(parList, i) in sortParents(option.parents)"
                    :key="`search-result-multiselect-tree-search-${treeName}-list-${i}`">
                    <ol class="breadcrumb m-0 ms-1 p-0 bg-none small">
                        <li class=" breadcrumb-item text-muted small" v-for="p in parList"
                            :key="`search-result-multiselect-tree-search-${treeName}-${p.id}`">
                            <span>
                                {{ getLabel(p, true) }}
                            </span>
                        </li>
                        <li class=" breadcrumb-item text-muted small fst-italic" v-if="parList.length == 0">
                            <span>
                                {{ t('tree.search.is_top_level') }}
                            </span>
                        </li>
                    </ol>
                </div>
            </div>
        </template>
        <template v-slot:beforelist="{}" v-if="addOption && state.query.length > 0">
            <div class="d-flex flex-column py-2 px-2-5 fs-6">
                <span class="" @click="addOptionSelected()">
                    Add new concept <span class="fw-bold">{{ state.query }}</span>
                </span>
            </div>
        </template>
        <template v-slot:nooptions="{}">
            <div v-if="addOption"></div>
            <div v-else>
                <div class="p-2" v-if="!!state.query" v-html="t('tree.search.no_results', {term: state.query})" />
                <div class="p-1 text-muted" v-else>
                    {{ t('tree.search.empty_term_info') }}
                </div>
            </div>
        </template>
    </multiselect>
</template>

<script>
    import {
        reactive,
        ref,
        onMounted,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import {
        searchConcept,
    } from '@/api.js';

    import {
        getTs,
        gotoConcept,
    } from '@/helpers/helpers.js';

    import {
        getLabel,
        sortParents,
    } from '@/helpers/tree.js';

    export default {
        props: {
            delay: {
                type: Number,
                required: false,
                default: 300,
            },
            limit: {
                type: Number,
                required: false,
                default: 10,
            },
            treeName: {
                type: String,
                required: true,
            },
            exclude: {
                type: Array,
                required: false,
                default: [],
            },
            addOption: {
                type: Boolean,
                required: false,
                default: false,
            },
        },
        emits: ['add'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                delay,
                limit,
                treeName,
                exclude,
                addOption,
            } = toRefs(props);

            // FETCH

            // FUNCTIONS
            const search = async (query) => {
                state.query = query;
                if(!query) {
                    return await new Promise(r => r([]));
                }
                return await searchConcept(query, treeName.value, exclude.value);
            };
            const optionSelected = option => {
                state.query = '';
                state.entry = {};
                if(!context.attrs.onSelect) {
                    gotoConcept(option.id, treeName.value);
                } else if(option) {
                    context.emit('select', {
                        option: option
                    });
                }
            };
            const addOptionSelected = _ => {
                const content = state.query;
                state.query = '';
                state.entry = {};
                msRef.value.close();
                msRef.value.clear();
                msRef.value.clearSearch();
                context.emit('add', {
                    content: content,
                });
            };

            // DATA
            const msRef = ref({});
            const state = reactive({
                id: `multiselect-tree-search-${treeName.value}-${getTs()}`,
                entry: {},
                query: '',
            });

            // RETURN
            return {
                t,
                // HELPER
                getLabel,
                sortParents,
                // LOCAL
                search,
                optionSelected,
                // PROPS
                delay,
                limit,
                treeName,
                addOption,
                addOptionSelected,
                // STATE
                msRef,
                state,
            };
        },
    }
</script>
