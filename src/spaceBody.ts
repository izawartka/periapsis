import World from "./world";
import Vector2 from "./vector2";
import OrbitalPos from "./orbitalPos";
import Settings from "./settings";
import Planet from "./planet";

export default class SpaceBody {
    world: World;
    position: Vector2;
    velocity: Vector2;
    deltaPos: Vector2 = Vector2.zero();
    deltaVel: Vector2 = Vector2.zero();
    mass: number;
    noPhys: boolean;
    aac: Vector2 = Vector2.zero(); // additional acceleration (beside gravity)
    orbit: OrbitalPos | null = null;

    constructor(world: World, position: Vector2, velocity: Vector2, mass: number, noPhys: boolean = false) {
        this.world = world;
        this.position = position;
        this.velocity = velocity;
        this.mass = mass;
        this.noPhys = noPhys;
    }

    update(dt: number) {
        this.updatePhys(dt);
    }

    
    getAltitude() {
        if(!this.orbit) return 0;
        return this.orbit.getAltitude();
    }

    getRelativeVelocity() {
        if(!this.orbit) return Vector2.zero();
        return this.orbit.velocityRel;
    }

    protected updatePhys(dt: number) {
        if(this.noPhys) return;
        
        const oldPos = this.position.clone();
        const oldVel = this.velocity.clone();

        if(this.orbit !== null) {
            this.position = this.position.add(this.orbit.planet.deltaPos);
            this.velocity = this.velocity.add(this.orbit.planet.deltaVel);
        }

        let mainOrbitPlanet = null;
        let mainOrbitGravity = 0;

        for(const planet of this.world.planets) {
            // @ts-ignore
            if(planet === this) continue;
            const gravity = planet.getGravityFromPos(this.position);

            if(gravity > mainOrbitGravity) {
                mainOrbitPlanet = planet;
                mainOrbitGravity = gravity;
            }
        }

        if(mainOrbitPlanet === null) return;

        if(mainOrbitPlanet != this.orbit?.planet) {
            this.orbit = new OrbitalPos(mainOrbitPlanet);
            this.orbit.setState(this.position, this.velocity);
        }

        if(!this.aac.isZero()) {
            const deltaV = this.aac.scale(dt);
            this.velocity = this.velocity.add(deltaV);
            this.orbit.setState(this.position, this.velocity);
        }

        this.orbit.update(dt);
        this.velocity = this.orbit.velocity;
        this.position = this.orbit.position;
        
        this.deltaPos = this.position.sub(oldPos);
        this.deltaVel = this.velocity.sub(oldVel);
    }
}