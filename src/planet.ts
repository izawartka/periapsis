import Vector2 from './vector2';
import Settings from './settings';

export default class Planet {
    position: Vector2;
    velocity: Vector2;
    radius: number;
    mass: number;
    color: string;

    constructor(position: Vector2, radius: number, mass: number, color: string) {
        this.position = position;
        this.velocity = new Vector2(0, 0);
        this.radius = radius;
        this.mass = mass;
        this.color = color;
    }

    getGravitionalParameter() {
        return Settings.world.gravityConstant * this.mass;
    }

    getGravityForce(distance: number) {
        return this.getGravitionalParameter() / (distance * distance);
    }

    getGravity(position: Vector2) {
        const distance = this.position.sub(position).getMagnitude();
        const direction = this.position.sub(position).normalize();
        return direction.scale(this.getGravityForce(distance));
    }

    getAltitude(position: Vector2) {
        return position.sub(this.position).getMagnitude() - this.radius;
    }
}