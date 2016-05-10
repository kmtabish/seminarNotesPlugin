'use strict';
(function (angular, buildfire) {
  angular
    .module('seminarNotesPluginContent')
    .controller('ContentItemCtrl', ['$scope', '$routeParams', 'Buildfire', 'DataStore', 'TAG_NAMES', '$location', '$timeout', 'RankOfLastItem',
      function ($scope, $routeParams, Buildfire, DataStore, TAG_NAMES, $location, $timeout, RankOfLastItem) {
        var ContentItem = this;
        var _rankOfLastItem = RankOfLastItem.getRank();
        var _data = {
          "title": "",
          "summary": "",
          "listImage": "",
          "createdOn": "",
          "publishedOn": "",
          "links": [],
          "description": "",
          "carouselImages": [],
          "rank": _rankOfLastItem
        };

        ContentItem.item = {
          data: angular.copy(_data)
        };

        ContentItem.isUpdating = false;
        ContentItem.isNewItemInserted = false;
        ContentItem.unchangedData = true;

        ContentItem.isValidItem = function (item) {
          return item.title;
        };

        ContentItem.descriptionWYSIWYGOptions = {
          plugins: 'advlist autolink link lists charmap print preview',
          skin: 'lightgray',
          trusted: true,
          theme: 'modern'
        };
        console.log("-------------------------------------------------");
        // create a new instance of the buildfire carousel editor
        /*var editor = new Buildfire.components.carousel.editor("#carousel2");
         console.log(editor);

         // this method will be called when a new item added to the list
         editor.onAddItems = function (items) {
         if (!ContentItem.item.data.carouselImages)
         ContentItem.item.data.carouselImages = [];
         ContentItem.item.data.carouselImages.push.apply(ContentItem.item.data.carouselImages, items);
         $scope.$digest();
         };
         // this method will be called when an item deleted from the list
         editor.onDeleteItem = function (item, index) {
         ContentItem.item.data.carouselImages.splice(index, 1);
         $scope.$digest();
         };
         // this method will be called when you edit item details
         editor.onItemChange = function (item, index) {
         ContentItem.item.data.carouselImages.splice(index, 1, item);
         $scope.$digest();
         };
         // this method will be called when you change the order of items
         editor.onOrderChange = function (item, oldIndex, newIndex) {
         var items = ContentItem.item.data.carouselImages,
         tmp = items[oldIndex],
         i;

         if (oldIndex < newIndex) {
         for (i = oldIndex + 1; i <= newIndex; i++) {
         items[i - 1] = items[i];
         }
         } else {
         for (i = oldIndex - 1; i >= newIndex; i--) {
         items[i + 1] = items[i];
         }
         }
         items[newIndex] = tmp;

         ContentItem.item.data.carouselImages = items;
         $scope.$digest();
         };*/

        console.log("===================================================");

        /**
         * link and sortable options
         */
        var linkOptions = {"icon": "true"};

        ContentItem.linksSortableOptions = {
          handle: '> .cursor-grab'
        };

        /* Build fire thumbnail component to add thumbnail image*/
        /*var listImage = new Buildfire.components.images.thumbnail("#listImage", {
         title: "List Image",
         dimensionsLabel: "600x280"
         });

         listImage.onChange = function (url) {
         ContentItem.item.data.listImage = url;
         if (!$scope.$$phase && !$scope.$root.$$phase) {
         $scope.$apply();
         }
         };

         listImage.onDelete = function (url) {
         ContentItem.item.data.listImage = "";
         if (!$scope.$$phase && !$scope.$root.$$phase) {
         $scope.$apply();
         }
         };*/

        var updateMasterItem = function (item) {
          ContentItem.masterItem = angular.copy(item);
        };

        var isUnchanged = function (item) {
          return angular.equals(item, ContentItem.masterItem);
        };

        ContentItem.addNewItem = function () {
          ContentItem.isNewItemInserted = true;
          ContentItem.item.data.dateCreated = +new Date();
          localStorage.setItem('pluginLoadedFirst', true);

          var successItem = function (result) {
            console.log("Inserted", result.id);
            ContentItem.isUpdating = false;
            ContentItem.item.id = result.id;
            _data.dateCreated = ContentItem.item.data.dateCreated;
            updateMasterItem(ContentItem.item);
            ContentItem.item.data.deepLinkUrl = Buildfire.deeplink.createLink({id: result.id});
            if (ContentItem.item.id) {
              buildfire.messaging.sendMessageToWidget({
                id: ContentItem.item.id,
                type: 'AddNewItem'
              });
            }
          }, errorItem = function () {
            ContentItem.isNewItemInserted = false;
            return console.error('There was a problem saving your data');
          };
          DataStore.insert(ContentItem.item.data, TAG_NAMES.SEMINAR_ITEMS).then(successItem, errorItem);
        };

        ContentItem.updateItemData = function () {
          DataStore.update(ContentItem.item.id, ContentItem.item.data, TAG_NAMES.SEMINAR_ITEMS, function (err) {
            ContentItem.isUpdating = false;
            if (err)
              return console.error('There was a problem saving your data');
          })
        };

        ContentItem.getItem = function (id) {
          var successItem = function (result) {
            ContentItem.item = result;
            if (ContentItem.item.data.listImage) {
              listImage.loadbackground(ContentItem.item.data.listImage);
            }
            if (!ContentItem.item.data.carouselImages)
              editor.loadItems([]);
            else
              editor.loadItems(ContentItem.item.data.carouselImages);
            _data.dateCreated = result.data.dateCreated;
            updateMasterItem(ContentItem.item);
          }, errorItem = function () {
            throw console.error('There was a problem fetching your data', err);
          };
          DataStore.getById(id, TAG_NAMES.SEMINAR_ITEMS).then(successItem, errorItem);
        };

        /**
         * Add dynamic link
         */

        ContentItem.addLink = function () {
          var options = {showIcons: false};
          var callback = function (error, result) {
            if (error) {
              return console.error('Error:', error);
            }
            if (!ContentItem.item.data.links)
              ContentItem.item.data.links = [];
            if (result.title)
              ContentItem.item.data.links.push(result);
            $scope.$digest();
          };
          Buildfire.actionItems.showDialog(null, options, callback);
        };

        /**
         * Remove dynamic link
         */

        ContentItem.removeLink = function (index) {
          if (ContentItem.item.data && ContentItem.item.data.links) {
            ContentItem.item.data.links.splice(index, 1);
          }
        };

        /**
         * Edit dynamic link
         */

        ContentItem.editLink = function (link, index) {
          Buildfire.actionItems.showDialog(link, linkOptions, function editLinkCallback(error, result) {
            if (error) {
              return console.error('Error:', error);
            }
            if (!ContentItem.item.data.links) {
              ContentItem.item.data.links = [];
            }
            if (result === null) {
              return console.error('Error:Can not save data, Null record found.');
            }
            ContentItem.item.data.links.splice(index, 1, result);
            $scope.$digest();
          });
        };

        ContentItem.gotToHome = function () {
            buildfire.messaging.sendMessageToWidget({})
          $location.path('#/');
        };

        if ($routeParams.id) {
          ContentItem.getItem($routeParams.id);
        }

        var tmrDelayForItem = null;

        var updateItemsWithDelay = function (item) {
          clearTimeout(tmrDelayForItem);
          ContentItem.isUpdating = false;
          ContentItem.unchangedData = angular.equals(_data, ContentItem.item.data);

          ContentItem.isItemValid = ContentItem.isValidItem(ContentItem.item.data);
          if (!ContentItem.isUpdating && !isUnchanged(ContentItem.item) && ContentItem.isItemValid) {
            tmrDelayForItem = setTimeout(function () {
              if (item.id) {
                ContentItem.updateItemData();
              } else if (!ContentItem.isNewItemInserted) {
                ContentItem.addNewItem();
              }
            }, 300);
          }
        };

        $scope.$watch(function () {
          return ContentItem.item;
        }, updateItemsWithDelay, true);

      }]);
})(window.angular, window.buildfire);