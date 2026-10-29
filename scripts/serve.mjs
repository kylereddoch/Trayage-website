import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const args = process.argv.slice(2);
const option = (key,fallback) => args.includes(key) ? args[args.indexOf(key)+1] : fallback;
const root = resolve(option('--dir','dist'));
const port = Number(option('--port', '4173'));
const {base} = JSON.parse(await readFile(resolve(root,'build-info.json'),'utf8'));
const types = {'.webp':'image/webp','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
createServer(async (req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (base !== '/' && pathname === base.slice(0,-1)) { res.writeHead(301,{Location:base});res.end();return; }
    if (!pathname.startsWith(base)) throw new Error('Not found');
    let file=resolve(root,pathname.slice(base.length));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Not found');
    const stats=await stat(file);
    if(stats.isDirectory()) {
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'});res.end();return;}
      file=resolve(file,'index.html');
    }
    const data=await readFile(file);
    const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Length':data.length};
    if(extname(file)==='.mp4') {
      headers['Accept-Ranges']='bytes';
      const range=req.headers.range;
      if(range && req.method==='GET') {
        const match=/^bytes=(\d*)-(\d*)$/.exec(range);
        if(match && (match[1] || match[2])) {
          const start=match[1] ? Number(match[1]) : Math.max(0,data.length-Number(match[2]));
          const end=match[1] && match[2] ? Math.min(Number(match[2]),data.length-1) : data.length-1;
          if(!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start>end || start>=data.length) {
            res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;
          }
          res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});
          res.end(data.subarray(start,end+1));return;
        }
      }
    }
    res.writeHead(200,headers);
    res.end(req.method==='HEAD'?undefined:data);
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(resolve(root,'404.html')));
  }
}).listen(port,'127.0.0.1',()=>console.log(`Trayage preview: http://127.0.0.1:${port}${base}`));
