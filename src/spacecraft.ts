import Vector2 from './vector2';
import World from './world';
import OrbitalPos from './orbitalPos';
import Settings from './settings';
import SimplePhys from './simplePhys';

export default class SpaceCraft {
    size: number;
    world: World;
    booster: Vector2 = new Vector2(0, 0);
    crashed: boolean = false;
    orbit: OrbitalPos;
    simplePhys: SimplePhys;

    constructor(world: World, size: number, position: Vector2, velocity: Vector2) {
        this.world = world;
        this.size = size;

        this.simplePhys = new SimplePhys(world, position, velocity);
        this.orbit = new OrbitalPos(world.planet);
        this.orbit.setState(position, velocity);
    }

    crash() {
        this.crashed = true;
        console.log('Crashed!');
    }

    update(dt: number) {
        if(this.crashed) return;

        const doSimplePhys = !this.booster.isZero() ||
            this.orbit.isHyperbolic() ||
            Settings.forceSimplePhysics;

        if(doSimplePhys) {
            this.simplePhys.update(dt, this.booster);
            this.orbit.setState(this.simplePhys.position, this.simplePhys.velocity);
        } else {
            this.orbit.update(dt);
            this.simplePhys.setState(this.orbit.position, this.orbit.velocity);
        }

        if(this.orbit.getAltitude() < 0) {
            this.crash();
        }
    }
}