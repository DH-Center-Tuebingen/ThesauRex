# Changelog
All notable changes to this project will be documented in this file.

## 0.9.3
### Added
- Made language list searchable
- Add _Project Name_ to browser tab title
### Fixed
- More dropdowns in modals
- Show link to Spacialist if set in preferences
- Broken avatar if is part of Spacialist
- Tree export
- Toggling concepts in sandbox tree no longer show descendants on top level
- Removing a narrower relation in _Detail View_ of a narrower with only one broader left only removed the relation, but the narrower concept still existed without any broaders
- Concept search was broken for a vocabulary wit a lot of concepts
### Changed
- No longer show user profile item in dropdown, if is part of Spacialist
- Auto select user (or first available) language in _Create Concept_ modal
- Searching for concepts returns only a maximum of 30 results (15 each for matches in user language and all other languages) ordered by exact match

## 0.9.2
### Fixed
- Updated language files
- Closing modal on adding concept
- Search did not work if no concept was selected
- Node dropdown not closed on outside click
- Added missing delete functionality
- Dropdowns in modals did not overlap modal boundaries

## 0.9.1
### Added
- Logo image
### Fixed
- Reload on node item click

## 0.9 - Isfahan
### Added
- Show badge what tree the selected concept is from
- Switch to make a concept a top level concept
- Show icon and info text if a concept has only one broader relation (and thus is not deletable)
### Fixed
### Changed
- Revamp Role Permission Configuration
  - Add Presets to Derive Role Permission Set from
- Update Laravel to Version 9
- Update VueJS to Version 3
- Restructure Bootstrapping and Setup of App
- Restructure Layout of Preference Pages
- Replace most of Checkboxes with Switches
- Update Dependencies
  - Bootstrap 5
  - Multiselect (switched from [vue-multiselect](https://github.com/shentao/vue-multiselect) to [multiselect](https://github.com/vueform/multiselect))
  - Modals (switched from [vue-js-modal](https://github.com/euvl/vue-js-modal) to [vue-final-modal](https://github.com/vue-final/vue-final-modal))
- Renamed eScience-Center to DH-Center

## 0.6.3
### Added
- Sorting of concepts in tree
- Login using a nickname instead of e-mail address
- Re-add dependency lock-files
### Fixed
- Error on adding new concepts
- Missing dropdown items in header bar
- Ignore uppercase/lowercase letters in login form user names
- Several problems with removing concepts
- Adding new top level concept not visible
- Deleting concept with strategy _Delete & Level Up_ led to orphaned descendant concepts

## 0.6.2
### Changed
- Switched (unmaintained) permission package to match Spacialist

## 0.6.1
### Added
- Drag & Drop
- Info modal when importing a new file
### Fixed
- Skip resources that are not concepts of imported files
- Wrong URLs (Add/Delete broader)
- Font loading
- Remove login page redirect on page load
- Prevent adding broaders as narrowers (would create circles)
- Several bugs in add/remove concepts
- Minor style fixes
- Logout after typing too fast in tree/concept search

## 0.6 - Federsee
This version is a complete rewrite using Laravel and Vue.js. Please refer to the [INSTALL.md](INSTALL.md) for migration and new setup information.

### Added
- Manage Language Page
- Icon to copy URI of selected concept to clipboard
- Translations

### Changed
- Moved from Lumen (5.3) to Laravel (5.7)
- Moved from AngularJS (1.5) to Vue.js (2.5)
- Updated Bootstrap 3.3 to 4.1
- Switched from Material Design back to original Bootstrap
- Switched from Material Icons to new FontAwesome 5.6
- User/Role Management bundle several actions (Save, Edit, Delete, ...) in single dropdown (...-menu)
- Tree View now loads root elements only. Sub-elements are loaded on request
- Search now searches in user's language and in all languages if no labels found in that language

### Fixed
- Unfolding, highlighting and selection of tree items

### Removed
- Drag & Drop (not supported by current tree implementation)

## 0.5 - Ephesus

Version bump to 0.5 to match Spacialist's current release

### Added
- User Management (same as in Spacialist)
- Toggle Button to show/hide sandbox tree

### Changed
- Switch tables for project and sandbox tree
- Replaced vanilla bootstrap with Material Design

### Fixed
- Hide elements if user has insufficient permissions
- RDF import
- Tree unfolding
- Language Switcher in modals
- Several UI fixes

## 0.1 - Atlantis

First working version

### Added
- Thesaurus Tree (for master and project thesaurus)
- Concept Editor (SKOS preferred and alternative labels, SKOS narrower and broader concepts)
- SKOS RDF Import/Export
