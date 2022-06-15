import TreeNode from '@/components/tree/Node.vue';

import { ref } from 'vue';
import store from '@/bootstrap/store.js';
import { getNodeFromPath } from 'tree-component';

import i18n from '@/bootstrap/i18n.js';

import { addToast } from '@/plugins/toast.js';

import {
    only,
} from '@/helpers/helpers.js';

import {
    fetchChildren as fetchChildrenApi,
    uploadFile,
    exportTree as exportTreeApi,
    fetchTreeData,
} from '@/api.js';

import {
    emojiFlag,
    isArray,
    getPreference,
    slugify,
    createDownloadLink,
} from '@/helpers/helpers.js';

export async function fetchChildren(id, tree) {
    tree = tree != 'sandbox' ? 'project' : tree;
    return fetchChildrenApi(id, tree).then(data => {
        return store.dispatch("addConcepts", {
            concepts: data,
            tree: tree,
        });
    });

};

export function sortParents(parents) {
    parents.sort((a, b) => a.length - b.length);
    return parents;
};

export function sortTree(tree, dir = 'asc') {
    const sortFn = (a, b) => {
        let value = 0;
        const first = getLabel(a, true);
        const second = getLabel(b, true);
        if(first < second) value = -1;
        if(first > second) value = 1;
        if(dir == 'desc') {
            value = -value;
        }
        return value;
    };
    sortTreeLevel(tree, sortFn);
};

function sortTreeLevel(tree, fn) {
    if(!tree) return;

    const treeVal = isArray(tree) ? tree : tree.value;

    treeVal.sort(fn);
    treeVal.forEach(n => {
        if(n.childrenLoaded) {
            sortTreeLevel(n.children, fn);
        }
        if(n.broaders) {
            n.broaders.sort(fn);
        }
        if(n.narrowers) {
            n.narrowers.sort(fn);
        }
    });
};

export function uploadConceptsFile(file, tree, type) {
    return uploadFile(file, tree, type).then(data => {
        const msg = i18n.global.t('tree.import.toast.finish.message', {
            lbl_skip: data.skipped_labels,
            lbl_ign: data.ignored_labels,
            lang_ign: data.ignored_languages,
            rel_ign: data.ignored_relations,
        });
        const title = i18n.global.t('tree.import.toast.finish.title');
        addToast(msg, title, {
            channel: 'success',
            autohide: false,
            html: true,
        });

        store.dispatch('resetConcepts', {
            tree: tree,
        });
        return fetchTreeData([tree]);
    });
};

export function exportTree(tree, rootId) {
    let filename = '';
    if(rootId) {
        const concept = store.getters.conceptsFromMap(tree)[rootId];
        const label = slugify(getLabel(concept));
        filename = `thesaurex-${label}-export.rdf`;
    } else {
        filename = `thesaurex-export.rdf`;
    }

    exportTreeApi(tree, rootId).then(response => {
        createDownloadLink(response.data, filename, false, response.headers['content-type']);
    });
};

export async function openPath(ids, tree = 'project') {
    const index = ids.pop();
    const elem = store.getters.conceptsFromMap(tree)[index];
    if(ids.length == 0) {
        return elem;
    }
    if(!elem.childrenLoaded) {
        const children = await fetchChildren(elem.nid, tree);
        elem.state.opened = true;
        elem.children = children;
        elem.childrenLoaded = true;
        // Have to get current elemen from tree (not entities array) as well
        // otherwise children and childrenLoaded props are not correctly set
        const htmlElem = document.getElementById(`tree-node-${elem.id}`).parentElement;
        const node = getNodeFromPath(store.getters.conceptsFromTree(tree), htmlElem.getAttribute('data-path').split(','));
        node.children = children;
        node.childrenLoaded = true;
    }
    elem.state.opened = true;
    return openPath(ids, tree);
};

export function toggleTreeNode(node, tree) {
    if(node.children.length < node.children_count) {
        node.state.loading = true;
        fetchChildren(node.nid, tree).then(response => {
            node.children =  response;
            node.state.loading = false;
            node.childrenLoaded = true;
        });
    }
    node.state.opened = !node.state.opened;
};

export function getLabel(node, displayForeign = false) {
    if(!node) return 'No Title';
    if(!node.labels || !node.labels.length) return node.concept_url;
    const prefLang = getPreference('prefs.gui-language');
    if(node.labels.length > 1) {
        let sortIndex = l => {
            let idx = 0;
            if(l.language) {
                if(l.language.short_name == prefLang) {
                    idx -= 50;
                } else if(l.language.short_name == 'en') {
                    idx -= 25;
                }
            }
            if(l.concept_label_type === 1) {
                idx -= 10;
            }
            return idx;
        };
        node.labels.sort((a, b) => {
            return sortIndex(a) - sortIndex(b);
        });
    }
    const bestLabel = node.labels[0];
    let label = bestLabel.label;
    if(displayForeign && bestLabel.language && bestLabel.language.short_name != prefLang) {
        label = `${label} ${emojiFlag(bestLabel.language.short_name)}`;
    }
    return label;
};

export function unnode(node) {
    if(node.nid) {
        node.id = node.nid;
    }

    return only(node, [
        'concept_scheme', 'concept_url', 'created_at', 'id', 'is_top_concept', 'labels', 'pivot', 'updated_at', 'user_id'
    ]);
};

// export class Node {
//     constructor(data) {
//         Object.assign(this, data);
//         this.nid = `tree-node-${this.id}`;
//         this.label = 'Default Label';
//         this.treeNodeSpec = {
//             idProperty: 'nid',
//             expandable: this.children_count > 0,
//             selectable: true,
//             draggable: true,
//             allowDrop: true,
//             state: {
//                 expanded: false,
//                 selected: false,
//             },
//             loadChildrenAsync: parent => {
//                 return fetchChildren(parent.id, parent.tree);
//             }
//         };
//         this.children = ref([]);
//         this.childrenLoaded = ref(this.children.length == this.children_count);
//         this.children_count = ref(this.children_count);
//     }
// }

// function childrenPlaceholder(cnt, parentId) {
//     const children = [];
//     for(let i=0; i<cnt; i++) {
//         children.push(new Node({
//             id: `${parentId}-children-${i+1}`,
//             label: `Children #${i+1}`,
//             is_placeholder: true,
//         }))
//     }
//     return children;
// }

export class Node {
    constructor(data, component) {
        Object.assign(this, data);
        this.nid = this.id;
        if(!!store.getters.conceptsFromMap(data.tree)[this.id]) {
            let cntr = 1;
            while(!!store.getters.conceptsFromMap(data.tree)[`${this.id}_${cntr}`]) {
                cntr++;
            }
            this.id = `${this.id}_${cntr}`;
        }
        this.text = this.name;
        this.state = {
            opened: false,
            selected: false,
            disabled: false,
            loading: false,
            highlighted: false,
            openable: this.children_count > 0,
            dropPosition: 0,
            dropAllowed: true,
        };
        this.icon = false;
        this.children = ref([]);
        this.childrenLoaded = ref(this.children.length == this.children_count);
        this.children_count = ref(this.children_count);
        this.component = component || TreeNode;
        // this.dragDelay = vm.dragDelay;
        // this.dragAllowed = _ => vm.isDragAllowed;
        // this.onToggle = vm.itemToggle;
    }
}
