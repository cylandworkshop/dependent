function Main_scene(pixi) {
    fetch("svg/Голова/g1.svg")
    .then(r => r.text())
    .then(svg => {
      let div = document.createElement("div");
      div.insertAdjacentHTML("afterbegin", svg);

      let doc = div.querySelector("svg");
      let ellipses = [...doc.querySelectorAll("ellipse"), ...doc.querySelectorAll("circle")];
      ellipses.forEach(ellipse => ellipse.parentNode.removeChild(ellipse));

      let image = doc.querySelector("image");
      // let transform = `translate(1000,0) scale(0.4) rotate(${angle}})`;
      // image.setAttribute("transform", transform);

      /*fragments.push({
        element: image
      });*/

      document.body.append(div);
    });

    let scene = new Container();

    let background = new Graphics()
        .beginFill(0x000000)
        .drawRect(0, 0, pixi.screen.width, pixi.screen.height)
        .endFill();

    scene.addChild(background);

    const beeSvg = "svg/Голова/g1.svg";
    let beeTexture = new PIXI.Texture.fromImage(beeSvg, undefined, undefined, 1.0);
    let bee = new PIXI.Sprite(beeTexture);
    scene.addChild(bee);


    {
        let message = new Text("Click to begin", RED_STYLE_H1);
        message.position.set(pixi.screen.width/2 - 100, pixi.screen.height/2);
        scene.addChild(message);
    }

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