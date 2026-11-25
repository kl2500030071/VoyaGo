// Re-read the account record so blocked or deleted users lose access immediately.
function requireAuth(role){
  const session=getSession();
  if(!session){
    const next=`../${location.pathname.split('/').slice(-2).join('/')||location.pathname.split('/').pop()}`;
    const safe=safeNextPath(next);
    location.href=`../auth/login.html${safe?`?next=${encodeURIComponent(safe)}`:''}`;
    return null;
  }
  const user=Store.read(KEYS.users,[]).find(u=>u.id===session.id&&u.email===session.email);
  if(!user||user.blocked){
    Store.remove(KEYS.session);
    sessionStorage.removeItem(KEYS.session);
    const next=`../${location.pathname.split('/').slice(-2).join('/')||location.pathname.split('/').pop()}`;
    location.href=`../auth/login.html?next=${encodeURIComponent(next)}`;
    return null;
  }
  if(role&&user.role!==role){
    location.href=user.role==='admin'?'../admin/dashboard.html':'../user/dashboard.html';
    return null;
  }
  return user;
}

// Protect a page, hydrate the current user's name, and wire logout/theme controls.
function initPage(role){
  const s=requireAuth(role);
  if(!s)return null;
  document.querySelectorAll('[data-user-name]').forEach(e=>e.textContent=s.name);
  document.querySelectorAll('[data-logout]').forEach(e=>e.addEventListener('click',logout));
  return s;
}
