function add_fragment(url, parent, position, fragments) {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(r => r.text())
        .then(svg => {
            let div = document.createElement("div");
            div.insertAdjacentHTML("afterbegin", svg);

            let doc = div.querySelector("svg");
            const width = doc.getAttribute("width");
            const height = doc.getAttribute("height");

            let ellipses = [...doc.querySelectorAll("ellipse"), ...doc.querySelectorAll("circle")];
            ellipses = ellipses.map((e, id) => ({e, id}));

            let parent_points = ellipses.filter(x => x.e.style.fill === "rgb(255, 0, 0)");
            let parent_point = parent_points[Math.floor((Math.random()*parent_points.length))];

            // ellipses.filter(x => x.id !== parent_point.id).forEach(ellipse => ellipse.e.parentNode.removeChild(ellipse.e));

            // let svg_r = new PIXI.SVGResource(svg);
            let svg_r = new PIXI.SVGResource(new XMLSerializer().serializeToString(doc));
            let svg_t = new PIXI.BaseTexture(svg_r);

            let fragment_texture = new PIXI.Texture.from(svg_t);
            let fragment = new PIXI.Sprite(fragment_texture);
            fragment.anchor.set(
                parent_point.e.getAttribute("cx") / width,
                parent_point.e.getAttribute("cy") / height
            );

            fragment.child_points = ellipses
                .filter(x => x.e.style.fill === "rgb(0, 0, 255)")
                .map(x => ({
                    x: x.e.getAttribute("cx") - parent_point.e.getAttribute("cx"),
                    y: x.e.getAttribute("cy") - parent_point.e.getAttribute("cy")
                }));

            fragment_texture.baseTexture.on("loaded", () => {
                console.log("w:", fragment.width);
                fragments.push(fragment);
                parent.addChild(fragment);

                fragment.position.x = position.x;
                fragment.position.y = position.y;

                fragment.scale.x = 0.5;
                fragment.scale.y = 0.5;
                
                resolve(fragment);
            });

            // console.log(fragment.child_points[0]);

            
        });
    });
}

function Main_scene(pixi) {
    let scene = new Container();
    let root = null;

    let fragments = [];

    add_fragment("svg/Голова/g1.svg", scene, {x:1200, y:600}, fragments)
    .then(fragment => add_fragment("svg/щупальца/w1.svg", fragment, fragment.child_points[0], fragments));

    scene.interactive = true;
    scene.click = function(e) {
        console.log("click");
    }

    scene.update = (delta, now) => {
        fragments.forEach(f => {
            f.rotation += delta * 0.02;
        });
    };

    scene.key_handler = (key, isPress) => {
        
    };

    scene.select = () => {
    };

    return scene;
}