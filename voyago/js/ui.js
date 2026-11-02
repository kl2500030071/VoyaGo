function toast(message){
  const el=document.createElement('div');
  el.className='toast';
  el.textContent=message;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),3200);
}
function modal(title,body){
  const el=document.createElement('div');
  el.className='modal';
  el.innerHTML=`<div class="modal-card"><div class="row between"><h3>${title}</h3><button class="btn ghost" data-close>Close</button></div><div>${body}</div></div>`;
  el.addEventListener('click',e=>{if(e.target.matches('.modal,[data-close]'))el.remove()});
  document.body.appendChild(el);
  return el;
}
function applyTheme(){
  const settings=Store.read(KEYS.settings,{theme:'light'});
  document.documentElement.dataset.theme=settings.theme;
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.textContent=settings.theme==='dark'?'☀️':'🌙');
}
function wireTheme(){
  applyTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const s=Store.read(KEYS.settings,{theme:'light'});
    s.theme=s.theme==='dark'?'light':'dark';
    Store.write(KEYS.settings,s);
    applyTheme();
  }));
}
function renderNav(active=''){
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===active));
}
function emptyState(title='Nothing here yet',text='Your activity will appear here.'){
  return `<div class="empty"><div style="font-size:42px">✦</div><h3>${title}</h3><p>${text}</p></div>`;
}
function escapeHtml(s){
  return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

function inventoryCities(){
  const inv=Store.read(KEYS.inventory,{});
  const set=new Set();
  [
    ...(Array.isArray(inv.flights)?inv.flights.flatMap(x=>[x?.from,x?.to]):[]),
    ...(Array.isArray(inv.hotels)?inv.hotels.map(x=>x?.city):[]),
    ...(Array.isArray(inv.cabs)?inv.cabs.map(x=>x?.city):[]),
    ...(Array.isArray(inv.trains)?inv.trains.flatMap(x=>[x?.from,x?.to]):[])
  ].forEach(v=>v&&set.add(v));
  return [...set].sort((a,b)=>a.localeCompare(b));
}

function getVoyagoCities(mode='',from=''){
  const all=inventoryCities();
  if(mode==='train'){
    const rail=new Set((Store.read(KEYS.inventory,{}).trains||[]).flatMap(x=>[x?.from,x?.to]).filter(Boolean));
    return all.filter(c=>rail.has(c));
  }
  if(mode==='flight'&&from){
    const destinations=new Set((Store.read(KEYS.inventory,{}).flights||[])
      .filter(x=>x?.from===from&&x?.to)
      .map(x=>x.to));
    return [...destinations].sort((a,b)=>a.localeCompare(b));
  }
  return all;
}

function createCityCombobox(input,options={}){
  if(!input)return null;
  let cities=[...(options.cities||getVoyagoCities())];
  const id=input.id||uid('CITY').toLowerCase();
  const wrap=document.createElement('div');
  wrap.className='combo';
  input.parentNode.insertBefore(wrap,input);
  wrap.appendChild(input);
  input.setAttribute('role','combobox');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-expanded','false');
  input.setAttribute('aria-haspopup','listbox');
  const list=document.createElement('div');
  list.id=`${id}-listbox`;
  list.className='combo-list';
  list.setAttribute('role','listbox');
  input.setAttribute('aria-controls',list.id);
  wrap.appendChild(list);

  let filtered=cities.slice(),active=-1;
  let valid=cities.includes(input.value);

  const render=()=>{
    const q=input.value.trim().toLowerCase();
    filtered=cities.filter(c=>c.toLowerCase().includes(q)).slice(0,12);
    active=Math.min(active,filtered.length-1);
    list.innerHTML=filtered.length
      ?filtered.map((c,i)=>`<div class="combo-option ${i===active?'active':''}" role="option" aria-selected="${i===active}" data-city="${escapeHtml(c)}" id="${id}-opt-${i}">${escapeHtml(c)}</div>`).join('')
      :`<div class="combo-empty">No matching city</div>`;
    list.classList.toggle('open',!!filtered.length&&document.activeElement===input);
    input.setAttribute('aria-expanded',String(list.classList.contains('open')));
    if(active>=0&&filtered[active]){
      input.setAttribute('aria-activedescendant',`${id}-opt-${active}`);
    }else{
      input.removeAttribute('aria-activedescendant');
    }
  };

  const choose=value=>{
    if(!cities.includes(value))return false;
    input.value=value;
    valid=true;
    input.setCustomValidity('');
    render();
    list.classList.remove('open');
    input.setAttribute('aria-expanded','false');
    if(options.onChange)options.onChange(value);
    return true;
  };

  const setOptions=(nextOptions,preserveValue=true)=>{
    const current=input.value;
    cities=[...new Set((nextOptions||[]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    filtered=cities.slice();
    active=-1;
    if(preserveValue&&cities.includes(current)){
      valid=true;
      input.setCustomValidity('');
    }else{
      valid=false;
      input.setCustomValidity('Choose a city from the list.');
    }
    render();
    return cities.slice();
  };

  input.addEventListener('focus',render);
  input.addEventListener('input',()=>{
    valid=false;
    input.setCustomValidity('Choose a city from the list.');
    render();
  });
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){
      e.preventDefault();
      if(filtered.length)active=Math.min(active+1,filtered.length-1);
      render();
    }else if(e.key==='ArrowUp'){
      e.preventDefault();
      if(filtered.length)active=Math.max(active-1,0);
      render();
    }else if(e.key==='Enter'){
      if(list.classList.contains('open')&&filtered[active]){
        e.preventDefault();
        choose(filtered[active]);
      }
    }else if(e.key==='Escape'){
      list.classList.remove('open');
      input.setAttribute('aria-expanded','false');
      input.removeAttribute('aria-activedescendant');
    }
  });
  input.addEventListener('blur',()=>setTimeout(()=>{
    if(!cities.includes(input.value)){
      valid=false;
      input.setCustomValidity('Choose a city from the list.');
    }else{
      valid=true;
      input.setCustomValidity('');
    }
    list.classList.remove('open');
    input.setAttribute('aria-expanded','false');
  },120));
  list.addEventListener('mousedown',e=>{
    const opt=e.target.closest('[data-city]');
    if(opt){
      e.preventDefault();
      choose(opt.dataset.city);
      input.focus();
    }
  });

  if(cities.includes(input.value)){
    valid=true;
    input.setCustomValidity('');
  }else if(input.value){
    input.setCustomValidity('Choose a city from the list.');
  }

  return {
    input,
    choose,
    setOptions,
    isValid:()=>valid&&cities.includes(input.value),
    value:()=>input.value,
    options:()=>cities.slice()
  };
}

function swapCityComboboxes(a,b,widgets){
  const av=a.value,bv=b.value;
  a.value=bv;
  b.value=av;
  if(widgets?.a)widgets.a.choose(a.value);
  if(widgets?.b)widgets.b.choose(b.value);
}

function recordSearch(userId,mode,filters,count){
  Store.patch(KEYS.searches,a=>[
    {id:uid('S'),userId:userId||'guest',mode,filters:{...filters},count,time:nowISO()},
    ...a
  ]);
}

document.addEventListener('pointermove',e=>{
  const c=e.target.closest('.spotlight');
  if(c){
    const r=c.getBoundingClientRect();
    c.style.setProperty('--mx',`${e.clientX-r.left}px`);
    c.style.setProperty('--my',`${e.clientY-r.top}px`);
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  wireTheme();
  document.querySelectorAll('.reveal').forEach(x=>{
    const o=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting)e.target.classList.add('in');
    }),{threshold:.08});
    o.observe(x);
  });
});
