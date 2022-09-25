function Main_scene(pixi) {
    let scene = new Container();
    let background = new Graphics()
        .beginFill(0x000000)
        .drawRect(0, 0, pixi.screen.width, pixi.screen.height)
        .endFill();

    scene.addChild(background);

    fetch("svg/Голова/g1.svg")
    .then(r => r.text())
    .then(svg => {
      let div = document.createElement("div");
      div.insertAdjacentHTML("afterbegin", svg);

      let doc = div.querySelector("svg");
      let ellipses = [...doc.querySelectorAll("ellipse"), ...doc.querySelectorAll("circle")];
      ellipses.forEach(ellipse => ellipse.parentNode.removeChild(ellipse));

      let svg_r = new PIXI.SVGResource(new XMLSerializer().serializeToString(doc));
      let svg_t = new PIXI.BaseTexture(svg_r);

      let head_svg = new PIXI.Texture.from(svg_t);
      let head = new PIXI.Sprite(head_svg);
      scene.addChild(head);
    });

    scene.interactive = true;
    scene.click = function(e) {
        console.log("click");
    }

    scene.update = (delta, now) => {

    };

    scene.key_handler = (key, isPress) => {
        
    };

    scene.select = () => {
    };

    return scene;
}