import World from "./world";
import Vector2 from "./vector2";

export default class SimplePhys {
    world: World;
    position: Vector2;
    velocity: Vector2;

    constructor(world: World, position: Vector2, velocity: Vector2) {
        this.world = world;
        this.position = position;
        this.velocity = velocity;
    }

    setState(position: Vector2, velocity: Vector2) {
        this.position = position;
        this.velocity = velocity;
    }

    update(dt: number, booster: Vector2) {
        const gravity = this.world.getGravity(this.position);

        const forces = gravity.add(booster);
        const deltaV = forces.scale(dt);
        this.velocity = this.velocity.add(deltaV);

        const deltaP = this.velocity.scale(dt);
        this.position = this.position.add(deltaP);
    }

}