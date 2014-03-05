angular.module('sailsChat.controllers',['ui.router','sailsChat.services','sailsChat.ui'])

.controller('signInController', ['$scope','$state', 'ChatUser',function ($scope,$state,ChatUser) {
	console.log('wee')
	$scope.chatUser = ChatUser.user;

	$scope.signIn = function(username){
		console.log(username)
		$scope.chatUser.name = username;
		ChatUser.update($scope.chatUser).success(function(){
			$state.go('app.chat')
		});
	}

}])

.controller('appController',['$scope','ChatUser','Rooms','Users',function($scope,ChatUser,Rooms,Users){

  $scope.chatUser = ChatUser.user;



}])

.controller('chatController',['$scope','ChatUser','Rooms','Users',function($scope,ChatUser,Rooms,Users){

	$scope.createNewRoom = Rooms.createRoom;

  $scope.joinRoom = Rooms.joinRoom;
  
  //load rooms and users
  Rooms.getRooms().then(function(rooms){
    $scope.rooms = Rooms.chatrooms;
  })

  Users.getUsers().then(function(users){
    $scope.users = users
  });


}])

