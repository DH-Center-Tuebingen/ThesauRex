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
        delete_name: {
            title: '{name} löschen',
            desc: 'Willst du <span class="font-weight-medium">{name}</span> wirklich löschen?'
        },
        discard: {
            title: 'Ungespeicherte Änderungen',
            msg: 'Ungespeicherte Änderungen in <span class="font-weight-medium">{name}</span>. Willst du wirklich fortfahren und die Änderungen verwerfen?',
            confirm: 'Ja, Änderungen verwerfen',
            confirmpos: 'Nein, Speichern und fortfahren'
        },
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
            languages: 'Sprachen',
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
        display_name: 'Anzeigename',
        short_name: 'Kürzel',
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
            extend: 'Nur neue Konzepte importieren',
            'update-extend': 'Vorhandene Konzepte aktualisieren & neue hinzufügen',
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
        copy_url: {
            title: 'URL in Zwischenablage kopiert',
            message: '<span class="font-weight-medium">{url}</span> erfolgreich in die Zwischenablage kopiert.'
        },
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
        },
        import_info: {
            title: 'Importiere…',
            info: 'Bitte warte während ThesauRex die Datei importiert. Das Fenster schließt sich automatisch.'
        }
    },
    menus: {
        'tree-node': {
            'add-concept': 'Konzept hinzufügen',
            'export-concept': 'Sub-Baum exportieren',
            'delete-concept': 'Konzept löschen',
            'remove-concept-relation': 'Verbindung aufheben'
        }
    },
    settings: {
        user: {
            'add-button': 'Neuen Benutzer hinzufügen',
            toasts: {
                updated: {
                    title: 'Benutzer aktualisiert',
                    msg: '{name} wurde erfolgreich aktualisiert.'
                }
            },
            modal: {
                new: {
                    title: 'Neuer Benutzer'
                }
            },
            'add-role-placeholder': 'Rollen hinzufügen'
        },
        role: {
            'add-button': 'Neue Rolle hinzufügen',
            toasts: {
                updated: {
                    title: 'Rolle aktualisiert',
                    msg: '{name} wurde erfolgreich aktualisiert.'
                }
            },
            modal: {
                new: {
                    title: 'Neue Rolle'
                }
            },
            'add-permission-placeholder': 'Berechtigungen hinzufügen'
        },
        language: {
            'add-button': 'Neue Sprache hinzufügen',
            toasts: {
                updated: {
                    title: 'Sprache aktualisiert',
                    msg: '{name} wurde erfolgreich aktualisiert.'
                }
            },
            modal: {
                new: {
                    title: 'Neue Sprache'
                }
            },
            set_short_placeholder: 'Sprach-Kürzel auswählen'
        },
        preference: {
            toasts: {
                updated: {
                    title: 'Einstellung aktualisiert',
                    msg: '{name} wurde erfolgreich aktualisiert.'
                }
            },
            key: {
                language: 'Sprache',
                tooltips: 'Infos anzeigen',
                'link-thesaurex': 'Link zu ThesauRex anzeigen',
                project: {
                    name: 'Projektname',
                    maintainer: 'Verantwortlicher',
                    public: 'Öffentlich verfügbar'
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
            title: 'Über ThesauRex',
            desc: 'ThesauRex wird vom Ministerium für Wissenschaft, Forschung und Kunst, Baden-Württemberg im Rahmen des "E-Science"-Programms gefördert.',
            release: {
                name: 'Name der Veröffentlichung',
                time: 'Datum der Veröffentlichung',
                'full-name': 'Vollständiger Name'
            },
            'build-info': 'Mit <i class="fab fa-fw fa-laravel"></i> & <i class="fab fa-fw fa-vuejs"></i> erstellt!',
            contributor: 'Mitwirkender | Mitwirkende'
        },
    }
}

export default de;
