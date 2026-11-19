/* 내 기록: 연습 차시(8차시, 10차시)에서 문제마다
   걸린 시간, 시도 횟수, 처음에 쓴 틀린 답, 힌트 수를 이 태블릿에 저장했다가
   '내 기록 확인하기'를 누르면 팝업으로 보여 줘요.
   - 문제를 푸는 동안에는 시간을 보여 주지 않아요(2·3차시에 초를 보여 주니 속도 경쟁이 되었음).
   - 시간은 학생이 화면을 건드린 사이만 세요. 1분 넘게 손대지 않은 동안(선생님 설명을 듣는 시간 등)은
     1분까지만 넣어요. 그래서 '대략'의 시간이에요.
   - 학생별 기록을 어디로 보내지 않아요. 이 태블릿에만 남아요. */
(function(){
  "use strict";
  const GAP=60000;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function fmt(ms){const s=Math.round(ms/1000);if(s<1)return "1초 안";if(s<60)return s+"초";const m=Math.floor(s/60),r=s%60;return r?`${m}분 ${r}초`:`${m}분`;}
  let styled=false;
  function style(){if(styled)return;styled=true;const st=document.createElement("style");st.textContent=`
.carec-open{align-self:center}
dialog.carec{border:none;border-radius:16px;padding:0;max-width:min(760px,94vw);width:100%;max-height:88vh;background:var(--paper);color:var(--ink);box-shadow:0 10px 40px rgba(0,0,0,.35)}
dialog.carec::backdrop{background:rgba(0,0,0,.45)}
.carec-in{display:flex;flex-direction:column;gap:10px;padding:18px 18px 16px;max-height:88vh;box-sizing:border-box}
.carec-in h2{font-family:var(--display);font-size:1.6rem;margin:0;line-height:1.2}
.carec-in p{margin:0;word-break:keep-all}
.carec-note{font-size:.88rem;color:var(--muted)}
.carec-sum{font-weight:700}
.carec-wrap{overflow:auto;border:1px solid var(--line);border-radius:10px;flex:1 1 auto;min-height:0}
.carec table{border-collapse:collapse;width:100%;font-size:.95rem}
.carec th,.carec td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;word-break:keep-all}
.carec th{position:sticky;top:0;background:var(--bg);font-size:.85rem;color:var(--muted);white-space:nowrap}
.carec td.n{text-align:center;white-space:nowrap}
.carec td.w small{display:block;color:var(--muted);font-size:.82rem}
.carec .ok{color:var(--ok);font-weight:700}
.carec .yet{color:var(--muted)}
.carec-close{align-self:flex-end}`;document.head.appendChild(st);}

  window.CARec={create(o){
    const key=o.key,items=o.items,withHints=!!o.hints,title=o.title||"내가 고민한 기록";
    const byId=Object.fromEntries(items.map((it,i)=>[it.id,i]));
    let st={},cur=null,last=null;
    function load(){try{const v=JSON.parse(localStorage.getItem(key)||"{}");st=v&&typeof v.s==="object"&&v.s?v.s:{};}catch(_){st={};}}
    function save(){try{localStorage.setItem(key,JSON.stringify({v:1,s:st}));}catch(_){}}
    const rec=id=>st[id]||(st[id]={t:0,a:0,h:0,ok:false,w:"",n:""});
    load();
    /* 화면을 건드릴 때마다, 지금 푸는 문제에 지난번 손댄 뒤로 흐른 시간을 더해요(1분까지). */
    function tick(){if(cur==null||!(cur in byId))return;const r=rec(cur);const now=Date.now();if(r.ok){last=now;return;}
      if(last!=null){r.t+=Math.min(now-last,GAP);save();}last=now;}
    ["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,tick,{capture:true,passive:true}));
    document.addEventListener("visibilitychange",()=>{if(document.hidden)last=null;});
    const api={
      /* 이 문제를 지금 푸는 문제로 정해요. 지금부터 다음에 화면을 건드릴 때까지의 시간이 이 문제에 들어가요. */
      focus(id){cur=id;},
      /* 답을 낸 뒤 불러요. wrong: 틀렸을 때 보여 줄 말(처음 틀린 것만 남겨요). note: 메모(덮어써요). */
      attempt(id,ok,wrong){const r=rec(id);if(r.ok)return;r.a++;if(!ok&&wrong&&!r.w)r.w=String(wrong);if(ok)r.ok=true;save();},
      note(id,text){const r=rec(id);r.n=String(text);save();},
      hint(id){const r=rec(id);if(r.ok)return;r.h++;save();},
      clear(){st={};cur=null;last=null;save();},
      open(){style();let d=document.getElementById("carec-dlg");
        if(!d){d=document.createElement("dialog");d.id="carec-dlg";d.className="carec";d.setAttribute("aria-labelledby","carec-h");document.body.appendChild(d);
          d.addEventListener("click",e=>{if(e.target===d||e.target.closest(".carec-close"))close(d);});}
        const rows=items.filter(it=>{const r=st[it.id];return r&&(r.a||r.t>=1000||r.h);});
        const solved=items.filter(it=>st[it.id]&&st[it.id].ok),first=solved.filter(it=>st[it.id].a===1);
        const head=`<tr><th>문제</th><th>걸린 시간</th><th>시도</th>${withHints?"<th>힌트</th>":""}<th>처음에 쓴 틀린 답</th></tr>`;
        const body=rows.map(it=>{const r=st[it.id];
          return `<tr><td>${esc(it.label)}</td><td class="n">${fmt(r.t)}</td><td class="n">${r.ok?`<span class="ok">${r.a}번 만에 ✓</span>`:`<span class="yet">${r.a}번, 푸는 중</span>`}</td>${withHints?`<td class="n">${r.h?r.h+"개":"–"}</td>`:""}<td class="w">${r.w?esc(r.w):(r.a?"없음":"–")}${r.n?`<small>${esc(r.n)}</small>`:""}</td></tr>`;}).join("");
        const total=Object.values(st).reduce((s,r)=>s+r.t,0);
        d.innerHTML=`<div class="carec-in"><h2 id="carec-h">${esc(title)}</h2>
<p class="carec-sum">${sumTxt(solved)} · 한 번에 맞힌 문제 ${first.length}개${total>=1000?` · 모두 합쳐 ${fmt(total)}`:""}</p>
<p class="carec-note">여러 번 시도한 문제는 그만큼 끝까지 생각한 문제예요. 걸린 시간은 대략이에요(화면을 오래 건드리지 않은 시간은 빼고 셌어요).</p>
${rows.length?`<div class="carec-wrap"><table>${head}${body}</table></div>`:`<p>아직 푼 문제가 없어요.</p>`}
<button class="btn carec-close" type="button">닫기</button></div>`;
        if(typeof d.showModal==="function"){if(!d.open)d.showModal();}else d.setAttribute("open","");
        d.querySelector(".carec-close").focus();},
      /* 기록 버튼을 그 자리(box) 맨 아래에 붙여요 */
      mount(box){style();const b=document.createElement("button");b.type="button";b.className="btn carec-open";b.textContent="내 기록 확인하기";b.onclick=()=>api.open();box.appendChild(b);return b;},
      _state:()=>st
    };
    /* 묶음(g)이 있으면 묶음마다 푼 수를 따로 보여 줘요. 예: 기본 미션 12 / 12개 · 도전 미션 3 / 12개 */
    function sumTxt(solved){const gs=[...new Set(items.map(it=>it.g).filter(Boolean))];
      if(!gs.length)return `푼 문제 ${solved.length} / ${items.length}개`;
      return gs.map(g=>`${g} ${solved.filter(it=>it.g===g).length} / ${items.filter(it=>it.g===g).length}개`).join(" · ");}
    function close(d){if(typeof d.close==="function")d.close();else d.removeAttribute("open");}
    return api;
  }};
})();
