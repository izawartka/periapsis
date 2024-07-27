export default class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static zero() {
        return new Vector2(0, 0);
    }

    static fromMoveEvent(event: MouseEvent) {
        return new Vector2(event.movementX, event.movementY);
    }

    static fromPosEvent(event: MouseEvent) {
        return new Vector2(event.clientX, event.clientY);
    }

    static fromArray(arr: number[]) {
        return new Vector2(arr[0], arr[1]);
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    equals(v: Vector2) {
        return this.x == v.x && this.y == v.y;
    }

    isZero() {
        return this.x == 0 && this.y == 0;
    }

    getMagnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    getMagnitudeSq() {
        return this.x * this.x + this.y * this.y;
    }

    toArray() : [number, number] {
        return [this.x, this.y];
    }

    toString(precision: number = 2) {
        return `(${this.x.toFixed(precision)}, ${this.y.toFixed(precision)})`;
    }

    add(v: Vector2) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    sub(v: Vector2) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    scale(scalar: number) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    divide(scalar: number) {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    normalize() {
        const magnitude = this.getMagnitude();

        return new Vector2(this.x / magnitude, this.y / magnitude);
    }

    dot(v: Vector2) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v: Vector2) {
        return this.x * v.y - this.y * v.x;
    }

    rotate(angle: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
}