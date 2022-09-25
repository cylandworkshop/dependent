let update = () => {};
let key_handler = (key, isPress) => {};

let main_scene;

let stage = new Stage();
/*
let glitch_filter = new PIXI.filters.GlitchFilter();
let crt_filter = new PIXI.filters.CRTFilter();
crt_filter.curvature = 5.8;
crt_filter.lineWidth = 3.8;
crt_filter.lineContrast = 0.64;

glitch_filter.red.x = -10;
glitch_filter.blue.x = 14;
glitch_filter.green.x = -20;
glitch_filter.red.y = -5;
glitch_filter.blue.y = 10;
glitch_filter.green.y = -20;
*/

// let semaphore_sound = new Audio('semaphore_01.mp3');

/*function disable_glitch() {
    stage.filters = [];
}

function enable_glitch() {
    stage.filters = [crt_filter, glitch_filter];
    setTimeout(() => disable_glitch(), 500);
}
*/

function app(pixi) {
    pixi.stage = stage;

    PIXI.utils.sayHello("Philosolhe begin!");

    /*stage.addChild(
        // put all layers for deferred rendering of normals
        new Layer(diffuseGroup),
        new Layer(normalGroup),
        new Layer(lightGroup),
    );*/

    main_scene = Main_scene(pixi);
    main_scene.visible = false;
    stage.addChild(main_scene);

    /*setInterval(() => {
        if(stage.filters && stage.filters.length > 0) {
            glitch_filter.refresh();
            glitch_filter.red.x = getRandomArbitrary(-20,20);
            glitch_filter.blue.x = getRandomArbitrary(-20,20);
            glitch_filter.green.x = getRandomArbitrary(-20,20);
            glitch_filter.red.y = getRandomArbitrary(-20,20);
            glitch_filter.blue.y = getRandomArbitrary(-20,20);
            glitch_filter.green.y = getRandomArbitrary(-20,20);
        }
    }, 50);*/

    window.addEventListener(
        "keydown",
        (event) => {
            key_handler(event.keyCode, true);
            if(event.keyCode !== 116 && event.keyCode !== 122/* && event.keyCode !== 123*/) {
                event.preventDefault();
            }
        },
        false
    );

    window.addEventListener(
        "keyup",
        (event) => {
            key_handler(event.keyCode, false);
            event.preventDefault();
        },
        false
    );

    pixi.ticker.add(delta => update(delta, performance.now()));

    select_scene(main_scene);

    /*var block = new PIXI.Container();
    const block_diffuse = Sprite.fromImage('images/block.png');
    block_diffuse.parentGroup = diffuseGroup;
    const block_normal = Sprite.fromImage('images/blockNormalMap.png');
    block_normal.parentGroup = normalGroup;
    block.addChild(block_normal, block_diffuse);
    background.addChild(block);

    block.x = 200;
    block.y = 300;
    */
}

let current_scene = null;
let back_scene = null;

function select_scene(scene, params) {
    if(current_scene !== null) {
        current_scene.visible = false;
    }
    scene.visible = true;
    current_scene = scene;

    update = scene.update;
    key_handler = scene.key_handler;
    scene.select(params);
}

function popup_scene(scene, params) {
    back_scene = current_scene;
    current_scene = scene;

    scene.visible = true;

    update = scene.update;
    key_handler = scene.key_handler;
    scene.select(params);
}
