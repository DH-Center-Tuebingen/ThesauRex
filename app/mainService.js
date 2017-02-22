thesaurexApp.service('mainService', ['httpGetFactory', 'httpPostFactory', 'httpPostPromise', '$uibModal', function(httpGetFactory, httpPostFactory, httpPostPromise, $uibModal) {
    var trees = ['master', 'project'];
    var main = {};
    main.languages = [];
    main.preferredLanguages = {
        pref: {},
        alt: {},
        main: {}
    };
    main.tree = {
        project: {
            tree: [],
            concepts: []
        },
        master: {
            tree: [],
            concepts: []
        }
    };
    main.selectedElement = {
        properties: {},
        labels: {
            pref: [],
            alt: []
        },
        relations: {
            broader: [],
            narrower: []
        },
        treeName: '',
        loading: {}
    };
    main.blockedUi = {
        isBlocked: false,
        message: ''
    };

    main.createNewConceptModal = function(treeName, parent, name) {
        if(!isValidTreeName(treeName)) return;
        var modalInstance = $uibModal.open({
            templateUrl: 'templates/newConceptModal.html',
            controller: function($uibModalInstance) {
                this.parent = parent;
                this.newConceptName = name;
                this.treeName = treeName;
                this.languages = main.languages;
                this.preferredLanguage = main.preferredLanguages.main;
                this.addConcept = main.addConcept;
            },
            controllerAs: 'mc'
        });
        main.currentModal = modalInstance;
    };

    main.addConcept = function(name, concept, lang, treeName) {
        if(!isValidTreeName(treeName)) return;
        if(typeof main.currentModal !== 'undefined') main.currentModal.close('ok');
        var projName = (treeName == 'master') ? 'intern' : '<user-project>';
        var scheme = "https://spacialist.escience.uni-tuebingen.de/schemata#newScheme";
        var isTC = false;
        var reclevel = 0;
        var parentId = -1;
        if(typeof concept == 'undefined') {
            isTC = true;
        } else {
            reclevel = parseInt(concept.reclevel) + 1;
            parentId = concept.id;
        }
        var promise = addConcept(scheme, parentId, isTC, name, projName, lang.id, treeName);
        promise.then(function(retElem) {
            var newElem = retElem.entry;
            newElem.label = name;
            newElem.reclevel = reclevel;
            newElem.broader_id = parentId;
            main.tree[treeName].concepts.push(newElem);
            addElement(newElem, treeName);
        });
    };

    main.setSelectedElement = function(element, treeName) {
        if(!isValidTreeName(treeName)) return;
        main.selectedElement.treeName = treeName;
        main.selectedElement.properties = element;
        main.selectedElement.labels.pref.length = 0;
        main.selectedElement.labels.alt.length = 0;
        main.selectedElement.relations.broader.length = 0;
        main.selectedElement.relations.narrower.length = 0;
        displayInformation(element, treeName);
    };

    main.disableUi = function(msg) {
        main.blockedUi.isBlocked = true;
        main.blockedUi.message = msg;
    };

    main.enableUi = function() {
        main.blockedUi.isBlocked = false;
        main.blockedUi.message = '';
    };

    main.uploadFile = function(file, errFiles, type, treeName) {
        if(file) {
            main.disableUi('Uploading file. Please wait.');
            file.upload = Upload.upload({
                 url: 'api/import',
                 data: { file: file, treeName: treeName, type: type }
            });
            file.upload.then(function(response) {
                $timeout(function() {
                    file.result = response.data;
                    main.fillTree(treeName);
                    main.enableUi();
                });
            }, function(reponse) {
                if(response.status > 0) {
                    $scope.errorMsg = response.status + ': ' + response.data;
                }
            }, function(evt) {
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        }
    };

    main.promisedExport = function(treeName, id) {
        if(!isValidTreeName(treeName)) return;
        var formData = new FormData();
        formData.append('treeName', treeName);
        if(typeof id !== 'undefined' && id > 0) {
            formData.append('root', id);
        }
        return httpPostPromise.getData('api/export', formData);
    };

    main.setPrefLabelLanguage = function(index) {
        main.preferredLanguages.pref = main.languages[index];
    };

    main.setAltLabelLanguage = function(index) {
        main.preferredLanguages.alt = main.languages[index];
    };

    main.setLanguage = function(index) {
        main.preferredLanguages.main = main.languages[index];
    };

    main.addBroader = function(parent, treeName) {
        if(!isValidTreeName(treeName)) return;
        var id = main.selectedElement.properties.id;
        addBroaderWithId(id, parent, treeName);
    };

    main.setEditLabelEntry = function(label) {
        label.editText = label.label;
        label.editMode = true;
    };

    main.resetLabelEdit = function(label) {
        label.editText = '';
        label.editMode = false;
    };

    function addBroaderWithId(id, parent, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('broader_id', parent.id);
        formData.append('treeName', treeName);
        httpPostFactory('api/add/broader', formData, function(response) {
            if(typeof main.tree[treeName].childList[parent.id] == 'undefined') {
                main.tree[treeName].childList[parent.id] = [];
            }
            main.tree[treeName].childList[parent.id].push(id);
            main.tree[treeName].concepts[parent.id].children = getChildrenById(parent.id, treeName);
        });
    }

    main.addNarrower = function(item, treeName) {
        var parent = main.selectedElement.properties;
        if(item.isNew) {
            main.createNewConceptModal(treeName, parent, item.label);
        } else {
            addBroaderWithId(item.id, parent, treeName);
        }
    };

    main.addPrefLabel = function(labelText, language, cid, treeName, id) {
        var promise = addLabel(1, labelText, language, cid, treeName, id);
        promise.then(function(response) {
            postAdd(response);
        });
    };

    main.addAltLabel = function(labelText, language, cid, treeName, id) {
        var promise = addLabel(2, labelText, language, cid, treeName, id);
        promise.then(function(response) {
            postAdd(response);
        });
    };

    main.updatePrefLabel = function(label, cid, treeName) {
        var language = {
            id: label.langId,
            langShort: label.langShort,
            langName: label.langName
        };
        var promise = addLabel(1, label.editText, language, cid, treeName, label.id);
        promise.then(function(response) {
            postUpdate(label);
        });
    };

    main.updateAltLabel = function(label, cid, treeName) {
        var language = {
            id: label.langId,
            langShort: label.langShort,
            langName: label.langName
        };
        var promise = addLabel(2, label.editText, language, cid, treeName, label.id);
        promise.then(function(response) {
            postUpdate(label);
        });
    };

    main.deleteLabel = function(labelType, index, label, treeName) {
        var formData = new FormData();
        formData.append('treeName', treeName);
        formData.append('id', label.id);
        var promise = httpPostPromise.getData('api/remove/label', formData);
        promise.then(function(response) {
            var labelList;
            if(labelType == 1) {
                labelList = main.selectedElement.labels.pref;
            } else if(labelType == 2) {
                labelList = main.selectedElement.labels.alt;
            }
            labelList.splice(index, 1);
        });
    };

    main.getSearchResults = function(searchString, treeName, appendSearchString) {
        appendSearchString = appendSearchString || false;
        var formData = new FormData();
        formData.append('val', searchString);
        formData.append('treeName', treeName);
        return httpPostPromise.getData('api/search', formData).then(function(result) {
            if(appendSearchString) {
                var item = {
                    label: searchString,
                    id: -1,
                    broader_label: 'Add new',
                    broader_id: -1,
                    isNew: true
                };
                result.push(item);
            }
            return result;
        });
    };

    function addLabel(labelType, labelText, language, cid, treeName, id) {
        var isEdit = typeof id != 'undefined';
        var formData = new FormData();
        formData.append('text', labelText);
        formData.append('lang', language.id);
        formData.append('type', labelType);
        formData.append('concept_id', cid);
        formData.append('treeName', treeName);
        if(isEdit) formData.append('id', id);
        return httpPostPromise.getData('api/add/label', formData);
    }

    function postUpdate(label) {
        label.label = label.editText;
        main.resetLabelEdit(label);
    }

    function postAdd(response) {
        var label = response.label;
        var data = [];
        var curr = {
            id: label.id,
            label: label.label,
            concept_label_type: label.concept_label_type,
            short_name: language.langShort,
            display_name: language.langName,
            language_id: language.id
        };
        data.push(curr);
        setLabels(data);
    }

    function isValidTreeName(treeName) {
        return trees.indexOf(treeName) > -1;
    }

    function displayInformation(element, treeName) {
        console.log(element);
        var id = element.id;
        main.selectedElement.loading.prefLabels = true;
        main.selectedElement.loading.altLabels = true;
        main.selectedElement.loading.broaderConcepts = true;
        main.selectedElement.loading.narrowerConcepts = true;
        getLabels(id, treeName).then(function(data) {
            main.selectedElement.loading.prefLabels = false;
            main.selectedElement.loading.altLabels = false;
            setLabels(data);
        });

        getRelations(id, treeName).then(function(data) {
            main.selectedElement.loading.broaderConcepts = false;
            main.selectedElement.loading.narrowerConcepts = false;
            if(data == -1) return;
            setRelations(data);
        });
    }

    function getLabels(id, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('treeName', treeName);
        return httpPostPromise.getData('api/get/label', formData);
    }

    function setLabels(data) {
        // var setPrefLabels = typeof prefLabels !== 'undefined' && prefLabels !== null;
        // var setAltLabels = typeof altLabels !== 'undefined' && altLabels !== null;
        angular.forEach(data, function(lbl, key) {
            var curr = {
                id: lbl.id,
                label: lbl.label,
                langShort: lbl.short_name,
                langName: lbl.display_name,
                langId: lbl.language_id
            };
            if(lbl.concept_label_type == 1) {
                main.selectedElement.labels.pref.push(curr);
            } else if(lbl.concept_label_type == 2) {
                main.selectedElement.labels.alt.push(curr);
            }
        });
    }

    function getRelations(id, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('treeName', treeName);
        return httpPostPromise.getData('api/get/relations', formData);
    }

    function setRelations(data) {
        angular.forEach(data.narrower, function(n, key) {
            main.selectedElement.relations.narrower.push({
                id: n.id,
                label: n.label,
                url: n.concept_url
            });
        });
        angular.forEach(data.broader, function(b, key) {
            main.selectedElement.relations.broader.push({
                id: b.id,
                label: b.label,
                url: b.concept_url
            });
        });
    }

    function addElement(element, treeName) {
        var parentId = element.broader_id;
        if(typeof parentId == 'undefined' || parentId < 0) {
            main.tree[treeName].tree.push(element);
        } else {
            if(typeof main.tree[treeName].childList[parentId] == 'undefined') {
                main.tree[treeName].childList[parentId] = [];
            }
            main.tree[treeName].childList[parentId].push(element.id);
            main.tree[treeName].concepts[parentId].children = getChildrenById(parentId, treeName);
        }
    }

    function addConcept(scheme, broader, tc, label, proj, languageId, treeName) {
        var formData = new FormData();
        formData.append('projName', proj);
        formData.append('concept_scheme', scheme);
        if(broader > 0) formData.append('broader_id', broader);
        formData.append('is_top_concept', tc);
        formData.append('prefLabel', label);
        formData.append('lang', languageId);
        formData.append('treeName', treeName);
        return httpPostPromise.getData('api/add/concept', formData);
    }

    init();

    function init() {
        getLanguages();
        getTrees();
    }

    function getLanguages() {
        httpGetFactory('api/get/languages', function(callback) {
            for(var i=0; i<callback.length; i++) {
                var lg = callback[i];
                main.languages.push({
                    langShort: lg.short_name,
                    langName: lg.display_name,
                    id: lg.id
                });
            }
            var l = main.languages[0];
            for(var k in l) {
                if(l.hasOwnProperty(k)) {
                    main.preferredLanguages.main[k] = l[k];
                    main.preferredLanguages.pref[k] = l[k];
                    main.preferredLanguages.alt[k] = l[k];
                }
            }
        });
    }

    function getTrees() {
        for(var i=0; i<trees.length; i++) {
            var t = trees[i];
            fillTree(t);
        }
    }

    function fillTree(t) {
        var formData = new FormData();
        formData.append('treeName', t);
        main.tree[t].tree.length = 0; // reset tree
        httpPostFactory('api/get/tree', formData, function(callback) {
            var tC = callback.topConcepts;
            angular.extend(main.tree[t].concepts, callback.topConcepts, callback.conceptList);
            main.tree[t].childList = callback.concepts;
            console.log(callback.concepts);
            for(var k in tC) {
                if(tC.hasOwnProperty(k)) {
                    var c = tC[k];
                    c.children = getChildren(c.id, main.tree[t].childList, main.tree[t].concepts);
                    main.tree[t].tree.push(c);
                }
            }
        });
    }

    function getChildren(id, children, list) {
        if(typeof children[id] === 'undefined') return [];
        var contextChildren = children[id];
        var newChildren = [];
        for(var i=0; i<contextChildren.length; i++) {
            var child = list[contextChildren[i]];
            child.children = getChildren(contextChildren[i], children, list);
            newChildren.push(child);
        }
        return newChildren;
    }

    function getChildrenById(id, treeName) {
        return getChildren(id, main.tree[treeName].childList, main.tree[treeName].concepts);
    }

    main.displayAlert = function(title, message) {
        var modalInstance = $uibModal.open({
            templateUrl: 'templates/alertModal.html',
            controller: function($uibModalInstance) {
                this.alertTitle = title;
                this.alertMsg = message;
            },
            controllerAs: 'mc'
        });
    };

    return main;
}]);
