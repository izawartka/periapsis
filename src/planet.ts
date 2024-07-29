import Vector2 from './vector2';
import Settings from './settings';
import SpaceBody from './spaceBody';
import World from './world';

export default class Planet extends SpaceBody {
    radius: number;
    color: string;
    deltaPos: Vector2 = Vector2.zero();
    deltaVel: Vector2 = Vector2.zero();

    constructor(world: World, position: Vector2, velocity: Vector2, radius: number, mass: number, color: string, noPhys: boolean = false) {
        super(world, position, velocity, mass, noPhys);

        this.radius = radius;
        this.color = color;
    }

    update(dt: number) {
        const oldPos = this.position.clone();
        const oldVel = this.velocity.clone();

        this.updatePhys(dt);

        this.deltaPos = this.position.sub(oldPos);
        this.deltaVel = this.velocity.sub(oldVel);
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