import Vector2 from './vector2';
import Settings from './settings';
import SpaceBody from './spaceBody';
import World from './world';

export default class Planet extends SpaceBody {
    radius: number;
    color: string;

    constructor(world: World, position: Vector2, velocity: Vector2, radius: number, mass: number, color: string, noPhys: boolean = false) {
        super(world, position, velocity, mass, noPhys);

        this.radius = radius;
        this.color = color;
    }

    getGravitionalParameter() {
        return Settings.world.gravityConstant * this.mass;
    }

    getGravityFromDist(distance: number) {
        return this.getGravitionalParameter() / (distance * distance);
    }

    getGravityFromPos(position: Vector2) {
        const relPos = this.position.sub(position);
        const distance = relPos.getMagnitude();
        return this.getGravityFromDist(distance);
    }

    getGravityVector(position: Vector2) {
        const relPos = this.position.sub(position);
        const distance = relPos.getMagnitude();
        const direction = relPos.normalize();
        return direction.scale(this.getGravityFromDist(distance));
    }
}