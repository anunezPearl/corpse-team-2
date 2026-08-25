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
function sendJson(response,status,data){ response.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}); response.end(JSON.stringify(data)); }
async function readJson(request){
  let body='';
  for await(const chunk of request){ body+=chunk; if(body.length>10000) throw new Error('Request is too large.'); }
  return JSON.parse(body||'{}');
}

async function makeRhyme(word){
  const baseUrl=process.env.LITELLM_BASE_URL?.replace(/\/$/,'');
  const apiKey=process.env.LITELLM_API_KEY;
  if(!baseUrl||!apiKey) throw new Error('LiteLLM is not configured.');
  const llmResponse=await fetch(`${baseUrl}/chat/completions`,{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'openai/gpt-4.1-mini-2025-04-14',temperature:.9,max_tokens:120,
      response_format:{type:'json_object'},
      messages:[
        {role:'system',content:'You are a playful rhyme writer. Return only JSON with exactly two string fields: rhyme and lyric. The rhyme must be a real word that rhymes with the user word. The lyric must be one short, original, family-friendly song lyric about a bot named Pearl, and must naturally use both the user word and the rhyme word.'},
        {role:'user',content:`Word: ${word}`}
      ]
    })
  });
  if(!llmResponse.ok) throw new Error(`LiteLLM returned ${llmResponse.status}.`);
  const completion=await llmResponse.json();
  const result=JSON.parse(completion.choices?.[0]?.message?.content||'{}');
  if(typeof result.rhyme!=='string'||typeof result.lyric!=='string') throw new Error('Unexpected LiteLLM response.');
  return {rhyme:result.rhyme.trim(),lyric:result.lyric.trim()};
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
