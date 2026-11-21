import current from './helter-tower.js';
import legacy from './helter-legacy.js';
import {withReleasedEngine} from '../engine-release.js';
export default withReleasedEngine(current,{game:"helter",module:"helter-tower.js",legacy});
