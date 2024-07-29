import Vector2 from './vector2';
import Planet from './planet';
import Settings from './settings';

export default class OrbitalPos {
    planet: Planet;
    eccentricity: number;
    semiMajorAxis: number;
    omega: number; // Argument of periapsis
    trueAnomaly: number;
    direction: number = 1;

    positionRel!: Vector2;
    velocityRel!: Vector2;
    position!: Vector2;
    velocity!: Vector2;
    centre!: Vector2;
    periapsis: Vector2 = new Vector2(0, 0);
    apoapsis: Vector2 = new Vector2(0, 0);

    constructor(planet: Planet, eccentricity: number = 0, semiMajorAxis: number = 0, omega: number = 0, trueAnomaly: number = 0, direction: number = 1) {
        this.planet = planet;
        this.eccentricity = eccentricity;
        this.semiMajorAxis = semiMajorAxis;
        this.omega = omega;
        this.trueAnomaly = trueAnomaly;
        this.direction = direction;

        this.calcOutputs();
    }
    
    getSemiMinorAxis() {
        if(this.isHyperbolic()) {
            return this.semiMajorAxis * Math.sqrt(this.eccentricity * this.eccentricity - 1);
        } else {
            return this.semiMajorAxis * Math.sqrt(1 - this.eccentricity * this.eccentricity);
        }
    }

    isHyperbolic() {
        return this.eccentricity > 1;
    }

    clone() {
        return new OrbitalPos(this.planet, this.eccentricity, this.semiMajorAxis, this.omega, this.trueAnomaly, this.direction);
    }

    getDistance() {
        if(this.isHyperbolic()) {
            return -this.semiMajorAxis * (this.eccentricity * this.eccentricity - 1) / (1 + this.eccentricity * Math.cos(this.trueAnomaly));
        } else {
            return this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / (1 + this.eccentricity * Math.cos(this.trueAnomaly));
        }
    }

    getAltitude() {
        return this.getDistance() - this.planet.radius;
    }

    getGravity() {
        return this.planet.getGravityVector(this.position);
    }

    update(dt: number) {
        if(this.isHyperbolic()) {
            this.updateHyperbolic(dt);
        } else {
            this.updateParabolic(dt);
        }

        this.calcOutputs();
    }

    private updateHyperbolic(dt: number) {
        const hyperbolicAnomaly = 2 * Math.atanh(Math.sqrt((this.eccentricity - 1) / (this.eccentricity + 1)) * Math.tan(this.trueAnomaly / 2));
        const meanAnomaly = this.eccentricity * Math.sinh(hyperbolicAnomaly) - hyperbolicAnomaly;
        const meanMotion = Math.sqrt(this.planet.getGravitionalParameter() / -Math.pow(this.semiMajorAxis, 3));
        const newMeanAnomaly = meanAnomaly + meanMotion * dt * this.direction;
        const newHyperbolicAnomaly = this.solveHyperbolicAnomaly(newMeanAnomaly, this.eccentricity);
        let newTrueAnomaly = 2 * Math.atan(Math.sqrt((this.eccentricity + 1) / (this.eccentricity - 1)) * Math.tanh(newHyperbolicAnomaly / 2));
        if(newTrueAnomaly < 0) newTrueAnomaly += 2*Math.PI;

        this.trueAnomaly = newTrueAnomaly;
    }

    private updateParabolic(dt: number) {
        const eccentricAnomaly = 2 * Math.atan(Math.sqrt((1 - this.eccentricity) / (1 + this.eccentricity)) * Math.tan(this.trueAnomaly / 2));
        const meanAnomaly = eccentricAnomaly - this.eccentricity * Math.sin(eccentricAnomaly);
        const meanMotion = Math.sqrt(this.planet.getGravitionalParameter() / Math.pow(this.semiMajorAxis, 3));
        const newMeanAnomaly = meanAnomaly + meanMotion * dt * this.direction;
        const newEccentricAnomaly = this.solveEccentricAnomaly(newMeanAnomaly, this.eccentricity);
        let newTrueAnomaly = 2 * Math.atan(Math.sqrt((1 + this.eccentricity) / (1 - this.eccentricity)) * Math.tan(newEccentricAnomaly / 2));
        if(newTrueAnomaly < 0) newTrueAnomaly += 2*Math.PI;

        this.trueAnomaly = newTrueAnomaly;
    }

    setState(position: Vector2, velocity: Vector2) {
        if(position.equals(this.position) && velocity.equals(this.velocity)) {
            return;
        }

        const positionRel = position.sub(this.planet.position);
        const velocityRel = velocity.sub(this.planet.velocity);
        
        const r = positionRel.getMagnitude();
        const v2 = velocityRel.getMagnitudeSq();
        const mu = this.planet.getGravitionalParameter();
        
        const angularMomentum = positionRel.x * velocityRel.y - positionRel.y * velocityRel.x;
        const specificOrbitalEnergy = v2 / 2 - mu / r;
        const semiMajorAxis = 1 / (2 / r - v2 / mu);
        const eccentricity = Math.sqrt(1 + (2 * specificOrbitalEnergy * angularMomentum * angularMomentum) / (mu * mu));

        const eVec = positionRel.scale(v2 / mu - 1 / r).sub(velocityRel.scale(positionRel.dot(velocityRel) / mu));
        
        const direction = angularMomentum > 0 ? 1 : -1;

        let omega = Math.atan2(eVec.y, eVec.x);
        if(omega < 0) omega += 2 * Math.PI;

        let trueAnomaly = Math.atan2(positionRel.y, positionRel.x) - omega;
        if(trueAnomaly < 0) trueAnomaly += 2 * Math.PI;

        this.positionRel = positionRel;
        this.position = position;
        this.velocityRel = velocityRel;
        this.velocity = velocity;
        this.semiMajorAxis = semiMajorAxis;
        this.eccentricity = eccentricity;
        this.omega = omega;
        this.trueAnomaly = trueAnomaly;
        this.direction = direction;
        
        this.calcOutputs();
    }

    private applyOmega(vector: Vector2) {
        return vector.rotate(this.omega);
    }
    
    private calcCentre() {
        const e = this.eccentricity * this.semiMajorAxis;
        const x = -e * Math.cos(this.omega);
        const y = -e * Math.sin(this.omega);
        this.centre = new Vector2(x, y).add(this.planet.position);
        return this.centre;
    }
    
    private calcPosition() {
        let lx, ly;
        if (this.isHyperbolic()) {
            lx = this.getDistance() * Math.cos(this.trueAnomaly);
            ly = this.getDistance() * Math.sin(this.trueAnomaly);
        } else {
            lx = this.getDistance() * Math.cos(this.trueAnomaly);
            ly = this.getDistance() * Math.sin(this.trueAnomaly);
        }
    
        this.positionRel = this.applyOmega(new Vector2(lx, ly));
        this.position = this.positionRel.add(this.planet.position);
        return this.position;
    }
    
    private calcVelocity() {
        let mu = this.planet.getGravitionalParameter();
        let a = this.semiMajorAxis;
        let e = this.eccentricity;
        let theta = this.trueAnomaly;

        let Vr, Vt;
        if (this.isHyperbolic()) {
            Vr = Math.sqrt(mu / -a) * (e * Math.sin(theta)) / Math.sqrt(e * e - 1);
            Vt = Math.sqrt(mu / -a) * (1 + e * Math.cos(theta)) / Math.sqrt(e * e - 1);
        } else {
            Vr = Math.sqrt(mu / a) * (e * Math.sin(theta)) / Math.sqrt(1 - e * e);
            Vt = Math.sqrt(mu / a) * (1 + e * Math.cos(theta)) / Math.sqrt(1 - e * e);
        }

        let vx = (Vr * Math.cos(theta) - Vt * Math.sin(theta)) * this.direction;
        let vy = (Vr * Math.sin(theta) + Vt * Math.cos(theta)) * this.direction;

        this.velocityRel = this.applyOmega(new Vector2(vx, vy));
        this.velocity = this.velocityRel.add(this.planet.velocity);
        return this.velocity;
    }

    private calcPeriapasis() {
        const e = (1 - this.eccentricity) * this.semiMajorAxis;
        const x = e * Math.cos(this.omega);
        const y = e * Math.sin(this.omega);
        this.periapsis = new Vector2(x, y).add(this.planet.position);
        return this.periapsis;
    }

    private calcApoapsis() {
        const e = (1 + this.eccentricity) * this.semiMajorAxis;
        const x = -e * Math.cos(this.omega);
        const y = -e * Math.sin(this.omega);
        this.apoapsis = new Vector2(x, y).add(this.planet.position);
        return this.apoapsis;
    }

    private calcOutputs() {
        this.calcPosition();
        this.calcVelocity();
        this.calcCentre();
        this.calcApoapsis();
        this.calcPeriapasis();
    }

    private solveEccentricAnomaly(meanAnomaly: number, excenticity: number) {
        let eccentricAnomaly = meanAnomaly;
        let delta;
        do {
            let f = eccentricAnomaly - excenticity * Math.sin(eccentricAnomaly) - meanAnomaly;
            let df = 1 - excenticity * Math.cos(eccentricAnomaly);
            delta = -f / df;
            eccentricAnomaly += delta;
        } while (Math.abs(delta) >= 1e-6);
        return eccentricAnomaly;
    }
    
    private solveHyperbolicAnomaly(meanAnomaly: number, eccentricity: number) {
        let hyperbolicAnomaly = meanAnomaly;
        let delta;
        do {
            let f = eccentricity * Math.sinh(hyperbolicAnomaly) - hyperbolicAnomaly - meanAnomaly;
            let df = eccentricity * Math.cosh(hyperbolicAnomaly) - 1;
            delta = -f / df;
            hyperbolicAnomaly += delta;
        } while (Math.abs(delta) >= 1e-6);

        return hyperbolicAnomaly;
    }
}