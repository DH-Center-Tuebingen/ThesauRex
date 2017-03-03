thesaurexApp.service('mainService', ['httpGetFactory', 'httpPostFactory', 'httpPostPromise', 'modalFactory', '$uibModal', function(httpGetFactory, httpPostFactory, httpPostPromise, modalFactory, $uibModal) {
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

    function addBroaderWithId(id, parent, treeName, isNarrower) {
        isNarrower = isNarrower || false;
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
            if(!isNarrower) updateRelations(id, treeName);
            else updateRelations(parent.id, treeName);
        });
    }

    main.addNarrower = function(item, treeName) {
        var parent = main.selectedElement.properties;
        if(item.isNew) {
            main.createNewConceptModal(treeName, parent, item.label);
        } else {
            addBroaderWithId(item.id, parent, treeName, true);
        }
    };

    main.addPrefLabel = function(labelText, language, cid, treeName, id) {
        var promise = addLabel(1, labelText, language, cid, treeName, id);
        promise.then(function(response) {
            postAdd(response, language, treeName);
        });
    };

    main.addAltLabel = function(labelText, language, cid, treeName, id) {
        var promise = addLabel(2, labelText, language, cid, treeName, id);
        promise.then(function(response) {
            postAdd(response, language, treeName);
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
            postUpdate(label, treeName);
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
            postUpdate(label, treeName);
        });
    };

    main.deleteBroaderConcept = function(index, broader, treeName) {
        var id = main.selectedElement.properties.id;
        var promise = deleteBroaderConcept(id, broader.id, treeName);
        promise.then(function(response) {
            deleteFromChildren(broader.id, id, treeName);
            updateChildren(broader.id, treeName);
            main.selectedElement.relations.broader.splice(index, 1);
            if(main.selectedElement.relations.broader.length === 0) {
                main.tree[treeName].tree.push(main.tree[treeName].concepts[id]);
            }
        });
    };

    main.deleteNarrowerConcept = function(index, narrower, treeName) {
        var id = main.selectedElement.properties.id;
        var promise = deleteNarrowerConcept(id, narrower.id, treeName);
        promise.then(function(response) {
            deleteFromChildren(id, narrower.id, treeName);
            updateChildren(id, treeName);
            main.selectedElement.relations.narrower.splice(index, 1);
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

    main.deleteSingleElement = function(elem, treeName) {
        var id = elem.id;
        var formData = new FormData();
        formData.append('id', id);
        formData.append('treeName', treeName);
        httpPostFactory('api/delete/cascade', formData, function(result) {
            deleteById(id, treeName);
            if(elem.is_top_concept) {
                deleteTopConcept(elem, treeName);
            }
        });
    };

    main.deleteElementWithChildren = function(elem, label, treeName) {
        var id = elem.id;
        modalFactory.deleteModal(label, function() {
            var formData = new FormData();
            formData.append('id', id);
            formData.append('treeName', treeName);
            httpPostFactory('api/delete/cascade', formData, function(result) {
                var deleteElements = main.tree[treeName].childList[id].slice();
                deleteElements.push(id);
                angular.forEach(deleteElements, function(elemId, key) {
                    deleteById(elemId, treeName);
                });
                if(elem.is_top_concept) {
                    deleteTopConcept(elem, treeName);
                }
            });
        }, 'If you delete this element, all of its descendants will be deleted, too!');
    };

    main.deleteElementAndMoveUp = function(elem, broader_id, treeName) {
        var id = elem.id;
        var formData = new FormData();
        formData.append('id', id);
        formData.append('broader_id', broader_id);
        formData.append('treeName', treeName);
        httpPostFactory('api/delete/oneup', formData, function(result) {
            var children = main.tree[treeName].childList[id].slice();
            delete(main.tree[treeName].concepts[id]);
            delete(main.tree[treeName].childList[id]);
            angular.forEach(main.tree[treeName].childList, function(entry, key) {
                var index = entry.indexOf(id);
                if(index > -1) {
                    addChildren(key, treeName, children);
                    main.tree[treeName].concepts[key].children = getChildrenById(key, treeName, true);
                }
            });
            if(elem.is_top_concept) {
                deleteTopConcept(elem, treeName);
            }
        });
    };

    main.dropped = function(event, isProjectTree) {
        var src = event.source;
        var dst = event.dest;
        var droppedElement = event.source.nodeScope.$modelValue;
        var srcTreeId = src.nodesScope.$treeScope.$id;
        var dstTreeId = dst.nodesScope.$treeScope.$id;
        var isFromAnotherTree = srcTreeId != dstTreeId;
        var id = droppedElement.id;
        var oldParentId = droppedElement.broader_id;
        var from = isProjectTree ? 'project' : 'master';
        var to = ((isFromAnotherTree && !isProjectTree) || isProjectTree) ? 'project' : 'master';
        var destScope = dst.nodesScope.$nodeScope;
        var newParent;
        if(destScope !== null) {
            newParent = destScope.$modelValue;
        }
        var is_top_concept = false;
        var newParentId = -1;
        if(typeof newParent == 'undefined' || newParent.id == -1) {
            is_top_concept = true;
        } else {
            newParentId = newParent.id;
        }
        if(isFromAnotherTree) {
            var formData = new FormData();
            formData.append('id', id);
            formData.append('new_broader', newParentId);
            formData.append('src', from);
            formData.append('is_top_concept', is_top_concept);
            var promise = httpPostPromise.getData('api/copy', formData);
            promise.then(function(response) {
                var newChildren = dst.nodesScope.childNodes();
                for(var i=0; i<newChildren.length; i++) {
                    var childId = newChildren[i].$modelValue.id;
                    var conceptUrl = newChildren[i].$modelValue.concept_url;
                    if(childId == droppedElement.id && conceptUrl == droppedElement.concept_url) {
                        newChildren[i].remove();
                        break;
                    }
                }
                var clonedElement = response.clonedElement;
                if(!main.tree[to].concepts[clonedElement.id]) {
                    main.tree[to].concepts[clonedElement.id] = clonedElement;
                }
                if(!main.tree[to].childList[clonedElement.broader_id]) {
                    main.tree[to].childList[clonedElement.broader_id] = [];
                }
                main.tree[to].childList[clonedElement.broader_id].push(clonedElement.id);
                setChildren(clonedElement.broader_id, to);
                var concepts = response.conceptList;
                var childList = response.concepts;
                for(var k in concepts) {
                    if(concepts.hasOwnProperty(k)) {
                        var c = concepts[k];
                        if(!main.tree[to].concepts[c.id]) {
                            main.tree[to].concepts[c.id] = c;
                        }
                    }
                }
                for(k in childList) {
                    if(childList.hasOwnProperty(k)) {
                        if(!main.tree[to].childList[k]) {
                            main.tree[to].childList[k] = [];
                        }
                        for(i=0; i<childList[k].length; i++) {
                            main.tree[to].childList[k].push(childList[k][i]);
                        }
                        setChildren(k, to);
                    }
                }
            });
        } else  {
            if(typeof oldParentId == 'undefined') oldParentId = -1;
            updateRelation(id, oldParentId, newParentId, to).then(function() {
                var modifiedValues = {};
                modifiedValues.is_top_concept = is_top_concept;
                modifiedValues.broader_id = newParentId;
                updateConcept(id, modifiedValues, from);
                var index = main.tree[to].childList[oldParentId].indexOf(id);
                if(index > -1) {
                    main.tree[to].childList[oldParentId].splice(index, 1);
                    setChildren(oldParentId, to);
                }
                index = main.tree[to].childList[newParentId].indexOf(id);
                if(index == -1) {
                    main.tree[to].childList[newParentId].push(id);
                    setChildren(newParentId, to);
                }
            });
        }
    };

    var updateRelation = function(narrower, oldBroader, newBroader, treeName) {
        console.log(narrower+","+ oldBroader+","+ newBroader);
        var formData = new FormData();
        formData.append('narrower_id', narrower);
        formData.append('old_broader_id', oldBroader);
        formData.append('broader_id', newBroader);
        formData.append('treeName', treeName);
        var promise = httpPostPromise.getData('api/update/relation', formData);
        return promise;
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

    main.getLanguageCode = function(shortName) {
        if(shortName == 'en') return 'us';
        return shortName;
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

    function postUpdate(label, treeName) {
        label.label = label.editText;
        main.resetLabelEdit(label);
        getUpdatedDisplayLabel(label, treeName);
    }

    function updateConcept(id, newValues, treeName) {
        for(var v in newValues) {
            main.tree[treeName].concepts[id][v] = newValues[v];
        }
    }

    function getUpdatedDisplayLabel(label, treeName) {
        var formData = new FormData();
        formData.append('id', label.id);
        formData.append('treeName', treeName);
        httpPostFactory('api/get/label/display', formData, function(response) {
            var newValues = {
                label: response.concept.label
            };
            updateConcept(response.concept.id, newValues, treeName);
        });
    }

    function postAdd(response, language, treeName) {
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
        getUpdatedDisplayLabel(label, treeName);
    }

    function deleteBroaderConcept(id, broaderId, treeName) {
        return deleteConcept(id, broaderId, treeName, true);
    }

    function deleteNarrowerConcept(id, narrowerId, treeName) {
        return deleteConcept(id, narrowerId, treeName, false);
    }

    function deleteConcept(id, relatedId, treeName, removeBroader) {
        var relationKey = removeBroader ? 'broader_id' : 'narrower_id';
        var formData = new FormData();
        formData.append('id', id);
        formData.append(relationKey, relatedId);
        formData.append('treeName', treeName);
        var promise = httpPostPromise.getData('api/remove/concept', formData);
        return promise;
    }

    function deleteTopConcept(elem, treeName) {
        if(!elem.is_top_concept) return;
        for(var i=0; i<main.tree[treeName].tree.length; i++) {
            var curr = main.tree[treeName].tree[i];
            if(curr.id == elem.id) {
                main.tree[treeName].tree.splice(i, 1);
                break;
            }
        }
    }

    function deleteById(id, treeName) {
        delete(main.tree[treeName].concepts[id]);
        delete(main.tree[treeName].childList[id]);
        angular.forEach(main.tree[treeName].childList, function(entry, key) {
            var index = entry.indexOf(id);
            if(index > -1) {
                main.tree[treeName].concepts[key].children = getChildrenById(key, treeName, true);
            }
        });
    }

    function deleteFromChildren(id, childId, treeName) {
        var children = main.tree[treeName].childList[id];
        // remove selected element from broaders childList
        for(var i=0; i<children.length; i++) {
            if(childId == children[i]) {
                children.splice(i, 1);
                break;
            }
        }
    }

    function updateChildren(id, treeName) {
        main.tree[treeName].concepts[id].children = getChildrenById(id, treeName, true);
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

        updateRelations(id, treeName);
    }

    function updateRelations(id, treeName) {
        main.selectedElement.relations.broader.length = 0;
        main.selectedElement.relations.narrower.length = 0;
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
            updateRelations(parentId, treeName);
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
            for(var k in tC) {
                if(tC.hasOwnProperty(k)) {
                    var c = tC[k];
                    c.children = getChildren(c.id, main.tree[t].childList, main.tree[t].concepts);
                    main.tree[t].tree.push(c);
                }
            }
        });
    }

    function getChildren(id, children, list, nonRecursive) {
        nonRecursive = nonRecursive || false;
        if(typeof children[id] === 'undefined') return [];
        var contextChildren = children[id];
        var newChildren = [];
        for(var i=0; i<contextChildren.length; i++) {
            var child = list[contextChildren[i]];
            // if child no longer exists in concepts hash map => remove it from childList
            if(!child) {
                children[id].splice(i, 1);
                i--; //decrement index after splice
                continue;
            }
            if(!nonRecursive) child.children = getChildren(contextChildren[i], children, list);
            newChildren.push(child);
        }
        return newChildren;
    }

    function getChildrenById(id, treeName, nonRecursive) {
        return getChildren(id, main.tree[treeName].childList, main.tree[treeName].concepts, nonRecursive);
    }

    function setChildren(id, treeName) {
        main.tree[treeName].concepts[id].children = getChildrenById(id, treeName, true);
    }

    function addChildren(id, treeName, children) {
        for(var i=0; i<children.length; i++) {
            main.tree[treeName].childList[id].push(children[i]);
        }
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
