import http from 'http';

export type RequestInformation = {

  /**
   * request body
   */
  body: string;

  /**
   * request url
   */
  url: URL;

  /**
   * request headers
   */
  headers: { [key: string]: (string | string[] | undefined) };

  /**
   * request method
   */
  method: string,

  /**
   * client ip address
   */
  ipaddr: string;

  /**
   * request timing
   */
  time: Date;
};

export type ResponseInformation = {

  /**
   * response body
   */
  body: any;

  /**
   * response status code
   */
  status: number;

  /**
   * response headers
   */
  headers: { [key: string]: string }
};

export class Server {

  // ----- private -----

  private server: http.Server;
  private host: string;
  private port: number;

  private getClientIpAddress(request: http.IncomingMessage): string{
    let result = request.headers['x-forwarded-for'] || request.connection?.remoteAddress || request.socket?.remoteAddress || '';
    return result instanceof Array ? result[0] ?? '' : result;
  }

  // ----- public -----
  
  public constructor(host: string = 'localhost', port: number = 8080){
    
    this.server = http.createServer();

    this.host = host;
    this.port = port;
  }

  public set onRequest(callback: (request: RequestInformation)=>(ResponseInformation | Promise<ResponseInformation>)){
    
    this.server.on('request', (request: http.IncomingMessage, response: http.ServerResponse)=>{

      let time: Date = new Date();

      /**
       * request body
       */
      let body: string = '';
      request.on('data', (chunk: any)=>body+=chunk);

      /**
       * request url
       */
      const url: string = request.url || '/';

      // on request end
      request.on('end', async ()=>{

        const reqInfo: RequestInformation = {
          body,
          url: new URL(`http://${this.host}:${this.port}${url}`),
          headers: request.headers,
          method: request.method ?? '',
          ipaddr: this.getClientIpAddress(request),
          time,
        };

        const resInfo = await callback(reqInfo);

        response.writeHead(resInfo.status, resInfo.headers);
        response.write(resInfo.body);
        response.end();
      });
    });
  }

  public listen(): void{
    this.server.listen(this.port, this.host, ()=>console.log(`server start at ${this.host}:${this.port}`));
  }
};
