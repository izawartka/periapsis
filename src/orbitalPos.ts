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
        return this.semiMajorAxis * Math.sqrt(1 - this.eccentricity * this.eccentricity);
    }

    isHyperbolic() {
        return this.eccentricity > 1;
    }

    clone() {
        return new OrbitalPos(this.planet, this.eccentricity, this.semiMajorAxis, this.omega, this.trueAnomaly, this.direction);
    }

    getDistance() {
        return this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / (1 + this.eccentricity * Math.cos(this.trueAnomaly));
    }

    getAltitude() {
        return this.getDistance() - this.planet.radius;
    }

    getGravity() {
        return this.planet.getGravity(this.position);
    }

    update(dt: number) {
        const eccentricAnomaly = 2 * Math.atan(Math.sqrt((1 - this.eccentricity) / (1 + this.eccentricity)) * Math.tan(this.trueAnomaly / 2));
        const meanAnomaly = eccentricAnomaly - this.eccentricity * Math.sin(eccentricAnomaly);
        const meanMotion = Math.sqrt(this.planet.getGravitionalParameter() / Math.pow(this.semiMajorAxis, 3));
        const newMeanAnomaly = meanAnomaly + meanMotion * dt * this.direction;
        const newEccentricAnomaly = this.solveEccentricAnomaly(newMeanAnomaly, this.eccentricity);
        const newTrueAnomaly = 2 * Math.atan(Math.sqrt((1 + this.eccentricity) / (1 - this.eccentricity)) * Math.tan(newEccentricAnomaly / 2));

        this.trueAnomaly = newTrueAnomaly;
        this.calcOutputs();
    }

    setState(position: Vector2, velocity: Vector2) {
        const lPosition = position.sub(this.planet.position);
        const lVelocity = velocity.sub(this.planet.velocity);
        
        const r = lPosition.getMagnitude();
        const v2 = lVelocity.getMagnitudeSq();
        const mu = this.planet.getGravitionalParameter();

        const semiMajorAxis = -(mu * r) / (r * v2 - 2 * mu);
        const angularMomentum = lPosition.x * lVelocity.y - lPosition.y * lVelocity.x;
        const specificOrbitalEnergy = v2 / 2 - mu / r;

        const eccentricity = Math.sqrt(1 + (2 * specificOrbitalEnergy * angularMomentum * angularMomentum) / (mu * mu));
        const eVec = lPosition.scale(v2 / mu - 1 / r).sub(lVelocity.scale(lPosition.dot(lVelocity) / mu));
        
        const direction = angularMomentum > 0 ? 1 : -1;

        let omega = Math.atan2(eVec.y, eVec.x);
        if(omega < 0) omega += 2 * Math.PI;

        let trueAnomaly = Math.atan2(lPosition.y, lPosition.x) - omega;
        if(trueAnomaly < 0) trueAnomaly += 2 * Math.PI;

        this.position = position;
        this.velocity = velocity;
        this.semiMajorAxis = semiMajorAxis;
        this.eccentricity = eccentricity;
        this.omega = omega;
        this.trueAnomaly = trueAnomaly;
        this.direction = direction;
        
        this.calcOutputs();
    }

    private applyOmega(vector: Vector2) {
        return new Vector2(
            vector.x * Math.cos(this.omega) - vector.y * Math.sin(this.omega),
            vector.x * Math.sin(this.omega) + vector.y * Math.cos(this.omega)
        );
    }
    
    private calcCentre() {
        const e = this.eccentricity * this.semiMajorAxis;
        const x = -e * Math.cos(this.omega);
        const y = -e * Math.sin(this.omega);
        this.centre = new Vector2(x, y).add(this.planet.position);
        return this.centre;
    }
    
    private calcPosition() {
        const lx = this.getDistance() * Math.cos(this.trueAnomaly);
        const ly = this.getDistance() * Math.sin(this.trueAnomaly);

        this.position = this.applyOmega(new Vector2(lx, ly)).add(this.planet.position);
        return this.position;
    }

    private calcVelocity() {
        let mu = this.planet.getGravitionalParameter();
        let a = this.semiMajorAxis;
        let e = this.eccentricity;
        let theta = this.trueAnomaly;

        // Calculate the radial and tangential velocity components
        let Vr = this.direction * Math.sqrt(mu / a) * (e * Math.sin(theta)) / Math.sqrt(1 - e * e);
        let Vtheta = this.direction * Math.sqrt(mu / a) * (1 + e * Math.cos(theta)) / Math.sqrt(1 - e * e);

        // Convert to Cartesian coordinates
        let vx = Vr * Math.cos(theta) - Vtheta * Math.sin(theta);
        let vy = Vr * Math.sin(theta) + Vtheta * Math.cos(theta);

        this.velocity = this.applyOmega(new Vector2(vx, vy)).add(this.planet.velocity);
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
        let maxIterations = 100;
        let iterations = 0;
        while(iterations < maxIterations) {
            let f = eccentricAnomaly - excenticity * Math.sin(eccentricAnomaly) - meanAnomaly;
            let df = 1 - excenticity * Math.cos(eccentricAnomaly);
            let delta = -f / df;
            eccentricAnomaly += delta;
            if(Math.abs(delta) < 1e-6) {
                return eccentricAnomaly;
            }
            iterations++;
        }
        return eccentricAnomaly;
    }    
}