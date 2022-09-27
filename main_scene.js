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

function parse_rotate(ellipse) {
    let transform = ellipse.getAttribute("transform");
    if(transform === null) return 0;

    let angle = parseInt(transform.split('(')[1].split(')')[0]);

    return angle;
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
                .filter(x => x.e.style.fill === "rgb(0, 255, 0)")
                .forEach(ellipse => console.log(ellipse.e));

            ellipses
                .filter(x => x.e.style.fill !== "rgb(0, 255, 0)")
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

            let child_points = ellipses
                .filter(x => x.e.style.fill === "rgb(0, 0, 255)")
                .map(x => ({
                    x: x.e.getAttribute("cx") - parent_point.e.getAttribute("cx"),
                    y: x.e.getAttribute("cy") - parent_point.e.getAttribute("cy"),
                    fragment,
                    type: "body"
                }));

            let part_areas = ellipses
                .filter(x => x.e.style.fill === "rgb(0, 255, 0)")
                .map(x => ({
                    x: x.e.getAttribute("cx") - parent_point.e.getAttribute("cx"),
                    y: x.e.getAttribute("cy") - parent_point.e.getAttribute("cy"),
                    width: x.e.getAttribute("rx") * 2,
                    height: x.e.getAttribute("ry") * 2,
                    rotate: parse_rotate(x.e),
                    fragment,
                    type: "part"
                }));

            fragment.child_points = [...child_points, ...part_areas];

            fragment_texture.baseTexture.on("loaded", () => {
                console.log("w:", fragment.width);
                fragments.push(fragment);
                parent.addChild(fragment);

                fragment.position.x = position.x;
                fragment.position.y = position.y;

                fragment.phi = 0.2;
                fragment.target_angle = getRandomArbitrary(0, 1);

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

function add_part(url, parent, area, fragments) {
    console.log("adding part", url);
    return new Promise((resolve, reject) => {
        let part_texture = new PIXI.Texture.from(url);
        let part = new PIXI.Sprite(part_texture);

        function on_ready() {
            part.width = area.width;
            part.height = area.height;

            part.child_points = [];

            part.position.x = area.x - area.width/2;
            part.position.y = area.y - area.height/2;
            part.target_angle = area.rotate;
            part.target_scale = Math.sqrt(part.scale.x * part.scale.x + part.scale.y * part.scale.y);
            part.scale_speed = 0.05;
            part.scale.x = 0;
            part.scale.y = 0;
            part.fixed = false;

            part.phi = 0.2;

            parent.addChild(part);
            fragments.push(part);
            console.log("resolve part");
            resolve(part);
        }

        if(part_texture.valid) {
            on_ready();
        } else {
            part_texture.baseTexture.on("loaded", on_ready);
        }
    });
}



function Main_scene(pixi) {
    let fragments_list = null;
    let screen = {width: pixi.renderer.width, height: pixi.renderer.height};

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
                return add_fragment(fragments_list.root.random(), scene, {x:screen.width/2, y:screen.height/2}, fragments)
                .then(f => {
                    f.target_scale = 0.2;
                });
            } else {
                // fragments.forEach(x => console.log("childs:", x.child_points));
                let points = fragments.map(x => x.child_points.map((v,i)=>({v,i}))).flat();
                // console.log("all childs:", points);
                if(points.length === 0) {
                    console.log("no more childs, resolve null");
                    return Promise.resolve(null);
                }
                let point = points.random();
                point.v.fragment.child_points.splice(point.i, 1);

                if(point.v.type === "body") {
                    let new_fragment = [...fragments_list.root, ...fragments_list.body].random();
                    // console.log("resolve null");
                    return Promise.resolve(null);
                    // return add_fragment(new_fragment, point.v.fragment, point.v, fragments);
                } else if (point.v.type === "part") {
                    let new_part = fragments_list.parts.random();
                    return add_part(new_part, point.v.fragment, point.v, fragments);
                } else {
                    // console.log("resolve null");
                    return Promise.resolve(null);
                }
            }
        } else {
            console.log("resolve null");
            return Promise.resolve(null);
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

            if(overbound && false) {
                f.target_scale -= delta * f.scale_speed * 0.4;
                f.target_angle -= delta * f.phi * 2;
            }

            let scale_delta = f.target_scale - f.scale.x;
            f.scale.x += delta * f.scale_speed * scale_delta;
            f.scale.y = f.scale.x;

            if(angle_delta > 1 || scale_delta > 0.1 || overbound) {
                /*console.log("motion", angle_delta, scale_delta);
                console.log("bbox", f.getBounds());
                console.log("pixi size", pixi.renderer.width);*/
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