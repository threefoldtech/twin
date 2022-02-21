import fs from 'fs';
import PATH from 'path';
import { config } from '../config/config';

export const cacheDirectory = PATH.join(config.baseDir, '/cache');

class CacheResolver {
    private cache: Record<string, any>;

    constructor() {
        this.cache = {};
    }

    async getObject(path: string, force = false) {
        return this.get(path, force, () => {
            return JSON.parse(fs.readFileSync(path, 'utf-8'));
        });
    }

    async getString(path: string, force = false) {
        return this.get(path, force, () => {
            return fs.readFileSync(path, 'utf-8');
        });
    }

    private async get(path: string, force = false, onForce: Promise<any> | any): Promise<any> {
        if (!force) {
            const res = this.cache[path];
            if (res) {
                return res;
            }
        }

        const result = await onForce();
        this.cache[path] = result;
        return result;
    }

    set(path: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, data, err => {
                if (err) {
                    reject(err);
                    return;
                }
                this.cache[path] = data;
                resolve();
            });
        });
    }

    registerObject(path: string) {}

    private register(path: string, initData: any) {
        if (this.cache[path]) return;
    }
}

export const cacheResolver = new CacheResolver();
