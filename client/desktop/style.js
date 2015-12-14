(function($) {
    $.each(['show','hide'], function(i, val) {
        var _org = $.fn[val];
        $.fn[val] = function() {
            _org.apply(this, arguments);
            this.trigger(val);
        };
    });
})(jQuery);

$(document).ready(function () {

    FE.onPageLoad();

    $('#main_connected').hide();
    $('#screen_game').hide();
    $('#input_name').focus();

    $('#button_main_ok').click(function() {
        var name = $("#input_name").val();
        $('#button_main_ok').addClass("disabled");
        FE.requestAuthentication(name);
    });

    $('#button_main_edit').click(function() {
        var name = $("#set_name").val();
        FE.setName(name);
    });

    $('#input_name').on("keypress", function(event) {
        if (event.keyCode === 13 && $("#input_name").val().length > 0){
            $('#button_main_ok').trigger('click');
        }
    });

    $('#button_main_bot').click(function(){
        $('body').toggleClass("background-color");
        $('#main_connected').hide();
        $('#screen_game').show();
        FE.joinBot();
    });

    function startHosting() {
        $('#button_main_join').hide();
        $('#button_main_bot').prop('disabled', true);
        $('#button_main_host').removeClass('width-45');
        $('#button_main_host').addClass('width-full');
        $('#button_main_host').text('Stop Hosting');
    }

    function stopHosting() {
        $('#button_main_join').show();
        $('#button_main_bot').prop('disabled', false);
        $('#button_main_host').addClass('width-45');
        $('#button_main_host').removeClass('width-full');
        $('#button_main_host').text('Host');
    }

    $('#game_exit_button').click(function(){
        $('#dialog-yesno').show();
        $('#dialog-yesno-text').text("Surrender and go back to the lobby?");
        $('#dialog-yesno-yes').click(function() {
            $('#screen_game').hide();
            $('#main_connected').show();
            $('body').toggleClass("background-color");
            stopHosting();
            FE.mainMenu();
            $('#dialog-yesno').hide();
        });
    });

    $('#back_to_lobby_button').click(function(){
        $('#screen_game').hide();
        $('#main_connected').show();
        $('body').toggleClass("background-color");

        stopHosting();
        FE.mainMenu();
    });

    $('#button_main_host').click(function() {
    var hosting = FE.hostMenu();
    if (hosting) {
        startHosting();
    } else {
        stopHosting();
    }
    });

    $('#button_main_join').click(function() {
        $("#dialog-join").show();
    });

    $('#button_players').click(function() {
        $("#dialog-player-list").show();
    });

    $('#button_main_send, #button_game_send').click(function(){
        var input;
        if ($("#input_game_chat:visible").length) {
            input = $("#input_game_chat");
        } else {
            input = $("#input_main_chat");
        }
        var message = input.val();
        if (message != "") {
            input.val("");
            FE.sendChatMessage(message);
        }
    });

    $('#input_game_chat').on("keypress", function(event) {
        if (event.keyCode === 13){
            $('#button_game_send').trigger('click');
        }
    });

    $('#input_main_chat').on("keypress", function(event) {
        if (event.keyCode === 13){
            $('#button_main_send').trigger('click');
        }
    });

    $('#game_chat_button').click(function() {
      $('#game_chat_button').removeClass("icon-chat-notify");
      $('#game_chat_button').addClass("icon-chat");
      $('#dialog-chat').show();
    });

    $('#modal_chat').on('shown.bs.modal', function() {
        $('#input_game_chat').focus();
        $('#game_chat_container').scrollTop($('#game_chat_container')[0].scrollHeight)
    })

    $('.dialog').hide();

    $('.dialog-closer').on('click', function() {
        $('.dialog').hide();
    });

    function fitElements() {
        var twoBorders = 2; // TODO: get this from css
        var marginS = 10; // TODO: get this from css
        $('#set_name').width($('#main_connected').width() - $('#button_main_edit').outerWidth(true) - twoBorders);
        $('#input_main_chat').width($('#main_connected').width() - $('#button_main_send').outerWidth(true) - twoBorders - 1);
        $('#main_chat_container').height($('#main_connected').height() - $('#main_connected_toolbar').height() - $('#main_connected_chatbar').height() - marginS - 3*twoBorders);
        $('#game_chat_container').height($('#dialog_chat_window').height() - $('#dialog_chat_titlebar').height() - $('#dialog_chat_chatbar').height() - marginS - 2*twoBorders);
    }

    $(window).on('resize', function() {
        fitElements();
    });

    $('.menu-screen, .dialog').on('show', function () {
        fitElements();
    });
});

var PAINTER = (function () {

    var getSafeString = function (s) {
        var lt = /</g,
        gt = />/g,
        ap = /'/g,
        ic = /"/g;
        return s.replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;");
    }

    var addMessageSpan = function (divId, message) {
        if ($(divId).text() != "")
            $(divId).append("\n");
        $(divId).append(message);
    }

    var scrollToBottom = function (id) {
        $(id).scrollTop($(id)[0].scrollHeight)
    }

    return {
        repaintClientsLists: function (clientList) {
            $('#table_main_players').find("tr").remove();
            for (var i = 0; i < clientList.length; i++) {
                $('#table_main_players').append(
                    '<tr>' +
                        '<td>' + getSafeString(clientList[i].name) + '</td>' +
                        '<td>'+ clientList[i].state +'</td>' +
                    '</tr>'
                );
            }

            $('#table_main_join').find("tr").remove();
            for (var i = 0; i < clientList.length; i++) {
                if (clientList[i].state == "hosting") {
                    $('#table_main_join').append(
                        '<tr>' +
                            '<td>' + getSafeString(clientList[i].name) + '</td>' +
                            '<td><button class="button button-join default-rect text-m" value='+ clientList[i].id +'>Join</button></td>' +
                        '</tr>'
                    );
                }
            }

            $('.button-join').click(function() {
                FE.joinClient(this.value);
                $('.dialog').hide();
                $('#main_connected').hide();
                $('#screen_game').show();
                $('body').toggleClass("background-color");
            });
        },
        enableConnection: function() {
            $('#button_main_ok').removeClass("disabled");
        },
        setPlayerName: function() {
            var name = $('#input_name').val();
            $('#screen_main').hide();
            $('#main_connected').show();
            $('#set_name').val(name);
        },
        displayErrorMessage: function(reason) {
            $("#dialog-info").show();
            $("#dialog-info-text").text(reason);
            $('#dialog-info-ok').click(function(){
                $("#dialog-info").hide();
            });
        },
        printMessage: function(name, message) {
            if (name) {
                message = "[" + getSafeString(name) + "]: " + getSafeString(message);
                if ($('#screen_game:visible').length) {
                    if(!$('#dialog-chat:visible').length) {
                        $('#game_chat_button').removeClass("icon-chat");
                        $('#game_chat_button').addClass("icon-chat-notify");
                    }
                }
            }
            addMessageSpan("#game_chat_container", message);
            scrollToBottom("#game_chat_container");
            addMessageSpan("#main_chat_container", message);
            scrollToBottom("#main_chat_container");
        },
        startGame: function() {
            $('#main_connected').hide();
            $('#screen_game').show();
            $('body').toggleClass("background-color");
        },
        endGame: function(message) {
            $("#dialog-info").show();
            $("#dialog-info-text").text(message);
            $('#dialog-info-ok').click(function(){
                $('#screen_game').hide();
                $('#main_connected').show();
                $('body').toggleClass("background-color");
                $('#button_main_join').show();
                $('#button_main_bot').prop('disabled', false);
                $('#button_main_host').addClass('width-45');
                $('#button_main_host').removeClass('width-full');
                $('#button_main_host').text('Host');
                FE.mainMenu();
                $("#dialog-info").hide();
            });
        },
        playSoundChecked: function() {
            return $('#checkbox_main_playsound').is(':checked');
        }
    }
}());
