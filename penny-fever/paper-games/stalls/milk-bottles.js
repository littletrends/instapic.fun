import current from './milk-match-crates.js';
import legacy from './milk-bottles-legacy.js';
import {withReleasedEngine} from '../engine-release.js';
export default withReleasedEngine(current,{game:"milk-bottles",module:"milk-match-crates.js",legacy});
