import Settings from "./settings";
import Vector2 from "./vector2";

export enum CameraFocusMode {
    SpaceCraft,
    Planet,
    None
}

export default class Camera {
    position!: Vector2;
    zoom!: number;
    focusMode!: CameraFocusMode;
    
    constructor() {
        this.reset();
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
    
    toggleFocusMode() {
        this.focusMode = (this.focusMode + 1) % 3;
    }

    getFocusModeString() {
        switch(this.focusMode) {
            case CameraFocusMode.SpaceCraft:
                return "SpaceCraft";
            case CameraFocusMode.Planet:
                return "Planet";
            default:
                return "None";
        }
    }

    reset() {
        this.position = Settings.camera.startPos.clone();
        this.zoom = Settings.camera.startZoom;
        this.focusMode = Settings.camera.focusMode;
    }
}