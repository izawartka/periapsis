import Vector2 from './vector2';
import World from './world';
import OrbitalPos from './orbitalPos';
import Settings from './settings';
import SpaceBody from './spaceBody';
import Planet from './planet';

export default class SpaceCraft extends SpaceBody {
    size: number;
    booster: Vector2 = new Vector2(0, 0);
    crashedOrbit: OrbitalPos | null = null;
    orbits: Array<OrbitalPos> = [];

    constructor(world: World, size: number, position: Vector2, velocity: Vector2) {
        super(world, position, velocity, 1);
        this.size = size;
    }

    checkCrash() {
        for(const orbit of this.orbits) {
            if(orbit.getAltitude() >= 0) continue;

            this.crashedOrbit = orbit;
            console.log('Crashed!');
            break;
        }
    }

    update(dt: number) {
        if(this.crashedOrbit) {
            this.position = this.crashedOrbit.planet.position.add(this.crashedOrbit.positionRel);
            this.velocity = this.crashedOrbit.planet.velocity;
            return;
        }

        this.aac = this.booster;

        super.updatePhys(dt);

        this.checkCrash();
    }
}