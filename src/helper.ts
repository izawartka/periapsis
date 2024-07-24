import Vector2 from "./vector2";

export default class Helper {
    static getRandomString(length : number = 16): string {
        return Math.random().toString(36).substring(2, 2 + length);
    }

    static clamp(value : number, min : number, max : number) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(a : number, b : number, t : number) {
        return a + (b - a) * t;
    }

    static randomRange(min : number, max : number) {
        return min + Math.random() * (max - min);
    }
}