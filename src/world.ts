import Planet from './planet';
import Settings from './settings';
import Vector2 from './vector2';
import SpaceCraft from './spacecraft';
import OrbitalPos from './orbitalPos';

export default class World {
    planet : Planet;
    currentSpaceCraft! : SpaceCraft;
    spaceCrafts : Array<SpaceCraft> = [];
    timeScale : number = 1;

    constructor() {
        this.planet = new Planet(
            new Vector2(
                Settings.world.planet.x,
                Settings.world.planet.y
            ),
            Settings.world.planet.radius,
            Settings.world.planet.mass,
            Settings.world.planet.color
        );

        this.addDefaultSpaceCraft();

        this.timeScale = Settings.timeScale;
    }

    update(dt : number) {
        if(dt > 0.1) dt = 0.1;
        dt *= this.timeScale;

        this.spaceCrafts.forEach(spaceCraft => {
            spaceCraft.update(dt);
        });
    }

    setCurrentSpaceCraft(spaceCraft : SpaceCraft) {
        if(this.currentSpaceCraft) {
            this.currentSpaceCraft.booster = Vector2.zero();
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
        let newSpaceCraft = new SpaceCraft(
            this,
            this.currentSpaceCraft.size,
            this.currentSpaceCraft.simplePhys.position.clone(),
            this.currentSpaceCraft.simplePhys.velocity.clone()
        );
        this.addSpaceCraft(newSpaceCraft);
    }

    addDefaultSpaceCraft() {
        let newSpaceCraft = new SpaceCraft(
            this,
            Settings.world.spaceCraft.size,
            Vector2.fromArray(Settings.world.spaceCraft.position),
            Vector2.fromArray(Settings.world.spaceCraft.velocity)
        );
        this.addSpaceCraft(newSpaceCraft);
    }


    getGravity(position : Vector2) : Vector2 {
        let direction = this.planet.position.sub(position);
        let distanceSq = direction.getMagnitudeSq();
        let force = Settings.world.gravityConstant * this.planet.mass / distanceSq;

        return direction.normalize().scale(force);
    }
}