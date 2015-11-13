$(document).ready(function () {

  $('#button_main_ok').click(function() {
    $('#screen_main').hide();
    $('#main_connected').show();
  });

  $('#input_name').on('input',function(){
     if($(this).val().length > 0) {
       $('#button_main_ok').removeClass("disabled");
     }
     else {
       $('#button_main_ok').addClass("disabled");
     }
  });

  $('#modal_players').on('shown.bs.modal', function () {
    $('#button_players').focus()
  });

  $('#button_main_bot').click(function(){
    $('body').toggleClass("background-color");
    $('#main_connected').hide();
    $('#screen_game').show();
  });

});
