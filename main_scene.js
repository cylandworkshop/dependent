function get_fragments_dir(name) {
    const url = "/svg/" + name + "/";
    return fetch(url)
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const links = Array.prototype.slice.call(
            doc.querySelectorAll("body > ul > li > a")
        ).map(x => (url + x.innerHTML));
        return {name, links};
    });
}

function get_fragments_list() {
    return Promise.all(['root', 'body', 'parts'].map(x => get_fragments_dir(x)));
}

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

            ellipses
                // .filter(x => x.id !== parent_point.id)
                .forEach(ellipse => ellipse.e.parentNode.removeChild(ellipse.e));

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
                    y: x.e.getAttribute("cy") - parent_point.e.getAttribute("cy"),
                    fragment,
                    type: "body"
                }));

            fragment_texture.baseTexture.on("loaded", () => {
                console.log("w:", fragment.width);
                fragments.push(fragment);
                parent.addChild(fragment);

                fragment.position.x = position.x;
                fragment.position.y = position.y;

                fragment.phi = 0.2;
                fragment.target_angle = getRandomArbitrary(0, 360);

                fragment.target_scale = getRandomArbitrary(1, 2);
                fragment.scale_speed = 0.05;
                fragment.scale.x = 0;
                fragment.scale.y = 0;

                fragment.fixed = false;
                
                resolve(fragment);
            });

            // console.log(fragment.child_points[0]);

            
        });
    });
}



function Main_scene(pixi) {
    let fragments_list = null;

    get_fragments_list()
    .then(list => {
        fragments_list = list.reduce((a, v) => ({ ...a, [v.name]: v.links}), {});
        console.log(fragments_list);
        handle_fragment();
    });

    let scene = new Container();
    let fragments = [];
    let fragments_tree = [];

    function handle_fragment() {
        if(fragments_list !== null) {
            if(fragments.length === 0) {
                return add_fragment(fragments_list.root.random(), scene, {x:600, y:300}, fragments)
                .then(f => {
                    f.target_scale = 0.2;
                });
            } else {
                let point = fragments.map(x => x.child_points.map((v,i)=>({v,i}))).flat().random();
                let new_fragment = [...fragments_list.root, ...fragments_list.body].random();
                point.v.fragment.child_points.splice(point.i, 1);

                return add_fragment(new_fragment, point.v.fragment, point.v, fragments);
            }
        } else {
            return null;
        }
    }

    /*add_fragment("svg/root/g1.svg", scene, {x:1200, y:600}, fragments)
    .then(fragment => add_fragment("svg/body/w1.svg", fragment, fragment.child_points[0], fragments));*/

    let pending = null;
    scene.interactive = true;
    scene.click = function(e) {
        console.log("click");
        if(pending === null) {
            pending = handle_fragment();
            pending.then(() => {
                pending = null;
            });
        } else {
            console.log("prev op is pending, ignore click");
        }
    }

    let screen = {width: pixi.renderer.width, height: pixi.renderer.height};

    scene.update = (delta, now) => {
        fragments.filter(f => !f.fixed).forEach(f => {
            let angle_delta = f.target_angle - f.angle;
            f.angle += delta * f.phi * angle_delta;

            let bounds = f.getBounds();
            let overbound = !(
                bounds.x > 0 &&
                bounds.y > 0 &&
                bounds.x + bounds.width < screen.width &&
                bounds.y + bounds.height < screen.height
            );

            if(overbound) {
                f.target_scale -= delta * f.scale_speed * 0.4;
                f.target_angle -= delta * f.phi * 2;
            }

            let scale_delta = f.target_scale - f.scale.x;
            f.scale.x += delta * f.scale_speed * scale_delta;
            f.scale.y = f.scale.x;

            if(angle_delta > 1 || scale_delta > 1 || overbound) {
                console.log("motion", angle_delta, scale_delta);
                console.log("bbox", f.getBounds());
                console.log("pixi size", pixi.renderer.width)
            } else {
                f.fixed = true;
            }
        });
    };

    scene.key_handler = (key, isPress) => {
        
    };

    scene.select = () => {
    };

    return scene;
}