load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_pppos.js');
load('api_gps.js');
load('api_timer.js');
load('api_sys.js');
load('api_net.js');

let led = Cfg.get('board.led1.pin');
let gimei = '';
let giccid = '';
let gtopic = '';

let pubData = function () {
  return JSON.stringify({
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram(),
    time: Timer.fmt("%F %T", Timer.now() + 28800),
    iccid: giccid,
    imei: gimei,
    gps: GPS.getLocation()
  });
};

GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(1000, Timer.REPEAT, function () {
  let value = GPIO.toggle(led);
  if (giccid === '') {
    giccid = PPPOS.iccid();
  }
  if (gimei === '') {
    gimei = PPPOS.imei();
  }
  if (giccid !== '' && gimei !== '' && gtopic === '') {
    gtopic = '/' + Cfg.get('device.id') + '/' + giccid + '/' + gimei;
  }
  print(value ? 'Tick' : 'Tock', Sys.uptime(), gtopic);
}, null);

Timer.set(5000, Timer.REPEAT, function () {
  if (gtopic !== '') {
    MQTT.pub(gtopic, pubData(), 1);
    print("==== MQTT pub:", gtopic);
  }
}, null);

Event.addGroupHandler(Net.EVENT_GRP, function (ev, evdata, arg) {
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

MQTT.setEventHandler(function (conn, ev, edata) {
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
    print('==== MQTT event:', evs);
  }
}, null);
