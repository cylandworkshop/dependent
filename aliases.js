const Graphics = PIXI.Graphics;
const Text = PIXI.Text;
const Container = PIXI.Container;
const Point = PIXI.Point;

const Application = PIXI.Application;
const Sprite = PIXI.Sprite;
const lights = PIXI.lights;
// const display = PIXI.display;

/*const diffuseGroup = lights.diffuseGroup;
const normalGroup = lights.normalGroup;
const lightGroup = lights.lightGroup;*/

// const Layer = display.Layer;
// const Stage = display.Stage;

// const light = new PIXI.lights.PointLight(0xFFFFFF, 1);

let RED_STYLE_H1 = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 56,
  fill: "#ff3b94",
  stroke: '#55ffe1',
  strokeThickness: 1,
  dropShadow: true,
  dropShadowColor: "#af3dff",
  dropShadowBlur: 15,
  dropShadowAngle: Math.PI / 7,
  dropShadowDistance: 3,
});

let RED_STYLE_H2 = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 32,
  fill: "#ff3b94",
  stroke: '#55ffe1',
  strokeThickness: 1,
  dropShadow: true,
  dropShadowColor: "#af3dff",
  dropShadowBlur: 15,
  dropShadowAngle: Math.PI / 7,
  dropShadowDistance: 3,
});

let WHITE_STYLE_H2 = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 32,
  fill: "#af3dff",
  stroke: '#ff3b94',
  strokeThickness: 1,
  dropShadow: true,
  dropShadowColor: "#55ffe1",
  dropShadowBlur: 15,
  dropShadowAngle: Math.PI / 7,
  dropShadowDistance: 3,
});

function hitTestRectangle(r1, r2) {
  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

function create_geometry(texture_graphics, normal_graphics) {
    let diffuse = Sprite.from(texture_graphics);
    diffuse.parentGroup = diffuseGroup;

    let normal = Sprite.from(normal_graphics);
    normal.parentGroup = normalGroup;
    
    let res = new PIXI.Container();
    res.addChild(diffuse, normal);

    return res;
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}