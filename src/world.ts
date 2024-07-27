import Planet from './planet';
import Settings from './settings';
import Vector2 from './vector2';
import SpaceCraft from './spaceCraft';
import SpaceBody from './spaceBody';

export default class World {
    planets : Array<Planet> = [];
    currentSpaceCraft! : SpaceCraft;
    spaceCrafts : Array<SpaceCraft> = [];
    timeScale : number = 1;

    constructor() {
        this.spawnPlanets();
        this.addDefaultSpaceCraft();

        this.timeScale = Settings.timeScale;
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

        this.planets.forEach(planet => {
            planet.registerOrbits();
        });
    }

    update(dt : number) {
        if(dt > 0.1) dt = 0.1;
        dt *= this.timeScale;

        this.spaceCrafts.forEach(spaceCraft => {
            spaceCraft.update(dt);
        });

        this.planets.forEach(planet => {
            planet.update(dt);
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
        spaceCraft.registerOrbits();
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
            this.currentSpaceCraft.position.clone(),
            this.currentSpaceCraft.velocity.clone()
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

    getGravity(position : Vector2, excludeBody : SpaceBody | null = null) : Vector2 {
        let force = Vector2.zero();
        this.planets.forEach(planet => {
            if(planet == excludeBody) return;
            force = force.add(planet.getGravity(position));
        });

        return force;
    }
}