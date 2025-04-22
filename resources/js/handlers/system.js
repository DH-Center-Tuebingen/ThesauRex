import { addToast } from '@/plugins/toast.js';

import useConceptStore from '@/bootstrap/stores/concept.js';
import useLanguageStore from '@/bootstrap/stores/language.js';
import useUserStore from '@/bootstrap/stores/user.js';

import {
    only,
} from '@/helpers/helpers.js';

export const handleTestEvent = {
    'TestEvent': e => {
        const message = 'Successfully received Test Event! ' + JSON.stringify(e);
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptAddedEvent = {
    'ConceptCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().fetchAndPushConcept(e.concept.id, e.tree, true);
        const message = 'Successfully received ConceptAdded Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptUpdatedEvent = {
    'ConceptUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const message = '[TODO] Successfully received ConceptUpdated Event! ' + JSON.stringify(e);
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptDeletedEvent = {
    'ConceptDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const message = '[TODO] Successfully received ConceptDeleted Event! ' + JSON.stringify(e);
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptLabelAddedEvent = {
    'LabelCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().pushLabel(e.label, e.label.concept_id, e.tree);
        const message = 'Successfully received ConceptAdded Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptLabelUpdatedEvent = {
    'LabelUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const updateData = only(e.label, ['label', 'concept_label_type']);
        useConceptStore().updateLabel(e.label.concept_id, e.tree, e.label.id, updateData);
        const message = 'Successfully received ConceptUpdated Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptLabelDeletedEvent = {
    'LabelDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().removeLabel(e.label.concept_id, e.tree, e.label.id);
        const message = 'Successfully received ConceptDeleted Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptNoteAddedEvent = {
    'NoteCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().pushNote(e.note, e.note.concept_id, e.tree);
        const message = 'Successfully received NoteCreated Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptNoteUpdatedEvent = {
    'NoteUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().updateNote(e.note.concept_id, e.tree, e.note.id, e.note.content);
        const message = 'Successfully received NoteUpdated Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptNoteDeletedEvent = {
    'NoteDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().removeNote(e.note.concept_id, e.tree, e.note.id);
        const message = 'Successfully received NoteDeleted Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptRelationAddedEvent = {
    'RelationCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().handleAddRelation(e.relation.broader_id, e.relation.narrower_id, e.tree);
        const message = 'Successfully received RelationCreated Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

// Relation updates make no sense right now? [VR]
export const handleConceptRelationUpdatedEvent = {
    'RelationUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        const message = '[TODO] Successfully received RelationUpdated Event! ' + JSON.stringify(e);
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleConceptRelationDeletedEvent = {
    'RelationDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useConceptStore().handleRemoveRelation(e.relation.broader_id, e.relation.narrower_id, e.tree);
        const message = 'Successfully received RelationDeleted Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

export const handleLanguageAddedEvent = {
    'LanguageCreated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useLanguageStore().pushLanguage(e.language);
        const message = 'Successfully received LanguageCreated Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};

// Languages can not be updated right now, needs to be implemented
export const handleLanguageUpdatedEvent = {
    'LanguageUpdated': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        // const message = '[TODO] Successfully received LanguageUpdated Event! ' + JSON.stringify(e);
        // addToast(message, '', {
        //     duration: 2500,
        //     autohide: true,
        //     channel: 'info',
        //     icon: true,
        //     simple: true,
        // });
    },
};

export const handleLanguageDeletedEvent = {
    'LanguageDeleted': e => {
        // Only handle event if from different user
        if(e.user.id == useUserStore().getCurrentUserId) return;
        useLanguageStore().removeLanguage(e.language.id);
        const message = 'Successfully received LanguageDeleted Event!';
        addToast(message, '', {
            duration: 2500,
            autohide: true,
            channel: 'info',
            icon: true,
            simple: true,
        });
    },
};
