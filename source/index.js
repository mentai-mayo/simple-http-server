
      const dirinfo = JSON.parse(`?dirinfo?`); // 本番用
      // const dirinfo = [
      //   { name: `.gitignore`, type: `file` },
      //   { name: `licence`, type: `file` },
      //   { name: `node_modules`, type: `dir` },
      //   { name: `package-lock.json`, type: `file` },
      //   { name: `package.json`, type: `file` },
      //   { name: `readme.md`, type: `file` },
      //   { name: `sample`, type: `api` },
      //   { name: `source`, type: `dir` },
      //   { name: `test`, type: `dir` },
      //   { name: `tsconfig.json`, type: `file` },
      // ]; // テスト用

      // onload
      window.addEventListener('load', ()=>{
        
        // set dirname
        const dirname = location.pathname.replace(/\/$/, '');
        document.title = dirname || '/';
        dirname.split(/\//g).forEach((name, index, array)=>{
          const elm = document.createElement('a');
          elm.innerText = name || '_';
          elm.href = index ? array.slice(0, index + 1).join('/') : '/';
          document.querySelector('#dirname').appendChild(elm);
          document.querySelector('#dirname').appendChild(((elm)=>{elm.innerText = '/'; return elm;})(document.createElement('span')));
        });

        // set children name
        dirinfo.forEach((info)=>{
          const child = document.createElement('div');
          const icon = document.querySelector('#assets > svg.icon-dir').cloneNode();
          if(info.type == 'dir')
            icon.appendChild(document.querySelector('#assets > svg.icon-dir > path').cloneNode());
          if(info.type == 'file')
            icon.appendChild(document.querySelector('#assets > svg.icon-file > path').cloneNode());
          if(info.type == 'api')
            icon.appendChild(document.querySelector('#assets > svg.icon-api > path').cloneNode());
          child.appendChild(icon);
          const anchor = document.createElement('a');
          anchor.innerText = info.name;
          anchor.href = dirname + '/' + info.name;
          child.appendChild(anchor);
          document.querySelector('#children').appendChild(child);
        });
      });
   