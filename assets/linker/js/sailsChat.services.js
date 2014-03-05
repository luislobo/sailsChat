//wraps a sailsSocket with a service specific to the app
angular.module('sailsChat.services',['ui.router'])

.factory('chatSocket',['sailsSocketFactory','$rootScope',function(sailsSocketFactory,$rootScope){

  var chatSocket = sailsSocketFactory()

  //setup event forwards
  chatSocket.forward('hello')
  chatSocket.forward('connected')
  chatSocket.forward('user')
  chatSocket.forward('room')

  return chatSocket;


}])

.factory('Users',['$q','$filter','$rootScope','chatSocket','ChatUser',function($q,$filter,$rootScope,chatSocket,ChatUser){

  var userManager  = { users : []}


  var userEventHandlers = {
    'created' : function(ev,msg){
      userManager.users.push(msg.data)
    },
    'updated' : function(ev,msg){
      var user = $filter('findById')(userManager.users,msg.id)
      if(user){
        angular.forEach(msg.data,function(value,key){
          user[key] = value;
        })
      }
    },
    'destroyed' : function(ev,msg){
      var idx = userManager.users.indexOf(msg.data)
      userManager.users.splice(idx)
    },
    'addedTo' : function(data){
      console.log('added')
    },
    'removed' : function(data){
      console.log('removed')
    }
  }


  $rootScope.$on('sails:user',function(ev,data){
    console.log(ev,data)
    if(userEventHandlers[data.verb]) userEventHandlers[data.verb](ev,data);
  })




  return {
    getUsers : function(){
      var _users = $q.defer()
      chatSocket.get('/user').success(function(users){
        angular.forEach(users,function(user){
          userManager.users.push(user)
        })
        _users.resolve(userManager.users)
      })
      return _users.promise;
    },
    users : userManager.users
  }

}])

.factory('Rooms',['$q','$filter','$rootScope','chatSocket','ChatUser',function($q,$filter,$rootScope,chatSocket,ChatUser){

  var chatRoomManager = { rooms : [] }

  var roomEventHandlers = {
    'created' : function(ev,msg){
      chatRoomManager.rooms.push(msg.data)
    },
    'updated' : function(ev,msg){
      var room = $filter('findById')(chatRoomManager.rooms,msg.id)
      if(room){
        angular.forEach(msg.data,function(value,key){
          room[key] = value;
        })
      }
    },
    'destroyed' : function(ev,msg){
      var room = $filter('findById')(chatRoomManager.rooms,msg.id)
      if(room){
        chatRoomManager.rooms.splice(chatRoomManager.rooms.indexOf(room))
      }
    },
    'addedTo' : function(data){
      console.log('added')
    },
    'removed' : function(data){
      console.log('removed')
    }
  }


  $rootScope.$on('sails:room',function(ev,data){
    console.log(ev,data)
    if(roomEventHandlers[data.verb]) roomEventHandlers[data.verb](ev,data);
  })



  return {
    getRooms : function(){
      var _rooms = $q.defer();

      chatSocket.get('/room').success(function(rooms){
        angular.forEach(rooms,function(room){
          chatRoomManager.rooms.push(room)
        })
        _rooms.resolve(chatRoomManager.rooms)
      })

      return _rooms.promise;
    },
    createRoom : function(roomName){
      if(roomName){
        chatSocket.post('/room',{name : roomName}).success(function(newRoom){
          chatRoomManager.rooms.push(newRoom)

          return newRoom;
        }).error(function(err){ console.log(err) })
      }
    },
    joinRoom : function(room){
      if(room){
        console.log(ChatUser.user.id)
        chatSocket.post('/room/' + room.id + '/users',{id : ChatUser.user.id}).success(function(joined){
          console.log(joined)
        }).error(function(err){
          console.log(err)
        })
      }
    },
    chatrooms : chatRoomManager.rooms
  }


}])

.factory('ChatUser',['$q','chatSocket','$rootScope',function($q,chatSocket,$rootScope){

  var _chatUser = {
    name : 'not connected'
  }


  $rootScope.$on('sails:hello',function(ev,userdata){
    _chatUser.name = userdata.name;
    _chatUser.id = userdata.id;
  })


  return {
    connected : _chatUser.connected,
    update : function(user){
      console.log(user)
      return chatSocket.put('/user/' + user.id,user).success(function(user){
        _chatUser.name = user.name
        return user;
      }).error(function(err){
        return err
      })
    },
    user : _chatUser
  }


}])