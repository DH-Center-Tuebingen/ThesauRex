import TreeNode from '@/components/tree/Node.vue';

import { computed, ref } from 'vue';

import i18n from '@/bootstrap/i18n.js';

import useSystemStore from '@/bootstrap/stores/system.js';
import useConceptStore from '@/bootstrap/stores/concept.js';

import { addToast } from '@/plugins/toast.js';

import {
    emojiFlag,
    isArray,
    only,
} from '@/helpers/helpers.js';

export async function fetchChildren(id, tree) {
    return await useConceptStore().fetchChildren(id, tree);
};

export function sortParents(parents) {
    parents.sort((a, b) => a.length - b.length);
    return parents;
};

export function sortTree(tree, dir = 'asc') {
    const sortFn = (a, b) => {        
        const first = getLabel(a, true);
        const second = getLabel(b, true);
        if(!first && !second) return 0;
        if(!first) return 1;
        if(!second) return -1;

        let value = first.localeCompare(second);
        if(dir == 'desc') {
            value *= -1;
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
    return useConceptStore().uploadFile(file, tree, type).then(data => {
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
    });
};

export async function openPath(ids, tree = 'project', parent = null) {
    if(ids.length == 0) return;
    const conceptStore = useConceptStore();
    const index = ids.pop();

    // Get the root element of the tree
    if(parent === null) {
        parent = conceptStore.tree[tree].find(node => node.nid == index)
        if(!parent) {
            // TODO: This should be a warn but the warnings in the console are polluted by the tree component
            console.error(`Could not find parent node with id ${index} in tree ${tree}`);
            return;
        }
    }

    // If there is no further child, just quit.
    const nextId = ids.length > 0 ? ids[ids.length - 1] : null;
    if(nextId === null) {
        return;
    }

    let nextNode = null;
    if(!parent.childrenLoaded) {
        const children = await fetchChildren(parent.nid, tree);
        parent.children = children;
    }
    parent.state.opened = true;
    nextNode = parent.children.find(child => child.nid == nextId);
    await openPath(ids, tree, nextNode);
};

// export function toggleTreeNode(node, tree) {
//     console.log('Toggling node', node, tree);
//     if(node.children.length < node.children_count) {
//         node.state.loading = true;
//         fetchChildren(node.nid, tree).then(response => {
//             node.children = response;
//             node.state.loading = false;
//             node.childrenLoaded = true;
//         });
//     }
//     node.state.opened = !node.state.opened;
// };

export function getLabel(conceptOrNode, displayForeign = false) {
    // The getLabel is called either with a node or a concept.
    // This solution is not ideal, but it works for now.
    const concept = conceptOrNode.concept || conceptOrNode;
    if(!concept) return 'No Label';
    if(!concept.labels || !concept.labels.length) return concept.concept_url;
    const prefLang = useSystemStore().getPreference('prefs.gui-language');
    if(concept.labels.length > 1) {
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
        concept.labels.sort((a, b) => {
            return sortIndex(a) - sortIndex(b);
        });
    }
    const bestLabel = concept.labels[0];
    let label = bestLabel.label;
    if(displayForeign && bestLabel.language && bestLabel.language.short_name != prefLang) {
        label = `${label} ${emojiFlag(bestLabel.language.short_name)}`;
    }
    return label;
};

// export function toNode(tree, concept) {
//     return new Node({
//         ...concept,
//         tree: tree,
//     });
// }

// export function unnode(node) {
//     if(!node) return {};

//     if(node.nid) {
//         node.id = node.nid;
//     }

//     return only(node, [
//         'concept_scheme', 'concept_url', 'created_at', 'id', 'is_top_concept', 'labels', 'pivot', 'updated_at', 'user_id', 'broaders_count', 'broaders', 'children_count', 'narrowers'
//     ]);
// };

export class Concept {
    
    sortByLabel(tree, dir = 'asc') {
        
    }

    static removeRelation(concept, broaderConcept) {
        Concept.removeNarrowerFromBroader(concept, broaderConcept);
        Concept.removeBroader(concept, broaderConcept);
    }

    static removeNarrowerFromBroader(concept, broaderConcept) {
        Concept.removeNarrowers(broaderConcept, concept);
    }

    static removeBroader(concept, broaderConcept) {
        // Remove the broader from the narrower's broaders
        concept.broaders = concept.broaders || [];
        concept.broaders = concept.broaders.filter(b => b.id != broaderConcept.id);

        // Update the count of broaders on the narrower node
        concept.broaders_count = concept.broaders.length;
    }

    static removeNarrowers(concept, narrowerConcept) {
        const narrowerId = narrowerConcept.id;
        concept.narrowers = concept.narrowers || [];
        concept.narrowers = concept.narrowers.filter(n => n.id != narrowerId);
    }

    static addRelation(concept, broaderConcept) {
        Concept.addBroaders(concept, broaderConcept);
        Concept.addNarrowersToBroaders(concept, broaderConcept);
    }

    static addNarrowersToBroaders(concept, broaderConcept) {
        Concept.addNarrowers(broaderConcept, concept);
    }

    static addNarrowers(concept, narrowerConcept) {
        // Add the newly added narrower (if it does not exist yet) to the broader's narrowers
        concept.narrowers = concept.narrowers || [];
        if(!concept.narrowers.some(n => n.id == narrowerConcept.id)) {
            concept.narrowers.push(narrowerConcept);
            sortTree(concept.narrowers);
        }

        concept.children_count = concept.narrowers.length;
    }

    static addBroaders(concept, broaderConcept) {
        // Add the newly added broader (if it does not exist yet) to the narrower's broaders
        concept.broaders = concept.broaders || [];
        if(!concept.broaders.some(b => b.id == broaderConcept.id)) {
            concept.broaders.push(broaderConcept);
            sortTree(concept.broaders);
        }

        // Update the count of broaders on the narrower node
        concept.broaders_count = concept.broaders.length;
    }
}

export class Node {
    constructor(tree, concept, component = TreeNode) {

        /* 
        * Initially the variables should be private properties using the # syntax, 
        * but it's incompatible with Proxy variables and therefore incompatible with Vue's reactivity system.
        * The composimise was to use the _ prefix for private properties,
        */
        this._concept = concept.id;
        this._tree = tree;
        // this.#text = this.name;
        this._icon = false;
        this._children = ref([]);
        this._component = component;

        this._id = this.generateId();
        this.state = {
            opened: false,
            selected: false,
            disabled: false,
            loading: false,
            highlighted: false,
            openable: computed (() => this.narrowersCount > 0),
            dropPosition: 0,
            dropAllowed: true,
        };
    }

    get id() {
        return this._id;
    }

    get tree() {
        return this._tree;
    }

    get concept() {
        return useConceptStore().dictionary[this._tree][this._concept] || {};
    }

    get icon() {
        return this._icon;
    }

    get children() {
        return this._children;
    }

    set children(children) {
        this._children.value = children;
    }
    
    get hasNarrowers() {
        return this.narrowersCount > 0;
    }

    get childCount() {
        return this._children.length;
    }

    get narrowersCount() {
        if(!this?.concept?.narrowers?.length) return 0;
        return this.concept.narrowers.length;
    }

    get childrenLoaded() {
        return this.narrowersCount === this.childCount;
    }

    get component() {
        return this._component;
    }

    // Alias for the time there was an nid on the object.
    get nid() {
        return this._concept;
    }

    get isTopConcept() {
        return this.concept.is_top_concept || false;
    }

    get broaderCount() {
        if(!this.concept.broaders) return 0;
        return this.concept.broaders.length || 0;
    }

    get hasBroaders() {
        return this.broaderCount > 0
    }

    get canDeleteBroader() {
        const parentRelationCount = this.broaderCount + (this.isTopConcept ? 1 : 0);
        return parentRelationCount >= 2;
    }

    getLabel(displayForeign = false) {
        return getLabel(this.concept, displayForeign);
    }

    async toggle() {
        if(this.childCount < this.narrowersCount) {
            this.state.loading = true;
            try {
                const response = await fetchChildren(this.nid, this.tree);
                this.children = response;
            } catch(e) {
                console.error(`Error fetching children for node ${this.nid} in tree ${this.tree}:`, e);
            }
            this.state.loading = false;
        }
        this.state.opened = !this.state.opened;
    }

    isSelected() {
        const conceptStore = useConceptStore();
        return conceptStore.isSelected(this.nid, this.tree);
    }

    generateId() {
        let id = this.getIdForCount(0);
        const conceptStore = useConceptStore();
        if(conceptStore.nodes[this.tree][this.nid]) {
            const referencesCount = conceptStore.nodes[this.tree][this.nid].length;
            id = this.getIdForCount(referencesCount);
        }
        return id;
    }

    getIdForCount(count) {
        if(!this._concept) console.error("No concept set for node", this);
        return `${this.nid}_${count}`
    }


    // addBroaderConcept(broaderConcept) {
    //     // Add the newly added broader (if it does not exist yet) to the narrower's broaders
    //     this.concept.broaders = this.concept.broaders || [];
    //     if(!this.concept.broaders.some(b => b.id == broaderConcept.id)) {
    //         this.concept.broaders.push(broaderConcept);
    //         sortTree(this.concept.broaders);
    //     }

    //     // Update the count of broaders on the narrower node
    //     if(!this.concept.broaders_count) {
    //         this.concept.broaders_count = this.concept.broaders?.length ? this.concept.broaders.length : 0;
    //     }
    //     this.concept.broaders_count++;
    // }

    hasChild(narrowerConcept) {
        if(!this.children || !this.children.length) return false;
        return this.children.some(c => c.nid == narrowerConcept.id);
    }

    addNarrower(narrowerNode) {
        if(!this.children.some(child => child.nid == narrowerNode.nid)) {
            this.children.push(narrowerNode);
        } else {
            console.error(`Narrower concept with id ${narrowerNode.nid} already exists in node with id ${this.nid}`);
        }
    }

    removeNarrower(narrowerConcept) {
        const idx = this.children.findIndex(child => child.nid == narrowerConcept.id);
        if(idx > -1) {
            this.children.splice(idx, 1);
        }
        
        // When an open node has no children anymore, it should be closed.
        // Otherwise when a node is readded, it will be opened with no children.
        if(this.state.opened && this.children.length == 0) {
            this.state.opened = false;
        }
    }
}
