import Settings from "./settings";
import World from "./world";

export default class InfoUI {
    world!: World;
    div : HTMLDivElement;

    constructor() {        
        this.div = document.getElementById(Settings.infoUIDivID) as HTMLDivElement;
        if(!this.div) throw new Error("Div not found");
    }

    init(world: World) {
        this.world = world;
    }
    
    update(dt: number) {
        const spacecraft = this.world.currentSpaceCraft;
        if(!spacecraft) return;

        const spacecraftIndex = this.world.spaceCrafts.indexOf(spacecraft);
        const spacecraftCount = this.world.spaceCrafts.length;
        
        let html = `
            <table>
            <tr>
                <td>FPS:</td>
                <td>${(1 / dt).toFixed(2)}</td>
            </tr>
            <tr>
                <td>Time scale:</td>
                <td>${this.world.timeScale}</td>
            </tr>
            <tr>
                <td>Spacecraft:</td>
                <td>${spacecraftIndex + 1} / ${spacecraftCount}</td>
            </tr>
            <tr>
                <td>Position:</td>
                <td>${spacecraft.simplePhys.position.toString()} [m]</td>
            </tr>
            <tr>
                <td>Altitude:</td>
                <td>${spacecraft.orbit.getAltitude().toFixed(2)} m</td>
            </tr>
            <tr>
                <td>Velocity:</td>
                <td>${spacecraft.simplePhys.velocity.getMagnitude().toFixed(2)} m/s</td>
            </tr>
        `;

        if(spacecraft.crashed) {
            html += "<tr><td>Crashed!</td></tr>";
        }

        html += "</table>";

        this.div.innerHTML = html;
    }

}