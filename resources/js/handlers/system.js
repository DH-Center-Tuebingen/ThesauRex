import { addToast } from '@/plugins/toast.js';

import useConceptStore from '@/bootstrap/stores/concept.js';
import useLanguageStore from '@/bootstrap/stores/language.js';
import useUserStore from '@/bootstrap/stores/user.js';

import {
    only,
} from '@/helpers/helpers.js';

function toastMessage(message, config = {}) {
    addToast(message, '', Object.assign({
        duration: 2500,
        autohide: true,
        channel: 'info',
        icon: true,
        simple: true,
    }, config));
}

export const handleSystemMessageEvent = {
    'SystemMessage': e => {
        // Only handle event if from different user
        const message = 'System Message: ' + JSON.stringify(e.message);
        toastMessage(message, {channel: 'danger'});
    }   
}

export const handleConceptAddedEvent = {
    'ConceptCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().fetchAndPushConcept(e.concept.id, e.tree, true);
        const message = 'Successfully received ConceptAdded Event!';
        toastMessage(message);
    },
};

export const handleConceptUpdatedEvent = {
    'ConceptUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const message = 'Successfully received ConceptUpdated Event!';
        useConceptStore().handleConceptUpdate(e.concept.id, e.tree, e.concept.is_top_concept);
        toastMessage(message);
    },
};

export const handleConceptDeletedEvent = {
    'ConceptDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const message = 'Successfully received ConceptDeleted Event!';
        useConceptStore().deleteConceptReferences(e.concept.id, e.tree);
        toastMessage(message);
    },
};

export const handleConceptLabelAddedEvent = {
    'LabelCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().pushLabel(e.label, e.label.concept_id, e.tree);
        const message = 'Successfully received ConceptAdded Event!';
        toastMessage(message);
    },
};

export const handleConceptLabelUpdatedEvent = {
    'LabelUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const updateData = only(e.label, ['label', 'concept_label_type']);
        useConceptStore().updateLabel(e.label.concept_id, e.tree, e.label.id, updateData);
        const message = 'Successfully received ConceptUpdated Event!';
        toastMessage(message);
    },
};

export const handleConceptLabelDeletedEvent = {
    'LabelDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().removeLabel(e.label.concept_id, e.tree, e.label.id);
        const message = 'Successfully received ConceptDeleted Event!';
        toastMessage(message);
    },
};

export const handleConceptNoteAddedEvent = {
    'NoteCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().pushNote(e.note, e.note.concept_id, e.tree);
        const message = 'Successfully received NoteCreated Event!';
        toastMessage(message);
    },
};

export const handleConceptNoteUpdatedEvent = {
    'NoteUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().updateNote(e.note.concept_id, e.tree, e.note.id, e.note.content);
        const message = 'Successfully received NoteUpdated Event!';
        toastMessage(message);
    },
};

export const handleConceptNoteDeletedEvent = {
    'NoteDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().removeNote(e.note.concept_id, e.tree, e.note.id);
        const message = 'Successfully received NoteDeleted Event!';
        toastMessage(message);
    },
};

export const handleConceptRelationAddedEvent = {
    'RelationCreated': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const tree = e.tree;
        useConceptStore().addRawConcept(e.relation.broader, tree);
        useConceptStore().addRawConcept(e.relation.narrower, tree);
        await useConceptStore().handleAddRelation(e.relation.narrower_id, e.relation.broader_id, tree);
        const message = 'Successfully received RelationCreated Event!';
        toastMessage(message);
    },
};

export const handleConceptRelationDeletedEvent = {
    'RelationDeleted': async e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        await useConceptStore().handleRemoveRelation(e.relation.narrower_id, e.relation.broader_id, e.tree);
        const message = 'Successfully received RelationDeleted Event!';
        toastMessage(message);
    },
};

export const handleLanguageAddedEvent = {
    'LanguageCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useLanguageStore().pushLanguage(e.language);
        const message = 'Successfully received LanguageCreated Event!';
        toastMessage(message);
    },
};

export const handleLanguageDeletedEvent = {
    'LanguageDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useLanguageStore().removeLanguage(e.language.id);
        const message = 'Successfully received LanguageDeleted Event!';
        toastMessage(message);
    },
};
