import Planet from './planet';
import Settings from './settings';
import Vector2 from './vector2';
import SpaceCraft from './spaceCraft';
import SpaceBody from './spaceBody';
import Camera, { CameraFocusMode } from './camera';

export default class World {
    planets : Array<Planet> = [];
    currentSpaceCraft! : SpaceCraft;
    spaceCrafts : Array<SpaceCraft> = [];
    timeScale : number = 1;
    camera: Camera;

    constructor() {
        this.spawnPlanets();
        this.addDefaultSpaceCraft();

        this.timeScale = Settings.timeScale;
        this.camera = new Camera();
    }

    spawnPlanets() {
        Settings.world.planets.forEach(planet => {
            this.planets.push(new Planet(
                this,
                Vector2.fromArray(planet.position),
                Vector2.fromArray(planet.velocity),
                planet.radius,
                planet.mass,
                planet.color,
                planet.noPhys
            ));
        });
    }

    update(dt : number) {
        if(dt > 0.1) dt = 0.1;
        dt *= this.timeScale;
        
        this.planets.forEach(planet => {
            planet.update(dt);
        });

        this.spaceCrafts.forEach(spaceCraft => {
            spaceCraft.update(dt);
        });

        this.updateCameraFocus();
    }

    updateCameraFocus() {
        if(!this.currentSpaceCraft?.orbit) return;

        let focus;
        switch(this.camera.focusMode) {
            case CameraFocusMode.SpaceCraft:
                focus = this.currentSpaceCraft;
                break;
            case CameraFocusMode.Planet:
                focus = this.currentSpaceCraft.orbit.planet;
                break;
            default:
                return;
        }

        const deltaPos = focus.deltaPos.scale(-this.camera.zoom);
        this.camera.position = this.camera.position.add(deltaPos);
    }

    setCurrentSpaceCraft(spaceCraft : SpaceCraft) {
        if(this.currentSpaceCraft) {
            this.currentSpaceCraft.aac = Vector2.zero();
        }
        this.currentSpaceCraft = spaceCraft;
    }

    addSpaceCraft(spaceCraft : SpaceCraft) {
        this.spaceCrafts.push(spaceCraft);
        this.setCurrentSpaceCraft(spaceCraft);
    }

    nextSpaceCraft() {
        let index = this.spaceCrafts.indexOf(this.currentSpaceCraft);
        index++;
        if(index >= this.spaceCrafts.length) index = 0;
        this.setCurrentSpaceCraft(this.spaceCrafts[index]);
    }

    prevSpaceCraft() {
        let index = this.spaceCrafts.indexOf(this.currentSpaceCraft);
        index--;
        if(index < 0) index = this.spaceCrafts.length - 1;
        this.setCurrentSpaceCraft(this.spaceCrafts[index]);
    }

    cloneCurrentSpaceCraft() {
        const newSpaceCraft = this.currentSpaceCraft.clone();
        this.addSpaceCraft(newSpaceCraft);
    }

    addDefaultSpaceCraft() {
        let newSpaceCraft = new SpaceCraft(
            this,
            Settings.world.spaceCraft.size,
            Vector2.fromArray(Settings.world.spaceCraft.position),
            Vector2.fromArray(Settings.world.spaceCraft.velocity),
            Settings.world.spaceCraft.angle
        );
        this.addSpaceCraft(newSpaceCraft);
    }

    getGravity(position : Vector2, excludeBody : SpaceBody | null = null) : Vector2 {
        let force = Vector2.zero();
        this.planets.forEach(planet => {
            if(planet == excludeBody) return;
            force = force.add(planet.getGravityVector(position));
        });

        return force;
    }
}