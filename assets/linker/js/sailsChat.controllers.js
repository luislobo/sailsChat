angular.module('sailsChat.controllers',['ui.router','sailsChat.services','sailsChat.ui'])

.controller('signInController', ['$scope','$state', 'ChatUser',function($scope,$state,ChatUser) {

	$scope.chatUser = ChatUser.user;

	$scope.signIn = function(username){
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
	$scope.joinRoom = Rooms.joinRoom;

	Rooms.getRooms().then(function(rooms){
		$scope.rooms = Rooms.chatrooms;
	})

	Users.getUsers().then(function(users){
		$scope.users = users
	});
}])

.controller('newChatController',['$scope','$state','ChatUser','Rooms',function($scope,$state,ChatUser,Rooms){
	$scope.createNewRoom = function(roomName){
		Rooms.createRoom(roomName).then(function(room){
			if(room){
				Rooms.joinRoom(room).then(function(joined){
					console.log(joined)
					if(joined){
						$state.go('app.chat.room',{ id : joined.id })
					}
				})
			}
		})
	}

}])

.controller('chatRoomController', ['$scope', '$state','$filter','ChatUser', 'Users', 'Rooms','Messages', function($scope,$state,$filter,ChatUser,Users,Rooms,Messages) {
	
	//grab room id from state params
	var roomId = $state.params.id;

	Rooms.getRoomById(roomId).then(function(room){
		var joined = $filter('findById')(room.users,ChatUser.user.id)

		if(!joined){
			Rooms.joinRoom(room).then(function(joined){
				$scope.room = joined;
			})
		}
		else{
			$scope.room = room;
		}
	})

	$scope.sendMessage = function(message){
		Rooms.getRoomById(roomId).then(function(room){

			Messages.sendMessageToRoom($scope.room,message)

			if(!room.messages) room.messages = []

			
		})
		
	}

}])

