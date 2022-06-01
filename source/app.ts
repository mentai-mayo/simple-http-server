import process from 'process';

import main from './main';

export type Meta = {

  /**
   * command-line arguments
   */
  arguments: string[];

  /**
   * options
   */
  options: Map<string, string | true>;

  /**
   * path list
   */
  paths: {

    /**
     * path of node.exe
     */
    nodejs: string;

    /**
     * path of app.js
     */
    appjs: string;

    /**
     * current directory
     */
    current: string;
  };
};

const paths = {
  nodejs: process.argv[0] ?? '',
  appjs: process.argv[1] ?? '',
  current: process.cwd(),
};
const options: Map<string, string | true> = new Map();
const argv: string[] = [];

function init(): void{

  // set options / argv
  let key: string | null = null;
  process.argv.slice(2).forEach((str: string)=>{
    if(/^-(-|)/.test(str)){
      if(key) options.set(key, true);
      key = str;
    } else{
      if(key){
        options.set(key, str);
        key = null;
      } else argv.push(str);
    }
  });
}

// ----- process start -----
init();
main({ arguments: argv, options: options, paths: paths });
