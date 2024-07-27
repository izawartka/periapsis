import World from "./world";
import Vector2 from "./vector2";
import OrbitalPos from "./orbitalPos";
import Settings from "./settings";

export default class SpaceBody {
    world: World;
    position: Vector2;
    velocity: Vector2;
    mass: number;
    orbits: Array<OrbitalPos> = [];
    noPhys: boolean;
    aac: Vector2 = Vector2.zero();
    mainOrbit: OrbitalPos | null = null;

    constructor(world: World, position: Vector2, velocity: Vector2, mass: number, noPhys: boolean = false) {
        this.world = world;
        this.position = position;
        this.velocity = velocity;
        this.mass = mass;
        this.noPhys = noPhys;
    }

    registerOrbits() {
        for(const planet of this.world.planets) {
            // @ts-ignore
            if(this == planet) continue;

            const orbit = new OrbitalPos(planet);
            orbit.setState(this.position, this.velocity);
            this.orbits.push(orbit);
        }
    }

    update(dt: number) {
        this.updatePhys(dt);
    }

    
    getAltitude() {
        if(!this.mainOrbit) return 0;
        return this.mainOrbit.getAltitude();
    }

    getRelativeVelocity() {
        if(!this.mainOrbit) return Vector2.zero();
        return this.mainOrbit.velocityRel;
    }

    protected updatePhys(dt: number) {
        if(this.noPhys) return;

        if(Settings.forceSimplePhysics) {
            this.updateSimplePhys(dt);
            return;
        }

        this.mainOrbit = null;
        let mainOrbitGravitySq = 0;

        for(const orbit of this.orbits) {
            const gravity = orbit.getGravity().getMagnitudeSq();

            if(gravity > mainOrbitGravitySq) {
                this.mainOrbit = orbit;
                mainOrbitGravitySq = gravity;
            }
        }

        if(!this.mainOrbit) return;

        if(!this.aac.isZero()) {
            const gravity = this.mainOrbit.planet.getGravity(this.position);
            const acceleration = gravity.add(this.aac);
            const deltaV = acceleration.scale(dt);
            this.velocity = this.velocity.add(deltaV);
            const deltaP = this.velocity.scale(dt);
            this.position = this.position.add(deltaP);
            
            for(const orbit of this.orbits) {
                orbit.setState(this.position, this.velocity);
            }

            return;
        }

        this.mainOrbit.update(dt);
        this.velocity = this.mainOrbit.velocity;
        this.position = this.mainOrbit.position;

        for(const orbit of this.orbits) {
            orbit.setState(this.position, this.velocity);
        }
    }

    protected updateSimplePhys(dt: number) {
        const gravity = this.world.getGravity(this.position, this);
        
        const deltaV = gravity.add(this.aac).scale(dt);
        this.velocity = this.velocity.add(deltaV);
        const deltaP = this.velocity.scale(dt);
        this.position = this.position.add(deltaP);

        for(const orbit of this.orbits) {
            orbit.setState(this.position, this.velocity);
        }
    }
}