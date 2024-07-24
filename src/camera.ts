import Settings from "./settings";
import Vector2 from "./vector2";

export default class Camera {
    position: Vector2;
    zoom: number;
    
    constructor() {
        this.position = Settings.camera.startPos.clone();
        this.zoom = Settings.camera.startZoom;
    }

    zoomIn(amount: number) {
        if(this.zoom * amount < Settings.camera.minZoom) return;
        if(this.zoom * amount > Settings.camera.maxZoom) return;

        this.zoom *= amount;
        this.position = this.position.scale(amount);
    }

    move(vector : Vector2) {
        this.position = this.position.add(vector);
    }
}