$(document).ready(function () {

  FE.onPageLoad();

  $('#main_connected').hide();
  $('#screen_game').hide();

  $('#button_main_ok, #button_main_edit').click(function() {
    var name;
    if ($("#set_name:visible").length) {
      name = $("#set_name").val();
    }
    else {
      name = $("#input_name").val();
    }
    FE.setName(name);
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
    if (event.keyCode === 13){
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
    FE.mainMenu();
  });

  $('#button_main_host').click(function() {
    var hosting = FE.hostMenu();
    if (hosting) {
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

  $('#list_join_clients').on('click', function() {
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
  });

  $('#button_join_refresh').click(function(){
    FE.joinRefresh();
  });

  $('#button_join_back').click(function(){
    FE.mainMenu();
  });

});
