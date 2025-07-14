import { defineStore } from 'pinia';

import {
    addConcept,
    addLabel,
    addNote,
    addRelation,
    cloneAcrossTree,
    deleteConcept,
    deleteLabel,
    deleteNote,
    exportTree,
    fetchChildren,
    fetchConcept,
    fetchTreeData,
    getConceptParentIds,
    patchLabel,
    patchNote,
    removeRelation,
    uploadFile,
    toggleTopLevelState,
} from '@/api.js';

import {
    createDownloadLink,
    only,
    slugify,
} from '@/helpers/helpers.js';

import {
    Concept,
    getLabel,
    Node,
    openPath,
    sortTree,
} from '@/helpers/tree.js';

export const useConceptStore = defineStore('concept', {
    state: _ => ({
        // Treestructure of concepts
        // Each tree is an array of Node objects
        tree: {
            project: [],
            sandbox: [],
        },
        dictionary: {
            project: {},
            sandbox: {},
        },
        // Map of all Nodes in a tree with 'id' as key
        // This means the keys can be 10, 10_1, 10_2, etc.
        // DANGER TODO: This is dangerous, as currently we often rely on the id being set in the nodesMap
        //              When we remove the concept wiht the id=nid then this will return null!
        nodesMap: {
            project: {},
            sandbox: {},
        },
        // List of all nodes of a concept.
        // Maps: nid -> [id_1, nid_2, ...]
        //       12 -> [12, 12_1, 12_2]
        nodes: {
            project: {},
            sandbox: {},
        },
        // Map of top-level nodes in a tree.
        topNodes: {
            project: {},
            sandbox: {},
        },
        // Maps the nid of a concept to its parents.
        // Maps: nid -> [parent_nid_1, parent_nid_2, ...]
        parentMap: { // a.k.a parents
            project: {},
            sandbox: {},
        },
        selected: { // a.k.a selected / active
            from: null,
            data: {},
        },
    }),
    getters: {
    },
    actions: {
        addReference(treeName, node) {
            const nid = node.nid;
            const id = node.id;

            if(!this.nodes[treeName][nid]) {
                this.nodes[treeName][nid] = [];
            }

            if(!this.nodes[treeName][nid].includes(id)) {
                this.nodes[treeName][nid].push(id);
            }
        },
        removeReference(treeName, node) {
            const nid = node.nid;
            const id = node.id;

            if(!this.nodes[treeName][nid]) {
                console.error(`Concept with id ${nid} not found in nodes for tree ${treeName}`);
                return;
            }

            const nodes = this.nodes[treeName][nid];
            const index = nodes.indexOf(id);
            if(index > -1) {
                nodes.splice(index, 1);
                if(nodes.length == 0) {
                    delete this.nodes[treeName][nid];
                }
            } else {
                console.error(`Concept with id ${id} not found in nodes for tree ${treeName}`);
            }
        },
        addToDictionary(treeName, concept) {
            if(!this.dictionary[treeName][concept.id]) {
                this.dictionary[treeName][concept.id] = concept;
            }
        },
        addToMap(treeName, node) {
            this.nodesMap[treeName][node.id] = node;
        },
        removeFromMap(treeName, node) {
            if(this.nodesMap[treeName][node.id]) {
                delete this.nodesMap[treeName][node.id];
            } else {
                console.error(`Node with id ${node.id} not found in the nodesMap for tree ${treeName}`);
            }
        },
        addParentNode(treeName, node, broaderId) {
            if(broaderId == -1) return;
            if(!this.parentMap[treeName][node.nid]) {
                this.parentMap[treeName][node.nid] = [];
            } else if(this.parentMap[treeName][node.nid].includes(broaderId)) {
                return; // already added
            }
            this.parentMap[treeName][node.nid].push(broaderId);
        },
        removeFromParentNodes(treeName, node, broaderId) {
            if(!this.parentMap[treeName][node.nid]) return;
            const parentNodes = this.nodes[treeName][broaderId] || [];

            for(let i = 0; i < parentNodes.length; i++) {
                const parentNode = this.nodesMap[treeName][parentNodes[i]];
                const parents = this.parentMap[treeName][node.nid];
                const index = parents.indexOf(parentNode.id);
                if(index == -1) {
                    parents.splice(index, 1);
                }
                if(parents.length == 0) {
                    delete this.parentMap[treeName][node.nid];
                }
            }
        },
        async uploadFile(file, treeName, actionType) {
            const data = await uploadFile(file, treeName, actionType);
            await this.initialize([treeName]);
            return data;
        },
        createConceptNode(concept, treeName/* , options = {} */) {
            // const doCount = !options.ignore_count;
            this.addToDictionary(treeName, concept);
            // The path of conceptNode is an array of arrays where all nodes reside.
            for(let i = 0; i < concept.path.length; i++) {
                const nodePath = concept.path[i];
                const broaderId = nodePath[1] || -1; // second element in path is always direct parent (first is self)
                if(!this.relationExistsAtPath(treeName, nodePath)) {
                    this.handleAddSingleRelation(concept.id, broaderId, treeName);
                    // this.handleConceptChange(concept.id, treeName);
                }
            }
        },
        relationExistsAtPath(treeName, path = []) {
            if(path.length == 0) return false;

            let subtree = this.tree[treeName];
            while(path.length > 0 && subtree != null) {
                const conceptId = path.pop();
                const treeIndex = subtree.findIndex(node => node.nid == conceptId)
                if(treeIndex == -1) {
                    subtree = null;
                    break;
                }

                if(!subtree[treeIndex].children) {
                    return false;
                }

                subtree = subtree[treeIndex].children;
            }
            return subtree != null
        },
        resetConcepts(treeName) {
            this.tree[treeName] = [];
            this.nodesMap[treeName] = {};
            this.parentMap[treeName] = {};
        },
        async initialize() {
            const result = {};
            const concepts = await fetchTreeData();
            for(let treeName in concepts) {
                result[treeName] = this.initializeConcepts(concepts[treeName], treeName);
            }
            return result;
        },
        initializeConcepts(concepts, treeName) {
            this.resetConcepts(treeName);
            concepts.forEach(concept => {
                this.createConceptNode(concept, treeName);
            });
        },
        async clone(narrowerId, broaderId, srcTree, targetTree) {
            const concept = await cloneAcrossTree(narrowerId, broaderId, srcTree, targetTree);
            return this.createConceptNode(concept, targetTree);
        },
        // method to add newly created concepts to store
        async addConcept(data, treeName, broaderId) {
            const concept = await addConcept(data, treeName, broaderId);
            this.createConceptNode(concept, treeName);
        },
        async toggleTopLevelState(id, treeName) {
            const data = await toggleTopLevelState(id, treeName);
            if(data.is_top_concept) {
                await this.handleAddRelation(data.id, -1, treeName);
            } else {
                await this.handleRemoveRelation(data.id, -1, treeName);
            }
            return data;
        },
        async ensureConcept(id, treeName) {
            let concept = this.dictionary[treeName][id];
            if(!concept) {
                concept = await fetchConcept(id, treeName, false);
                if(!concept) {
                    throw new Error(`Concept with id ${id} does not exist in tree ${treeName}`);
                } else {
                    this.dictionary[treeName][id] = concept;
                }
            }
            return concept
        },
        async fetchAndPushConcept(id, treeName, receivedFromEvent = false) {
            const concept = await fetchConcept(id, treeName);
            if(concept) {
                this.pushConcepts([concept], treeName)
                // TODO: Ignore_count check why we need this.
                // , {
                //     ignore_count: receivedFromEvent,
                // });
            } else {
                throw new Error(`Concept with id ${id} does not exist in tree ${treeName}`);
            }
            return concept;
        },
        async fetchChildren(id, treeName) {
            treeName = treeName != 'sandbox' ? 'project' : treeName;
            const narrowerConcepts = await fetchChildren(id, treeName);

            const nodes = [];
            narrowerConcepts.forEach(narrowerConcept => {
                const node = this.handleCreateNode(treeName, narrowerConcept, id);
                nodes.push(node);
            })
            sortTree(nodes);
            return nodes;
        },
        // method to add existing, fetched concepts to store
        pushConcepts(concepts, treeName, overrides = {}) {
            // const nodes = [];
            concepts.forEach(concept => {
                this.createConceptNode(concept, treeName)

                // TODO: Ignore_count check why we need this.
                // , {
                //     ignore_count: overrides.ignore_count !== false,
                // });
                // nodes.push(node);
            });
            // return nodes;
        },
        async deleteConcept(id, treeName, action, parameters) {
            await deleteConcept(id, treeName, action, parameters);
            this.conceptDeleted(id, treeName, action, parameters = {});
        },
        async conceptDeleted(id, treeName, action) {
            action = (action == 'level' || action == 'top' || action == 'rerelate') ? action : 'cascade';

            const concept = this.dictionary[treeName][id];
            const parentRefs = concept.broaders.map(broader => broader.id);

            // Top level referce is not stored in broaders, so we need to add it manually
            if(concept.is_top_concept) {
                parentRefs.push(-1);
            }

            let keepChildren = false;
            let loadNarrowers = false;
            const narrowerIds = concept.narrowers.map(narrower => narrower.id);
            if(action != 'cascade') {
                keepChildren = true;
                let broaders = null;
                if(action == 'level') {
                    broaders = concept.is_top_concept ? [...parentRefs, -1] : parentRefs;
                    loadNarrowers = true;
                } else if(action == 'top') {
                    loadNarrowers = true;
                    broaders = [-1];
                } else if(action == 'rerelate') {
                    const allParentNodes = this.nodes[treeName][parameters.p] || [];
                    // Only load narrowers if at least one parent node is opened
                    loadNarrowers = allParentNodes.some(nodeId => {
                        const node = this.nodesMap[treeName][nodeId];
                        return node.hasNarrowers && node?.state?.opened;
                    })
                    broaders = [parameters.p];
                }
            }

            // Fetch all required narrowers that are not already fetched,
            for(let i = 0; i < narrowerIds.length; i++) {
                // because they need to be added to the tree
                if(loadNarrowers) {
                    const narrowerId = narrowerIds[i];
                    if(!this.dictionary[treeName][narrowerId]) {
                        await this.fetchAndPushConcept(narrowerId, treeName, false);
                    }
                }
                // Remove all narrower relations from the concept
                await this.handleRemoveRelation(narrowerIds[i], concept.id, treeName);
            }

            // Add all narrower relations to their new parent if needed
            if(keepChildren) {
                await this.handleAddRelation(narrowerIds, broaders, treeName);
            }

            await this.handleRemoveRelation(id, parentRefs, treeName);

            // Unselect the concept if it was selected
            if(this.isSelected(id, treeName)) {
                this.setSelected(null, null);
            }
        },
        isSelected(id, treeName) {
            if(!id || !treeName) {
                return false;
            }
            const selectedConcept = this.selected?.data;
            if(!selectedConcept || !selectedConcept.id) {
                return false;
            }
            return selectedConcept.id == id && this.selected.from == treeName;
        },
        async setSelected(id, treeName) {
            if(!id || !treeName) {
                this.selected.from = null;
                this.selected.data = {};
            } else {
                let concept = this.dictionary[treeName][id];
                if(!concept) {
                    this.selected.from = null;
                    this.selected.data = {};
                } else {
                    this.selected.from = treeName;
                    this.selected.data = concept;
                }
            }
        },
        pushLabel(label, conceptId, treeName) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept) {
                if(!concept.labels) {
                    concept.labels = [];
                }
                concept.labels.push(label);
                this.handleConceptChange(conceptId, treeName, this);
            }
        },
        updateLabel(conceptId, treeName, labelId, updates = {}) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept?.labels) {
                const label = concept.labels.find(label => label.id == labelId);
                if(label) {
                    for(let k in updates) {
                        label[k] = updates[k];
                    }
                    this.handleConceptChange(conceptId, treeName, this);
                }
            }
        },
        removeLabel(conceptId, treeName, labelId, newPrefLabelId) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept?.labels) {
                const idx = concept.labels.findIndex(label => label.id == labelId);
                if(idx > -1) {
                    concept.labels.splice(idx, 1);
                    if(newPrefLabelId) {
                        const label = concept.labels.find(label => label.id == newPrefLabelId);
                        if(label) {
                            label.concept_label_type = 1;
                        }
                    }
                    this.handleConceptChange(conceptId, treeName, this);
                }
            }
        },
        async addLabel(id, treeName, text, languageId) {
            const content = await addLabel({
                content: text,
                lid: languageId,
                cid: id,
                tree_name: treeName,
            });
            this.pushLabel(content, id, treeName);
        },
        async patchLabel(conceptId, treeName, labelId, text) {
            await patchLabel(labelId, text, treeName);
            const updateData = {
                label: text,
            };
            this.updateLabel(conceptId, treeName, labelId, updateData);
        },
        async deleteLabel(conceptId, treeName, labelId) {
            const updatedLabelId = await deleteLabel(labelId, treeName);
            this.removeLabel(conceptId, treeName, labelId, updatedLabelId);
        },
        pushNote(note, conceptId, treeName) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept) {
                if(!concept.notes) {
                    concept.notes = [];
                }
                concept.notes.push(note);
            }
        },
        updateNote(conceptId, treeName, noteId, text) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept?.notes) {
                const note = concept.notes.find(note => note.id == noteId);
                if(note) {
                    note.content = text;
                }
            }
        },
        removeNote(conceptId, treeName, noteId) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept?.notes) {
                const idx = concept.notes.findIndex(note => note.id == noteId);
                if(idx > -1) {
                    if(idx > -1) {
                        concept.notes.splice(idx, 1);
                    }
                }
            }
        },
        handleConceptChange(conceptId, treeName) {
            const concept = this.dictionary[treeName][conceptId];
            const parents = this.parentMap[treeName][conceptId] || [];
            if(concept.is_top_concept) {
                sortTree(this.tree[treeName]);
            }
            parents.forEach(parent => {
                const parentConcept = this.dictionary[treeName][parent];
                if(!!parentConcept) {
                    sortTree(parentConcept.children);
                }
            });
        },
        async addNote(id, treeName, text, languageId) {
            const content = await addNote({
                content: text,
                lid: languageId,
                cid: id,
                tree_name: treeName,
            });
            this.pushNote(content, id, treeName);
        },
        pushNote(note, conceptId, treeName) {
            const concept = this.dictionary[treeName][conceptId];
            if(concept) {
                if(!concept.notes) {
                    concept.notes = [];
                }
                concept.notes.push(note);
            }
        },
        async patchNote(conceptId, treeName, noteId, text) {
            await patchNote(noteId, text, treeName);
            this.updateNote(conceptId, treeName, noteId, text);
        },
        async deleteNote(conceptId, treeName, noteId) {
            await deleteNote(noteId, treeName);
            this.removeNote(conceptId, treeName, noteId);
        },
        async addRelation(narrowerId, broaderId, treeName) {
            await addRelation(narrowerId, broaderId, treeName);
            await this.handleAddRelation(narrowerId, broaderId, treeName);
        },
        async removeRelation(narrowerId, broaderId, treeName) {
            await removeRelation(narrowerId, broaderId, treeName);
            await this.handleRemoveRelation(narrowerId, broaderId, treeName);
        },
        async handleAddRelation(narrowers, broaders, treeName) {
            const broaderIdList = Array.isArray(broaders) ? broaders : [broaders];
            const narrowerIdList = Array.isArray(narrowers) ? narrowers : [narrowers];

            for(let i = 0; i < broaderIdList.length; i++) {
                for(let j = 0; j < narrowerIdList.length; j++) {
                    await this.handleAddSingleRelation(narrowerIdList[j], broaderIdList[i], treeName);
                }
            }
        },
        async handleAddSingleRelation(narrowerId, broaderId, treeName) {
            let narrowerConcept = await this.ensureConcept(narrowerId, treeName);
            if(broaderId !== -1)
                await this.ensureConcept(broaderId, treeName);

            if(broaderId == -1) {
                narrowerConcept.is_top_concept = true;
            } else {
                const broaderConcept = this.dictionary[treeName][broaderId];
                if(broaderConcept) {
                    Concept.addRelation(narrowerConcept, broaderConcept);
                } else {
                    console.error(`Broader concept with id ${broaderId} not found in dictionary for tree ${treeName}`);
                }
            }

            // This must be done after the Concept as the nodes check the narrower count
            // to determine if they are openable or not.
            this.handleAddNodesToBroaderNodes(treeName, broaderId, narrowerConcept);
        },
        handleCreateNode(treeName, concept, broaderId) {
            const node = new Node(treeName, concept);
            this.addToDictionary(treeName, concept);
            this.addReference(treeName, node);
            this.addToMap(treeName, node);
            this.addParentNode(treeName, node, broaderId);
            return node;
        },
        handleAddNodesToBroaderNodes(treeName, broaderId, narrowerConcept) {
            this.handleAddNodeToTop(treeName, narrowerConcept, broaderId);

            // Update all nodes in the tree with the new node
            const broaderNodes = this.nodes[treeName][broaderId] || [];
            for(const nodeId of broaderNodes) {
                const broaderNode = this.nodesMap[treeName][nodeId];
                if(broaderNode && !broaderNode.hasChild(narrowerConcept)) {
                    const node = this.handleCreateNode(treeName, narrowerConcept, broaderId);
                    broaderNode.addNarrower(node);
                    sortTree(broaderNode.children);
                } else {
                    console.error(`Narrower concept with id ${narrowerConcept.id} already exists in broader concept with id ${broaderId} for tree ${treeName}`);
                }
            }
        },
        handleAddNodeToTop(treeName, concept, broaderId) {
            if(broaderId == -1 && !this.topNodes[treeName][concept.id]) {
                const node = this.handleCreateNode(treeName, concept, broaderId);
                this.topNodes[treeName][concept.id] = node;
                this.tree[treeName].push(node);
                node.is_top_concept = true;
                concept.is_top_concept = true;
                sortTree(this.tree[treeName]);
            }
        },
        async handleRemoveRelation(narrowers, broaders, treeName) {
            const broaderIdList = Array.isArray(broaders) ? broaders : [broaders];
            const narrowerIdList = Array.isArray(narrowers) ? narrowers : [narrowers];

            for(let i = 0; i < broaderIdList.length; i++) {
                for(let j = 0; j < narrowerIdList.length; j++) {
                    await this.handleRemoveSingleRelation(narrowerIdList[j], broaderIdList[i], treeName);
                }
            }
        },
        async handleRemoveSingleRelation(narrowerId, broaderId, treeName) {
            const concept = await this.ensureConcept(narrowerId, treeName);
            if(broaderId !== -1) {
                await this.ensureConcept(broaderId, treeName);
            }

            if(broaderId == -1) {
                concept.is_top_concept = false;
            } else {
                const broaderConcept = this.dictionary[treeName][broaderId];
                if(broaderConcept) {
                    Concept.removeRelation(concept, broaderConcept);
                } else {
                    console.error(`Broader concept with id ${broaderId} not found in dictionary for tree ${treeName}`);
                }
            }

            this.handleRemoveFromReferences(treeName, broaderId, concept);
        },
        handleRemoveFromReferences(treeName, broaderId, narrowerConcept) {
            this.handleRemoveFromTop(treeName, broaderId, narrowerConcept);
            // We must remove the narrower nodes from all existing nodes of it's broader concept:
            // 1) A -> X
            // 2) B -> A -> X
            // When I remove X from (1) I must also remove it from (2) 
            const broaderReferences = this.nodes[treeName][broaderId] || [];
            for(let i = broaderReferences.length - 1; i >= 0; i--) {
                const broaderNode = this.nodesMap[treeName][broaderReferences[i]];
                if(broaderNode) {
                    broaderNode.removeNarrower(narrowerConcept);
                }
            }
        },
        handleRemoveFromTop(treeName, broaderId, narrowerConcept) {
            if(broaderId == -1 && this.topNodes[treeName][narrowerConcept.id]) {
                // Remove the concept from the top level concepts
                narrowerConcept.is_top_concept = false;
                this.handleDeleteNode(treeName, this.tree[treeName], narrowerConcept, broaderId);
                delete this.topNodes[treeName][narrowerConcept.id];
            }
        },
        handleDeleteNode(treeName, subtree, narrowerConcept, broaderId) {
            const index = subtree.findIndex((node) => node.nid == narrowerConcept.id);
            if(index > -1) {
                const node = subtree[index];
                if(broaderId != -1) {
                    this.removeFromParentNode(treeName, node, broaderId);
                }
                this.removeFromMap(treeName, node);
                this.removeReference(treeName, node);
                subtree.splice(index, 1);
            } else {
                console.error(`Concept with id ${narrowerConcept.id} not found in nodesMap for tree ${treeName}`);
            }
        },
        // currently only updating is_top_concept is allowed/handled
        async handleConceptUpdate(conceptId, treeName, isTopConcept) {
            let fetched = false;
            if(!this.dictionary[treeName][conceptId]) {
                fetched = true;
                await this.fetchAndPushConcept(conceptId, treeName);
            }

            // if we had to fetch concept it is already up to date,
            // no need to add relation
            if(fetched) return;

            if(isTopConcept) {
                await this.handleAddRelation(conceptId, -1, treeName);
            } else {
                await this.handleRemoveRelation(conceptId, -1, treeName);
            }
        },
        async move(narrower, fromBroader, toBroader) {
            if(narrower.tree != toBroader.tree) {
                await this.clone(narrower.nid, toBroader.nid, narrower.tree, toBroader.tree);
            } else {
                await this.addRelation(narrower.nid, toBroader.nid, narrower.tree);
                await this.removeRelation(narrower.nid, fromBroader.nid, narrower.tree);
            }
        },
        export(treeName, fromNode) {
            let filename = '';
            if(fromNode) {
                const concept = this.nodesMap[treeName][fromNode];
                const label = slugify(getLabel(concept));
                filename = `thesaurex-${treeName}-${label}-export.rdf`;
            } else {
                filename = `thesaurex-${treeName}-export.rdf`;
            }

            exportTree(treeName, fromNode).then(response => {
                createDownloadLink(
                    response.data,
                    filename,
                    false,
                    response.headers['content-type']
                );
            });
        },
        async openAllConceptPaths(treeName, conceptId) {
            const paths = await getConceptParentIds(conceptId, treeName);
            for(const path of paths) {
                await openPath(path, treeName);
            }
        },
    }
});

export default useConceptStore;