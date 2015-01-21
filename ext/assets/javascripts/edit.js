// Generated by CoffeeScript 1.8.0
(function() {
  var Edit, Trello;

  Edit = (function() {
    var annotate_canvas, append_canvas_html, append_errors, bind_trello, blob, build_trello_boards, build_trello_labels, build_trello_lists, canvas_html, draw_image_to_canvas, get_selected_labels, log_in_to_trello, page_info, save_canvas, save_preferences_to_storage, submit_trello_card, update_select_field, validate_card_info;

    function Edit() {}

    page_info = "";

    Edit.prepare_page_info = function(page_information) {
      var name, value, _results;
      page_info += "\n\n----------\n\n";
      _results = [];
      for (name in page_information) {
        value = page_information[name];
        _results.push(page_info += "" + name + ": " + value + "\n");
      }
      return _results;
    };

    Edit.screenshot = function(type, image_url, image_info) {
      var $image;
      if (image_info == null) {
        image_info = {};
      }
      $image = new Image;
      $image.src = image_url;
      return $image.onload = function() {
        return jQuery(function() {
          var $image_canvas, context;
          append_canvas_html(type, image_url, image_info, $image);
          $image_canvas = $("#canvas-image");
          context = $image_canvas[0].getContext('2d');
          draw_image_to_canvas(type, $image, image_info, context);
          return annotate_canvas($("#canvas-annotations"));
        });
      };
    };

    draw_image_to_canvas = function(type, $image, image_info, context) {
      if (image_info == null) {
        image_info = {};
      }
      if (type === "visible") {
        return context.drawImage($image, 0, 0);
      } else if (type === "partial") {
        return context.drawImage($image, image_info.x, image_info.y, image_info.w, image_info.h, 0, 0, image_info.w, image_info.h);
      }
    };

    append_canvas_html = function(type, image_url, image_info, $image) {
      if (image_info == null) {
        image_info = {};
      }
      if (type === "visible") {
        return $("#editor-container").append(canvas_html(image_url, $image.naturalWidth, $image.naturalHeight, 0, 0));
      } else if (type === "partial") {
        return $("#editor-container").append(canvas_html(image_url, image_info.w, image_info.h, image_info.x, image_info.y));
      }
    };

    canvas_html = function(image_url, w, h, x, y) {
      return "<div id=\"editor\">\n  <canvas id=\"canvas-image\" width=\"" + w + "\" height=\"" + h + "\"></canvas>\n  <canvas id=\"canvas-annotations\" width=\"" + w + "\" height=\"" + h + "\"></canvas>\n</div>\n\n<style>\n  #editor {\n    width      : " + w + "px;\n    height     : " + h + "px;\n    background : url(" + image_url + ") no-repeat -" + x + "px -" + y + "px;\n  }\n\n  #editor-container {\n    min-width: " + (w + 100) + "px;\n  }\n</style>";
    };

    annotate_canvas = function($canvas) {
      return $canvas.annotate({
        tools_container: "#header-main #annotate",
        color: 'red',
        type: 'rectangle'
      });
    };

    save_canvas = function() {
      var annotations, image, screenshot, screenshot_ctx;
      screenshot = $("#canvas-image");
      screenshot_ctx = screenshot[0].getContext("2d");
      annotations = $("#canvas-annotations");
      screenshot_ctx.drawImage(annotations[0], 0, 0);
      image = screenshot[0].toDataURL("image/png");
      return image;
    };

    blob = function(data_image) {
      var array, binary, i;
      binary = atob(data_image.split(",")[1]);
      array = [];
      i = 0;
      while (i < binary.length) {
        array.push(binary.charCodeAt(i));
        i++;
      }
      return new Blob([new Uint8Array(array)], {
        type: "image/png"
      });
    };

    Edit.init_trello = function() {
      return Trello.is_user_logged_in(function(username) {
        if (username) {
          $("#login-container").hide();
          $("#add-card-container").show();
          return Trello.get_api_credentials(function(creds) {
            if (creds) {
              return Trello.get_client_token(creds, function(token) {
                var access;
                if (token) {
                  access = {
                    username: username,
                    creds: creds,
                    token: token
                  };
                  if (localStorage.position) {
                    $("#trello-card-position").prop("checked", true);
                  }
                  build_trello_boards(access);
                  return bind_trello(access);
                }
              });
            }
          });
        } else {
          $("#login-container").show();
          $("#add-card-container").hide();
          return window.setTimeout(function() {
            return Edit.init_trello();
          }, 2000);
        }
      });
    };

    bind_trello = function(access) {
      $("#trello-boards select").on("change", function() {
        update_select_field($(this));
        build_trello_lists($(this).find("option:selected").val(), access);
        return build_trello_labels($(this).find("option:selected").val(), access);
      });
      $("#trello-lists select").on("change", function() {
        return update_select_field($(this));
      });
      $("#trello-labels").on("click", "> div", function() {
        return $(this).toggleClass("selected");
      });
      return $("#trello-card-submit").on("click", function() {
        return validate_card_info(function(validated) {
          if (validated) {
            save_preferences_to_storage();
            $("#trello-card-submit").prop("disabled", true);
            $("#trello-upload-progress").show();
            return submit_trello_card(access, $("#trello-card-name").val(), $("#trello-card-description").val() + page_info, $("#trello-lists select option:selected").val(), get_selected_labels(), $("#trello-card-position").prop("checked"), blob(save_canvas()));
          }
        });
      });
    };

    build_trello_boards = function(access) {
      return Trello.get_boards(access, function(boards) {
        var board, _i, _len;
        if (boards.length) {
          for (_i = 0, _len = boards.length; _i < _len; _i++) {
            board = boards[_i];
            $("#trello-boards select").append("<option value='" + board.id + "' " + (board.id === localStorage.board ? "selected" : "") + ">" + board.name + "</option>");
          }
          return $("#trello-boards select").trigger("change");
        }
      });
    };

    build_trello_lists = function(board_id, access) {
      return Trello.get_lists(board_id, access, function(lists) {
        var list, _i, _len, _results;
        if (lists.length) {
          $("#trello-lists select").empty();
          _results = [];
          for (_i = 0, _len = lists.length; _i < _len; _i++) {
            list = lists[_i];
            $("#trello-lists select").append("<option value='" + list.id + "' " + (list.id === localStorage.list ? "selected" : "") + ">" + list.name + "</option>");
            _results.push($("#trello-lists select").trigger("change"));
          }
          return _results;
        }
      });
    };

    build_trello_labels = function(board_id, access) {
      var label_colors;
      label_colors = ["black", "blue", "green", "lime", "orange", "pink", "purple", "red", "sky", "yellow"];
      $("#trello-labels > div").not(".trello-label-description").empty();
      return Trello.get_labels(board_id, access, function(labels) {
        var color, _i, _len, _results;
        if (labels) {
          _results = [];
          for (_i = 0, _len = label_colors.length; _i < _len; _i++) {
            color = label_colors[_i];
            _results.push($("#trello-labels .trello-label-" + color).text(labels[color]));
          }
          return _results;
        }
      });
    };

    submit_trello_card = function(access, name, description, list, labels, position, blob) {
      return Trello.submit_card(access, name, description, list, labels, function(card) {
        if (card && position) {
          Trello.move_card_to_top(access, card.id);
        }
        if (card && blob) {
          return Trello.upload_attachment(access, card.id, blob, function(data) {
            if (data.isUpload) {
              $("#trello-upload-progress").hide();
              return $("#trello-upload-success").show().append("<div class='url'><a href='" + card.shortUrl + "'>" + card.shortUrl + "</a></div>");
            } else {
              return alert("Upload failed. Please try again.");
            }
          });
        }
      });
    };

    update_select_field = function($select) {
      return $select.parent().find(".input").text($select.find("option:selected").text());
    };

    get_selected_labels = function() {
      var array;
      array = [];
      $("#trello-labels").find(".selected").each(function() {
        return array.push($(this).data("trello-color"));
      });
      return array.join(",");
    };

    validate_card_info = function(callback) {
      var validations;
      validations = [];
      validations.push($("#trello-boards select").val() === "" ? false : true);
      validations.push($("#trello-lists select").val() === "" ? false : true);
      validations.push($("#trello-card-name").val() === "" ? false : true);
      append_errors(validations);
      return callback(validations.indexOf(false) === -1 ? true : false);
    };

    append_errors = function(errors) {
      var $val;
      if (errors == null) {
        errors = [];
      }
      $val = $("#trello-validation");
      $val.empty();
      if (!errors[0]) {
        $val.append("<div class='error'>Please select a board before submitting.</div>");
      }
      if (!errors[1]) {
        $val.append("<div class='error'>Please select a list before submitting.</div>");
      }
      if (!errors[2]) {
        return $val.append("<div class='error'>Please add a card name before submitting.</div>");
      }
    };

    save_preferences_to_storage = function() {
      localStorage.board = $("#trello-boards select option:selected").val();
      localStorage.list = $("#trello-lists select option:selected").val();
      return localStorage.position = $("#trello-card-position").prop("checked");
    };

    log_in_to_trello = function() {
      return Trello.log_in($("#trello-username").val(), $("#trello-password").val(), function(logged_in) {
        return console.log(logged_in);
      });
    };

    return Edit;

  })();

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    Edit.screenshot(message.screenshot, message.image, message.image_info);
    return Edit.prepare_page_info(message.page);
  });

  jQuery(function() {
    Edit.init_trello();
    $("#editor-container").css({
      "min-height": $(window).innerHeight() - 70
    });
    return $("#upload").on("click", ".upload-button", function() {
      var $trello;
      $trello = $("#trello");
      if ($trello.is(":visible")) {
        if ($("#trello-card-name").val() !== "" && $("#trello-boards select").val() !== "" && $("#trello-lists select").val() !== "" && !$("#trello-card-submit").is(':disabled')) {
          return $("#trello-card-submit").trigger("click");
        } else {
          return $("#trello").slideUp(200);
        }
      } else {
        return $("#trello").slideDown(200);
      }
    });
  });

  Trello = (function() {
    function Trello() {}

    Trello.is_user_logged_in = function(callback) {
      return $.ajax({
        url: "https://trello.com/1/Members/me"
      }).done(function(data) {
        return callback(data.username);
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.get_api_credentials = function(callback) {
      return $.ajax({
        url: "https://trello.com/1/appKey/generate"
      }).done(function(data) {
        var $html;
        $html = $($.parseHTML(data));
        return callback({
          api_key: $html.find("input#key").val(),
          api_secret: $html.find("input#secret").val()
        });
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.get_client_token = function(creds, callback) {
      return $.ajax({
        url: "https://trello.com/1/authorize?key=" + creds.api_key + "&name=TrelloCapture&expiration=never&response_type=token&scope=read,write"
      }).done(function(data) {
        var $html;
        $html = $($.parseHTML(data));
        return $.ajax({
          type: 'POST',
          url: 'https://trello.com/1/token/approve',
          data: {
            approve: "Allow",
            requestKey: $html.find("input[name='requestKey']").val(),
            signature: $html.find("input[name='signature']").val()
          }
        }).done(function(data) {
          var token;
          $html = $($.parseHTML(data));
          token = $($html[5]).html().replace(RegExp(" ", "g"), "").replace(/\r\n/g, "").replace(/\n/g, "").replace(/\r/g, "");
          if (token && token.length === 64) {
            return callback(token);
          } else {
            return callback(false);
          }
        }).fail(function() {
          return callback(false);
        });
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.get_boards = function(access, callback) {
      return $.ajax({
        url: "https://api.trello.com/1/members/" + access.username + "/boards?key=" + access.creds.api_key + "&token=" + access.token
      }).done(function(data) {
        return callback(data.filter(function(board) {
          return !board.closed;
        }));
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.get_lists = function(board_id, access, callback) {
      return $.ajax({
        url: "https://api.trello.com/1/boards/" + board_id + "/lists?key=" + access.creds.api_key + "&token=" + access.token
      }).done(function(data) {
        return callback(data.filter(function(list) {
          return !list.closed;
        }));
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.get_labels = function(board_id, access, callback) {
      return $.ajax({
        url: "https://api.trello.com/1/boards/" + board_id + "/labelNames?key=" + access.creds.api_key + "&token=" + access.token
      }).done(function(data) {
        return callback(data);
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.submit_card = function(access, name, description, list, labels, callback) {
      labels = labels.length ? "&labels=" + labels : "";
      return $.ajax({
        url: "https://api.trello.com/1/lists/" + list + "/cards?key=" + access.creds.api_key + "&token=" + access.token + labels,
        type: "POST",
        data: {
          name: name,
          desc: description,
          pos: "top"
        }
      }).done(function(data) {
        return callback(data);
      }).fail(function() {
        return callback(false);
      });
    };

    Trello.move_card_to_top = function(access, card_id) {
      return $.ajax({
        url: "https://api.trello.com/1/cards/" + card_id + "?key=" + access.creds.api_key + "&token=" + access.token,
        type: "PUT",
        data: {
          pos: "top"
        }
      });
    };

    Trello.upload_attachment = function(access, card_id, blob, callback) {
      var form_data;
      form_data = new FormData();
      form_data.append("file", blob, "trellosnap-screenshot.png");
      return $.ajax({
        url: "https://api.trello.com/1/cards/" + card_id + "/attachments?key=" + access.creds.api_key + "&token=" + access.token,
        type: "POST",
        data: form_data,
        processData: false,
        contentType: false
      }).done(function(data) {
        return callback(data);
      }).fail(function() {
        return callback(false);
      });
    };

    return Trello;

  })();

}).call(this);
