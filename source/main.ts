import http from 'http';
import path from 'path';
import fs from 'fs';

import { Meta } from './app';

const ExtensionToContentType: { [ext: string]: string } = {
  
  // no extension
  '': 'text/plain', // plain text

  // text
  '.txt':    'text/plain',      // plain text
  '.json':   'text/json',       // json
  '.jsonld': 'text/json+ld',    // json-ld
  '.csv':    'text/csv',        // csv
  '.html':   'text/html',       // html
  '.htm':    'text/html',       // html
  '.css':    'text/css',        // css
  '.js':     'text/javascript', // javascript
  '.mjs':    'text/javascript', // javascript
  '.svg':    'image/svg+xml',   // svg
  '.xml':    'text/xml',        // xml

  // image
  '.jpg':  'image/jpeg', // jpeg
  '.jpeg': 'image/jpeg', // jpeg
  '.png':  'image/png',  // png
  '.gif':  'image/gif',  // gif
  '.bmp':  'image/bmp',  // bitmap

  // audio
  '.mp3':  'audio/mpeg', // mp3
  '.wav':  'audio/wav',  // wave
  '.opus': 'audio/opus', // opus

  // video
  '.mp4': 'video/mp4', // mp4

  // font
  '.otf': 'font/otf',  // OpenType format
  '.ttf': 'font/ttf',  // TrueType font

  // application data
  '.zip': 'application/zip',             // zip
  '.7z':  'application/x-7z-compressed', // 7zip
  '.pdf': 'application/pdf',             // pdf
};

async function main(meta: Meta): Promise<void>{

  // error check
  if(!meta.arguments[0]){
    console.error('ERROR:', 'need to set root-path');
    return;
  }
  /**
   * server root
   */
  const root: string = path.win32.resolve(meta.paths.current, meta.arguments[0] ?? '');
  
  // rootpath check
  if(!fs.existsSync(root)){
    console.error('ERROR:', `"${root}" is not exist`);
    return;
  }
  if(!fs.statSync(root).isDirectory()){
    console.error('ERROR:', `"${root}" is not directory`);
    return;
  }

  const server: http.Server = http.createServer();

  server.on('request', async (request: http.IncomingMessage, response: http.ServerResponse)=>{

    /**
     * request body
     */
    let body: string = '';
    request.on('data', (chunk: string)=>{
      body += chunk;
    });

    /**
     * request url
     */
    const url: string = request.url || '/';

    /**
     * request path
     */
    let reqpath: string = path.win32.resolve(root, `.${url.split('?')[0]}`);

    request.on('end', async ()=>{

      /**
       * file info
       */
      let exist: 'exist' | 'directory' | 'notfound' = 'exist';

      // check path is exist
      if(!fs.existsSync(reqpath)) exist = 'notfound';

      // check path is directory & is index.html exist
      if(exist == 'exist' && fs.statSync(reqpath).isDirectory()){
        let tmp = reqpath.replace(/(\/|\\|)$/, '\\index.html');
        if(!fs.existsSync(tmp) || fs.statSync(tmp).isDirectory())
          exist = 'directory';
        else{
          exist = 'exist';
          reqpath = tmp;
        }
      }

      // check (file/dir)name is hidden
      if(/(\/|\\)(_|\.)/.test(reqpath)) exist = 'notfound';

      if(exist != 'exist')
        console.log('x', url, '=>', reqpath, `[${exist}]`);

      if(exist != 'exist'){
        response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        if(exist == 'notfound')
          response.write('NOT_FOUND');
        else
          response.write('IS_DIRECTORY');
        response.end();
        return;
      }

      /**
       * response data
       */
      const data: any = fs.readFileSync(reqpath);

      /**
       * extension
       */
      const ext: string = reqpath.match(/\.[^\.]+$/)?.[0] ?? '';

      /**
       * content type
       */
      const contentType: string = ExtensionToContentType[ext] ?? 'application/octet-stream';

      console.log('o', url, '=>', reqpath, `[${exist}: ${contentType}]`);

      response.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
      response.write(data);
      response.end();
    });
  });

  server.listen(80, 'localhost', ()=>console.log('server start'));
}

export default main;