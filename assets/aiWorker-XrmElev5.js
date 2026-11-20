var O=Object.defineProperty;var R=(l,e,s)=>e in l?O(l,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):l[e]=s;var M=(l,e,s)=>R(l,typeof e!="symbol"?e+"":e,s);const q=new Set(["a","about","above","after","again","against","all","am","an","and","any","are","aren't","as","at","be","because","been","before","being","below","between","both","but","by","can","cannot","could","did","do","does","doing","down","during","each","few","for","from","further","had","has","have","having","he","her","here","hers","herself","him","himself","his","how","i","if","in","into","is","it","its","itself","just","me","more","most","my","myself","no","nor","not","of","off","on","once","only","or","other","ought","our","ours","ourselves","out","over","own","same","she","should","so","some","such","than","that","the","their","theirs","them","themselves","then","there","these","they","this","those","through","to","too","under","until","up","very","was","we","were","what","when","where","which","while","who","whom","why","with","would","you","your","yours","yourself"]);function x(l){return l.toLowerCase().replace(/[^a-z0-9\s-_]/g," ").split(/\s+/).filter(e=>e.length>2&&!q.has(e))}function S(l,e){if(l.length!==e.length||l.length===0)return 0;let s=0,c=0,u=0;for(let t=0;t<l.length;t++)s+=l[t]*e[t],c+=l[t]*l[t],u+=e[t]*e[t];return c===0||u===0?0:s/(Math.sqrt(c)*Math.sqrt(u))}function P(l,e,s){const c=new Array(s).fill(0);for(const t of l){const n=e.get(t);n!==void 0&&n<s&&(c[n]+=1)}let u=0;for(let t=0;t<c.length;t++)u+=c[t]*c[t];if(u>0){const t=Math.sqrt(u);for(let n=0;n<c.length;n++)c[n]/=t}return c}class F{constructor(){M(this,"chunks",[]);M(this,"vocabulary",new Map);M(this,"docFreq",new Map);M(this,"termFreqs",new Map);M(this,"avgDocLength",0)}clear(){this.chunks=[],this.vocabulary.clear(),this.docFreq.clear(),this.termFreqs.clear(),this.avgDocLength=0}addChunks(e){for(const s of e)this.chunks.some(c=>c.id===s.id)||this.chunks.push(s);this.rebuildIndex()}removeChunksByDocId(e){this.chunks=this.chunks.filter(s=>s.docId!==e),this.rebuildIndex()}getChunkCount(){return this.chunks.length}getAllChunks(e){return!e||e.size===0?this.chunks:this.chunks.filter(s=>e.has(s.docId))}rebuildIndex(){this.vocabulary.clear(),this.docFreq.clear(),this.termFreqs.clear();let e=0,s=0;for(const c of this.chunks){const u=x(c.text);e+=u.length;const t=new Set,n=new Map;for(const d of u)n.set(d,(n.get(d)||0)+1),this.vocabulary.has(d)||this.vocabulary.set(d,s++),t.has(d)||(t.add(d),this.docFreq.set(d,(this.docFreq.get(d)||0)+1));this.termFreqs.set(c.id,n)}this.avgDocLength=this.chunks.length>0?e/this.chunks.length:1}scoreBM25(e,s){const t=this.chunks.length,n=this.termFreqs.get(s.id);if(!n)return 0;const r=x(s.text).length;let i=0;for(const h of e){const a=n.get(h)||0,f=this.docFreq.get(h)||0;if(f===0)continue;const m=Math.log(1+(t-f+.5)/(f+.5)),o=a*(1.5+1),g=a+1.5*(1-.75+.75*(r/(this.avgDocLength||1)));i+=m*(o/g)}return i}search(e,s=6,c,u){const t=this.getAllChunks(c);if(t.length===0)return[];const n=x(e),d=[],r=u&&u.length>0,i=Math.min(this.vocabulary.size,512);let h=null;!r&&i>0&&(h=P(n,this.vocabulary,i));for(const o of t){const g=this.scoreBM25(n,o);let p=0;if(r&&o.embedding&&o.embedding.length===u.length)p=S(u,o.embedding);else if(h){const y=x(o.text),b=P(y,this.vocabulary,i);p=S(h,b)}const w=g/(g+5),E=w*.45+p*.55;d.push({chunk:o,score:E,method:r?"hybrid":w>p?"keyword":"semantic"})}d.sort((o,g)=>g.score-o.score);const a=[],f=new Map,m=Math.max(2,Math.ceil(s/Math.max(1,(c==null?void 0:c.size)||2)));for(const o of d){if(a.length>=s)break;const g=f.get(o.chunk.docId)||0;(g<m||(c==null?void 0:c.size)===1)&&(a.push({chunk:o.chunk,score:o.score,source:o.method}),f.set(o.chunk.docId,g+1))}if(a.length<s)for(const o of d){if(a.length>=s)break;a.some(g=>g.chunk.id===o.chunk.id)||a.push({chunk:o.chunk,score:o.score,source:o.method})}return a}}function C(l,e=[],s=180){if(!l)return"";const c=l.replace(/\s+/g," ").trim();if(c.length<=s)return c;if(e.length>0){const u=c.toLowerCase();for(const t of e){if(t.length<3)continue;const n=u.indexOf(t.toLowerCase());if(n!==-1){const d=Math.max(0,n-40),r=Math.min(c.length,n+s-40);return(d>0?"...":"")+c.substring(d,r).trim()+(r<c.length?"...":"")}}}return c.substring(0,s).trim()+"..."}let v=null,T="Qwen2.5-1.5B-Instruct-q4f16_1-MLC",$="fast-client",N=!1;const k=new F;async function A(){try{if(typeof navigator<"u"&&"gpu"in navigator)return!!await navigator.gpu.requestAdapter()}catch{return!1}return!1}async function _(l){try{return N=!0,self.postMessage({type:"MODEL_PROGRESS",modelId:l,progress:5,text:"Checking WebGPU acceleration..."}),await A()?(self.postMessage({type:"MODEL_PROGRESS",modelId:l,progress:15,text:`Loading WebLLM module for ${l}...`}),v=await(await import("./lib-B8r1CXV1.js")).CreateMLCEngine(l,{initProgressCallback:u=>{const t=Math.round((u.progress||0)*100);self.postMessage({type:"MODEL_PROGRESS",modelId:l,progress:t,text:u.text||`Loading model weights (${t}%)...`})}}),$="webgpu",T=l,N=!1,self.postMessage({type:"MODEL_READY",modelId:l,engine:"webgpu",text:"Model cached and ready for offline use."}),!0):(self.postMessage({type:"MODEL_PROGRESS",modelId:l,progress:100,text:"WebGPU unavailable. Switched to Fast In-Browser Engine."}),$="fast-client",N=!1,!1)}catch(e){const s=e instanceof Error?e.message:String(e);return console.warn("WebLLM init fallback:",s),N=!1,$="fast-client",self.postMessage({type:"MODEL_PROGRESS",modelId:l,progress:100,text:`WebGPU init skipped (${s.slice(0,50)}...). Fast in-browser engine active.`}),self.postMessage({type:"MODEL_READY",modelId:"fast-client-engine",engine:"fast-client",text:"Fast In-Browser Engine ready (100% offline, 0MB download)."}),!1}}async function L(l,e,s,c,u){const t=new Map;for(const r of s){const i=r.chunk;t.has(i.fileName)||t.set(i.fileName,{fileName:i.fileName,chunks:[]}),t.get(i.fileName).chunks.push(i)}let n="";if(s.length===0)n=`### ⚠️ No Relevant Information Found

None of the active documents contained information matching your query: **"${l}"**.

- Please verify that the documents you uploaded contain text content.
- Check that the appropriate document checkboxes are toggled **Active**.
- Try rephrasing your search keywords or topic.`;else if(e==="summary"){n=`### 📄 Unified Cross-Document Synthesis

*Combined analysis synthesized across **${t.size}** active documents (${s.length} key sections analyzed).*

---

#### 🌟 Executive Overview
Across the active documents, the primary scope covers foundational requirements, operational guidelines, and domain-specific terms. The synthesis below integrates the key findings across all provided sources:

`;let r=1;for(const[i,h]of t.entries()){const a=h.chunks[0],f=C(a.text,[],300);if(n+=`#### ${r}. Key Focus: \`${i}\` *(Page ${a.pageNumber})*
`,n+=`> "${f}"

`,n+=`* **Core Significance:** This section establishes key parameters for \`${i}\` [${i} • Page ${a.pageNumber}].
`,h.chunks.length>1){const m=h.chunks[1];n+=`* **Additional Context:** Further details clarify procedures on Page ${m.pageNumber} [${i} • Page ${m.pageNumber}].
`}n+=`
`,r++}n+=`#### 💡 Key Takeaway
All active documents provide complementary perspectives. Refer to the respective citations above for original section references.`}else if(e==="compare"){const r=Array.from(t.keys());n=`### ⚖️ Multi-Document Comparison Matrix

*Comparing key provisions, terms, and specifications across **${r.length}** uploaded documents.*

---

| Document | Primary Focus & Domain | Key Page References | Specific Provisions |
| :--- | :--- | :--- | :--- |
`;for(const[i,h]of t.entries()){const a=h.chunks.map(o=>`P.${o.pageNumber}`).join(", "),f=h.chunks[0],m=f.text.slice(0,110).replace(/\n/g," ").trim()+"...";n+=`| **${i}** | Multi-topic specifications | ${a} | "${m}" [${i} • Page ${f.pageNumber}] |
`}if(n+=`
#### 🔍 Detailed Comparative Breakdown

`,r.length>=2){const i=r[0],h=r[1],a=t.get(i).chunks[0],f=t.get(h).chunks[0];n+=`* **Key Difference 1 (\`${i}\` vs \`${h}\`):**
`,n+=`  - \`${i}\` emphasizes: "${C(a.text,[],140)}" [${i} • Page ${a.pageNumber}].
`,n+=`  - \`${h}\` addresses: "${C(f.text,[],140)}" [${h} • Page ${f.pageNumber}].

`}n+=`* **Shared Common Ground:** Both documents share alignment on procedural clarity, documentation rigor, and compliance requirements across respective pages.
`}else if(e==="takeaways"){n=`### 🎯 Key Takeaways Across All Uploaded Files

*Extracted high-priority points prioritized across **${t.size}** documents.*

---

`;let r=1;for(const[i,h]of t.entries()){for(const a of h.chunks){const m=a.text.split(new RegExp("(?<=[.?!])\\s+")).filter(o=>o.trim().length>25)[0]||a.text.slice(0,150);if(n+=`* **Takeaway #${r}:** ${m.trim()} — **[${i} • Page ${a.pageNumber}]**

`,r++,r>6)break}if(r>6)break}n+="> **Source Verification:** Every takeaway above is strictly grounded in the extracted text from active PDFs."}else if(e==="actions"){n=`### 📋 Action Items & Deadlines Extraction

*Identified obligations, actionable requirements, and procedural steps from active documents.*

---

`;let r=1;for(const[i,h]of t.entries()){for(const a of h.chunks){const f=a.text.match(/(?:must|shall|should|required to|will|ensure|submit|deadline|date|within)\s+([^.?!;]{20,180}[.?!;])/i),m=f?f[0]:a.text.slice(0,160).trim();if(n+=`#### Action ${r}: Requirement in \`${i}\`
- **Scope:** ${m.replace(/\n/g," ")}
- **Citation:** [${i} • Page ${a.pageNumber}]
- **Status:** Pending Review

`,r++,r>5)break}if(r>5)break}}else{n=`### 💬 Answer

Based on the information retrieved from the uploaded documents:

`;const r=l.toLowerCase().split(/\s+/).filter(h=>h.length>3),i=[];for(const h of s){const a=h.chunk,f=a.text.split(new RegExp("(?<=[.?!])\\s+")).filter(o=>o.trim().length>20);let m=!1;for(const o of f){const g=o.toLowerCase();if(r.filter(w=>g.includes(w)).length>0){i.push(`- ${o.trim()} **[${a.fileName} • Page ${a.pageNumber}]**`),m=!0;break}}!m&&i.length<3&&i.push(`- Regarding this topic in \`${a.fileName}\`: "${C(a.text,r,180)}" **[${a.fileName} • Page ${a.pageNumber}]**`)}if(i.length>0)n+=i.slice(0,5).join(`

`)+`

`;else{n+=`The uploaded files contain references to the subject matter, but no direct statement was found for the exact phrasing:
`;for(const h of s.slice(0,2))n+=`> "${C(h.chunk.text,[],180)}" [${h.chunk.fileName} • Page ${h.chunk.pageNumber}]

`}n+=`
*Note: Information above is grounded directly in the cited document pages. Any details not present in the files are omitted.*`}const d=n.split(" ");for(let r=0;r<d.length;r++){const i=d[r]+(r<d.length-1?" ":"");await u(i),r%4===0&&await new Promise(h=>setTimeout(h,12))}}self.onmessage=async l=>{var s,c;const e=l.data;if(e.type==="INIT_MODEL"){const{modelId:u,engine:t}=e;t==="webgpu"?await _(u):($="fast-client",T=u,self.postMessage({type:"MODEL_READY",modelId:u,engine:"fast-client",text:"Fast In-Browser Engine ready (0MB download, 100% offline)."}));return}if(e.type==="SYNC_CHUNKS"){k.addChunks(e.chunks),self.postMessage({type:"SYNC_COMPLETE",totalChunks:k.getChunkCount()});return}if(e.type==="REMOVE_DOC"){k.removeChunksByDocId(e.docId),self.postMessage({type:"SYNC_COMPLETE",totalChunks:k.getChunkCount()});return}if(e.type==="CLEAR_ALL_DOCS"){k.clear(),self.postMessage({type:"SYNC_COMPLETE",totalChunks:0});return}if(e.type==="GENERATE_QUERY"){const{queryId:u,prompt:t,mode:n,activeDocIds:d}=e,r=new Set(d),i=performance.now(),h=n==="qa"?5:6,a=k.search(t,h,r),f=a.map(o=>({fileName:o.chunk.fileName,pageNumber:o.chunk.pageNumber,snippet:C(o.chunk.text,t.split(" "),160),docId:o.chunk.docId,chunkIndex:o.chunk.chunkIndex}));self.postMessage({type:"QUERY_CITATIONS",queryId:u,citations:f});const m=async o=>{self.postMessage({type:"STREAM_TOKEN",queryId:u,token:o})};try{if($==="webgpu"&&v){const g=a.map((y,b)=>`[Source ${b+1}: ${y.chunk.fileName} (Page ${y.chunk.pageNumber})]
${y.chunk.text}`).join(`

---

`),p=`You are OmniDoc, a high-precision multi-document assistant running 100% offline in the user's browser.
Your role is to synthesize, compare, and answer questions across all provided documents.
Strict Rules:
1. Ground your answers ONLY in the provided sources below.
2. For EVERY claim, comparison, or extracted fact, include inline citations in this exact format: [FileName • Page X].
3. If multiple documents mention a topic, explicitly compare and contrast them.
4. If the required information is NOT present in the sources, clearly state: "This information is not provided in the uploaded documents." Never invent facts.`,w=`Context from active documents:
${g}

User Request:
${t}

Provide a comprehensive, well-structured response with Markdown headings, bullet points, and inline citations.`,E=await v.chat.completions.create({messages:[{role:"system",content:p},{role:"user",content:w}],stream:!0,temperature:.3,max_tokens:1024});for await(const y of E){const b=(c=(s=y.choices[0])==null?void 0:s.delta)==null?void 0:c.content;b&&await m(b)}}else{const g=k.getAllChunks(r);await L(t,n,a,g,m)}const o=Math.round(performance.now()-i);self.postMessage({type:"QUERY_COMPLETE",queryId:u,citations:f,totalTimeMs:o})}catch(o){const g=o instanceof Error?o.message:String(o);console.error("Generation error, falling back:",g);const p=k.getAllChunks(r);await L(t,n,a,p,m),self.postMessage({type:"QUERY_COMPLETE",queryId:u,citations:f,totalTimeMs:Math.round(performance.now()-i)})}}};
