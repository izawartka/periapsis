export default class FileLoader {
    static async fetchJSON(path: string) : Promise<any | null> {
        const response = await fetch(path);
        if(!response.ok) {
            console.error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
            return null;
        }

        const json = await response.json();
        if(json === null) {
            console.error(`Failed to parse JSON from ${path}`);
        }

        return json;
    }

    static async fetchBinary(path: string) : Promise<DataView | null> {
        const response = await fetch(path);
        if(!response.ok) {
            console.error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
            return null;
        }

        const buffer = await response.arrayBuffer();
        if(buffer === null) {
            console.error(`Failed to parse binary from ${path}`);
        }

        return new DataView(buffer);
    }

    static async fetchImage(path: string) : Promise<HTMLImageElement | null> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            }
            image.onerror = () => {
                console.error(`Failed to load image from ${path}`);
                resolve(null);
            }
            image.src = path;
        });
    }
}