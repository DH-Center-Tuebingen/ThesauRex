spacialistApp.controller('treeCtrl', ['$scope', 'scopeService', 'httpPostFactory', 'httpPostPromise', 'httpGetFactory', 'httpGetPromise', 'Upload', '$timeout', '$uibModal', '$sce', function($scope, scopeService, httpPostFactory, httpPostPromise, httpGetFactory, httpGetPromise, Upload, $timeout, $uibModal) {
    var getLanguages = function() {
        httpGetFactory('api/get/languages', function(callback) {
            for(var i=0; i<callback.length; i++) {
                var lg = callback[i];
                $scope.possibleLanguages.push({
                    langShort: lg.short_name,
                    langName: lg.display_name,
                    id: lg.id_th_language
                });
            }
            console.log($scope.possibleLanguages);
            $scope.selectedPrefLabelLanguage = $scope.possibleLanguages[0];
            $scope.selectedAltLabelLanguage = $scope.possibleLanguages[0];
        });
    };

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

    var toggle = function(collapsed, srcNodeScope, isExport) {
        isExport = getTreeType(isExport);
        if(!collapsed) {
            //get children
            var id = srcNodeScope.$modelValue.id;
            srcNodeScope.$modelValue.children = $scope.roots[isExport][id].slice();
            angular.forEach(srcNodeScope.$modelValue.children, function(child, key) {
                child.hasChildren = hasChildren(child.id);
            });
        } else {
            //remove children
            delete srcNodeScope.$modelValue.children;
        }
    };

    var dropped = function(event, isExportTree) {
        var oldParent = event.source.nodesScope.$parent.$modelValue;
        var newParent = event.dest.nodesScope.$parent.$modelValue;
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
            if(typeof newParent === 'undefined' || newParent.id == -1) {
                newParent.id = -1;
                elem.is_top_concept = 't';
                elem.broader_id = -1;
                $scope.roots[isExport]['-1'].push(elem);
            }
            var src = isExportTree ? 'clone' : 'master';
            var formData = new FormData();
            formData.append('id', elem.id);
            formData.append('new_broader', newParent.id);
            formData.append('src', src);
            formData.append('is_top_concept', elem.is_top_concept == 't');
            var promise = httpPostPromise.getData('api/copy', formData);
            promise.then(function(data) {
                console.log(data.toSource());
            });
        }
        var outerPromise = updateRelation(elem.id, oldParent.id, newParent.id, isExportTree);
        outerPromise.then(function(concepts) {
            for(var k in concepts.concepts) {
                if(concepts.concepts.hasOwnProperty(k)) {
                    $scope.roots[isExport][k] = concepts.concepts[k];
                }
            }
            //$scope.roots = angular.extend({}, concepts.concepts);
            $scope.conceptNames = concepts.conceptNames.slice();
        });
    };

    $scope.treeOptions = {
        toggle: function(collapsed, srcNodeScope) {
            toggle(collapsed, srcNodeScope, 'master');
        },
        dropped: function(event) {
            dropped(event, false);
        }
    };

    $scope.exportTreeOptions = {
        toggle: function(collapsed, srcNodeScope) {
            toggle(collapsed, srcNodeScope, 'clone');
        },
        dropped: function(event) {
            dropped(event, true);
        }
    };

    var getTreeType = function(isExport) {
        return (typeof isExport === 'undefined' || isExport != 'clone') ? 'master' : 'clone';
    };

    $scope.addConcept = function(name, concept, isExport) {
        isExport = getTreeType(isExport);
        if(typeof $scope.currentModal !== 'undefined') $scope.currentModal.close('ok');
        var id = concept.id;
        var ts = getFullTimestamp();
        var projName = (isExport == 'master') ? 'intern' : '<user-project>';
        var urlName = name.replace(/ /g, '_');
        urlName = urlName.replace(/,/g, '');
        var url = "https://spacialist.escience.uni-tuebingen.de/" + projName + "/" + urlName + "/" + ts;
        var scheme = "https://spacialist.escience.uni-tuebingen.de/schemata#newScheme";
        var reclevel = parseInt(concept.reclevel) + 1;
        var isTC = concept.is_project ? 't' : 'f';
        var promise = addConcept(url, scheme, id, isTC, name, 1);
        promise.then(function(newId) {
            $scope.roots[isExport][id].push({
                id: newId.toString(),
                concept_url: url,
                concept_scheme: scheme,
                broader_id: id.toString(),
                is_top_concept: isTC,
                label: name,
                reclevel: reclevel,
                hasChildren: false
            });
            if(typeof $scope.roots[isExport][newId] === 'undefined') $scope.roots[isExport][newId] = [];
            concept.children = getChildren(id, isExport);
            concept.hasChildren = hasChildren(id, isExport);
        });
    };

    var addPromisedConcept = function(name, concept, isExport) {
        isExport = getTreeType(isExport);
        $scope.addConcept(name, concept, isExport);
        return $timeout(function(){}, 50);
    };

    var addConcept = function(url, scheme, broader, tc, label, languageId) {
        var formData = new FormData();
        formData.append('concept_url', url);
        formData.append('concept_scheme', scheme);
        formData.append('broader_id', broader);
        formData.append('is_top_concept', tc);
        formData.append('prefLabel', label);
        formData.append('lang', languageId);
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

    $scope.conceptMenu = [[
            function($itemScope, $event) {
                return $itemScope.$modelValue.label + '&hellip;';
            }, function($itemScope, $event) {
                return;
            }, function($itemScope, $event) {
                return false;
            }
        ], null, [
            function($itemScope, $event) {
                if($itemScope.$modelValue.is_project) return '<i class="fa fa-plus-circle fa-fw light green"></i> Neues Topkonzept';
                else return '<i class="fa fa-plus-circle fa-fw light green"></i> Neues Konzept';
            }, function($itemScope, $event) {
                $scope.newConcept = $itemScope.$modelValue;
                $scope.which = 'master';
                var modalInstance = $uibModal.open({
                    templateUrl: 'templates/newConceptModal.html',
                    scope: $scope
                });
                $scope.currentModal = modalInstance;
            }
        ], null, [
            '<i class="fa fa-cloud-upload fa-fw light blue"></i> Import', function($itemScope, $event) {
                console.log("import!");
            }
        ], [
            '<i class="fa fa-cloud-download fa-fw light orange"></i> Export', function($itemScope, $event) {
                $scope.export('master', $itemScope.$modelValue.id);
            }
        ]
    ];

    $scope.conceptMenuExport = [[
            function($itemScope, $event) {
                return $itemScope.$modelValue.label + '&hellip;';
            }, function($itemScope, $event) {
                return;
            }, function($itemScope, $event) {
                return false;
            }
        ], null, [
            function($itemScope, $event) {
                if($itemScope.$modelValue.is_project) return '<i class="fa fa-plus-circle fa-fw light green"></i> Neues Topkonzept';
                else return '<i class="fa fa-plus-circle fa-fw light green"></i> Neues Konzept';
            }, function($itemScope, $event) {
                $scope.newConcept = $itemScope.$modelValue;
                $scope.which = 'clone';
                var modalInstance = $uibModal.open({
                    templateUrl: 'templates/newConceptModal.html',
                    scope: $scope
                });
                $scope.currentModal = modalInstance;
            }
        ], null, [
            '<i class="fa fa-cloud-upload fa-fw light blue"></i> Import', function($itemScope, $event) {
                console.log("import!");
            }
        ], [
            '<i class="fa fa-cloud-download fa-fw light orange"></i> Export', function($itemScope, $event) {
                $scope.export('clone', $itemScope.$modelValue.id);
            }
        ]
    ];

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
                    curr.children = getChildren(curr.id);
                    curr.hasChildren = hasChildren(curr.id);
                    $scope.rdfTree[isExport].push(curr);
                }
            }
            $scope.roots[isExport]['-1'] = $scope.rdfTree[isExport].slice();
            $scope.rdfTree[isExport] = [{
                id: -1,
                concept_url: 'no concept',
                concept_scheme: 'no scheme',
                broader_id: -2,
                is_top_concept: 'f',
                is_project: true,
                label: isExport + '.rdf',
                reclevel: -1,
                hasChildren: true,
                intree: isExport
            }];
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
            promise = addPromisedConcept(n.label, $scope.currentEntry, isExport);
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

    $scope.getMatchingConcepts = function(searchString, type) {
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

    $scope.getSearchTree = function(searchString, isExport) {
        isExport = getTreeType(isExport);
        if(typeof searchString == 'undefined' || searchString.length < 3) {
            $scope.searchResults[isExport] = [];
            return;
        }
        var formData = new FormData();
        formData.append('val', searchString);
        formData.append('tree', isExport);
        //formData.append('lang', 'de');
        httpPostFactory('api/search', formData, function(results) {
            console.log(results);
            $scope.searchResults[isExport] = results;
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

    var getFullTimestamp = function() {
        var d = new Date();
        var year = d.getUTCFullYear();
        var month = d.getUTCMonth() + 1;
        var day = d.getUTCDate();
        var hours = d.getUTCHours() + 1;
        var mins = d.getUTCMinutes() + 1;
        var secs = d.getUTCSeconds() + 1;
        return year +
            getLeadingZero(month) +
            getLeadingZero(day) +
            getLeadingZero(hours) +
            getLeadingZero(mins) +
            getLeadingZero(secs);
    };

    var getLeadingZero = function(number, width) {
        if(typeof width == 'undefined') width = 2;
        else if(!Number.isInteger(width)) width = 2;
        else if(width <= 0) width = 2;
        var strRep = number.toString();
        var lng = strRep.length;
        if(lng > width) {
            return strRep.substring(0, width);
        } else if(lng < width) {
            var filled = strRep;
            for(var i=lng; i<width; i++) {
                filled = '0' + filled;
            }
            return filled;
        } else {
            return strRep;
        }
    };
}]);

spacialistApp.config(function(treeConfig) {
    treeConfig.defaultCollapsed = true;
});
