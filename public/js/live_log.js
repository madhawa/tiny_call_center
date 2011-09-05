(function() {
  var Controller, Socket, p, store;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  p = function() {
    var _ref;
    return (_ref = window.console) != null ? typeof _ref.debug === "function" ? _ref.debug(arguments) : void 0 : void 0;
  };
  store = {
    pause: false
  };
  Socket = (function() {
    function Socket(controller) {
      this.controller = controller;
      this.connect();
    }
    Socket.prototype.connect = function() {
      var webSocket;
      webSocket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
      this.ws = new webSocket(store.server);
      return this.reconnector = setInterval(__bind(function() {
        if (!this.connected) {
          this.ws = new webSocket(store.server);
          return this.prepareWs();
        }
      }, this), 1000);
    };
    Socket.prototype.prepareWs = function() {
      this.ws.onopen = __bind(function() {
        this.say({
          method: 'subscribe',
          agent: store.agent
        });
        return this.connected = true;
      }, this);
      this.ws.onmessage = __bind(function(message) {
        var data;
        data = JSON.parse(message.data);
        return this.controller.dispatch(data);
      }, this);
      this.ws.onclose = __bind(function() {
        p("Closing WebSocket");
        return this.connected = false;
      }, this);
      return this.ws.onerror = __bind(function(error) {
        return p("WebSocket Error:", error);
      }, this);
    };
    Socket.prototype.say = function(obj) {
      return this.ws.send(JSON.stringify(obj));
    };
    return Socket;
  })();
  Controller = (function() {
    function Controller() {}
    Controller.prototype.dispatch = function(msg) {
      var display, ext, extMatch, key, left, leftMatch, line, right, rightMatch, value, _ref, _ref2, _ref3, _ref4, _ref5;
      if (store.pause) {
        return;
      }
      p(msg);
      if (msg.tiny_action) {
        display = msg;
        switch (msg.tiny_action) {
          case "status_change":
            display = {
              Action: "Status change",
              Agent: msg.cc_agent,
              Status: msg.cc_agent_status
            };
            break;
          case "state_change":
            display = {
              Action: "State change",
              Agent: msg.cc_agent,
              State: msg.cc_agent_state
            };
            break;
          case 'call_start':
            display = {
              Action: "Call",
              Agent: msg.cc_agent
            };
            ext = msg.cc_agent.split('-')[0];
            extMatch = /(?:^|\/)(?:sip:)?(\d+)[@-]/;
            _ref = [msg.left, msg.right], left = _ref[0], right = _ref[1];
            leftMatch = (_ref2 = left.channel) != null ? typeof _ref2.match === "function" ? (_ref3 = _ref2.match(extMatch)) != null ? _ref3[1] : void 0 : void 0 : void 0;
            rightMatch = (_ref4 = right.channel) != null ? typeof _ref4.match === "function" ? (_ref5 = _ref4.match(extMatch)) != null ? _ref5[1] : void 0 : void 0 : void 0;
            if (ext === leftMatch) {
              display.Detail = left.destination;
            } else if (ext === rightMatch) {
              display.Detail = right.destination;
            } else if (right.destination === rightMatch) {
              display.Detail = right.destination;
            } else if (left.destination === leftMatch) {
              display.Detail = left.destination;
            } else if (left.cid_number === leftMatch) {
              display.Detail = left.destination;
            } else if (right.cid_number === rightMatch) {
              display.Detail = right.destination;
            }
            break;
          case 'channel_hangup':
            display = {
              Action: "Hangup",
              Agent: msg.cc_agent
            };
            ext = msg.cc_agent.split('-')[0];
            if (ext === msg.caller_callee_id_number) {
              display.Detail = msg.caller_caller_id_number;
            } else if (ext === msg.caller_caller_id_number) {
              display.Detail = msg.caller_callee_id_number;
            } else {
              display.Detail = msg.caller_callee_id_number;
            }
        }
        line = $('<tr>', {
          "class": 'line'
        });
        for (key in display) {
          value = display[key];
          line.append($('<td>', {
            "class": key
          }).text(value));
        }
        $('#log tbody').prepend(line);
        return line.click(__bind(function() {
          return this.showDetail(line, msg);
        }, this));
      }
    };
    Controller.prototype.showDetail = function(line, msg) {
      var detail, dl, general, key, left, right, value, _ref, _ref2;
      $('#log .line').removeClass('active');
      line.addClass('active');
      detail = $('#detail');
      detail.text('');
      switch (msg.tiny_action) {
        case 'call_start':
          general = $('<dl>');
          left = $('<dl>');
          right = $('<dl>');
          for (key in msg) {
            value = msg[key];
            if (!(key === "left" || key === "right" || key === "original")) {
              general.append($('<dt>').text(key));
              general.append($('<dd>').text(value));
            }
          }
          _ref = msg.left;
          for (key in _ref) {
            value = _ref[key];
            left.append($('<dt>').text(key));
            left.append($('<dd>').text(value));
          }
          _ref2 = msg.right;
          for (key in _ref2) {
            value = _ref2[key];
            right.append($('<dt>').text(key));
            right.append($('<dd>').text(value));
          }
          detail.append($('<h2>').text("General"));
          detail.append(general);
          detail.append($('<h2>').text("Left"));
          detail.append(left);
          detail.append($('<h2>').text("Right"));
          return detail.append(right);
        default:
          dl = $('<dl>');
          for (key in msg) {
            value = msg[key];
            dl.append($('<dt>').text(key));
            dl.append($('<dd>').text(value));
          }
          return detail.append(dl);
      }
    };
    return Controller;
  })();
  $(function() {
    store.server = $('#server').text();
    if (store.server === '') {
      store.server = "ws://" + location.hostname + ":8081/websocket";
    }
    store.agent = $('#agent_name').text();
    store.extension = store.agent.split('-')[0];
    store.ws = new Socket(new Controller());
    window.tcc_store = store;
    $('#play').hide();
    $('#play, #pause').click(function(e) {
      store.pause = !store.pause;
      return $('#play, #pause').toggle();
    });
    return setInterval(function() {
      return $('#log .line:gt(100)').remove();
    }, 1000);
  });
}).call(this);
