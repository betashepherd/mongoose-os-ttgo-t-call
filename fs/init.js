load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_sys.js');
load('api_net.js');

let led = Cfg.get('board.led1.pin');              // Built-in LED GPIO number
let onhi = Cfg.get('board.led1.active_high');     // LED on when high?
let state = {on: false};               // Device state

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

let setLED = function (on) {
    let level = onhi ? on : !on;
    GPIO.write(led, level);
    print('LED on ->', on);
};

GPIO.set_mode(led, GPIO.MODE_OUTPUT);
setLED(state.on);

// Update state every second, and report to cloud if online
Timer.set(30000, Timer.REPEAT, function () {
    state.uptime = Sys.uptime();
    state.ram_free = Sys.free_ram();
    state.time = Timer.fmt("%F %T", Timer.now());
    print(JSON.stringify(state));
    MQTT.pub("/ttgo", JSON.stringify(state), 1);
}, null);