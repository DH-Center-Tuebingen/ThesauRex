thesaurexApp.controller('treeCtrl', ['$scope', 'mainService', function($scope, mainService) {
    $scope.languages = mainService.languages;
    $scope.preferredLanguages = mainService.preferredLanguages;
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
        if(item.children.length === 0) {
            menu.push([
                '<i class="fa fa-fw fa-trash light red"></i> Delete',
                function($itemScope) {
                    mainService.deleteSingleElement($itemScope.$modelValue.id, treeName);
                },
                function($itemScope) {
                    return $itemScope.$modelValue.children.length === 0;
                }
            ]);
        } else {
            menu.push([
                '<i class="fa fa-fw fa-trash light red"></i> Delete&hellip;',
                [
                    ['<i class="fa fa-fw fa-eraser light red"></i> and remove descendants', function($itemScope) {
                        mainService.deleteElementWithChildren($itemScope.$modelValue.id, $itemScope.$modelValue.label, treeName);
                    }],
                    ['<i class="fa fa-fw fa-angle-up light red"></i> and move descendants one level up', function($itemScope) {
                        mainService.deleteElementAndMoveUp($itemScope.$modelValue.id, $itemScope.$modelValue.broader_id, treeName);
                    }]
                ],
                function($itemScope) {
                    return $itemScope.$modelValue.children.length > 0;
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
        mainService.setPrefLabelLanguage(index);
    };

    $scope.editPrefLabelEntry = function(label) {
        mainService.setEditLabelEntry(label);
    };

    $scope.editAltLabelEntry = function(label) {
        mainService.setEditLabelEntry(label);
    };

    $scope.resetPrefLabelEdit = function(label) {
        mainService.resetLabelEdit(label);
    };

    $scope.resetAltLabelEdit = function(label) {
        mainService.resetLabelEdit(label);
    };

    $scope.storePrefLabelEdit = function(label, treeName) {
        var cid = $scope.selectedElement.properties.id;
        mainService.updatePrefLabel(label, cid, treeName);
    };

    $scope.storeAltLabelEdit = function(label, treeName) {
        var cid = $scope.selectedElement.properties.id;
        mainService.updateAltLabel(label, cid, treeName);
    };

    $scope.addPrefLabel = function(labelText, language, treeName) {
        for(var i=0; i<$scope.selectedElement.labels.pref.length; i++) {
            var l = $scope.selectedElement.labels.pref[i];
            if(l.langId == $scope.preferredLanguages.pref.id) {
                var alertTitle = 'prefLabel vorhanden';
                var alertMsg = "Es ist bereits ein prefLabel für " + $scope.preferredLanguages.pref.langName + " vorhanden.";
                mainService.displayAlert(alertTitle, alertMsg);
                return;
            }
        }
        var cid = $scope.selectedElement.properties.id;
        mainService.addPrefLabel(labelText, language, cid, treeName);
    };

    $scope.addAltLabel = function(labelText, language, treeName) {
        var cid = $scope.selectedElement.properties.id;
        mainService.addAltLabel(labelText, language, cid, treeName);
    };

    $scope.deleteBroaderConcept = function($index, broader, treeName) {
        mainService.deleteBroaderConcept($index, broader, treeName);
    };

    $scope.deleteNarrowerConcept = function($index, narrower, treeName) {
        mainService.deleteNarrowerConcept($index, narrower, treeName);
    };

    $scope.deletePrefLabel = function($index, label, treeName) {
        mainService.deleteLabel(1, $index, label, treeName);
    };

    $scope.deleteAltLabel = function($index, label, treeName) {
        mainService.deleteLabel(2, $index, label, treeName);
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

    $scope.addBroader = function($item, treeName) {
        mainService.addBroader($item, treeName);
    };

    $scope.addNarrower = function($item, treeName) {
        mainService.addNarrower($item, treeName);
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
