import current from './lookup-orbit.js';
import legacy from './lookup-legacy.js';
import {withReleasedEngine} from '../engine-release.js';
export default withReleasedEngine(current,{game:"lookup",module:"lookup-orbit.js",legacy});
