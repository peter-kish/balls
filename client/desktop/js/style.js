$(document).ready(function () {

  FE.onPageLoad();

  $('#button_main_ok, #button_main_edit').click(function() {
    if (!$(this).hasClass('disabled')) {
      var name;
      if ($("#set_name:visible").length) {
        name = $("#set_name").val();
      }
      else {
        name = $("#input_name").val();
      }
      FE.setName(name);
    }
  });

  $('#input_name').on('input',function(){
     if($(this).val().length > 0) {
       $('#button_main_ok').removeClass("disabled");
     }
     else {
       $('#button_main_ok').addClass("disabled");
     }
  })
  .on("keypress", function(event) {
    if (event.keyCode === 13 && $("#input_name").val().length > 0){
      $('#button_main_ok').trigger('click');
    }
  });

  $('#modal_players').on('shown.bs.modal', function () {
    $('#button_players').focus()
  });

  $('#button_main_bot').click(function(){
    $('body').toggleClass("background-color");
    $('#main_connected').hide();
    $('#screen_game').show();
    FE.joinBot();
  });

  $('#exit_game_button').click(function(){
    $('#screen_game').hide();
    $('#main_connected').show();
    $('body').toggleClass("background-color");
    $('#game_chat_container').text('');
    FE.mainMenu();
    $('#button_main_join').prop('disabled', false);
    $('#button_main_bot').prop('disabled', false);
    $('#button_main_host').text('Host');
  });

  $('#button_main_host').click(function() {
    var hosting = FE.hostMenu();
    if (!hosting) {
      $('#button_main_join').prop('disabled', true);
      $('#button_main_bot').prop('disabled', true);
      $('#button_main_host').text('Stop Hosting');
    } else {
      $('#button_main_join').prop('disabled', false);
      $('#button_main_bot').prop('disabled', false);
      $('#button_main_host').text('Host');
    }
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

  $('#button_main_join').click(function(){
    $('#button_join_join').prop('disabled', true);
  });

  var selectedPlayer;

  $('#list_join_clients').on('change', function() {
    selectedPlayer = this.value;
    if(this.value) {
      $('#button_join_join').prop('disabled', false);
    }
    else {
      $('#button_join_join').prop('disabled', true);
    }
  });

  $('#button_join_join').click(function() {
    FE.joinClient(selectedPlayer);
    $('#main_connected').hide();
    $('#screen_game').show();
    $('body').toggleClass("background-color");
  });

  $('#button_join_refresh').click(function(){
    FE.joinRefresh();
  });

  $('#button_join_back').click(function(){
    FE.mainMenu();
    $('#button_main_join').prop('disabled', false);
    $('#button_main_bot').prop('disabled', false);
    $('#button_main_host').text('Host');
  });

  $('#modal_chat_init_button').click(function() {
    $(this).css('color', 'white');
    $(this).css('background-color', 'blue');
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
      $('#list_join_clients').find('option').remove();
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].state == "hosting") {
          $('#list_join_clients').append($("<option></option>")
                                  .attr("value",clientList[i].id)
                                  .text(getSafeString(clientList[i].name)));
        }
      }

      $('#table_main_players').find("tr").remove();
      for (var i = 0; i < clientList.length; i++) {
        $('#table_main_players').append(
          '<tr>' +
            '<td>(' + (i+1) + ')</td>' +
            '<td>' + getSafeString(clientList[i].name) + '</td>' +
            '<td>['+ clientList[i].state +']</td>' +
          '</tr>'
        );
      }
    },
    setPlayerName: function() {
      var name = $('#input_name').val();
      $('#screen_main').hide();
      $('#main_connected').show();
      $('#set_name').val(name);
    },
    displayErrorMessage: function(reason) {
      $("#error_login").text(reason);
    },
    printMessage: function(name, message) {

      if ($('#screen_game:visible').length) {
        if (name == null) {
          $("#player_left_game_message").text(message);
          $('#player_left_game').modal('show');
        }
        else {
          message = "[" + getSafeString(name) + "]: " + getSafeString(message);
          addMessageSpan("#game_chat_container", message);
          scrollToBottom("#game_chat_container");
          if ($('#set_name').val() != name) {
            $('#modal_chat_init_button').css('color', 'red');
            $('#modal_chat_init_button').css('background-color', 'whitesmoke');
          }
        }
      }
      else {
          addMessageSpan("#main_chat_container", message);
          scrollToBottom("#main_chat_container");
      }

    },
    startGame: function() {
      $('#main_connected').hide();
      $('#screen_game').show();
      $('body').toggleClass("background-color");
    }

  }
}());
