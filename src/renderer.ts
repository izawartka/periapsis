import Settings from "./settings";
import Camera from "./camera";
import Vector2 from "./vector2";
import World from "./world";
import SpaceCraft from "./spacecraft";

export default class Renderer {
    world!: World;
    ctx : CanvasRenderingContext2D;
    camera : Camera;
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

        this.camera = new Camera();

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
        this.camera = new Camera();
        this.leftMouseDown = false;
        this.rightMouseDown = false;
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
        this.camera.zoomIn(zoomChange);
    }

    onMouseMove(event : MouseEvent) {
        this.lastMousePos = Vector2.fromPosEvent(event);

        if(this.rightMouseDown) {      
            let vector = Vector2.fromMoveEvent(event);
            this.camera.move(vector);
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
 
        this.drawPlanet();
        this.drawSpaceCrafts();
    }

    worldToScreenVector(vector : Vector2) : Vector2 {
        const ccX = this.canvas.width/2 + this.camera.position.x + this.canvasRect.left;
        const ccY = this.canvas.height/2 + this.camera.position.y + this.canvasRect.top;
        const zoom = this.camera.zoom;

        return new Vector2(
            vector.x * zoom + ccX,
            vector.y * zoom + ccY
        );
    }

    checkBooster() {
        const spacecraft = this.world.currentSpaceCraft;

        if(!this.leftMouseDown) {
            spacecraft.booster = Vector2.zero();
            return;
        }

        const spacecraftScreenPos = this.worldToScreenVector(spacecraft.orbit.position);
        const vector = this.lastMousePos.sub(spacecraftScreenPos).normalize();
        spacecraft.booster = vector.scale(Settings.world.spaceCraft.boosterForce);

        if(this.world.timeScale > Settings.maxSimplePhysicsTimeScale) {
            this.world.timeScale = Settings.maxSimplePhysicsTimeScale;
        }
    }

    drawPlanet() {
        const planet = this.world.planet;
        const planetScreenPos = this.worldToScreenVector(planet.position);
        const planetRadius = planet.radius * this.camera.zoom;

        this.ctx.fillStyle = planet.color;
        this.ctx.beginPath();
        this.ctx.arc(planetScreenPos.x, planetScreenPos.y, planetRadius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawSpaceCrafts() {
        this.world.spaceCrafts.forEach(spacecraft => {
            const isCurrent = spacecraft == this.world!.currentSpaceCraft;
            const color = isCurrent ? Settings.colors.currentSpaceCraft : Settings.colors.otherSpaceCrafts;
            const screenPos = this.worldToScreenVector(spacecraft.simplePhys.position);

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, spacecraft.size, 0, 2 * Math.PI);
            this.ctx.fill();

            if(this.showVectors) {
                this.drawSpaceCraftVector(
                    spacecraft, 
                    spacecraft.simplePhys.velocity.scale(Settings.shownVelocityScale),
                    Settings.colors.velocity
                );
    
                this.drawSpaceCraftVector(
                    spacecraft,
                    spacecraft.orbit.getGravity().scale(Settings.shownForceScale),
                    Settings.colors.gravity
                );
    
                this.drawSpaceCraftVector(
                    spacecraft,
                    spacecraft.booster.scale(Settings.shownForceScale),
                    Settings.colors.booster
                );
            }

            if(this.showOrbits) {
                this.drawOrbit(spacecraft);
            }
        });
    }

    drawSpaceCraftVector(spacecraft : SpaceCraft, vector : Vector2, color : string) {
        const spacecraftScreenPos = this.worldToScreenVector(spacecraft.orbit.position);
        const endScreenPos = this.worldToScreenVector(spacecraft.orbit.position.add(vector));

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(spacecraftScreenPos.x, spacecraftScreenPos.y);
        this.ctx.lineTo(endScreenPos.x, endScreenPos.y);
        this.ctx.stroke();
    }

    drawOrbit(spacecraft : SpaceCraft) {
        const orbit = spacecraft.orbit;

        if(orbit.isHyperbolic()) return;

        const semiMajorAxis = orbit.semiMajorAxis;
        const semiMinorAxis = orbit.getSemiMinorAxis();
        const center = this.worldToScreenVector(orbit.centre);
        const isCurrent = spacecraft == this.world!.currentSpaceCraft;

        this.ctx.strokeStyle = Settings.colors.otherSpaceCrafts;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = isCurrent ? Settings.colors.orbit : Settings.colors.otherOrbits;
        this.ctx.beginPath();
        this.ctx.ellipse(center.x, center.y, semiMajorAxis * this.camera.zoom, semiMinorAxis * this.camera.zoom, orbit.omega, 0, 2 * Math.PI);
        this.ctx.stroke();

        if(!isCurrent) return;

        if(!orbit.periapsis.isZero()) {
            const periapsis = this.worldToScreenVector(orbit.periapsis);
            this.ctx.fillStyle = Settings.colors.periapsis;
            this.ctx.beginPath();
            this.ctx.arc(periapsis.x, periapsis.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        if(!orbit.apoapsis.isZero()) {
            const apoapsis = this.worldToScreenVector(orbit.apoapsis);
            this.ctx.fillStyle = Settings.colors.apoapsis;
            this.ctx.beginPath();
            this.ctx.arc(apoapsis.x, apoapsis.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
}