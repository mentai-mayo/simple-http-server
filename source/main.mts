import fs from 'fs';
import * as _path from 'path';
import process from 'process';

import { Meta } from './app.mjs';
import * as server from './server.mjs';

async function main(meta: Meta): Promise<void>{

  /**
   * server
   */
  const webServer = new server.Server('localhost', 8080);

  /**
   * module path
   */
  const path = process.platform == 'win32' ? _path.win32 : _path;

  /**
   * default headers
   */
  const default_headers: { [key: string]: string } = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
  };

  const ContentType: { [ext: string]: string } = JSON.parse(fs.readFileSync(path.resolve(path.dirname((new URL(import.meta.url)).pathname), 'content-type.json'), { encoding: 'utf-8' }));

  /**
   * root path
   */
  const rootpath = path.resolve(process.cwd(), meta.arguments[0] || './');

  // check root
  if(!fs.existsSync(rootpath))
    throw new Error(`root "${rootpath}" is not exist`);
  if(!fs.statSync(rootpath).isDirectory())
    throw new Error(`root "${rootpath}" is exist, but it is not directory`);
  
  async function onreq(request: server.RequestInformation): Promise<server.ResponseInformation>{
    
    const filepath = path.resolve(rootpath, request.url.pathname.replace(/^\//,''));

    let file: 'notfound' | 'directory' | 'api' | 'file' = 'file';

    let apifunc: ((request: server.RequestInformation)=>(server.ResponseInformation | Promise<server.ResponseInformation>)) | null = null;

    // check is file/directory exist
    if(!fs.existsSync(filepath) || /\/(_|\.)/.test(request.url.toString())) file = 'notfound';

    // check is it directory
    if(file == 'file' && fs.statSync(filepath).isDirectory()) file = 'directory';

    // api check
    if(file == 'notfound' && !/\/(_|\.)/.test(request.url.toString()) && /^[^\.]+$/.test(path.basename(filepath)) && fs.existsSync(filepath + '.api.mjs') && !fs.statSync(filepath + '.api.mjs').isDirectory()){
      apifunc = (await import(filepath + '.api.mjs')).main as ((request: server.RequestInformation)=>(server.ResponseInformation | Promise<server.ResponseInformation>));
      file = 'api';
    }
    
    // if file notfound
    if(file == 'notfound'){
      console.log('[notfound]', request.url.toString());
      return { body: JSON.stringify({ message: 'NOT_FOUND' }), status: 404, headers: Object.assign(default_headers, { 'Content-Type': 'text/json' }) };
    }
    
    // if file exist
    if(file == 'file'){
      const data: any = fs.readFileSync(filepath);
      const contenttype = ContentType[path.extname(filepath)] ?? 'text/plain';
      console.log(`[  file  ]`, request.url.toString(), '=>', filepath);
      return { body: data, headers: Object.assign(default_headers, { 'Content-Type': contenttype }), status: 200 };
    }

    // if api request
    if(file == 'api' && apifunc !== null){
      console.log(`[  api   ]`, request.url.toString(), '=>', `call api "${filepath}.api.mjs"`);
      return apifunc(request);
    }

    // if directory
    if(file == 'directory'){
      const data: string = fs.readFileSync(path.resolve(path.dirname((new URL(import.meta.url)).pathname), './index.min.html'), { encoding: 'utf-8' });
      const children: { name: string, type: 'api' | 'file' | 'dir' }[] = [];
      fs.readdirSync(filepath).forEach((child: string)=>{
        if(/^(_|\.)/.test(child)) return;
        if(fs.statSync(path.resolve(filepath, child)).isDirectory()){
          children.push({ name: child, type: 'dir' });
          return;
        }
        if(/^[^\.]+\.api\.mjs$/.test(child)){
          if(fs.existsSync(path.resolve(filepath, child.replace(/\.api\.mjs$/, '')))) return;
          children.push({ name: child, type: 'api' });
          return;
        }
        children.push({ name: child, type: 'file' });
      });
      console.log(`[  dir   ]`, request.url.toString(), '=>', filepath);
      return { body: data.replace('?dirinfo?', JSON.stringify(children)), status: 200, headers: Object.assign(default_headers, { 'Content-Type': 'text/html' }) };
    }

    console.log(`[ error  ]`, request.url.toString());
    return { body: JSON.stringify({ message: 'INTERNAL_SERVER_ERROR' }), status: 500, headers: Object.assign(default_headers, { 'Content-Type': 'text/json' }) };
  };

  // server
  webServer.onRequest = onreq;

  webServer.listen();
}

export default main;
