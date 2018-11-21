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
        'select-all': 'Select All',
        'select-none': 'Deselect All',
        'delete-name': {
            title: 'Delete {name}',
            desc: 'Do you really want to delete {name}?'
        },
        'edit-name': {
            title: 'Edit {name}'
        },
        'remove-name': {
            title: 'Remove {name}',
            desc: 'Do you really want to remove {name}?'
        },
        'unlink-name': {
            title: 'Remove Link - {name}',
            desc: 'Do you really want to unlink {file} from {ent}?'
        },
        'all-entities': 'All Entities',
        unlinked: 'Unlinked',
        unlink: 'Unlink',
        link: 'Link',
        'unlink-from': 'Unlink from {name}',
        'link-to': 'Link to {name}',
        'has-links': 'Has no links | Has one link | Has {cnt} links',
        discard: {
            title: 'Unsaved Changes',
            msg: 'Unsaved changes in {name}. Do you really want to continue and discard changes?',
            confirm: 'Yes, discard changes',
            confirmpos: 'No, save and continue'
        },
        search: 'Search...',
        login: 'Login',
        'login-title': 'Login',
        'login-subtitle': 'Welcome to Spacialist',
        download: 'Download',
        'download-name': 'Download {name}',
        upload: 'Upload',
        tools: {
            title: 'Tools',
            bibliography: 'Bibliography',
            analysis: 'Data Analysis',
            thesaurex: 'ThesauRex',
            dbwebgen: 'dbWebGen',
            external: 'External Tools'
        },
        settings: {
            title: 'Settings',
            users: 'User Management',
            roles: 'Role Management',
            datamodel: 'Data-Model-Editor',
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
        attribute: 'Attribute',
        attributes: {
            string: 'Textfield',
            stringf: 'Textbox',
            'string-sc': 'Single Choice Dropdown',
            'string-mc': 'Multiple Choice Dropdown',
            double: 'Numeric Input (Floating Point)',
            integer: 'Numeric Input (Integer)',
            boolean: 'Checkbox',
            percentage: 'Percentage',
            entity: 'Entity',
            epoch: 'Time Period and Epoch',
            date: 'Date',
            dimension: 'Dimensions (BxHxT)',
            list: 'List',
            geography: 'WKT (Well-Known-Binary)',
            table: 'Table',
            sql: 'SQL-Query',
            serial: 'Serial (Auto-counting ID)',
            'serial-info': `All instances share this identifier as attribute. Add <code class="normal">%d</code> as counter.
            <br />
            <span class="font-weight-bold">Example:</span>
            <br />
            <code class="normal">Find_%d_Stone</code> would create Find_1_Stone, Find_2_Stone, &hellip;
            <br />
            To add a fixed width (e.g. 3 for 002 instead of 2), you can use <code class="normal">%03d</code>.`
        },
        active: 'Active',
        visible: 'Visible',
        invisible: 'Invisible',
        opacity: 'Opacity',
        transparency: 'Transparency',
        text: 'Text',
        font: 'Font',
        mode: 'Mode',
        size: 'Size',
        color: 'Color',
        format: 'Format',
        version: 'Version',
        label: 'Label',
        url: 'URL',
        name: 'Name',
        'display-name': 'Displayname',
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
        'root-element': 'Parent-Element',
        'non-recursive': 'All descendants (recursive)',
        content: 'Content',
        column: 'Column | Columns',
        'geometry-type': 'Geometry-Type',
        'depends-on': 'Depends on',
        preference: 'Preference',
        value: 'Value',
        'allow-override': 'Allow Override?',
        tag: 'Tag | Tags',
        set: 'Set',
        'has-tags': 'Has no tags | Has one tag | Has {cnt} tags'
    },
}

export default en;
