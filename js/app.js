angular
  .module('mentions', [])
  .provider('mentionsConfig', mentionsConfig)
  .directive('mhMentions', mhMentions)
  .controller('MainCtrl', MainCtrl);

function mentionsConfig() {
  this.regex = /[^\s]*@\b[\.a-z0-9_-]+\b/gi;

  this.searchField = 'username';

  this.optionsHTML = `<ol ng-if="options.length">
    <li ng-repeat="user in options" ng-click="mention(user)" ng-class="{selected: $index === selectedIndex}">
      <strong>{{ user.username }}</strong>
      <em>{{ user.firstname }} {{ user.lastname }}</em>
    </li>
  </ol>`;

  this.$get = function() {
    return this;
  };
}

mhMentions.$inject = ['$compile', 'filterFilter', 'mentionsConfig'];
function mhMentions($compile, filterFilter, mentionsConfig) {
  return {
    restrict: 'A',
    scope: {
      body: '=ngModel',
      users: '=',
      mentions: '='
    },
    link($scope, $element) {
      $scope = Object.assign($scope, mentionsConfig);
      $scope.body = $scope.body || '';
      $scope.mentions = $scope.mentions || [];

      const $el = angular.element('<div class="mh-mentions" />');
      $el.append($scope.optionsHTML);
      $compile($el)($scope);
      $element.after($el);
      $el.append($element);


      // find index of the start of the last word
      function getIndexOfLastWord(str) {
        const lastSpace = str.lastIndexOf(' ') + 1;
        const lastNewline = str.lastIndexOf('\n') + 1;
        return lastSpace > lastNewline ? lastSpace : lastNewline;
      }

      // keyCodes use for selecting users (tab, enter, up, down)
      const specialKeyCodes = [9,13,38,40];

      // add mouseover events to user selection
      function addMouseEvents() {
        const $lis = $element.find('ol').children();

        $lis.on('mouseover', function() {
          $scope.selectedIndex = Array.from($lis).indexOf(this);
          $scope.$apply();
        });
      }

      $scope.$watch('body', (val) => {
        // find mentions in body text
        const usernames = (val.match($scope.regex)||[]).map(match => match.substr(1));
        $scope.mentions = filterFilter($scope.users, (user => {
          return usernames.some(username => username === user[$scope.searchField]);
        }));

        // find options based on current input after @ symbol
        let searchString = (val.substr(getIndexOfLastWord(val)).match($scope.regex) || [])[0];
        searchString = searchString ? searchString.substr(1) : null;

        $scope.options = filterFilter($scope.users, searchString);
        $scope.selectedIndex = 0;

        // allow user selection with mouse once <ol> has been populated
        $scope.$$postDigest(addMouseEvents);
      });

      // allow user selection with keyboard
      $element.on('keydown', (e) => {
        if($scope.options.length > 0) {
          if(specialKeyCodes.includes(e.keyCode)) e.preventDefault();

          if(e.keyCode === 9 || e.keyCode === 13) $scope.mention($scope.options[$scope.selectedIndex]);
          if(e.keyCode === 38) {
            $scope.selectedIndex -= 1;
            if($scope.selectedIndex < 0) $scope.selectedIndex = $scope.options.length - 1;
          }
          if(e.keyCode === 40) {
            $scope.selectedIndex += 1;
            if($scope.selectedIndex > $scope.options.length - 1) $scope.selectedIndex = 0;
          }

          if(specialKeyCodes.includes(e.keyCode)) $scope.$apply();
        }
      });

      // add user to body and re-focus on the textarea in case user was selected with the mouse
      $scope.mention = function mention(user) {
        $scope.body = $scope.body.substring(0, getIndexOfLastWord($scope.body));
        $scope.body += `@${user[$scope.searchField]} `;
        $element[0].focus();
      };

    }
  };
}

function MainCtrl() {
  const vm = this;
  vm.users = [
    { id: 1, username: 'mickyginger', firstname: 'Mike', lastname: 'Hayden' },
    { id: 2, username: 'eisacke', firstname: 'Emily', lastname: 'Isacke' },
    { id: 3, username: 'markyjangles', firstname: 'Marc', lastname: 'De Vois' },
    { id: 4, username: 'a.maugey', firstname: 'Angela', lastname: 'Maugey' },
    { id: 5, username: 'jackm117', firstname: 'Jack', lastname: 'May' },
    { id: 6, username: 'mikedegroot', firstname: 'Mike', lastname: 'De Groot' }
  ];
}