/**
 * Created by D. Hockley.
 */

import Read = require('./Read');
import Write = require('./Write');
interface BaseBusiness<T> extends Read<T>, Write<T>
{
}
export = BaseBusiness;
