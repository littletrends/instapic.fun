import current from './pinball-thunder.js';
import legacy from './pinball-legacy.js';
import {withReleasedEngine} from '../engine-release.js';
export default withReleasedEngine(current,{game:"pinball",module:"pinball-thunder.js",legacy});
