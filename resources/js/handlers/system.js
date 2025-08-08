import { addToast } from '@/plugins/toast.js';

import useConceptStore from '@/bootstrap/stores/concept.js';
import useLanguageStore from '@/bootstrap/stores/language.js';
import useUserStore from '@/bootstrap/stores/user.js';

import {
    only,
} from '@/helpers/helpers.js';

import {
    getLabel,
} from '@/helpers/tree.js';

function icon(name, collection = 'fas') {
    return `<i class="${collection} fa-${name} me-3"></i>`;
}

function toastMessage(message, config = {}) {
    addToast(message, '', Object.assign({
        duration: 2500,
        autohide: true,
        channel: 'info',
        icon: true,
        simple: true,
    }, config));
}

function sanitize(text){
    // Sanitizes most spacial characters. Taken from: https://stackoverflow.com/a/11090301/5509932
    return text.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
}

function addMessage(e, topic, value) {
    let username = e?.user?.name || e.user?.nickname || 'Unknown User';
    toastMessage(`${icon('plus')} <b>${sanitize(username)}</b> added a new <i>${topic}</i>:   <b>"${sanitize(value)}"</b>`, {
        html: true
    });
}

function toastNote(e, action) {
    let username = e?.user?.name || e.user?.nickname || 'Unknown User';
    let concept = e?.concept || e.concept || {};
    const conceptLabel = "Unknown Concept";
    try{
        conceptLabel = getLabel(concept);
    } catch(error) {
        console.error("Error getting concept label:", error);
    }

    toastMessage(`${icon('plus')} <b>${sanitize(username)}</b> ${action} a <i>note</i> on <b>"${sanitize(conceptLabel)}"</b>`, {
        html: true
    });
}

function deleteMessage(e, topic, value) {
    let username = e?.user?.name || e.user?.nickname || 'Unknown User';

    toastMessage(`${icon('trash')} <b>${sanitize(username)}</b> deleted a <b>${topic}</b>:    <i>"${sanitize(value)}"</i>`, {
        html: true
    });
}

function toastRelationMessage(e, isRemove = false) {
    const tree = e.tree;
    const conceptStore = useConceptStore();
    const narrowerConcept = conceptStore.getConcept(tree, e.relation.narrower_id);
    const broaderConcept = conceptStore.getConcept(tree, e.relation.broader_id);
    
    const broaderLabel = getLabel(broaderConcept);
    const narrowerLabel = getLabel(narrowerConcept);
    const action = isRemove ? 'removed' : 'added';
    const charIcon = isRemove ? "<< ! >>" : ">>>"
    const iconHtml = isRemove ? icon('trash') : icon('plus');

    let username = e?.user?.name || e.user?.nickname || 'Unknown User';
    toastMessage(`${iconHtml} <b>${username}</b> ${action} the relation: <b>${broaderLabel}</b> ${charIcon} <b>${narrowerLabel}</b>`, {
        html: true
    });
}

export const handleSystemMessageEvent = {
    'SystemMessage': e => {
        // Only handle event if from different user
        const message = 'System Message: ' + JSON.stringify(e.message);
        toastMessage(message, { channel: 'danger' });
    }
}

export const handleConceptAddedEvent = {
    'ConceptCreated': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const concept = await useConceptStore().fetchAndPushConcept(e.concept.id, e.tree, true);
        const label = getLabel(concept);
        addMessage(e, 'concept', label);
    },
};

export const handleConceptUpdatedEvent = {
    'ConceptUpdated': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const conceptData = e.concept;
        const conceptTree = e.tree;
        let oldConcept = useConceptStore().getConcept(conceptTree, conceptData.id);
        let oldConceptTopLevel = oldConcept?.is_top_concept ?? null;
        let concept = await useConceptStore().handleConceptUpdate(conceptData.id, conceptTree, conceptData.is_top_concept);

        // For the notifications, we are only interested in top-entity changes.
        if(conceptData.is_top_concept != oldConceptTopLevel) {
            if(conceptData.is_top_concept) {
                toastMessage(`${icon('edit')} <b>${e.user.name}</b> made concept <b>"${getLabel(concept)}"</b> a top level concept.`, {
                    html: true
                });
            } else {
                toastMessage(`${icon('edit')} <b>${e.user.name}</b> removed concept <b>"${getLabel(concept)}"</b> from the top level.`, {
                    html: true
                });
            }
        }
    },
};

export const handleConceptDeletedEvent = {
    'ConceptDeleted': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        await useConceptStore().conceptDeleted(e.concept.id, e.tree, 'cascade');
        const conceptLabel = getLabel(e.concept)
        deleteMessage(e, 'concept', conceptLabel);
    },
};

export const handleConceptLabelAddedEvent = {
    'LabelCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().pushLabel(e.label, e.label.concept_id, e.tree);
        addMessage(e, 'label', e.label.label);
    },
};

export const handleConceptLabelUpdatedEvent = {
    'LabelUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const updateData = only(e.label, ['label', 'concept_label_type']);
        useConceptStore().updateLabel(e.label.concept_id, e.tree, e.label.id, updateData);
        toastMessage(`${icon('edit')} <b>${sanitize(e.user.name)}</b> updated label <b>"${sanitize(e.oldLabel)} >> ${sanitize(e.label.label)}"</b>.`, {
            html: true
        });
    },
};

export const handleConceptLabelDeletedEvent = {
    'LabelDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().removeLabel(e.label.concept_id, e.tree, e.label.id);
        deleteMessage(e, 'label', e.label.label);
    },
};

export const handleConceptNoteAddedEvent = {
    'NoteCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().pushNote(e.note, e.note.concept_id, e.tree);
        toastNote(e, 'added');
    },
};

export const handleConceptNoteUpdatedEvent = {
    'NoteUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().updateNote(e.note.concept_id, e.tree, e.note.id, e.note.content);
        toastNote(e, 'updated');
    },
};

export const handleConceptNoteDeletedEvent = {
    'NoteDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().removeNote(e.note.concept_id, e.tree, e.note.id);
        toastNote(e, 'removed');
    },
};

export const handleConceptRelationAddedEvent = {
    'RelationCreated': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const tree = e.tree;
        const conceptStore = useConceptStore();
        await conceptStore.handleAddRelation(e.relation.narrower_id, e.relation.broader_id, tree);
        toastRelationMessage(e, false);
    },
};

export const handleConceptRelationDeletedEvent = {
    'RelationDeleted': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        await useConceptStore().handleRemoveRelation(e.relation.narrower_id, e.relation.broader_id, e.tree);
        toastRelationMessage(e, true);
    },
};

function formatLanguage(language) {
    return `${language.display_name} (${language.short_name})`;
}

export const handleLanguageAddedEvent = {
    'LanguageCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useLanguageStore().pushLanguage(e.language);
        addMessage(e, 'language', formatLanguage(e.language));
    },
};

export const handleLanguageDeletedEvent = {
    'LanguageDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useLanguageStore().removeLanguage(e.language.id);
        deleteMessage(e, 'language', formatLanguage(e.language));
    },
};
