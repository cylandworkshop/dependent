function add_fragment(url, parent, position, fragments) {
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

        ellipses.filter(x => x.id !== parent_point.id).forEach(ellipse => ellipse.e.parentNode.removeChild(ellipse.e));

        // let svg_r = new PIXI.SVGResource(svg);
        let svg_r = new PIXI.SVGResource(new XMLSerializer().serializeToString(doc));
        let svg_t = new PIXI.BaseTexture(svg_r);

        let fragment_svg = new PIXI.Texture.from(svg_t);
        let fragment = new PIXI.Sprite(fragment_svg);
        fragment.anchor.set(
            parent_point.e.getAttribute("cx") / width,
            parent_point.e.getAttribute("cy") / height
        );

        fragment.child_points = ellipses
            .filter(x => x.e.style.fill === "rgb(0, 0, 255)")
            .map(x => ({
                x: x.e.getAttribute("cx") / width,
                y: x.e.getAttribute("cy") / height
            }));
        console.log(fragment.child_points);

        fragments.push(fragment);

        parent.addChild(fragment);

        fragment.position.x = position.x;
        fragment.position.y = position.y;
    });
}

function Main_scene(pixi) {
    let scene = new Container();
    let root = null;

    let fragments = [];

    add_fragment("svg/Голова/g1.svg", scene, {x:800, y:500}, fragments);

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