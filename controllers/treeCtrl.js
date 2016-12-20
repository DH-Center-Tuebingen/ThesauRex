spacialistApp.controller('treeCtrl', ['$scope', 'scopeService', 'httpPostFactory', 'httpPostPromise', 'httpGetFactory', 'httpGetPromise', 'Upload', '$timeout', '$uibModal', '$sce', function($scope, scopeService, httpPostFactory, httpPostPromise, httpGetFactory, httpGetPromise, Upload, $timeout, $uibModal) {
    var getLanguages = function() {
        httpGetFactory('api/get/languages', function(callback) {
            for(var i=0; i<callback.length; i++) {
                var lg = callback[i];
                $scope.possibleLanguages.push({
                    langShort: lg.short_name,
                    langName: lg.display_name,
                    id: lg.id
                });
            }
            $scope.selectedPrefLabelLanguage = $scope.possibleLanguages[0];
            $scope.selectedAltLabelLanguage = $scope.possibleLanguages[0];
            $scope.preferredLanguage = $scope.possibleLanguages[0];
        });
    };

    $scope.expandedElement = null;

    $scope.searchResults = {};
    $scope.rdfTree = {};
    $scope.roots = {
        clone: {},
        master: {}
    };
    $scope.completeTree = {};
    $scope.enableDragDrop = false;
    $scope.enableEditing = false;
    $scope.enableExportDragDrop = false;
    $scope.newPrefLabelText = {
        text: ""
    };
    $scope.newAltLabelText = {
        text: ""
    };
    $scope.matchingBroaderConcepts = [];
    $scope.matchingNarrowerConcepts = [];
    $scope.possibleLanguages = [];
    getLanguages();

    var dropped = function(event, isExportTree) {
        var oldParent = event.source.nodesScope.$modelValue;
        var newParent = event.dest.nodesScope.$modelValue;
        var isFromAnotherTree = false;
        if(typeof event.source.cloneModel !== 'undefined') {
            isFromAnotherTree = true;
            event.source.nodeScope.$modelValue = event.source.cloneModel;
        }
        var elem = event.source.nodeScope.$modelValue;
        var isExport = 'master';
        if((isFromAnotherTree && !isExportTree) || isExportTree) isExport = 'clone';
        if(isFromAnotherTree) {
            elem.is_top_concept = 'f';
            var id = -1;
            if(typeof newParent == 'undefined' || newParent.id == -1) {
                elem.is_top_concept = 't';
                elem.broader_id = -1;
            } else {
                id = newParent.id;
            }
            var src = isExportTree ? 'clone' : 'master';
            var formData = new FormData();
            formData.append('id', elem.id);
            formData.append('new_broader', id);
            formData.append('src', src);
            formData.append('is_top_concept', elem.is_top_concept == 't');
            var promise = httpPostPromise.getData('api/copy', formData);
            promise.then(function(data) {
                console.log(data.toSource());
                elem.reclevel = newParent.reclevel + 1;
                $scope.completeTree[isExport].push(elem);
                $scope.rdfTree[isExport].push(elem);
            });
        }
        var outerPromise = updateRelation(elem.id, oldParent.id, newParent.id, isExportTree);
        outerPromise.then(function(concepts) {
            for(var k in concepts.concepts) {
                if(concepts.concepts.hasOwnProperty(k)) {
                    $scope.roots[isExport][k] = concepts.concepts[k];
                }
            }
            $scope.conceptNames = concepts.conceptNames.slice();
        });
    };

    $scope.treeOptions = {
        dropped: function(event) {
            dropped(event, false);
        }
    };

    $scope.exportTreeOptions = {
        dropped: function(event) {
            dropped(event, true);
        }
    };

    var getTreeType = function(isExport) {
        return (typeof isExport === 'undefined' || isExport != 'clone') ? 'master' : 'clone';
    };

    $scope.addConcept = function(name, concept, lang, isExport) {
        isExport = getTreeType(isExport);
        if(typeof $scope.currentModal !== 'undefined') $scope.currentModal.close('ok');
        var projName = (isExport == 'master') ? 'intern' : '<user-project>';
        var scheme = "https://spacialist.escience.uni-tuebingen.de/schemata#newScheme";
        var isTC = false;
        var reclevel = 0;
        var id = -1;
        if(typeof concept == 'undefined') {
            isTC = true;
        } else {
            reclevel = parseInt(concept.reclevel) + 1;
            id = concept.id;
        }
        var promise = addConcept(scheme, id, isTC, name, projName, lang.id, isExport);
        promise.then(function(retElem) {
            var newId = retElem.newId;
            var newElem = {
                id: newId,
                concept_url: retElem.url,
                concept_scheme: scheme,
                is_top_concept: isTC,
                label: name,
                intree: isExport,
                reclevel: reclevel,
                hasChildren: false,
                children: []
            };
            if(id > 0) {
                newElem.broader_id = id;
                concept.children.push(newElem);
                if(!concept.hasChildren) concept.hasChildren = true;
            } else {
                $scope.rdfTree[isExport].push(newElem);
                $scope.completeTree[isExport].push(newElem);
            }
        });
    };

    var addPromisedConcept = function(name, concept, lang, isExport) {
        isExport = getTreeType(isExport);
        $scope.addConcept(name, concept, lang.id, isExport);
        return $timeout(function(){}, 50);
    };

    var addConcept = function(scheme, broader, tc, label, proj, languageId, isExport) {
        var formData = new FormData();
        formData.append('projName', proj);
        formData.append('concept_scheme', scheme);
        if(broader > 0) formData.append('broader_id', broader);
        formData.append('is_top_concept', tc);
        formData.append('prefLabel', label);
        formData.append('lang', languageId);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/add/concept', formData);
        return promise;
    };

    var updateRelation = function(narrower, oldBroader, newBroader, isExport) {
        if(typeof isExport === 'undefined') isExport = false;
        console.log(narrower+","+ oldBroader+","+ newBroader);
        var formData = new FormData();
        formData.append('narrower_id', narrower);
        formData.append('old_broader_id', oldBroader);
        formData.append('broader_id', newBroader);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/update/relation', formData);
        return promise;
    };

    var updateConcept = function(id, broader, isExport) {
        isExport = getTreeType(isExport);
        var formData = new FormData();
        formData.append('id', id);
        formData.append('broader_id', broader);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/add/broader', formData);
        return promise;
    };

    $scope.createNewConceptModal = function(which, model) {
        createNewConceptModal(model, which);
    };

    var createNewConceptModal = function(model, which) {
        $scope.newConcept = model;
        $scope.which = which;
        var modalInstance = $uibModal.open({
            templateUrl: 'templates/newConceptModal.html',
            scope: $scope
        });
        $scope.currentModal = modalInstance;
    };

    $scope.getContextMenu = function(item, isExport) {
        var menu = [];
        menu.push([
            function($itemScope, $event) {
                return $itemScope.$modelValue.label + '&hellip;';
            }, function($itemScope, $event) {
                return;
            }, function($itemScope, $event) {
                return false;
            }
        ]);
        menu.push(null);
        menu.push([
            '<i class="fa fa-fw fa-plus-circle light green"></i> Add new concept', function($itemScope, $event) {
                createNewConceptModal($itemScope.$modelValue, isExport);
            }
        ]);
        menu.push(null);
        if(!item.hasChildren || item.children.length === 0) {
            menu.push([
                '<i class="fa fa-fw fa-trash light red"></i> Delete',
                function($itemScope) {
                    var formData = new FormData();
                    formData.append('id', $itemScope.$modelValue.id);
                    formData.append('isExport', isExport);
                    httpPostFactory('api/delete/cascade', formData, function(result) {
                        $itemScope.remove();
                        var parent = $itemScope.$parent.$parent.$nodeScope.$modelValue;
                        parent.hasChildren = parent.children.length > 0;
                    });
                },
                function($itemScope) {
                    return !$itemScope.$modelValue.hasChildren || $itemScope.$modelValue.children.length === 0;
                }
            ]);
        } else {
            menu.push([
                '<i class="fa fa-fw fa-trash light red"></i> Delete&hellip;',
                [
                    ['<i class="fa fa-fw fa-eraser light red"></i> and remove descendants', function($itemScope) {
                        var formData = new FormData();
                        formData.append('id', $itemScope.$modelValue.id);
                        formData.append('isExport', isExport);
                        httpPostFactory('api/delete/cascade', formData, function(result) {
                            $itemScope.remove();
                            var parent = $itemScope.$parent.$parent.$nodeScope.$modelValue;
                            parent.hasChildren = parent.children.length > 0;
                        });
                    }],
                    ['<i class="fa fa-fw fa-angle-up light red"></i> and move descendants one level up', function($itemScope) {
                        var formData = new FormData();
                        formData.append('id', $itemScope.$modelValue.id);
                        formData.append('isExport', isExport);
                        httpPostFactory('api/delete/oneup', formData, function(result) {
                            var currChildren = $itemScope.$modelValue.children;
                            for(var i=0; i<currChildren.length; i++) {
                                currChildren[i].reclevel = currChildren[i].reclevel - 1;
                                $itemScope.$parent.$parent.$modelValue.push(currChildren[i]);
                            }
                            $itemScope.remove();
                        });
                    }],
                    ['<i class="fa fa-fw fa-angle-double-up light red"></i> and move descendants to the top level', function($itemScope) {
                        var t = angular.element(document.getElementById(isExport + '-tree')).scope();
                        var nodesScope = t.$nodesScope;
                        var formData = new FormData();
                        formData.append('id', $itemScope.$modelValue.id);
                        formData.append('isExport', isExport);
                        httpPostFactory('api/delete/totop', formData, function(result) {
                            var currChildren = $itemScope.$modelValue.children;
                            for(var i=0; i<currChildren.length; i++) {
                                currChildren[i].is_top_concept = true;
                                currChildren[i].reclevel = 0;
                                nodesScope.$modelValue.push(currChildren[i]);
                            }
                            $itemScope.remove();
                        });
                    }]
                ],
                function($itemScope) {
                    return $itemScope.$modelValue.hasChildren && $itemScope.$modelValue.children.length > 0;
                }
            ]);
        }
        menu.push(null);
        menu.push([
            '<i class="fa fa-fw fa-cloud-upload light blue"></i> Import', function($itemScope, $event) {
                console.log("import!");
            }
        ]);
        menu.push([
            '<i class="fa fa-fw fa-cloud-download light orange"></i> Export', function($itemScope, $event) {
                $scope.export(isExport, $itemScope.$modelValue.id);
            }
        ]);
        return menu;
    };

    $scope.uploadFile = function(file, errFiles, isExport) {
        isExport = getTreeType(isExport);
        $scope.f = file;
        $scope.errFiles = errFiles && errFiles[0];
        if(file) {
            file.upload = Upload.upload({
                 url: 'api/import',
                 data: { file: file }
            });
            file.upload.then(function(response) {
                $timeout(function() {
                    file.result = response.data;
                    $scope.getTree(isExport);
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

    var getChildrenFromArray = function(elem, isExport) {
        if (typeof $scope.roots[isExport][elem.id] === 'undefined') return [];
        var children = $scope.roots[isExport][elem.id].slice();
        delete $scope.roots[isExport][elem.id];
        for(var i=0; i<children.length; i++) {
            children[i].children = getChildrenFromArray(children[i], isExport);
            children[i].hasChildren = children[i].children.length > 0;
        }
        return children;
    };

    $scope.getTree = function(isExport) {
        isExport = getTreeType(isExport);
        var formData = new FormData();
        formData.append('tree', isExport);
        httpPostFactory('api/get/tree', formData, function(callback) {
            $scope.rdfTree[isExport] = [];
            $scope.conceptNames = [];
            var topConcepts = callback.topConcepts;
            $scope.roots[isExport] = angular.extend({}, callback.concepts);
            $scope.conceptNames = callback.conceptNames.slice();
            for(var k in topConcepts) {
                if(topConcepts.hasOwnProperty(k)) {
                    var curr = topConcepts[k];
                    curr.children = getChildrenFromArray(curr, isExport);
                    curr.hasChildren = curr.children.length > 0;
                    $scope.rdfTree[isExport].push(curr);
                }
            }
            $scope.completeTree[isExport] = $scope.rdfTree[isExport].slice();
        });
    };

    var getChildCount = function(id, isExport) {
        isExport = getTreeType(isExport);
        if(typeof $scope.roots[isExport][id] === 'undefined') return 0;
        return $scope.roots[isExport][id].length;
    };

    var hasChildren = function(id, isExport) {
        isExport = getTreeType(isExport);
        return getChildCount(id, isExport) > 0;
    };

    var getSubTree = function(id, isExport) {
        isExport = getTreeType(isExport);
        if(typeof $scope.roots[isExport][id] === 'undefined') return [];
        var children = $scope.roots[isExport][id].slice();
        delete $scope.roots[isExport][id];
        for(var i=0; i<children.length; i++) {
            children[i].children = getSubTree(children[i].id);
        }
        return children;
    };

    $scope.displayInformation = function(current) {
        console.log(current.id);
        var url = current.concept_url;
        var id = current.id;
        var label = current.label;
        var isExport = current.intree;
        setCurrentEntry(current);
        $scope.informations = {
            url: url,
            id: id,
            label: label,
            broaderConcepts: [],
            narrowerConcepts: [],
            prefLabels: [],
            altLabels: [],
            intree: isExport
        };
        $scope.informations.prefLabels.loading = true;
        $scope.informations.altLabels.loading = true;
        $scope.informations.broaderConcepts.loading = true;
        $scope.informations.narrowerConcepts.loading = true;
        var labelPromise = getLabels(id, isExport);
        labelPromise.then(function(data) {
            setLabels(data, $scope.informations.prefLabels, $scope.informations.altLabels);
        });

        var relationPromise = getRelations(id, isExport);
        relationPromise.then(function(data) {
            if(data == -1) return;
            setRelations(data, $scope.informations.broaderConcepts, $scope.informations.narrowerConcepts);
        });

        delete $scope.informations.prefLabels.loading;
        delete $scope.informations.altLabels.loading;
        delete $scope.informations.broaderConcepts.loading;
        delete $scope.informations.narrowerConcepts.loading;
    };

    var getRelations = function(id, isExport) {
        isExport = getTreeType(isExport);
        var formData = new FormData();
        formData.append('id', id);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/get/relations', formData);
        return promise;
    };

    var setRelations = function(data, broader, narrower) {
        if(typeof narrower !== 'undefined' && narrower !== null) {
            angular.forEach(data.narrower, function(n, key) {
                narrower.push({
                    id: n.id_th_concept,
                    label: n.label,
                    url: n.concept_url
                });
            });
        }
        if(typeof broader !== 'undefined' && broader !== null) {
            angular.forEach(data.broader, function(b, key) {
                broader.push({
                    id: b.id_th_concept,
                    label: b.label,
                    url: b.concept_url
                });
            });
        }
    };

    var getLabels = function(id, isExport) {
        isExport = getTreeType(isExport);
        var formData = new FormData();
        formData.append('id', id);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/get/label', formData);
        return promise;
    };

    var setLabels = function(data, prefLabels, altLabels) {
        var setPrefLabels = typeof prefLabels !== 'undefined' && prefLabels !== null;
        var setAltLabels = typeof altLabels !== 'undefined' && altLabels !== null;
        angular.forEach(data, function(lbl, key) {
            var curr = {
                id: lbl.id_th_concept_label,
                label: lbl.label,
                langShort: lbl.short_name,
                langName: lbl.display_name,
                langId: lbl.id_th_language
            };
            if(setPrefLabels && lbl.concept_label_type == 1) {
                prefLabels.push(curr);
            } else if(setAltLabels && lbl.concept_label_type == 2) {
                altLabels.push(curr);
            }
        });
    };

    $scope.selectPreferredLanguage = function(index) {
        $scope.preferredLanguage = $scope.possibleLanguages[index];
    };

    $scope.selectAltLabelLanguage = function(index) {
        $scope.selectedAltLabelLanguage = $scope.possibleLanguages[index];
    };

    $scope.selectPrefLabelLanguage = function(index) {
        $scope.selectedPrefLabelLanguage = $scope.possibleLanguages[index];
    };

    $scope.editPrefLabelEntry = function(index) {
        $scope.informations.prefLabels.editText = $scope.informations.prefLabels[index].label;
        $scope.informations.prefLabels.editIndex = index;
    };

    $scope.editAltLabelEntry = function(index) {
        $scope.informations.altLabels.editText = $scope.informations.altLabels[index].label;
        $scope.informations.altLabels.editIndex = index;
    };

    $scope.storePrefLabelEdit = function(isExport) {
        var index = $scope.informations.prefLabels.editIndex;
        var label = $scope.informations.prefLabels[index];
        var promise = addPrefLabel($scope.informations.prefLabels.editText, label.langId, label.id, isExport);
        promise.then(function(id) {
            $scope.informations.prefLabels[index].label = $scope.informations.prefLabels.editText;
            delete $scope.informations.prefLabels.editIndex;
            delete $scope.informations.prefLabels.editText;
        });
    };

    $scope.storeAltLabelEdit = function(isExport) {
        var index = $scope.informations.altLabels.editIndex;
        var label = $scope.informations.altLabels[index];
        var promise = addAltLabel($scope.informations.altLabels.editText, label.langId, label.id, isExport);
        promise.then(function(id) {
            $scope.informations.altLabels[index].label = $scope.informations.altLabels.editText;
            delete $scope.informations.altLabels.editIndex;
            delete $scope.informations.altLabels.editText;
        });
    };

    $scope.resetPrefLabelEdit = function() {
        delete $scope.informations.prefLabels.editIndex;
        delete $scope.informations.prefLabels.editText;
    };

    $scope.resetAltLabelEdit = function() {
        delete $scope.informations.altLabels.editIndex;
        delete $scope.informations.altLabels.editText;
    };

    var addPrefLabel = function(text, langId, id, isExport) {
        return addLabel(text, langId, 1, id, isExport);
    };

    var addAltLabel = function(text, langId, id, isExport) {
        return addLabel(text, langId, 2, id, isExport);
    };

    var removePrefLabel = function(langId, id, isExport) {
        return addLabel("", langId, 1, id, true, isExport);
    };

    var removeAltLabel = function(langId, id, isExport) {
        return addLabel("", langId, 2, id, true, isExport);
    };

    var addLabel = function(text, langId, type, id, del, isExport) {
        var formData = new FormData();
        formData.append('label', text);
        formData.append('lang', langId);
        formData.append('type', type);
        formData.append('concept_id', $scope.informations.id);
        formData.append('isExport', isExport);
        if(typeof id !== 'undefined') formData.append('id', id);
        if(typeof del !== 'undefined') formData.append('delete', del);
        var promise = httpPostPromise.getData('api/add/label', formData);
        return promise;
    };

    $scope.addPrefLabel = function(isExport) {
        for(var i=0; i<$scope.informations.prefLabels.length; i++) {
            var l = $scope.informations.prefLabels[i];
            if(l.langId == $scope.selectedPrefLabelLanguage.id) {
                $scope.alertTitle = 'prefLabel vorhanden';
                $scope.alertMsg = "Es ist bereits ein prefLabel für " + $scope.selectedPrefLabelLanguage.langName + " vorhanden.";
                var modalInstance = $uibModal.open({
                    templateUrl: 'templates/alertModal.html',
                    scope: $scope
                });
                return;
            }
        }
        var promise = addPrefLabel($scope.newPrefLabelText.text, $scope.selectedPrefLabelLanguage.id, isExport);
        promise.then(function(labelId) {
            if(labelId < 0) return;
            $scope.informations.prefLabels.push({
                id: labelId,
                label: $scope.newPrefLabelText.text,
                langShort: $scope.selectedPrefLabelLanguage.langShort,
                langName: $scope.selectedPrefLabelLanguage.langName,
                langId: $scope.selectedPrefLabelLanguage.id
            });
            $scope.newPrefLabelText.text = "";
        });
    };

    $scope.addAltLabel = function(isExport) {
        var promise = addAltLabel($scope.newAltLabelText.text, $scope.selectedAltLabelLanguage.id, isExport);
        promise.then(function(labelId) {
            $scope.informations.altLabels.push({
                id: labelId,
                label: $scope.newAltLabelText.text,
                langShort: $scope.selectedAltLabelLanguage.langShort,
                langName: $scope.selectedAltLabelLanguage.langName,
                langId: $scope.selectedAltLabelLanguage.id
            });
            $scope.newAltLabelText.text = "";
        });
    };

    $scope.deleteBroaderConcept = function($index, isExport) {
        deleteEntry($index, 1, 1, isExport);
    };

    $scope.deleteNarrowerConcept = function($index, isExport) {
        deleteEntry($index, 1, 2, isExport);
    };

    $scope.deletePrefLabel = function($index, isExport) {
        deleteEntry($index, 2, 1, isExport);
    };

    $scope.deleteAltLabel = function($index, isExport) {
        deleteEntry($index, 2, 2, isExport);
    };

    var removeBroaderConcept = function(id, broaderId, isExport) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('broaderId', broaderId);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/remove/concept', formData);
        return promise;
    };

    var removeNarrowerConcept = function(id, narrowerId, isExport) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('narrowerId', narrowerId);
        formData.append('isExport', isExport);
        var promise = httpPostPromise.getData('api/remove/concept', formData);
        return promise;
    };

    var deleteEntry = function(index, type, subType, isExport) {
        var concept;
        var promise;
        if(type == 1) { //concept
            var currentId = $scope.informations.id;
            if(subType == 1) { //broader
                concept = $scope.informations.broaderConcepts[index];
                promise = removeBroaderConcept(currentId, concept.id, isExport);
                promise.then(function(id) {
                    console.log(id);
                    $scope.informations.broaderConcepts.splice(index, 1);
                });
            } else if(subType == 2) { //narrower
                concept = $scope.informations.narrowerConcepts[index];
                promise = removeNarrowerConcept(currentId, concept.id, isExport);
                promise.then(function(id) {
                    console.log(id);
                    $scope.informations.narrowerConcepts.splice(index, 1);
                });
            }
        } else if(type == 2) { //label
            if(subType == 1) { //pref
                lbl = $scope.informations.prefLabels[index];
                promise = removePrefLabel(lbl.langId, lbl.id, isExport);
                promise.then(function() {
                    $scope.informations.prefLabels = [];
                    var nextPromise = getLabels($scope.informations.id, isExport);
                    nextPromise.then(function(data) {
                        setLabels(data, $scope.informations.prefLabels, null);
                    });
                });
            } else if(subType == 2) { //alt
                lbl = $scope.informations.altLabels[index];
                promise = removeAltLabel(lbl.langId, lbl.id, isExport);
                promise.then(function() {
                    $scope.informations.altLabels = [];
                    var nextPromise = getLabels($scope.informations.id, isExport);
                    nextPromise.then(function(data) {
                        setLabels(data, null, $scope.informations.altLabels);
                    });
                });
            }
        }
    };

    var setCurrentEntry = function(entry) {
        $scope.currentEntry = entry;
    };

    $scope.addBroaderConcept = function(b, isExport) {
        $scope.informations.broaderConcepts.push({
            id: b.id,
            label: b.label,
            url: b.url
        });
    };

    $scope.addNarrowerConcept = function(n, isExport) {
        isExport = getTreeType(isExport);
        var promise;
        if(n.isNew) {
            promise = addPromisedConcept(n.label, $scope.currentEntry, $scope.preferredLanguage, isExport);
        } else {
            promise = updateConcept(n.id, $scope.currentEntry.id, isExport);
        }
        promise.then(function() {
            $scope.informations.narrowerConcepts = [];
            var nextPromise = getRelations($scope.currentEntry.id, isExport);
            nextPromise.then(function(data) {
                setRelations(data, null, $scope.informations.narrowerConcepts);
            });
        });
    };

    angular.element(document).ready(function () {
        $scope.getWindowSize();
    });

    $scope.getMatchingConcepts = function(searchString, type) {
        if(typeof $scope.informations == 'undefined') return;
        var currentSet = [];
        if(type === 'broader') {
            $scope.matchingBroaderConcepts = [];
            currentSet = $scope.informations.broaderConcepts.slice();
        } else if(type === 'narrower') {
            $scope.matchingNarrowerConcepts = [];
            currentSet = $scope.informations.narrowerConcepts.slice();
        }
        if(searchString.length < 3) return;
        var ss = searchString.toLowerCase();
        var matchingConcepts = [];
        var exactMatch = false;
        angular.forEach($scope.conceptNames, function(c, key) {
            if(c.label.toLowerCase().indexOf(ss) > -1) {
                var alreadySet = false;
                for(var i=0; i<currentSet.length; i++) {
                    if(currentSet[i].id === c.id) {
                        alreadySet = true;
                        break;
                    }
                }
                if(!alreadySet) {
                    matchingConcepts.push(c);
                    if(c.label.toLowerCase() == ss) exactMatch = true;
                }
            }
        });
        if(type === 'broader') $scope.matchingBroaderConcepts = matchingConcepts;
        else if(type === 'narrower') {
            if(!exactMatch) matchingConcepts.push({
                label: searchString,
                isNew: true,
                additionalInfo: 'Add new'
            });
            $scope.matchingNarrowerConcepts = matchingConcepts;
        }
    };

    var getChildrenRecursive = function(id, reclevel) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('reclevel', reclevel);
        var promise = httpPostPromise.getData('api/get/children', formData);
        return promise;
    };

    var getChildren = function(id, isExport) {
        isExport = getTreeType(isExport);
        var children = $scope.roots[isExport][id];
        angular.forEach(children, function(c, key) {
            c.hasChildren = hasChildren(c.id, isExport);
        });
        return typeof children === 'undefined' ? children : children.slice();
    };

    var elementAlreadyInTree = function(elem, tree) {
        for(var i=0; i<tree.length; i++) {
            if(elem.id == tree[i].id) return true;
        }
        return false;
    };

    var expandElement = function(id, isExport) {
        isExport = getTreeType(isExport);
        var formData = new FormData();
        formData.append('id', id);
        formData.append('tree', isExport);
        httpPostFactory('api/get/parents/all', formData, function(parents) {
            var self = parents[parents.length-1].narrower_id;
            parents.push({
                broader_id: self
            });
            $scope.$broadcast('angular-ui-tree:collapse-all');
            var t = angular.element(document.getElementById(isExport + '-tree')).scope();
            t.$element[0].scrollTop = 0;
            var nodesScope = t.$nodesScope;
            var children = nodesScope.childNodes();

            var expandWatcher = $scope.$watch('expandedElement', function() {
                if($scope.expandedElement === null) return;
                var topLength = $scope.expandedElement.getBoundingClientRect().top;
                var treeDom = t.$element[0];
                var treeHeight = treeDom.getBoundingClientRect().height;
                if(topLength > treeHeight) {
                    treeDom.scrollTop = topLength - treeHeight;
                }
                expandWatcher();
                $scope.expandedElement = null;
            });
            recursiveExpansion(parents, children);
        });
    };

    var recursiveExpansion = function(parents, children) {
        recursiveExpansionHelper(parents, children, 0);
    };

    var recursiveExpansionHelper = function(parents, children, lvl) {
        for(var i=0; i<children.length; i++) {
            var currParent = parents[lvl];
            var currChild = children[i];
            if(currChild.$modelValue.id == currParent.broader_id) {
                if(lvl+1 == parents.length) {
                    $scope.displayInformation(currChild.$modelValue);
                    $scope.expandedElement = currChild.$element[0];
                } else {
                    //currChild.expand();
                    // calling expand() on currChild should be enough, but currChild.childNodes() then returns an array with undefined values.
                    //Thus we use this "simple" DOM-based method to simulate a click on the element and toggle it.
                    //This only works because we broadcast the collapse-all event beforehand.
                    $timeout(function() {
                        currChild.$element[0].firstChild.childNodes[2].click();
                        recursiveExpansionHelper(parents, currChild.childNodes(), lvl+1);
                    }, 0, false);
                }
                break;
            }
        }
    };

    $scope.expandElement = function($item, $model, $label, $event, isExport) {
        expandElement($item.id, isExport);
    };

    $scope.getSearchTree = function(searchString, isExport) {
        isExport = getTreeType(isExport);
        var formData = new FormData();
        formData.append('val', searchString);
        formData.append('tree', isExport);
        return httpPostPromise.getData('api/search', formData).then(function(result) {
            return result;
        });
    };

    $scope.export = function(isExport, id) {
        $scope.waitingForFile = true;
        var formData = new FormData();
        isExport = getTreeType(isExport);
        formData.append('isExport', isExport);
        if(typeof id !== 'undefined' && id > 0) {
            formData.append('root', id);
        }
        var promise = httpPostPromise.getData('api/export', formData);
        promise.then(function(data) {
            $scope.waitingForFile = false;
            var filename = "thesaurus.rdf";
            createDownloadFile(data, filename);
        });
    };

    var createDownloadFile = function(data, filename) {
        var uri = 'data:text/xml;charset=utf-8,' + encodeURIComponent(data);
        var link = document.createElement("a");
        link.href = uri;
        link.style = "visibility:hidden";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    $scope.getRecLength = function(parent) {
        var sum = 0;
        if(typeof parent === 'undefined' || typeof parent.children === 'undefined') return sum;
        if(typeof parent.children[0] !== 'undefined') {
            if(typeof parent.children[0].children !== 'undefined') {
                sum += parent.children[0].children.length;
                for(var i=0; i<parent.children[0].children.length; i++) {
                    var children = parent.children[0].children[i];
                    sum += $scope.getRecLength(children);
                }
            }
        }
        if(typeof parent.children[1] !== 'undefined') {
            if(typeof parent.children[1].children !== 'undefined') {
                sum += parent.children[1].children.length;
            }
        }
        return sum;
    };

    $scope.setEditContext = function(parent) {
        var attrDT;
        $scope.currentContext = parent;
        $scope.attribDataType = attrDT = attribDataTypes[1];
        $scope.attribData[attrDT] = {};
        $scope.attribData[attrDT].name = parent.title;
        angular.forEach(parent.data, function(value, key) {
            var index = value.context + "_" + value.attr;
            $scope.attribData[attrDT][index] = value.value;
        });
    };
}]);

spacialistApp.config(function(treeConfig) {
    treeConfig.defaultCollapsed = true;
});
