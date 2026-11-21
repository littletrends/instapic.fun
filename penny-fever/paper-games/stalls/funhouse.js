import current from './funhouse-turning.js';
import legacy from './funhouse-legacy.js';
import {withReleasedEngine} from '../engine-release.js';
export default withReleasedEngine(current,{game:"funhouse",module:"funhouse-turning.js",legacy});
