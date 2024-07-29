import Settings from "./settings";
import Camera from "./camera";
import Vector2 from "./vector2";
import World from "./world";
import SpaceCraft from "./spaceCraft";
import OrbitalPos from "./orbitalPos";
import Planet from "./planet";
import Helper from "./helper";

export default class Renderer {
    world!: World;
    ctx : CanvasRenderingContext2D;
    leftMouseDown : boolean = false;
    rightMouseDown : boolean = false;
    lastMousePos : Vector2 = new Vector2(0, 0);
    canvas : HTMLCanvasElement;
    canvasRect! : DOMRect;
    showVectors : boolean = Settings.showVectors;
    showOrbits : boolean = Settings.showOrbits;

    constructor() {        
        this.canvas = document.getElementById(Settings.mainCanvasID) as HTMLCanvasElement;
        if(!this.canvas) throw new Error("Canvas not found");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        this.canvas.addEventListener("wheel", (event) => {this.onScroll(event as WheelEvent)});
        this.canvas.addEventListener("mousedown", () => {this.onMouseDown(event as MouseEvent)});
        this.canvas.addEventListener("mouseup", () => {this.onMouseUp(event as MouseEvent)});
        this.canvas.addEventListener("mousemove", (event) => {this.onMouseMove(event as MouseEvent)});
        this.canvas.addEventListener("contextmenu", (event) => {this.onContextMenu(event as MouseEvent)});
        addEventListener("keydown", (event) => {this.onKeyDown(event as KeyboardEvent)});

        this.checkResize();
    }

    init(world: World) {
        this.world = world;
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.world.camera.reset();
    }
    
    checkResize() {
        const rect = this.canvas.getBoundingClientRect();
        if(rect.width == this.canvasRect?.width && rect.height == this.canvasRect?.height) return;
        this.canvasRect = rect;

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.ctx.imageSmoothingEnabled = false;
    }

    onScroll(event: WheelEvent) {
        if(event.shiftKey) {
            if(!this.world) return;
            this.world.timeScale *= 10 ** Math.sign(-event.deltaY);
            if(this.world.timeScale < 1) this.world.timeScale = 1;
            if(this.world.timeScale > Settings.maxTimeScale) this.world.timeScale = Settings.maxTimeScale;
            return;
        }

        let zoomChange = Math.pow(1.1, event.deltaY / -100);
        this.world.camera.zoomIn(zoomChange);
    }

    onMouseMove(event : MouseEvent) {
        this.lastMousePos = Vector2.fromPosEvent(event);

        if(this.rightMouseDown) {      
            let vector = Vector2.fromMoveEvent(event);
            this.world.camera.move(vector);
        }
    }

    onKeyDown(event : KeyboardEvent) {
        switch(event.key) {
            case "o":
                this.showOrbits = !this.showOrbits;
            break;
            case "v":
                this.showVectors = !this.showVectors;
            break;
            case "]":
                this.world.nextSpaceCraft();
            break;
            case "[":
                this.world.prevSpaceCraft();
            break;
            case "c":
                this.world.cloneCurrentSpaceCraft();
            break;
            case "x":
                this.world.addDefaultSpaceCraft();
            break;
            case "f":
                this.world.camera.toggleFocusMode();
            break;
        }
    }

    onMouseDown(event : MouseEvent) {
        if(event.button == 0) this.leftMouseDown = true;
        if(event.button == 2) this.rightMouseDown = true;
        
        this.lastMousePos = Vector2.fromPosEvent(event);
    }

    onMouseUp(event : MouseEvent) {
        if(event.button == 0) this.leftMouseDown = false;
        if(event.button == 2) this.rightMouseDown = false;

        this.lastMousePos = Vector2.fromPosEvent(event);
    }

    onContextMenu(event : MouseEvent) {
        event.preventDefault();
    }

    update(dt : number) {        
        this.checkResize();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.checkBooster();
 
        for(const planet of this.world.planets) {
            this.drawPlanet(planet);
        }

        for(const spaceCraft of this.world.spaceCrafts) {
            this.drawSpaceCraft(spaceCraft);
        }
    }

    worldToScreenVector(vector : Vector2) : Vector2 {
        const ccX = this.canvas.width/2 + this.world.camera.position.x + this.canvasRect.left;
        const ccY = this.canvas.height/2 + this.world.camera.position.y + this.canvasRect.top;
        const zoom = this.world.camera.zoom;

        return new Vector2(
            vector.x * zoom + ccX,
            vector.y * zoom + ccY
        );
    }

    checkBooster() {
        const spacecraft = this.world.currentSpaceCraft;

        if(!this.leftMouseDown) {
            spacecraft.aac = Vector2.zero();
            return;
        }

        const spacecraftScreenPos = this.worldToScreenVector(spacecraft.position);
        const vector = this.lastMousePos.sub(spacecraftScreenPos).normalize();
        spacecraft.aac = vector.scale(Settings.world.spaceCraft.boosterForce);

        if(this.world.timeScale > Settings.maxSimplePhysicsTimeScale) {
            this.world.timeScale = Settings.maxSimplePhysicsTimeScale;
        }
    }

    drawPlanet(planet : Planet) {
        const planetScreenPos = this.worldToScreenVector(planet.position);
        const planetRadius = planet.radius * this.world.camera.zoom;

        this.ctx.fillStyle = planet.color;
        this.ctx.beginPath();
        this.ctx.arc(planetScreenPos.x, planetScreenPos.y, planetRadius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawSpaceCraft(spaceCraft : SpaceCraft) {
        const isCurrent = spaceCraft == this.world!.currentSpaceCraft;
        const color = isCurrent ? Settings.colors.currentSpaceCraft : Settings.colors.otherSpaceCrafts;
        const screenPos = this.worldToScreenVector(spaceCraft.position);

        this.ctx.fillStyle = color;
        
        this.ctx.beginPath();
        this.ctx.translate(screenPos.x, screenPos.y);
        this.ctx.rotate(spaceCraft.angle);
        this.ctx.moveTo(0, -spaceCraft.size);
        this.ctx.lineTo(spaceCraft.size, spaceCraft.size);
        this.ctx.lineTo(-spaceCraft.size, spaceCraft.size);
        this.ctx.fill();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        if(spaceCraft.crashedTo !== null) {
            return;
        }

        if(this.showVectors) {
            this.drawSpaceCraftVector(
                spaceCraft, 
                spaceCraft.getRelativeVelocity().scale(Settings.shownVelocityScale),
                Settings.colors.velocity
            );

            this.drawSpaceCraftVector(
                spaceCraft,
                this.world.getGravity(spaceCraft.position).scale(Settings.shownForceScale),
                Settings.colors.gravity
            );

            this.drawSpaceCraftVector(
                spaceCraft,
                spaceCraft.aac.scale(Settings.shownForceScale),
                Settings.colors.booster
            );
        }

        if(this.showOrbits) {
            this.drawOrbit(spaceCraft.orbit, isCurrent);
        }
    }

    drawSpaceCraftVector(spacecraft : SpaceCraft, vector : Vector2, color : string) {
        const spacecraftScreenPos = this.worldToScreenVector(spacecraft.position);
        const endScreenPos = spacecraftScreenPos.add(vector);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(spacecraftScreenPos.x, spacecraftScreenPos.y);
        this.ctx.lineTo(endScreenPos.x, endScreenPos.y);
        this.ctx.stroke();
    }

    drawOrbit(orbit: OrbitalPos | null, isCurrent: boolean = false) {
        if(orbit === null) return;
        
        const center = this.worldToScreenVector(orbit.centre);
    
        this.ctx.strokeStyle = isCurrent ? Settings.colors.orbit : Settings.colors.otherOrbits;
        this.ctx.lineWidth = 1;
    
        if (orbit.isHyperbolic()) {
            this.ctx.beginPath();
            const points = this.getHyperbolicPoints(orbit);
            if (points.length > 0) {
                this.ctx.moveTo(points[0].x, points[0].y);
                for (let point of points) {
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            this.ctx.stroke();
        } else {
            const semiMajorAxis = orbit.semiMajorAxis;
            const semiMinorAxis = orbit.getSemiMinorAxis();
    
            this.ctx.beginPath();
            this.ctx.ellipse(
                center.x, 
                center.y, 
                semiMajorAxis * this.world.camera.zoom, 
                semiMinorAxis * this.world.camera.zoom, 
                orbit.omega, 
                0, 
                2 * Math.PI
            );
            this.ctx.stroke();
        }
    
        if (!isCurrent) return;
    
        const periapsisAlt = orbit.periapsis.sub(orbit.planet.position).getMagnitude() - orbit.planet.radius;
        if (periapsisAlt > 0) {
            const periapsisScr = this.worldToScreenVector(orbit.periapsis);
            this.ctx.fillStyle = Settings.colors.periapsis;
            this.ctx.beginPath();
            this.ctx.arc(periapsisScr.x, periapsisScr.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.font = '14px Verdana';
            this.ctx.fillText(Helper.distanceString(periapsisAlt), periapsisScr.x + 8, periapsisScr.y + 7);
        }
    
        const apoapsisAlt = orbit.apoapsis.sub(orbit.planet.position).getMagnitude() - orbit.planet.radius;
        if (apoapsisAlt > 0 && !orbit.isHyperbolic()) {
            const apoapsisScr = this.worldToScreenVector(orbit.apoapsis);
            this.ctx.fillStyle = Settings.colors.apoapsis;
            this.ctx.beginPath();
            this.ctx.arc(apoapsisScr.x, apoapsisScr.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.font = '14px Verdana';
            this.ctx.fillText(Helper.distanceString(apoapsisAlt), apoapsisScr.x + 8, apoapsisScr.y + 7);
        }
    }
    
    getHyperbolicPoints(orbit: OrbitalPos): Vector2[] {
        const a = orbit.semiMajorAxis;
        const points: Vector2[] = [];
        const step = 0.01;
        const range = 3;

        for (let theta = -range; theta <= range; theta += step) {
            const x = a * (Math.cosh(theta) - 1);
            const y = a * Math.sqrt(orbit.eccentricity * orbit.eccentricity - 1) * Math.sinh(theta);

            const wPoint = new Vector2(x, y).rotate(orbit.omega).add(orbit.periapsis);
            points.push(this.worldToScreenVector(wPoint));
        }

        return points;
    }
}