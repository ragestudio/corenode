import { join } from 'path';
import getCwd from './getCwd';
export default (dir) => {
    try {
        return require(join(getCwd(), 'package.json'));
    }
    catch (error) {
        try {
            return require(join(dir, 'package.json'));
        }
        catch (error) {
            return null;
        }
    }
};
