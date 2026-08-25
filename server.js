const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

function loadEnv(filename){
  if(!fs.existsSync(filename)) return;
  for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){
    const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if(match&&!process.env[match[1]]) process.env[match[1]]=match[2].replace(/^(['"])(.*)\1$/,'$2');
  }
}
loadEnv(path.join(__dirname,'.env'));

const PORT=Number(process.env.PORT)||3000;
const vowels=new Set(['a','e','i','o','u']);
const bandAdjectives=['Chromatic','Electric','Velvet','Neon','Cosmic','Midnight','Glitter','Turbo'];
const bandNouns=['Pancakes','Comets','Bananas','Kazoos','Jellybeans','Moonbeams','Waffles','Trombones'];
const youtubeSearches=['otters juggling', 'tiny train through snow', 'synthwave cooking show', 'moonwalk tutorial', 'goats in sweaters', 'underwater disco'];
function sendJson(response,status,data){ response.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}); response.end(JSON.stringify(data)); }
async function readJson(request){
  let body='';
  for await(const chunk of request){ body+=chunk; if(body.length>10000) throw new Error('Request is too large.'); }
  return JSON.parse(body||'{}');
}

async function makeRhyme(word){
  const query=new URLSearchParams({rel_rhy:word,max:'50'});
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);
  try{
    const rhymeResponse=await fetch(`https://api.datamuse.com/words?${query}`,{signal:controller.signal});
    if(!rhymeResponse.ok) throw new Error(`Rhyme service returned ${rhymeResponse.status}.`);
    const matches=await rhymeResponse.json();
    const rhyme=matches.find(match=>
      typeof match.word==='string'&&
      match.word.toLowerCase()!==word.toLowerCase()&&
      /^[a-z]+(?:[ '-][a-z]+)*$/i.test(match.word)
    )?.word;
    if(!rhyme) throw new Error('No rhyme found.');
    const bandName=`The ${bandAdjectives[Math.floor(Math.random()*bandAdjectives.length)]} ${bandNouns[Math.floor(Math.random()*bandNouns.length)]}`;
    const youtubeSearch=youtubeSearches[Math.floor(Math.random()*youtubeSearches.length)];
    const youtubeUrl=`https://www.youtube.com/results?${new URLSearchParams({search_query:youtubeSearch})}`;
    return {rhyme,lyric:`Pearl paired ${word} with ${rhyme}; your flow needs a tune-up, but she calls it a chart-topper!`,bandName,youtubeUrl};
  }finally{
    clearTimeout(timeout);
  }
}

http.createServer(async(request,response)=>{
  if(request.method==='GET'&&(request.url==='/'||request.url==='/index.html')){
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    fs.createReadStream(path.join(__dirname,'index.html')).pipe(response); return;
  }
  if(request.method==='POST'&&request.url==='/api/rhyme'){
    try{
      const {word:rawWord}=await readJson(request);
      const word=typeof rawWord==='string'?rawWord.trim():'';
      const ending=word.toLowerCase().match(/[a-z]$/)?.[0];
      if(!ending) return sendJson(response,400,{error:'Enter a word that ends with a letter.'});
      if(word.length>60) return sendJson(response,400,{error:'Please keep the word under 60 characters.'});
      if(vowels.has(ending)) return sendJson(response,200,{poop:true});
      return sendJson(response,200,await makeRhyme(word));
    }catch(error){ console.error(error.message); return sendJson(response,500,{error:'Pearl could not finish that rhyme. Try again.'}); }
  }
  response.writeHead(404); response.end('Not found');
}).listen(PORT,()=>console.log(`Pearl's Rhyme Machine is running at http://localhost:${PORT}`));
