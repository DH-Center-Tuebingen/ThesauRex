const de = {
    global: {
        save: 'Speichern',
        delete: 'Löschen',
        remove: 'Entfernen',
        cancel: 'Abbrechen',
        close: 'Schließen',
        add: 'Hinzufügen',
        edit: 'Editieren',
        update: 'Aktualisieren',
        replace: 'Ersetzen',
        clear: 'Leeren',
        confirm: 'Ok',
        create: 'Anlegen',
        search: 'Suche...',
        login: 'Einloggen',
        'login-title': 'Anmelden',
        'login-subtitle': 'Willkommen bei ThesauRex',
        download: 'Herunterladen',
        'download-name': '{name} herunterladen',
        upload: 'Hochladen',
        settings: {
            title: 'Einstellungen',
            users: 'Benutzerverwaltung',
            roles: 'Rollenverwaltung',
            system: 'System-Einstellungen',
            about: 'Über'
        },
        user: {
            settings: 'Einstellungen',
            logout: 'Ausloggen'
        },
        select: {
            placehoder: 'Option auswählen',
            select: 'Drücke Enter zum hinzufügen',
            deselect: 'Drücke Enter zum entfernen'
        },
        version: 'Version',
        label: 'Beschriftung',
        url: 'URL',
        name: 'Name',
        'display-name': 'Anzeigename',
        email: 'E-Mail-Adresse',
        password: 'Passwort',
        'remember-me': 'Eingeloggt bleiben',
        description: 'Beschreibung',
        roles: 'Rollen',
        permissions: 'Berechtigungen',
        'added-at': 'Hinzugefügt',
        'created-at': 'Erstellt',
        'updated-at': 'Aktualisert',
        options: 'Optionen',
        type: 'Typ',
        content: 'Inhalt',
        preference: 'Einstellung',
        value: 'Wert',
        'allow-override': 'Überschreibbar?',
        set: 'Setzen'
    },
    tree: {
        import: {
            label: 'RDF importieren',
            new: 'Nur neue Konzepte importieren',
            'new-update': 'Vorhandene Konzepte aktualisieren & neue hinzufügen',
            replace: 'Vorhandene Konzepte löschen & neue hinzufügen'
        },
        export: {
            label: 'RDF exportieren'
        },
        project: {
            title: 'Projekt-Baum'
        },
        sandbox: {
            title: 'Sandkasten-Baum'
        },
        'new-top-concept': 'Neues Top-Level Konzept anlegen'
    },
    detail: {
        title: 'Konzept-Eigenschaften',
        broader: {
            title: 'Übergeordnete Konzepte',
            empty: 'Keine übergeordneten Konzepte vorhanden'
        },
        narrower: {
            title: 'Untergeordnete Konzepte',
            empty: 'Keine untergeordneten Konzepte vorhanden'
        },
        label: {
            title: 'Beschriftungen',
            empty: 'Keine Beschriftungen vorhanden',
            'info-label-missing': 'Konzept nicht in alle Sprachen übersetzt.',
            toasts: {
                deleted: {
                    title: 'Beschriftung gelöscht',
                    message: 'Beschriftung <span class="font-weight-medium">{label}</span> erfolgreich gelöscht.'
                }
            }
        },
        note: {
            title: 'Notizen',
            empty: 'Keine Notizen vorhanden',
            toasts: {
                deleted: {
                    title: 'Notiz gelöscht',
                    message: 'Notiz <span class="font-weight-medium">{note}</span> erfolgreich gelöscht.'
                }
            }
        }
    },
    modals: {
        'new-concept': {
            title: 'Neues Top-Konzept anlegen',
            'title-parent': 'Neues Konzept unter {name} anlegen'
        },
        'delete-concept': {
            title: '{name} löschen',
            info: `Du kannst entweder <span class="font-weight-medium">{name}</span> und alle Unterkonzepte (<i class="fas fa-fw fa-trash"></i>) löschen oder nur <span class="font-weight-medium">{name}</span> löschen und alle Unterkonzepte eine Ebene nach oben verschieben (
                <span class="fa-stack d-inline" style="margin-right: -0.35rem;">
                    <i class="fas fa-trash"></i>
                    <i class="fas fa-arrow-up" data-fa-transform="shrink-2 left-4 up-5"></i>
                </span>
            ).`,
            delete: '<span class="font-weight-medium">{name}</span> löschen',
            'delete-recursive': 'Rekursiv löschen'
        }
    },
    menus: {
        'tree-node': {
            'add-concept': 'Konzept hinzufügen',
            'export-concept': 'Sub-Baum exportieren',
            'delete-concept': 'Konzept löschen'
        }
    }
}

export default de;
