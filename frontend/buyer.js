const keyInput=document.getElementById("apiKey");
const releasesEl=document.getElementById("releases");
const statusEl=document.getElementById("status");
const previewEl=document.getElementById("preview");
const saved=sessionStorage.getItem("modeljudge_buyer_key");
if(saved) keyInput.value=saved;
function key(){return keyInput.value.trim();}
async function api(path){const res=await fetch(`/api/buyer${path}`,{headers:{"X-API-Key":key()}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`Request failed (${res.status})`);return data;}
function setStatus(text,bad=false){statusEl.textContent=text;statusEl.className=`status${bad?" danger":""}`;}
function esc(s){return String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
async function load(){if(!key())return setStatus("Enter a buyer API key",true);sessionStorage.setItem("modeljudge_buyer_key",key());setStatus("Connected");try{const data=await api("/releases");releasesEl.innerHTML=data.versions.length?data.versions.map(v=>`<div class="release"><div><strong>v${esc(v)}</strong><span class="muted"> Immutable release</span></div><div class="buttonrow"><button class="button secondary" data-v="${esc(v)}">Inspect</button><a class="button primary" href="/api/buyer/releases/${encodeURIComponent(v)}/dataset?format=jsonl">Download JSONL</a><a class="button secondary" href="/api/buyer/releases/${encodeURIComponent(v)}/dataset?format=csv">CSV</a></div></div>`).join(""):"<div class='empty'>No releases published yet.</div>";releasesEl.querySelectorAll("button[data-v]").forEach(b=>b.onclick=()=>inspect(b.dataset.v));}catch(e){setStatus(e.message,true);releasesEl.innerHTML="<div class='empty'>Unable to load release catalog.</div>";}}
async function inspect(v){try{const [manifest,quality]=await Promise.all([api(`/releases/${encodeURIComponent(v)}/manifest`),api(`/releases/${encodeURIComponent(v)}/quality`)]);previewEl.textContent=JSON.stringify({manifest,quality},null,2);}catch(e){previewEl.textContent=e.message;}}
document.getElementById("connect").onclick=load;
document.getElementById("clear").onclick=()=>{sessionStorage.removeItem("modeljudge_buyer_key");keyInput.value="";setStatus("Not connected");releasesEl.innerHTML="<div class='empty'>Connect to load releases.</div>";previewEl.textContent="No release selected.";};
if(saved)load();
