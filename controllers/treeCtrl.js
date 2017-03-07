thesaurexApp.controller('treeCtrl', ['$scope', 'httpPostFactory', 'mainService', '$timeout', function($scope, httpPostFactory, mainService, $timeout) {
    $scope.languages = mainService.languages;
    $scope.preferredLanguages = mainService.preferredLanguages;
    $scope.masterTree = mainService.tree.master;
    $scope.projectTree = mainService.tree.project;
    $scope.selectedElement = mainService.selectedElement;
    $scope.blockedUi = mainService.blockedUi;

    $scope.expandedElement = null;

    $scope.enableDragDrop = false;
    $scope.enableEditing = false;
    $scope.enableExportDragDrop = false;

    $scope.treeOptions = {
        dropped: function(event) {
            mainService.dropped(event, false);
        }
    };

    $scope.exportTreeOptions = {
        dropped: function(event) {
            mainService.dropped(event, true);
        }
    };

    $scope.addConcept = function(name, concept, lang, treeName) {
        mainService.addConcept(name, concept, lang, treeName);
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
                    mainService.deleteSingleElement($itemScope.$modelValue, treeName);
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
                        mainService.deleteElementWithChildren($itemScope.$modelValue, $itemScope.$modelValue.label, treeName);
                    }],
                    ['<i class="fa fa-fw fa-angle-up light red"></i> and move descendants one level up', function($itemScope) {
                        mainService.deleteElementAndMoveUp($itemScope.$modelValue, $itemScope.$modelValue.broader_id, treeName);
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

    $scope.getLanguageCode = mainService.getLanguageCode;

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
        mainService.setAltLabelLanguage(index);
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
                var alertTitle = 'Problem with Preferred Label';
                var alertMsg = "For the language <i>" + $scope.preferredLanguages.pref.langName + "</i> there is already a preferred label defined.";
                mainService.displayAlert(alertTitle, alertMsg);
                return;
            }
        }
        var cid = $scope.selectedElement.properties.id;
        mainService.addPrefLabel(labelText, language, cid, treeName);
        $scope.newPrefLabelText.text = '';
    };

    $scope.addAltLabel = function(labelText, language, treeName) {
        var cid = $scope.selectedElement.properties.id;
        mainService.addAltLabel(labelText, language, cid, treeName);
        $scope.newAltLabelText.text = '';
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

    $scope.addBroader = function($item, treeName) {
        mainService.addBroader($item, treeName);
        $scope.broaderSearch = '';
    };

    $scope.addNarrower = function($item, treeName) {
        mainService.addNarrower($item, treeName);
        $scope.narrowerSearch = '';
    };

    angular.element(document).ready(function () {
        $scope.getWindowSize();
    });

    var expandElement = function(id, broader_id, treeName) {
        var formData = new FormData();
        formData.append('id', id);
        if(typeof broader_id != 'undefined') formData.append('broader_id', broader_id);
        formData.append('treeName', treeName);
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
            recursiveExpansion(parents, children, treeName);
        });
    };

    var recursiveExpansion = function(parents, children, treeName) {
        recursiveExpansionHelper(parents, children, 0, treeName);
    };

    var recursiveExpansionHelper = function(parents, children, lvl, treeName) {
        for(var i=0; i<children.length; i++) {
            var currParent = parents[lvl];
            var currChild = children[i];
            if(currChild.$modelValue.id == currParent.broader_id) {
                if(lvl+1 == parents.length) {
                    //$scope.displayInformation(currChild.$modelValue);
                    mainService.setSelectedElement(currChild.$modelValue, treeName);
                    $scope.expandedElement = currChild.$element[0];
                } else {
                    //currChild.expand();
                    // calling expand() on currChild should be enough, but currChild.childNodes() then returns an array with undefined values.
                    //Thus we use this "simple" DOM-based method to simulate a click on the element and toggle it.
                    //This only works because we broadcast the collapse-all event beforehand.
                    $timeout(function() {
                        currChild.$element[0].firstChild.childNodes[2].click();
                        recursiveExpansionHelper(parents, currChild.childNodes(), lvl+1, treeName);
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
        if(!promise) {
            mainService.enableUi();
            console.log("Something bad happened to your export...");
        } else {
            promise.then(function(data) {
                mainService.enableUi();
                var filename = treeName + '_thesaurus.rdf';
                createDownloadFile(data, filename);
            });
        }
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
