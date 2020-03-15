load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_sys.js');
load('api_net.js');

let led = Cfg.get('board.led1.pin');              // Built-in LED GPIO number
let state = {};               // Device state

//////////////////////////
let gsmSwitchPin = 23;
let gsmPwrKeyPin = 4;
/////////////////////////////////
GPIO.set_mode(gsmSwitchPin, GPIO.MODE_OUTPUT);
GPIO.set_mode(gsmPwrKeyPin, GPIO.MODE_OUTPUT);
GPIO.write(gsmSwitchPin, 1); // Turn on gsm module
GPIO.write(gsmPwrKeyPin, 1);

Timer.set(1500, 0, function () {
    // Wait for sometime
}, null);

// Turn Power Key pin low for 1200 ms to turn on the module
Timer.set(1200, 0, function () {
    GPIO.write(gsmPwrKeyPin, 0);
}, null);
GPIO.write(gsmPwrKeyPin, 1);

let getInfo = function() {
  return JSON.stringify({
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram()
  });
};

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
  let value = GPIO.toggle(led);
  print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
}, null);

// Update state every second, and report to cloud if online
Timer.set(5000, Timer.REPEAT, function () {
    state.time = Timer.fmt("%F %T", Timer.now());
    print(JSON.stringify(state));
    MQTT.pub("/ttgo", JSON.stringify(state), 1);
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('==== Net event:', ev, evs);
}, null);

//MQTT monitor
MQTT.setEventHandler(function(conn, ev, edata) {
  let evs = '???';
  if (ev !== 0) {
    if (ev === MQTT.EV_CONNACK) {
      evs = 'CONNACK';
    } else if (ev === MQTT.EV_PUBLISH) {
      evs = 'PUBLISH';
    } else if (ev === MQTT.EV_PUBACK) {
      evs = 'PUBACK';
    } else if (ev === MQTT.EV_SUBACK) {
      evs = 'SUBACK';
    } else if (ev === MQTT.EV_UNSUBACK) {
      evs = 'UNSUBACK';
    } else if (ev === MQTT.CLOSE) {
      evs = 'CLOSE';
    }
  }
  print('==== MQTT event:', evs, edata);
}, null);
