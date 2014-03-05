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
    'addedTo' : function(ev,msg){
      console.log('added')
    },
    'removed' : function(ev,msg){
      console.log('removed')
    }
  }


  $rootScope.$on('sails:user',function(ev,data){
    console.log(ev,data)
    if(userEventHandlers[data.verb]) userEventHandlers[data.verb](ev,data);
  })




  return {
    getUserById : function(id){
       var _user = $q.defer();

       var user = $filter('findById')(userManager.users,id)

       if(user) _user.resolve(user)

      return _user.promise;
    },
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

.factory('Rooms',['$q','$filter','$rootScope','chatSocket','ChatUser','Users',function($q,$filter,$rootScope,chatSocket,ChatUser,Users){

  var chatRoomManager = { rooms : [] }

  var roomEventHandlers = {
    'created' : function(ev,msg){
      console.log('new room created',msg.data)
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
        chatRoomManager.rooms.splice(chatRoomManager.rooms.indexOf(room),1)
      }
    },
    'addedTo' : function(ev,msg){
      console.log('new user joined room',msg)
      var room = $filter('findById')(chatRoomManager.rooms,msg.id)
      
      if(room){
        var user = $filter('findById')(Users.users,msg.addedId)
        var userExists = $filter('findById')(room.users || [],user.id)

        if(!userExists){
          room.users.push(user)
        }
      }
    },
    'removed' : function(ev,msg){
      console.log('removed')
    },
    'messaged' : function(ev,msg){
      var room = $filter('findById')(chatRoomManager.rooms,msg.id)

      if(!room.messages) room.messages = [];

      room.messages.push(msg.data)

    }
  }


  $rootScope.$on('sails:room',function(ev,data){
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
    getRoomById : function(id){
      var _room = $q.defer();



       var room = $filter('findById')(chatRoomManager.rooms,id)
       console.log(room)
       if(room) _room.resolve(room)
        console.log('found room', room)
        return _room.promise;
    },
    createRoom : function(roomName){
      var _newRoom = $q.defer()
      if(roomName){
        chatSocket.post('/room',{name : roomName}).success(function(newRoom){
          chatSocket.get('/room/' + newRoom.id).success(function(room){
            chatRoomManager.rooms.push(room)
             _newRoom.resolve(room)
         

          })


            
          

        
        }).error(function(err){
          _newRoom.reject(err)
        })
      }
      return _newRoom.promise;
    },
    joinRoom : function(room){
      var _joinedRoom = $q.defer()
      chatSocket.post('/room/' + room.id + '/users',{id : ChatUser.user.id}).success(function(joined){
      

        _joinedRoom.resolve(room)
      })
      return _joinedRoom.promise;
    },
    chatrooms : chatRoomManager.rooms
  }


}]).factory('Messages',['$q','$filter','$rootScope','chatSocket','ChatUser','Users','Rooms',function($q,$filter,$rootScope,chatSocket,ChatUser,Users,Rooms){


  return {
    sendMessageToRoom : function(room,message){

      if(room && message){
        chatSocket.post('/chat/public',{room : room.id, msg : message})
      }


    },
    sendMessageToUser : function(user,message){
      if(user && message){
        chatSocket.post('/chat/private',{user : user.id, msg : message})
      }
    }
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
      return chatSocket.put('/user/' + user.id,user).success(function(user){
        _chatUser.name = user.name
        _chatUser.connected = true;
        return user;
      }).error(function(err){
        return err
      })
    },
    user : _chatUser
  }


}])