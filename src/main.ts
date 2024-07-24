import Renderer from "./renderer";
import InfoUI from "./infoui";
import Settings from "./settings";
import World from "./world";

export default class Main {
    world?: World;
    renderer: Renderer;
    infoUI: InfoUI;
    lastFrameTime: number = 0;
    
    constructor() {
        this.renderer = new Renderer();
        this.infoUI = new InfoUI();

        this.load();

        setInterval(() => {
            this.update();
        }, 1000 / Settings.fps);
    }

    async load() {
        this.world = new World();
        this.renderer.init(this.world);
        this.infoUI.init(this.world);
    }

    update() {
        let now = performance.now();
        let dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.renderer.update(dt);
        this.infoUI.update(dt);
        this.world?.update(dt);
    }

}

const main = new Main();
console.log(main);