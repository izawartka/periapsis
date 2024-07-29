import Vector2 from './vector2';
import World from './world';
import SpaceBody from './spaceBody';
import Planet from './planet';

export default class SpaceCraft extends SpaceBody {
    size: number;
    angle: number;
    angularVel: number = 0;
    angularAcc: number = 0;
    crashedTo: Planet | null = null;

    constructor(world: World, size: number, position: Vector2, velocity: Vector2, angle: number = 0) {
        super(world, position, velocity, 1);
        this.size = size;
        this.angle = angle;
    }

    checkCrash() {
        for(const planet of this.world.planets) {
            const distance = planet.position.sub(this.position).getMagnitude();
            if(distance > planet.radius + this.size) continue;

            this.crashedTo = planet;
        }
    }

    update(dt: number) {
        if(this.crashedTo) {
            this.position = this.position.add(this.crashedTo.deltaPos);
            this.velocity = this.velocity.add(this.crashedTo.deltaVel);
            return;
        }

        super.updatePhys(dt);

        this.checkCrash();
    }
}