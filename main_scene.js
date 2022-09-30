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

const SCALE = 0.5;

function add_fragment(url, parent, position, fragments) {
    console.log("adding fragment", url);
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(r => r.text())
        .then(svg => {
            let div = document.createElement("div");
            div.insertAdjacentHTML("afterbegin", svg);

            let doc = div.querySelector("svg");
            const width = doc.getAttribute("width") * SCALE;
            const height = doc.getAttribute("height") * SCALE;

            let ellipses = [...doc.querySelectorAll("ellipse"), ...doc.querySelectorAll("circle")];
            ellipses = ellipses.map((e, id) => ({e, id}));

            let parent_points = ellipses.filter(x => x.e.style.fill === "rgb(255, 0, 0)");
            let parent_point = parent_points[Math.floor((Math.random()*parent_points.length))];

            ellipses
                .filter(x => x.e.style.fill === "rgb(0, 255, 0)")
                .forEach(ellipse => console.log(ellipse.e));

            ellipses
                // .filter(x => x.e.style.fill !== "rgb(0, 255, 0)")
                .forEach(ellipse => ellipse.e.parentNode.removeChild(ellipse.e));

            // let svg_r = new PIXI.SVGResource(svg);
            let svg_r = new PIXI.SVGResource(new XMLSerializer().serializeToString(doc));
            let svg_t = new PIXI.BaseTexture(svg_r, {resolution: 1/SCALE});

            let fragment_texture = PIXI.Texture.from(svg_t);
            let fragment = new PIXI.Sprite(fragment_texture);
            fragment.anchor.set(
                (parent_point.e.getAttribute("cx") / width) * SCALE,
                (parent_point.e.getAttribute("cy") / height) * SCALE
            );

            let child_points = ellipses
                .filter(x => x.e.style.fill === "rgb(0, 0, 255)")
                .map(x => ({
                    x: (x.e.getAttribute("cx") - parent_point.e.getAttribute("cx")) * SCALE,
                    y: (x.e.getAttribute("cy") - parent_point.e.getAttribute("cy")) * SCALE,
                    fragment,
                    type: "body"
                }));

            let part_areas = ellipses
                .filter(x => x.e.style.fill === "rgb(0, 255, 0)")
                .map(v => {
                    let a = parse_rotate(v.e);
                    let a_r = a * Math.PI/180;
                    let x = v.e.getAttribute("cx") * Math.cos(a_r) - v.e.getAttribute("cy") * Math.sin(a_r);
                    let y = v.e.getAttribute("cx") * Math.sin(a_r) + v.e.getAttribute("cy") * Math.cos(a_r);
                    console.log("x", x, "y", y);
                    return {
                        x: (x - parent_point.e.getAttribute("cx")) * SCALE,
                        y: (y - parent_point.e.getAttribute("cy")) * SCALE,
                        width: v.e.getAttribute("rx") * 2,
                        height: v.e.getAttribute("ry") * 2,
                        rotate: a,
                        fragment,
                        type: "part"
                    };
                });

            fragment.child_points = [...child_points, ...part_areas];

            function on_ready() {
                fragments.push(fragment);
                parent.addChild(fragment);

                fragment.position.x = position.x;
                fragment.position.y = position.y;

                fragment.phi = 0.2;
                fragment.target_angle = getRandomArbitrary(0, 360);

                fragment.target_scale = {x: getRandomArbitrary(1, 2), y: 0};
                fragment.target_scale.y = fragment.target_scale.x;
                fragment.scale_speed = 0.05;
                fragment.scale.x = 0;
                fragment.scale.y = 0;

                fragment.fixed = false;
                
                resolve(fragment);
            }

            if(fragment_texture.valid) {
                on_ready();
            } else {
                fragment_texture.baseTexture.on("loaded", on_ready);
            }
        });
    });
}

function add_part(url, parent, area, fragments) {
    console.log("adding part", url);
    return new Promise((resolve, reject) => {
        let part_texture = PIXI.Texture.from(url);
        let part = new PIXI.Sprite(part_texture);

        part.anchor.set(0.5);

        function on_ready() {
            part.width = area.width * 1.4;
            part.height = area.height * 1.4;

            part.child_points = [];

            part.position.x = area.x;
            part.position.y = area.y;
            part.target_angle = area.rotate;
            part.target_scale = {x: part.scale.x, y: part.scale.y};
            part.scale_speed = 0.05;
            part.scale.x = 0;
            part.scale.y = 0;
            part.fixed = false;

            part.phi = 0.2;

            parent.addChild(part);
            fragments.push(part);
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
                    f.target_scale = {x: 0.3 / SCALE, y: 0.3 / SCALE};
                });
            } else {
                let points = fragments.map(x => x.child_points.map((v,i)=>({v,i}))).flat();
                if(points.length === 0) {
                    console.log("no more childs, resolve null");
                    return Promise.resolve(null);
                }
                let point = points.random();
                point.v.fragment.child_points.splice(point.i, 1);

                if(point.v.type === "body") {
                    let new_fragment = [...fragments_list.root, ...fragments_list.body].random();
                    // return Promise.resolve(null);
                    return add_fragment(new_fragment, point.v.fragment, point.v, fragments);
                } else if (point.v.type === "part") {
                    let new_part = fragments_list.parts.random();
                    // return Promise.resolve(null);
                    return add_part(new_part, point.v.fragment, point.v, fragments);
                } else {
                    return Promise.resolve(null);
                }
            }
        } else {
            return Promise.resolve(null);
        }
    }

    /*add_fragment("svg/root/g1.svg", scene, {x:1200, y:600}, fragments)
    .then(fragment => add_fragment("svg/body/w1.svg", fragment, fragment.child_points[0], fragments));*/

    let pending = null;
    scene.interactive = true;
    scene.click = function(e) {
        
    }

    scene.update = (delta, now) => {
        fragments.filter(f => !f.fixed).forEach(f => {
            // f.target_angle += delta;
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
                f.target_scale.x -= delta * f.scale_speed * 0.4;
                f.target_scale.y -= delta * f.scale_speed * 0.4;
                f.target_angle -= delta * f.phi * 2;
            }
            // console.log("fragment:", f.target_scale, f.target_angle);

            let scale_delta = {x: f.target_scale.x - f.scale.x, y: f.target_scale.y - f.scale.y};
            f.scale.x += delta * f.scale_speed * scale_delta.x;
            f.scale.y += delta * f.scale_speed * scale_delta.y;

            if(angle_delta > 1 || scale_delta.x > 0.1 || scale_delta.y > 0.1 || overbound) {
                // console.log("motion", angle_delta, scale_delta);
            } else {
                f.fixed = true;
            }
        });
    };

    scene.key_handler = (key, isPress) => {
        if(isPress) {
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
    };

    scene.select = () => {
    };

    return scene;
}