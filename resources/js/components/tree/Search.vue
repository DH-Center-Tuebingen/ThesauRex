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
        @keydown.enter="selectCurrentOrCreateNew"
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
                <div
                    v-for="(parList, i) in sortParents(option.parents)"
                    :key="`search-result-multiselect-tree-search-${treeName}-list-${i}`"
                    class="d-flex align-items-center pb-1 ms-2"
                    :class="{ 'numbered-list': option.parents.length > 1 }"
                >
                    <ol class="breadcrumb m-0 ms-1 p-0 bg-none small">
                        <li
                            v-for="p in parList"
                            :key="`search-result-multiselect-tree-search-${treeName}-${p.id}`"
                            class=" breadcrumb-item text-muted small"
                        >
                            <span>
                                {{ getLabel(p, true) }}
                            </span>
                        </li>
                        <li
                            v-if="parList.length == 0"
                            class=" breadcrumb-item text-muted small fst-italic"
                        >
                            <span>
                                {{ t('tree.search.is_top_level') }}
                            </span>
                        </li>
                    </ol>
                </div>
            </div>
        </template>
        <template
            v-slot:beforelist="{ }"
            v-if="addOption && state.query.length > 0"
        >
            <div class="d-flex flex-column py-2 px-2-5 fs-6">
                <span @click="addOptionSelected()">
                    {{ t('modals.new_concept.add_new_info') }}
                    <span class="fw-bold">{{ state.query }}</span>
                </span>
            </div>
        </template>
        <template v-slot:nooptions="{ }">
            <div v-if="addOption"></div>
            <div v-else>
                <div
                    v-if="!!state.query"
                    class="p-2"
                    v-html="t('tree.search.no_results', { term: state.query })"
                />
                <div
                    v-else
                    class="p-1 text-muted"
                >
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

    import {useI18n} from 'vue-i18n';

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
            const {t} = useI18n();
            const {
                delay,
                limit,
                treeName,
                exclude,
                addOption,
            } = toRefs(props);

            // FETCH

            // FUNCTIONS
            const search = async query => {
                state.query = query;
                if(!query) {
                    return await new Promise(r => r([]));
                }
                state.searching = true;
                let result = [];
                try {
                    result = await searchConcept(query, treeName.value, exclude.value);
                } catch(e) {
                    console.error(e);
                } finally {
                    state.searching = false;
                    return result;
                }
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

            const selectCurrentOrCreateNew = _ => {
                // Disallow to create when there is an active
                // search to prevent the user from creating
                // a new concept with the same name as an existing one.
                if(state.searching) return;
                
                if(msRef.value.filteredOptions.length == 0) {
                    addOptionSelected();
                }
            };

            const focus = _ => {
                msRef.value.focus();
            }

            // DATA
            const msRef = ref({});
            const state = reactive({
                id: `multiselect-tree-search-${treeName.value}-${getTs()}`,
                entry: {},
                query: '',
                searching: false,
            });

            // RETURN
            return {
                t,
                // HELPER
                getLabel,
                sortParents,
                // EXTERNAL
                focus,
                // LOCAL
                search,
                optionSelected,
                // PROPS
                delay,
                limit,
                treeName,
                addOption,
                addOptionSelected,
                selectCurrentOrCreateNew,
                // STATE
                msRef,
                state,
            };
        },
    }
</script>
