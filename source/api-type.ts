
import * as server from './server.mjs';

type apifunc = ((request: server.RequestInformation)=>(server.ResponseInformation | Promise<server.ResponseInformation>));

export default apifunc;
