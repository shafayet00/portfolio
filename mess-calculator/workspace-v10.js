
(function(){
  'use strict';
  const APP_URL='https://shafayet00.github.io/Mess-Calculator/';
  const WORKSPACE_KEY='mc-active-workspace';
  let currentWorkspaceId=window.__mcWorkspaceId||null;
  let workspaceMemberships=[];
  let workspaceChannel=null;

  function q(s){return document.querySelector(s)}
  function qa(s){return Array.from(document.querySelectorAll(s))}
  function esc2(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}

  function injectUI(){
    if(q('#mcWorkspaceStyles')) return;
    const st=document.createElement('style');st.id='mcWorkspaceStyles';
    st.textContent=[
      '#mcWorkspaceScreen{position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle at 10% 0%,rgba(59,130,246,.14),transparent 32%),#f8fafc;overflow:auto}',
      '#mcWorkspaceScreen.show{display:flex}.mcw-card{width:min(760px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:28px;padding:30px;box-shadow:0 30px 100px rgba(15,23,42,.15)}',
      '.mcw-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.mcw-head h1{margin:4px 0 6px;font-size:28px;letter-spacing:-.04em}.mcw-head p{margin:0;color:#64748b;font-size:12px;line-height:1.6}.mcw-user{font-size:10px;color:#64748b;background:#f1f5f9;padding:8px 10px;border-radius:999px}',
      '.mcw-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}.mcw-choice{border:1px solid #e2e8f0;background:#fff;border-radius:20px;padding:22px;text-align:left;cursor:pointer;transition:.22s}.mcw-choice:hover{transform:translateY(-3px);border-color:#bfdbfe;box-shadow:0 16px 36px rgba(15,23,42,.08)}.mcw-icon{width:44px;height:44px;border-radius:14px;background:#eff6ff;color:#2563eb;display:grid;place-items:center;font-size:22px;margin-bottom:14px}.mcw-choice h3{margin:0 0 6px;font-size:16px}.mcw-choice p{margin:0;color:#64748b;font-size:11px;line-height:1.55}',
      '.mcw-form{display:none;margin-top:22px;padding-top:22px;border-top:1px solid #eef2f7}.mcw-form.show{display:block}.mcw-form h3{margin:0 0 12px}.mcw-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}.mcw-error{display:none;margin-top:12px;padding:10px 12px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:11px}.mcw-error.show{display:block}',
      '.mcw-list{margin-top:26px}.mcw-list h3{font-size:13px;margin:0 0 10px}.mcw-item{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 14px;border:1px solid #e5e7eb;border-radius:14px;margin-top:8px}.mcw-item strong{font-size:12px}.mcw-item small{display:block;color:#94a3b8;margin-top:3px}.mcw-item button{border:0;background:#0f172a;color:#fff;border-radius:9px;padding:8px 11px;font-size:10px;font-weight:800}',
      '.mcw-invite{margin-top:14px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;padding:14px}.mcw-code{font-size:24px;font-weight:900;letter-spacing:.12em}.mcw-link{word-break:break-all;color:#2563eb;font-size:10px;margin-top:7px}',
      '@media(max-width:650px){.mcw-card{padding:22px}.mcw-grid{grid-template-columns:1fr}.mcw-head{flex-direction:column}.mcw-user{white-space:normal}}'
    ].join('');
    document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend',
      '<div id="mcWorkspaceScreen"><div class="mcw-card">'+
      '<div class="mcw-head"><div><div class="eyebrow">Mess Calculator</div><h1>Choose how you want to use it</h1><p>Create your own mess or join an existing mess. Every mess stays separate.</p></div><div class="mcw-user" id="mcwUser"></div></div>'+
      '<div class="mcw-grid"><button class="mcw-choice" id="mcwManager"><div class="mcw-icon">♛</div><h3>Manager</h3><p>Create a new mess, set its name and manage members, meals, expenses and funds.</p></button><button class="mcw-choice" id="mcwMember"><div class="mcw-icon">♟</div><h3>Member</h3><p>Join another person's mess using an invite code or invite link.</p></button></div>'+
      '<div class="mcw-form" id="mcwCreate"><h3>Create a new mess</h3><label>Mess name<input id="mcwMessName" placeholder="e.g. Friends Mess"></label><div class="mcw-error" id="mcwCreateError"></div><div class="mcw-actions"><button class="secondary-btn" id="mcwBack1">Back</button><button class="primary-btn" id="mcwCreateBtn">Create Mess</button></div></div>'+
      '<div class="mcw-form" id="mcwJoin"><h3>Join a mess</h3><label>Invite code or link<input id="mcwInvite" placeholder="e.g. A1B2C3D4 or paste invite link"></label><div class="mcw-error" id="mcwJoinError"></div><div class="mcw-actions"><button class="secondary-btn" id="mcwBack2">Back</button><button class="primary-btn" id="mcwJoinBtn">Join Mess</button></div></div>'+
      '<div class="mcw-list" id="mcwList"></div><div class="mcw-actions" style="margin-top:22px"><button class="logout-btn" id="mcwLogout">Log out</button></div>'+
      '</div></div>'
    );
    q('#mcwManager').onclick=function(){showMode('create')};
    q('#mcwMember').onclick=function(){showMode('join')};
    q('#mcwBack1').onclick=function(){showMode(null)};
    q('#mcwBack2').onclick=function(){showMode(null)};
    q('#mcwCreateBtn').onclick=createMess;
    q('#mcwJoinBtn').onclick=joinMess;
    q('#mcwLogout').onclick=function(){supabaseClient.auth.signOut()};
  }

  function showMode(mode){
    q('#mcwCreate').classList.toggle('show',mode==='create');
    q('#mcwJoin').classList.toggle('show',mode==='join');
  }
  function errorBox(id,msg){const e=q(id);if(!e)return;e.textContent=msg||'';e.classList.toggle('show',!!msg)}
  function parseCode(v){
    v=String(v||'').trim();if(!v)return '';
    try{const u=new URL(v);v=u.searchParams.get('mess')||u.searchParams.get('code')||v}catch(_){}
    return v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16);
  }

  async function getMemberships(){
    const r=await supabaseClient.from('mc_workspace_members').select('workspace_id,member_id,user_id,role,joined_at');
    if(r.error)throw r.error;
    const ids=(r.data||[]).map(x=>x.workspace_id);
    let ws=[];
    if(ids.length){
      const w=await supabaseClient.from('mc_workspaces').select('id,name,invite_code,owner_user_id,created_at').in('id',ids);
      if(w.error)throw w.error;ws=w.data||[];
    }
    return (r.data||[]).map(x=>Object.assign({},x,{workspace:ws.find(w=>w.id===x.workspace_id)||null}));
  }

  async function showChooser(){
    injectUI();
    workspaceMemberships=await getMemberships();
    q('#mcwUser').textContent=currentUser&&currentUser.email?currentUser.email:'';
    q('#authScreen').classList.remove('show');
    q('#mcWorkspaceScreen').classList.add('show');
    q('.app-shell').style.display='none';
    const unique=Array.from(new Map(workspaceMemberships.filter(x=>x.workspace).map(x=>[x.workspace_id,x])).values());
    q('#mcwList').innerHTML=unique.length?'<h3>Your messes</h3>'+unique.map(function(x){
      return '<div class="mcw-item"><div><strong>'+esc2(x.workspace.name)+'</strong><small>'+(x.role==='manager'?'Manager':'Member')+' · Invite code: '+esc2(x.workspace.invite_code)+'</small></div><button data-ws="'+x.workspace_id+'">Open</button></div>';
    }).join(''):'';
    qa('#mcwList [data-ws]').forEach(function(b){b.onclick=function(){openWorkspace(b.dataset.ws)}});
    showMode(null);
    const invite=parseCode(new URLSearchParams(location.search).get('mess')||'');
    if(invite){q('#mcwInvite').value=invite;showMode('join')}
  }

  async function createMess(){
    errorBox('#mcwCreateError','');
    const name=q('#mcwMessName').value.trim();
    if(!name){errorBox('#mcwCreateError','Enter a mess name.');return}
    const r=await supabaseClient.rpc('mc_create_mess',{p_name:name});
    if(r.error){errorBox('#mcwCreateError',r.error.message);return}
    const row=Array.isArray(r.data)?r.data[0]:r.data;
    if(!row||!row.workspace_id){errorBox('#mcwCreateError','Mess was created but could not be opened.');return}
    await openWorkspace(row.workspace_id);
    const link=APP_URL+'?mess='+encodeURIComponent(row.invite_code);
    setTimeout(function(){alert(row.workspace_name+' created successfully.\n\nInvite code: '+row.invite_code+'\n\nInvite link: '+link)},200);
  }

  async function joinMess(){
    errorBox('#mcwJoinError','');
    const code=parseCode(q('#mcwInvite').value);
    if(!code){errorBox('#mcwJoinError','Enter an invite code or invite link.');return}
    const r=await supabaseClient.rpc('mc_join_mess',{p_code:code});
    if(r.error){errorBox('#mcwJoinError',r.error.message);return}
    const row=Array.isArray(r.data)?r.data[0]:r.data;
    if(!row||!row.workspace_id){errorBox('#mcwJoinError','Could not join the mess.');return}
    await openWorkspace(row.workspace_id);
    history.replaceState({},'',APP_URL);
  }

  async function openWorkspace(id){
    const memberships=await getMemberships();
    workspaceMemberships=memberships;
    const membership=memberships.find(x=>x.workspace_id===id);
    if(!membership)throw new Error('You are not a member of this mess.');
    const r=await supabaseClient.from('mc_workspace_state').select('state,updated_at').eq('workspace_id',id).single();
    if(r.error)throw r.error;
    currentWorkspaceId=id;
    window.__mcWorkspaceId=id;
    currentRole=membership.role;
    currentMemberId=membership.member_id;
    state=migrate(r.data.state||defaultState);
    state.workspaceId=id;
    state.mess=state.mess||structuredClone(defaultState.mess);
    state.mess.name=membership.workspace&&membership.workspace.name?membership.workspace.name:state.mess.name;
    localStorage.setItem(KEY+'-'+id,JSON.stringify(state));
    localStorage.setItem(WORKSPACE_KEY,id);
    q('#authScreen').classList.remove('show');
    q('#mcWorkspaceScreen').classList.remove('show');
    q('.app-shell').style.display='flex';
    setCloudStatus('Cloud synced',true);
    render();
    await setupWorkspaceRealtime();
  }

  async function loadCloudState(){
    if(!currentUser)throw new Error('Please sign in.');
    if(!currentWorkspaceId)return false;
    return openWorkspace(currentWorkspaceId);
  }

  async function syncCurrentState(){
    if(!currentUser||!currentWorkspaceId||currentRole!=='manager')return;
    const r=await supabaseClient.from('mc_workspace_state').upsert({
      workspace_id:currentWorkspaceId,state:state,updated_by:currentUser.id,updated_at:new Date().toISOString()
    },{onConflict:'workspace_id'});
    if(r.error)throw r.error;
    localStorage.setItem(KEY+'-'+currentWorkspaceId,JSON.stringify(state));
    setCloudStatus('Cloud synced',true);
  }

  window.syncCurrentState=syncCurrentState;
  window.save=function(){
    const k=currentWorkspaceId?KEY+'-'+currentWorkspaceId:KEY;
    localStorage.setItem(k,JSON.stringify(state));
    if(!renderQueued){renderQueued=true;requestAnimationFrame(function(){renderQueued=false;render()})}
    if(currentRole==='manager')syncCurrentState().catch(function(e){console.error(e);setCloudStatus('Sync failed',false)});
  };
  window.canEdit=function(){return currentRole==='manager'};
  window.isManager=function(){return currentRole==='manager'};
  window.isAdmin=function(){return false};

  window.setRoleUI=function(){
    const badge=q('#roleBadge');
    if(badge){badge.textContent=currentRole==='manager'?'🛠️ Manager':'👤 Member';badge.className='role-badge '+currentRole}
    qa('.admin-only').forEach(function(e){e.style.display='none'});
    qa('.manager-only').forEach(function(e){e.style.display=currentRole==='manager'?'':'none'});
    const cm=q('#changeManagerBtn');if(cm)cm.style.display=currentRole==='manager'?'':'none';
  };
  window.hideEditControlsForRole=function(){
    ['[data-open-modal="expenseModal"]','[data-open-modal="mealModal"]','#fundDepositBtn','#fundWithdrawBtn','#fundTransferBtn','#addMemberBtn','#settingsManager','#renameMess','#editDefaultMeal','#newMonthBtn','#changeManagerBtn','#managerSaveBtn','[data-edit-meal]','[data-edit-expense]','[data-edit-fund]','[data-delete-meal]','[data-delete-expense]','[data-delete-fund]','[data-delete-member]'].forEach(function(sel){qa(sel).forEach(function(e){e.style.display=currentRole==='manager'?'':'none'})});
  };

  window.changeManager=async function(){
    if(currentRole!=='manager'){toast('Manager only','Only the current manager can change the manager.','error');return}
    const sel=q('#managerSelect');if(!sel)return;
    sel.innerHTML=(state.members||[]).map(function(m){return '<option value="'+esc2(m.auth_user_id||m.id)+'" '+(m.id===state.mess.managerId?'selected':'')+'>'+esc2(m.name)+'</option>'}).join('');
    q('#managerMemberCount').textContent=(state.members||[]).length+' members';
    openModal('managerModal');
  };

  async function setupWorkspaceRealtime(){
    if(!currentWorkspaceId||!currentUser)return;
    if(workspaceChannel){try{await supabaseClient.removeChannel(workspaceChannel)}catch(_){}}
    workspaceChannel=supabaseClient.channel('mc-ws-'+currentWorkspaceId)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'mc_workspace_state',filter:'workspace_id=eq.'+currentWorkspaceId},function(payload){
        if(payload.new&&payload.new.updated_by===currentUser.id)return;
        if(payload.new&&payload.new.state){state=migrate(payload.new.state);state.workspaceId=currentWorkspaceId;localStorage.setItem(KEY+'-'+currentWorkspaceId,JSON.stringify(state));render();toast('Live update','Mess data was updated by another user.','info')}
      }).subscribe();
  }
  window.setupRealtimeSync=setupWorkspaceRealtime;
  window.broadcastMessUpdate=async function(){};
  window.startOnlineApp=async function(){
    try{
      const s=await supabaseClient.auth.getSession();if(s.error)throw s.error;
      currentUser=s.data.session?s.data.session.user:null;
      if(!currentUser){q('#authScreen').classList.add('show');q('.app-shell').style.display='none';return}
      await showChooser();
    }catch(e){console.error(e);q('#authScreen').classList.add('show');q('.app-shell').style.display='none';q('#authError').textContent=e.message||'Unable to connect.';q('#authError').classList.add('show')}
  };

  function replaceForm(id,handler){
    const old=q(id);if(!old)return;
    const fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.addEventListener('submit',handler);return fresh;
  }

  replaceForm('#loginForm',async function(e){
    e.preventDefault();q('#authError').classList.remove('show');q('#authLoading').classList.add('show');
    try{
      const fd=new FormData(e.target);
      const r=await supabaseClient.auth.signInWithPassword({email:String(fd.get('email')).trim().toLowerCase(),password:String(fd.get('password'))});
      if(r.error)throw r.error;
      await showChooser();
    }catch(err){q('#authError').textContent=err.message||'Login failed.';q('#authError').classList.add('show')}
    finally{q('#authLoading').classList.remove('show')}
  });

  replaceForm('#joinForm',async function(e){
    e.preventDefault();q('#joinError').classList.remove('show');q('#joinLoading').classList.add('show');
    try{
      const fd=new FormData(e.target),name=String(fd.get('name')||'').trim(),email=String(fd.get('email')||'').trim().toLowerCase(),password=String(fd.get('password')||''),confirm=String(fd.get('confirmPassword')||'');
      if(password!==confirm)throw new Error('Passwords do not match.');
      if(password.length<6)throw new Error('Password must be at least 6 characters.');
      const r=await supabaseClient.auth.signUp({email:email,password:password,options:{data:{full_name:name},emailRedirectTo:APP_URL}});
      if(r.error)throw r.error;
      e.target.reset();
      q('#joinError').textContent='Account created. Check your email, verify it, then this page will reopen and show Manager / Member choices.';
      q('#joinError').classList.add('show');
    }catch(err){q('#joinError').textContent=err.message||'Could not create account.';q('#joinError').classList.add('show')}
    finally{q('#joinLoading').classList.remove('show')}
  });

  const mf=q('#managerForm');
  if(mf){
    const fresh=mf.cloneNode(true);mf.replaceWith(fresh);
    fresh.addEventListener('submit',async function(e){
      e.preventDefault();
      const newUserId=q('#managerSelect').value;
      const target=(state.members||[]).find(function(m){return (m.auth_user_id||m.id)===newUserId});
      if(!target)return;
      const r=await supabaseClient.rpc('mc_change_manager',{p_workspace_id:currentWorkspaceId,p_new_user_id:target.auth_user_id||newUserId});
      if(r.error){toast('Manager change failed',r.error.message,'error');return}
      state.mess.managerId=target.id;addNotification('Manager changed',target.name+' is now manager');save();closeModals();toast('Manager changed',target.name+' is now the manager.','info');
      workspaceMemberships=await getMemberships();const me=workspaceMemberships.find(x=>x.workspace_id===currentWorkspaceId&&x.user_id===currentUser.id);if(me)currentRole=me.role;setRoleUI();hideEditControlsForRole();
    });
  }

  document.addEventListener('click',async function(e){
    const btn=e.target.closest('[data-delete-member]');
    if(!btn||currentRole!=='manager'||!currentWorkspaceId)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const uid=btn.dataset.deleteMember;
    const target=(state.members||[]).find(function(m){return m.id===uid});
    if(!target)return;
    if(!confirm('Remove '+target.name+' from this mess?'))return;
    const r=await supabaseClient.rpc('mc_remove_member',{p_workspace_id:currentWorkspaceId,p_user_id:target.auth_user_id||''});
    if(r.error){toast('Remove failed',r.error.message,'error');return}
    state.members=(state.members||[]).filter(function(m){return m.id!==uid});
    state.meals=(state.meals||[]).map(function(x){if(x.counts)delete x.counts[uid];return x});
    addNotification('Member removed',target.name+' was removed from this mess');
    save();toast('Member removed',target.name+' was removed from the mess','info');
  },true);

  if(typeof supabaseClient!=='undefined'&&supabaseClient){
    supabaseClient.auth.onAuthStateChange(function(event,session){
      currentUser=session&&session.user?session.user:null;
      if(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'){
        if(session)showChooser().catch(function(e){console.error(e)});
      }
      if(event==='SIGNED_OUT'){
        currentWorkspaceId=null;window.__mcWorkspaceId=null;workspaceMemberships=[];
        if(workspaceChannel){supabaseClient.removeChannel(workspaceChannel).catch(function(){})}
        q('#mcWorkspaceScreen')&&q('#mcWorkspaceScreen').classList.remove('show');
        q('.app-shell').style.display='none';q('#authScreen').classList.add('show');
      }
    });
  }

  injectUI();
  setTimeout(function(){startOnlineApp()},0);
})();
