thesaurexApp.controller('treeCtrl', ['$scope', 'mainService', function($scope, mainService) {
    $scope.languages = mainService.languages;
    $scope.preferredLanguage = mainService.preferredLanguage;
    $scope.masterTree = mainService.tree.master;
    $scope.projectTree = mainService.tree.project;
    $scope.selectedElement = mainService.selectedElement;
    $scope.blockedUi = mainService.blockedUi;

    $scope.expandedElement = null;

    $scope.searchResults = {};
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

    var dropped = function(event, treeNameTree) {
        var oldParentId = event.source.nodeScope.$modelValue.broader_id;
        var destScope = event.dest.nodesScope.$nodeScope;
        var newParent;
        if(destScope !== null) {
            newParent = destScope.$modelValue;
            newParent.hasChildren = true;
        }
        var isFromAnotherTree = false;
        if(event.source.nodesScope.$treeScope.$id != event.dest.nodesScope.$treeScope.$id) {
            isFromAnotherTree = true;
        }
        var elem = event.source.nodeScope.$modelValue;
        var treeName = 'master';
        if((isFromAnotherTree && !treeNameTree) || treeNameTree) treeName = 'project';
        var is_top_concept = false;
        var id = -1;
        var reclevel = -1;
        if(typeof newParent == 'undefined' || newParent.id == -1) {
            is_top_concept = true;
        } else {
            id = newParent.id;
            reclevel = typeof newParent.reclevel == 'undefined' ? -1 : newParent.reclevel;
        }
        if(isFromAnotherTree) {
            var src = treeNameTree ? 'project' : 'master';
            console.log("moving from " + src + " to " + treeName);
            var formData = new FormData();
            formData.append('id', elem.id);
            formData.append('new_broader', id);
            formData.append('src', src);
            formData.append('is_top_concept', is_top_concept);
            var promise = httpPostPromise.getData('api/copy', formData);
            promise.then(function(data) {
                elem.reclevel = reclevel + 1;
                elem.is_top_concept = is_top_concept;
                elem.broader_id = id;
            });
        } else  {
            if(typeof oldParentId == 'undefined') oldParentId = -1;
            var outerPromise = updateRelation(elem.id, oldParentId, id, treeName);
            outerPromise.then(function(concepts) {
                elem.reclevel = reclevel + 1;
                elem.is_top_concept = is_top_concept;
                elem.broader_id = id;
            });
        }
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

    $scope.addConcept = function(name, concept, lang, treeName) {
        mainService.addConcept(name, concept, lang, treeName);
    };

    var addPromisedConcept = function(name, concept, lang, treeName) {
        $scope.addConcept(name, concept, lang, treeName);
        return $timeout(function(){}, 50);
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

    $scope.createNewConceptModal = function(which) {
        mainService.createNewConceptModal(which);
    };

    $scope.getContextMenu = function(item, treeName) {
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
                mainService.createNewConceptModal(treeName, $itemScope.$modelValue);
            }
        ]);
        menu.push(null);
        if(!item.hasChildren || item.children.length === 0) {
            menu.push([
                '<i class="fa fa-fw fa-trash light red"></i> Delete',
                function($itemScope) {
                    var formData = new FormData();
                    formData.append('id', $itemScope.$modelValue.id);
                    formData.append('treeName', treeName);
                    httpPostFactory('api/delete/cascade', formData, function(result) {
                        publishNewChildrenToAllOccurrences($itemScope.$modelValue.id, { id: $itemScope.$modelValue.id }, treeName, true);
                        /*$itemScope.remove();
                        var parent = $itemScope.$parent.$parent.$nodeScope.$modelValue;
                        parent.hasChildren = parent.children.length > 0;*/
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
                        modalFactory.deleteModal($itemScope.$modelValue.label, function() {
                            var formData = new FormData();
                            formData.append('id', $itemScope.$modelValue.id);
                            formData.append('treeName', treeName);
                            httpPostFactory('api/delete/cascade', formData, function(result) {
	                            publishNewChildrenToAllOccurrences($itemScope.$modelValue.id, { id: $itemScope.$modelValue.id }, treeName, true);
                            });
                        }, 'If you delete this element, all of its descendants will be deleted, too!');
                    }],
                    ['<i class="fa fa-fw fa-angle-up light red"></i> and move descendants one level up', function($itemScope) {
                        var formData = new FormData();
                        formData.append('id', $itemScope.$modelValue.id);
                        formData.append('broader_id', $itemScope.$modelValue.broader_id);
                        formData.append('treeName', treeName);
                        httpPostFactory('api/delete/oneup', formData, function(result) {
                            var currChildren = $itemScope.$modelValue.children;
                            for(var i=0; i<currChildren.length; i++) {
                                currChildren[i].reclevel = currChildren[i].reclevel - 1;
                                $itemScope.$parent.$parent.$modelValue.push(currChildren[i]);
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
            '<i class="fa fa-fw fa-cloud-download light orange"></i> Export', function($itemScope, $event) {
                $scope.export(treeName, $itemScope.$modelValue.id);
            }
        ]);
        return menu;
    };

    $scope.uploadFile = function(file, errFiles, type, treeName) {
        $scope.f = file;
        $scope.errFiles = errFiles && errFiles[0];
        mainService.uploadFile(file, errFiles, type, treeName);
    };

    $scope.setSelectedElement = function(element, tree) {
        mainService.setSelectedElement(element, tree);
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

    $scope.storePrefLabelEdit = function(treeName) {
        var index = $scope.informations.prefLabels.editIndex;
        var label = $scope.informations.prefLabels[index];
        var promise = addPrefLabel($scope.informations.prefLabels.editText, label.langId, treeName, label.id);
        promise.then(function(id) {
            $scope.informations.prefLabels[index].label = $scope.informations.prefLabels.editText;
            delete $scope.informations.prefLabels.editIndex;
            delete $scope.informations.prefLabels.editText;
        });
    };

    $scope.storeAltLabelEdit = function(treeName) {
        var index = $scope.informations.altLabels.editIndex;
        var label = $scope.informations.altLabels[index];
        var promise = addAltLabel($scope.informations.altLabels.editText, label.langId, treeName, label.id);
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

    var addPrefLabel = function(text, langId, treeName, id) {
        return addLabel(text, langId, 1, id, treeName);
    };

    var addAltLabel = function(text, langId, treeName, id) {
        return addLabel(text, langId, 2, id, treeName);
    };

    var removePrefLabel = function(id, treeName) {
        return removeLabel(id, treeName);
    };

    var removeAltLabel = function(id, treeName) {
        return removeLabel(id, treeName);
    };

    var removeLabel = function(id, treeName) {
        var formData = new FormData();
        formData.append('treeName', treeName);
        formData.append('id', id);
        var promise = httpPostPromise.getData('api/remove/label', formData);
        return promise;
    };

    var addLabel = function(text, langId, type, id, treeName) {
        var formData = new FormData();
        formData.append('label', text);
        formData.append('lang', langId);
        formData.append('type', type);
        formData.append('concept_id', $scope.informations.id);
        formData.append('treeName', treeName);
        if(typeof id !== 'undefined') formData.append('id', id);
        var promise = httpPostPromise.getData('api/add/label', formData);
        return promise;
    };

    $scope.addPrefLabel = function(treeName) {
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
        var promise = addPrefLabel($scope.newPrefLabelText.text, $scope.selectedPrefLabelLanguage.id, treeName);
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

    $scope.addAltLabel = function(treeName) {
        var promise = addAltLabel($scope.newAltLabelText.text, $scope.selectedAltLabelLanguage.id, treeName);
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

    $scope.deleteBroaderConcept = function($index, treeName) {
        deleteEntry($index, 1, 1, treeName);
    };

    $scope.deleteNarrowerConcept = function($index, treeName) {
        deleteEntry($index, 1, 2, treeName);
    };

    $scope.deletePrefLabel = function($index, treeName) {
        deleteEntry($index, 2, 1, treeName);
    };

    $scope.deleteAltLabel = function($index, treeName) {
        deleteEntry($index, 2, 2, treeName);
    };

    var removeBroaderConcept = function(id, broaderId, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('broaderId', broaderId);
        formData.append('treeName', treeName);
        var promise = httpPostPromise.getData('api/remove/concept', formData);
        return promise;
    };

    var removeNarrowerConcept = function(id, narrowerId, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('narrowerId', narrowerId);
        formData.append('treeName', treeName);
        var promise = httpPostPromise.getData('api/remove/concept', formData);
        return promise;
    };

    var deleteEntry = function(index, type, subType, treeName) {
        var concept;
        var promise;
        if(type == 1) { //concept
            var currentId = $scope.informations.id;
            if(subType == 1) { //broader
                concept = $scope.informations.broaderConcepts[index];
                promise = removeBroaderConcept(currentId, concept.id, treeName);
                promise.then(function(id) {
                    console.log(id);
                    $scope.informations.broaderConcepts.splice(index, 1);
                });
            } else if(subType == 2) { //narrower
                concept = $scope.informations.narrowerConcepts[index];
                var removedItem = null;
                promise = removeNarrowerConcept(currentId, concept.id, treeName);
                promise.then(function(id) {
                    console.log(id);
                    var remId = $scope.informations.narrowerConcepts.splice(index, 1)[0].id;
                    var children = $scope.currentEntry.children;
                    for(var i=0; i<children.length; i++) {
                        var curr = children[i];
                        if(curr.id == remId) {
                            removedItem = $scope.currentEntry.children.splice(i, 1)[0];
                            break;
                        }
                    }
                    $scope.currentEntry.hasChildren = $scope.currentEntry.children.length > 0;
                    //check if the removed item has no remaining broader concept. If so, move it to the top
                    //var relationPromise = getRelations(removedItem.id, isExport);
                    return getRelations(removedItem.id, isExport);
                }).then(function(data) {
                    if(data.broader.length === 0) {
                        removedItem.is_top_concept = true;
                        removedItem.reclevel = 0;
                        $scope.rdfTree[isExport].push(removedItem);
                    }
                });
            }
        } else if(type == 2) { //label
            if(subType == 1) { //pref
                lbl = $scope.informations.prefLabels[index];
                promise = removePrefLabel(lbl.id, treeName);
                promise.then(function() {
                    $scope.informations.prefLabels = [];
                    var nextPromise = getLabels($scope.informations.id, treeName);
                    nextPromise.then(function(data) {
                        setLabels(data, $scope.informations.prefLabels, null);
                    });
                });
            } else if(subType == 2) { //alt
                lbl = $scope.informations.altLabels[index];
                promise = removeAltLabel(lbl.id, treeName);
                promise.then(function() {
                    $scope.informations.altLabels = [];
                    var nextPromise = getLabels($scope.informations.id, treeName);
                    nextPromise.then(function(data) {
                        setLabels(data, null, $scope.informations.altLabels);
                    });
                });
            }
        }
    };

    $scope.addBroader = function($item, treeName) {
        console.log($item);
        console.log(treeName);
        mainService.addBroader($item, treeName);
    };

    $scope.addNarrower = function($item, treeName) {
        console.log($item);
        console.log(treeName);
    };

    $scope.addBroaderConcept = function(b, treeName) {
        console.log(b);
        var promise = updateConcept($scope.currentEntry.id, b.id, treeName);
        promise.then(function() {
            $scope.informations.broaderConcepts = [];
            return getRelations($scope.currentEntry.id, treeName);
        }).then(function(data) {
            publishNewChildrenToAllOccurrences(b.id, $scope.currentEntry, treeName);
            setRelations(data, $scope.informations.broaderConcepts, null);
        });
    };

    $scope.addNarrowerConcept = function(n, treeName) {
        var oldNarrowers;
        var promise;
        promise = getRelations($scope.currentEntry.id, treeName);
        promise.then(function(data) {
            if(n.isNew) {
                oldNarrowers = data.narrower;
                promise = addPromisedConcept(n.label, $scope.currentEntry, $scope.preferredLanguage, treeName);
            } else {
                promise = updateConcept(n.id, $scope.currentEntry.id, treeName);
            }
            return promise;
        }).then(function() {
            $scope.informations.narrowerConcepts = [];
            return getRelations($scope.currentEntry.id, treeName);
        }).then(function(data) {
            var inserted;
            if(n.isNew) {
                var narrowers = data.narrower;
                for(var i=0; i<narrowers.length; i++) {
                    var curr = narrowers[i];
                    var found = false;
                    for(var j=0; j<oldNarrowers.length; j++) {
                        var old = oldNarrowers[j];
                        if(old.id == curr.id) {
                            found = true;
                            break;
                        }
                    }
                    if(!found) {
                        inserted = curr;
                        break;
                    }

                    if(inserted) break;
                }
            } else {
                inserted = n;
            }
            publishNewChildrenToAllOccurrences($scope.currentEntry.id, inserted, treeName, false);
            setRelations(data, null, $scope.informations.narrowerConcepts);
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

    var expandElement = function(id, broader_id, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        if(typeof broader_id != 'undefined') formData.append('broader_id', broader_id);
        formData.append('tree', treeName);
        httpPostFactory('api/get/parents/all', formData, function(parents) {
            if(parents.length > 1) return;
            parents = parents[0];
            var self = parents[parents.length-1].narrower_id;
            parents.push({
                broader_id: self
            });
            $scope.$broadcast('angular-ui-tree:collapse-all');
            var t = angular.element(document.getElementById(treeName + '-tree')).scope();
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

    $scope.expandElement = function($item, $model, $label, $event, treeName) {
        expandElement($item.id, $item.broader_id, treeName);
    };

    var publishNewChildrenToAllOccurrences = function(id, newChildren, treeName, isDelete) {
        isDelete = isDelete || false;
        var formData = new FormData();
        formData.append('id', id);
        formData.append('tree', treeName);
        httpPostFactory('api/get/parents/all', formData, function(parents) {
            var t = angular.element(document.getElementById(treeName + '-tree')).scope();
            var nodesScope = t.$nodesScope;
            var children = nodesScope.childNodes();
            if(parents.length > 0) {
                angular.forEach(parents, function(parent, key) {
                    var self = parent[parent.length-1].narrower_id;
                    parent.push({
                        broader_id: self
                    });
                    recursiveChildrenPublisher(parent, children, newChildren, isDelete);
                });
            } else { //element with id `id` has no parents (= is_top_concept)
                var parent = [{
                    broader_id: id
                }];
                recursiveChildrenPublisher(parent, children, newChildren, isDelete);
            }
        });
    };

    var recursiveChildrenPublisher = function(parents, children, newChildren, isDelete) {
        recursiveChildrenPublisherHelper(parents, children, 0, newChildren, isDelete);
    };

    var recursiveChildrenPublisherHelper = function(parents, children, lvl, newChildren, isDelete) {
        for(var i=0; i<children.length; i++) {
            var currParent = parents[lvl];
            var currChild = children[i];
            if(currChild.$modelValue.id == currParent.broader_id) {
                if(lvl+1 == parents.length) {
                    if(isDelete) {
                        var siblings = currChild.$parent.parent.children;
                        for(var j=0; j<siblings.length; j++) {
                            var sibling = siblings[j];
                            if(sibling.id == newChildren.id) {
                                currChild.$parent.parent.children.splice(j, 1);
                                currChild.$parent.parent.hasChildren = currChild.$parent.parent.children.length > 0;
                                break;
                            }
                        }
                    } else {
                        newChildren.reclevel = lvl + 1;
                        newChildren.broader_id = currChild.$modelValue.id;
                        if(typeof currChild.$parent.parent.children == 'undefined') {
                            currChild.$parent.parent.children = [];
                        }
                        currChild.$parent.parent.children.push(newChildren);
                        currChild.$parent.parent.hasChildren = true;
                    }
                } else {
                    $timeout(function() {
                        //we have to expand the element if it is collapsed to get access to the childnodes
                        var wasCollapsed = currChild.collapsed;
                        if(wasCollapsed) currChild.$element[0].firstChild.childNodes[2].click();
                        recursiveChildrenPublisherHelper(parents, currChild.childNodes(), lvl+1, newChildren, isDelete);
                        //collapse it afterwards if we expanded it
                        if(wasCollapsed) currChild.$element[0].firstChild.childNodes[2].click();
                    }, 0, false);
                }
                break;
            }
        }
    };

    $scope.getSearchTree = function(searchString, treeName, appendSearchString) {
        return mainService.getSearchResults(searchString, treeName, appendSearchString);
    };

    $scope.export = function(treeName, id) {
        var blockMsg = 'Creating ' + treeName + '_thesaurus.rdf. Please wait.';
        mainService.disableUi(blockMsg);
        var promise = mainService.promisedExport(treeName, id);
        promise.then(function(data) {
            mainService.enableUi();
            var filename = treeName + '_thesaurus.rdf';
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
}]);

thesaurexApp.config(function(treeConfig) {
    treeConfig.defaultCollapsed = true;
});
