export default class Helper {
    static distanceString(distance: number) {
        if(distance < 1000) {
            return `${distance.toFixed(2)} m`;
        } else if(distance < 1000000) {
            return `${(distance / 1000).toFixed(3)} km`;
        } else {
            return `${(distance / 1000000).toFixed(3)} Mm`;
        }
    }
}