const en = {
    global: {
        save: 'Save',
        delete: 'Delete',
        remove: 'Remove',
        cancel: 'Cancel',
        close: 'Close',
        add: 'Add',
        edit: 'Edit',
        update: 'Update',
        replace: 'Replace',
        clear: 'Clear',
        confirm: 'OK',
        create: 'Create',
        search: 'Search...',
        login: 'Login',
        'login-title': 'Log In',
        'login-subtitle': 'Welcome to ThesauRex',
        download: 'Download',
        'download-name': 'Download {name}',
        upload: 'Upload',
        settings: {
            title: 'Settings',
            users: 'User Management',
            roles: 'Role Management',
            system: 'System Preferences',
            about: 'About'
        },
        user: {
            settings: 'Preferences',
            logout: 'Logout'
        },
        select: {
            placehoder: 'Select option',
            select: 'Press enter to select',
            deselect: 'Press enter to remove'
        },
        version: 'Version',
        label: 'Label',
        url: 'URL',
        name: 'Name',
        'display-name': 'Display Name',
        email: 'E-Mail Address',
        password: 'Password',
        'remember-me': 'Remember me',
        description: 'Description',
        roles: 'Roles',
        permissions: 'Permissions',
        'added-at': 'Added',
        'created-at': 'Created',
        'updated-at': 'Updated',
        options: 'Options',
        type: 'Type',
        content: 'Content',
        preference: 'Preference',
        value: 'Value',
        'allow-override': 'Allow Override?',
        set: 'Set'
    },
    tree: {
        import: {
            label: 'Import RDF',
            new: 'Only import new concepts',
            'new-update': 'Update existing concepts & add new ones',
            replace: 'Delete existing concepts  & add new ones'
        },
        export: {
            label: 'Export RDF'
        },
        project: {
            title: 'Project Tree'
        },
        sandbox: {
            title: 'Sandbox Tree'
        },
        'new-top-concept': 'Create new Top-Level Concept'
    },
    detail: {
        title: 'Concept Properties',
        broader: {
            title: 'Broader Concepts',
            empty: 'No broader concepts available'
        },
        narrower: {
            title: 'Narrower Concepts',
            empty: 'No narrower concepts available'
        },
        label: {
            title: 'Labels',
            empty: 'No labels available',
            'info-label-missing': 'Concept not translated in all languages.',
            toasts: {
                deleted: {
                    title: 'Label deleted',
                    message: 'Label <span class="font-weight-medium">{label}</span> successfully deleted.'
                }
            }
        },
        note: {
            title: 'Notes',
            empty: 'No notes available',
            toasts: {
                deleted: {
                    title: 'Note deleted',
                    message: 'Note <span class="font-weight-medium">{note}</span> successfully deleted.'
                }
            }
        }
    },
    modals: {
        'new-concept': {
            title: 'Create new Top-Level Concept',
            'title-parent': 'Create new concept under {name}'
        },
        'delete-concept': {
            title: 'Delete {name}',
            info: `You can either delete <span class="font-weight-medium">{name}</span> and all narrowers (<i class="fas fa-fw fa-trash"></i>) or only delete <span class="font-weight-medium">{name}</span> and move all narrowers one level up (
                <span class="fa-stack d-inline" style="margin-right: -0.35rem;">
                    <i class="fas fa-trash"></i>
                    <i class="fas fa-arrow-up" data-fa-transform="shrink-2 left-4 up-5"></i>
                </span>
            ).`,
            delete: 'Delete <span class="font-weight-medium">{name}</span>',
            'delete-recursive': 'Delete recursive'
        }
    },
    menus: {
        'tree-node': {
            'add-concept': 'Add concept',
            'export-concept': 'Export Sub-Tree',
            'delete-concept': 'Delete concept'
        }
    }
}

export default en;
