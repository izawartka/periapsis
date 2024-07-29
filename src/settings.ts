import Vector2 from "./vector2";
import { CameraFocusMode } from "./camera";

const Settings = {
    infoUIDivID: "info-ui",
    mainCanvasID: "main-canvas",
    camera: {
        startPos: Vector2.zero(),
        startZoom: 2 / 100000,
        minZoom: 1 / 10000000,
        maxZoom: 1 / 100,
        focusMode: CameraFocusMode.Planet
    },
    fps: 60,
    timeScale: 1,
    maxTimeScale: 10000000,
    maxSimplePhysicsTimeScale: 1000,
    showVectors: false,
    showOrbits: true,
    shownVelocityScale: 1/40,
    shownForceScale: 40,
    colors: {
        guiText: "white",
        velocity: "white",
        booster: "green",
        gravity: "red",
        currentSpaceCraft: "white",
        otherSpaceCrafts: "gray",
        orbit: "white",
        otherOrbits: "gray",
        apoapsis: "green",
        periapsis: "red",
    },
    world: {
        planets: [
            {
                position: [0, 0],
                velocity: [0, 0],
                radius: 6371000,
                mass: 5.97219e+24,
                color: "#88aaff",
                noPhys: true,
            },
            {
                position: [363295494.90000004, 0],
                velocity: [0, 1075.8341101311357],
                radius: 1737400,
                mass: 7.34767309e+22,
                color: "#888888",
                noPhys: false,
            }
        ],
        gravityConstant: 6.67430e-11,
        spaceCraft: {
            position: [1000000 + 6371000, 0],
            velocity: [0, 7353.709409527417],
            angle: Math.PI,
            size: 8,
            color: "white",
            boosterForce: 5,
        }
    }
}

export default Settings;