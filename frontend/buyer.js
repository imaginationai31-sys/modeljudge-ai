const keyInput=document.getElementById("apiKey");
const releasesEl=document.getElementById("releases");
const statusEl=document.getElementById("status");
const previewEl=document.getElementById("preview");
const usageEl=document.getElementById("usage");
const saved=sessionStorage.getItem("modeljudge_buyer_key");
if(saved) keyInput.value=saved;
function key(){return keyInput.value.trim();}
async function api(path,options={}){const res=await fetch(`/api/buyer${path}`,{...options,headers:{"Content-Type":"application/json","X-API-Key":key(),...(options.headers||{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`Request failed (${res.status})`);return data;}
function setStatus(text,bad=false){statusEl.textContent=text;statusEl.className=`status${bad?" danger":""}`;}
function esc(s){return String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
async function load(){if(!key())return setStatus("Enter a buyer API key",true);sessionStorage.setItem("modeljudge_buyer_key",key());setStatus("Connected");try{const [data,usage,keys]=await Promise.all([api("/releases"),api("/usage"),api("/keys")]);releasesEl.innerHTML=data.versions.length?data.versions.map(v=>`<div class="release"><div><strong>v${esc(v)}</strong><span class="muted"> Immutable release</span></div><div class="buttonrow"><button class="button secondary" data-v="${esc(v)}">Inspect</button><a class="button primary" href="/api/buyer/releases/${encodeURIComponent(v)}/dataset?format=jsonl" target="_blank">Download JSONL</a><a class="button secondary" href="/api/buyer/releases/${encodeURIComponent(v)}/dataset?format=csv" target="_blank">CSV</a></div></div>`).join(""):"<div class='empty'>No releases published yet.</div>";releasesEl.querySelectorAll("button[data-v]").forEach(b=>b.onclick=()=>inspect(b.dataset.v));usageEl.innerHTML=`<strong>${usage.total_downloads||0}</strong> downloads · <strong>${usage.records_downloaded||0}</strong> records · <strong>${usage.versions_downloaded||0}</strong> versions<br><small>${keys.keys?.length||0} API key(s) associated with this buyer</small>`;}catch(e){setStatus(e.message,true);releasesEl.innerHTML="<div class='empty'>Unable to load buyer data.</div>";usageEl.textContent="Unable to load usage.";}}
async function inspect(v){try{const [manifest,quality]=await Promise.all([api(`/releases/${encodeURIComponent(v)}/manifest`),api(`/releases/${encodeURIComponent(v)}/quality`)]);previewEl.textContent=JSON.stringify({manifest,quality},null,2);}catch(e){previewEl.textContent=e.message;}}
document.getElementById("connect").onclick=load;
document.getElementById("clear").onclick=()=>{sessionStorage.removeItem("modeljudge_buyer_key");keyInput.value="";setStatus("Not connected");releasesEl.innerHTML="<div class='empty'>Connect to load releases.</div>";usageEl.textContent="No usage details.";previewEl.textContent="No release selected.";};
if(saved)load();
