import current from './curios-cabinet.js';
import legacy from './curios-legacy.js';
import {withReleasedEngine} from '../engine-release.js';
export default withReleasedEngine(current,{game:"curios",module:"curios-cabinet.js",legacy});
