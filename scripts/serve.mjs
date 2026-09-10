import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const args = process.argv.slice(2);
const option = (key,fallback) => args.includes(key) ? args[args.indexOf(key)+1] : fallback;
const root = resolve(option('--dir','dist'));
const port = Number(option('--port', '4173'));
const {base} = JSON.parse(await readFile(resolve(root,'build-info.json'),'utf8'));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
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
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:data);
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(resolve(root,'404.html')));
  }
}).listen(port,'127.0.0.1',()=>console.log(`Trayage preview: http://127.0.0.1:${port}${base}`));
