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
            extend: 'Only import new concepts',
            'update-extend': 'Update existing concepts & add new ones',
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
        copy_url: {
            title: 'Copied URL to Clipboard',
            message: '<span class="font-weight-medium">{url}</span> successfully copied to the Clipboard.'
        },
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
    },
    settings: {
        user: {
            'add-button': 'Add new User',
            toasts: {
                updated: {
                    title: 'User updated',
                    msg: '{name} successfully updated.'
                }
            },
            modal: {
                new: {
                    title: 'New User'
                }
            },
            'add-role-placeholder': 'Add roles'
        },
        role: {
            'add-button': 'Add new Role',
            toasts: {
                updated: {
                    title: 'Role updated',
                    msg: '{name} successfully updated.'
                }
            },
            modal: {
                new: {
                    title: 'New Role'
                }
            },
            'add-permission-placeholder': 'Add permissions'
        },
        preference: {
            toasts: {
                updated: {
                    title: 'Preference updated',
                    msg: '{name} successfully updated.'
                }
            },
            key: {
                language: 'Language',
                tooltips: 'Show Tooltips',
                'link-thesaurex': 'Show link to ThesauRex',
                project: {
                    name: 'Projectname',
                    maintainer: 'Maintainer',
                    public: 'Public accessible'
                }
            },
            labels: {
                prefs: {
                    'gui-language': '@:settings.preference.key.language',
                    'show-tooltips': '@:settings.preference.key.tooltips',
                    'link-to-thesaurex': '@:settings.preference.key.link-thesaurex',
                    'project-name': '@:settings.preference.key.project.name',
                    'project-maintainer': '@:settings.preference.key.project.maintainer'
                }
            }
        },
        about: {
            title: 'About ThesauRex',
            desc: 'Development of ThesauRex is co-funded by the Ministry of Science, Research and the Arts Baden-Württemberg in the "E-Science" funding programme.',
            release: {
                name: 'Release Name',
                time: 'Release Date',
                'full-name': 'Full Name'
            },
            'build-info': 'Built with <i class="fab fa-fw fa-laravel"></i> & <i class="fab fa-fw fa-vuejs"></i>!',
            contributor: 'Contributor | Contributors'
        },
    }
}

export default en;
