Dominion.Online = (function(Online, Incoming, Outgoing, Interface) {
    "use strict";

    var host;
    var socket;

    Online = function() {
        host = "ws://localhost:8080/Dominion/socket";

        if(!("WebSocket" in window)) {
		    $('#lobbies table').fadeOut("fast");
            $(".lobbymessage").text("Multiplayer is not supported on your browser.");
	    } else {
            connect();
        }
    };

    var connect = function() {
        try {
            socketInit();
            initReceiver();
        } catch(exception) {
            console.log('<p>Error ' + exception);
        }
    };

    var socketInit = function() {
        socket = new WebSocket(host);

        socket.onopen = function(){
            console.log('Socket Status: ' + socket.readyState + ' (open)');
            send({"type": "lobbies"});
        };

        socket.onclose = function(){
            console.log('Socket Status: ' + socket.readyState + ' (closed)');
        };

        addListeners();
    };

    var initReceiver = function() {
        socket.onmessage = function(msg){
            console.log('Received: ' + msg.data);
            var data = JSON.parse(msg.data);

            switch(data.type.toLowerCase()) {
                case "lobbies":
                    createLobbies(data.lobbies);
                    break;

                case "updatelobby":
                    updateLobbies(data.lobby);
                    break;

                case "addlobby":
                    addLobby(data.lobby);
                    break;

                case "dellobby":
                    delLobby(data.lobby);
                    break;

                case "gameinfo":
                    updateGameInfo(data.game);
                    break;

                case "chat":
                    updateLobbyChat(data);
                    break;
            }
        };
    };

    var sendChatMessage = function(message) {
        send({"type": "chat", "message": message});
    };

    var addLobby = function(lobby) {
        addLobbyToBrowser(lobby.id, lobby.name, lobby.players, lobby.canjoin);
    };

    var delLobby = function(dellobby) {
        delLobbyFromBrowser(dellobby.id);
    };

    var updateGameInfo = function(game) {
        $(".multiconfig").hide();
        $(".lobby-title").text(game.name);
        $("#lobby-players table tr:gt(0)").remove();
        for(var player in game.players) {
            $("#lobby-players table").append("<tr><td>" + game.players[player] + "</td></tr>");
        }

        var isHost = game.host;

        //convert from ALLCAPS RAGE to capitalized first letter
        var cardset = game.cardset.charAt(0).toUpperCase() + game.cardset.slice(1).toLowerCase();
        $("#lobby-settings").children().remove();

        if(isHost) {
            $("#lobby-settings").append(
                "<label for='change-lobby-name'>Change Lobby Name</label>" +
                "<input id='change-lobby-name' type='text'>" +
                "<button class='confirm-change-name'>Ok</button>" +
                "<label for='change-card-set'>Change Card Set</label>" +
                "<select name='change-card-set' id='change-card-set'>" +
                "<option value='firstgame' selected>First Game</option>" +
                "<option value='bigmoney'>Big Money</option>" +
                "<option value='interaction'>Interaction</option>" +
                "<option value='sizedistortion'>Size Distortion</option>" +
                "<option value='villagesquare'>Village Square</option>" +
                "</select>"
            );
            $('.confirm-change-name').on('click', function(e) {
                e.preventDefault();
                changeLobbyName($("#change-lobby-name").val().replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                e.stopImmediatePropagation();
            });
            $('.change-card-set').on('change', function(e) {
                e.preventDefault();
                changeCardSet($(this).val().replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                e.stopImmediatePropagation();
            });
        } else {
            $("#lobby-settings").append(
                "<h3>Card Set</h3>" +
                "<p>" + cardset + "</p>"
            );
        }

        $("#message-bar").keydown(function(e) {
            if(e.keyCode === 13 && $("#message-bar").val().length > 0) {
                e.preventDefault();
                sendChatMessage($('#message-bar').val().replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                $('#message-bar').val("");
            }
        });

        $('.leave-lobby').on('click', function(e) {
            e.preventDefault();
            send({"type": "leavelobby"});
            $('#lobby-screen').hide();
            $('#lobby-browser').show();
            e.stopImmediatePropagation();

        });

        $("#lobby-screen").show();
    };

    var updateLobbyChat = function(data) {
        $('#lobby-chat').append("<p><span class='username'>" + data.username + ":</span> " + data.message + "</p>");
        $('#lobby-chat').scrollTop($('#lobby-chat').height());
    };

    var createLobbies = function(lobbies) {
        console.log(lobbies);

        if(lobbies.length === 0) {
            $(".lobbymessage").text("There aren't any games right now, why not create one?");
            return;
        }

        for(var i = 0; i < lobbies.length; i++) {
            var lobby = lobbies[i];
            console.log(lobby);
            addLobbyToBrowser(lobby.id, lobby.name, lobby.players, lobby.canjoin);
        }
    };

    var updateLobbies = function(lobby) {
        updateLobbyBrowser(lobby.id, lobby.name, lobby.players, lobby.canjoin);
    };

    var createLobby = function(name, creator) {
        send({"type": "createlobby", "name": name, "displayname": creator});
    };

    var send = function(message) {
        console.log("sending:" + JSON.stringify(message));
        socket.send(JSON.stringify(message));
    };

    var closeConnection = function() {
        socket.close();
    };

    var addLobbyToBrowser = function(id, name, players, joinable) {
        var classes = joinable ? "lobby" : "lobby nojoin";
        var btnMsg = joinable ? "Join" : "In progress";

        $("#lobbies table").append(
            "<tr data-id='" + id + "'>" +
            "<td>" + name + "</td>" +
            "<td>" + players + "</td>" +
            "<td><button data-id='" + id + "' class='" + classes + "'>" + btnMsg + "</button></td>" +
            "</tr>"
        );

        $('#lobbies button').on('click', function(e) {
            e.preventDefault();
            var lobbyId = $(this).attr('data-id');
            var username;
            $(".multiconfig").hide();
            $("#join-lobby").show();
            $('.join-lobby').on('click', function(e) {
                e.preventDefault();
                username = $('#connecting-username').val().replace(/</g, "&lt;").replace(/>/g, "&gt;");
                joinLobby(lobbyId, username);
                e.stopImmediatePropagation();
            });
            e.stopImmediatePropagation();
        });
    };

    var joinLobby = function(lobbyId, name) {
        send({"type": "joinlobby", "id": lobbyId, "name": name});
    };

    var updateLobbyBrowser = function(id, name, players, joinable) {
        $("#lobbies table tr").each(function () {
            if($(this).attr("data-id") === id) {
                $(this).eq(0).val(name).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                $(this).eq(1).val(players).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                $(this).eq(2).toggleClass("nojoin", !joinable);
            }
        });
    };

    var changeLobbyName = function (newName) {
        send({"type": "changelobbyname", "name": newName});
    };

    var changeCardSet = function (cardSet) {
        send({"type": "setcardset", "cardset": cardSet});
    };

    var clearLobbies = function() {
        $("#lobbies table tr").each(function() {
            if($(this).attr("data-id")) {
                $(this).remove();
            }
        });
    };

    var delLobbyFromBrowser = function(uuid) {
        $("#lobbies table tr").each(function() {
            if($(this).attr("data-id") && $(this).data("id").equals(uuid)) {
                $(this).remove();
            }
        });
    };

    var submitLobby = function() {
        var name = $("#create-lobby-name").val().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var username = $("#create-lobby-username").val().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        console.log(name, username);
        createLobby(name, username);
    };

    var addListeners = function() {
        $(".show-lobby-creator").on('click', function(e) {
            e.preventDefault();
            $('.multiconfig').hide();
            $("#lobby-creator").show();
            e.stopImmediatePropagation();
        });
        $(".show-lobby-browser").on('click', function(e) {
            e.preventDefault();
            $('.multiconfig').hide();
            $("#lobby-browser").show();
            e.stopImmediatePropagation();
        });
        $(".create-lobby").on('click', submitLobby);
    };

    return Online;
}(Dominion.Online || {}));
