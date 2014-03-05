angular.module('sailsChat.ui',['ui.router']).directive('sailsChatNav', [function () {
	return {
		restrict: 'E',
		replace : true,
		templateUrl : '/templates/navbar.html',
		scope : {
			navLinks : '=',
			authenticated : '=',
			user: '=',
			connected: '='
		},
		link: function (scope, iElement, iAttrs) {
			console.log('linking')
		}
	};
}])
