(function () {
  const CLOUD_DB_PATH = 'user_cloud';
  const CHAT_UPLOADS_ID = '__chat_uploads__';
  let _encKey = null;

  async function getEncKey() {
    if (_encKey) return _encKey;
    const base = localStorage.getItem('userDbKey') || 'unknown';
    const enc = new TextEncoder();
    const mat = await crypto.subtle.importKey('raw', enc.encode(base), 'PBKDF2', false, ['deriveKey']);
    _encKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode('delta_cloud_v1'), iterations: 100000, hash: 'SHA-256' },
      mat, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
    return _encKey;
  }

  async function encryptFile(file) {
    const key = await getEncKey();
    const CHUNK = 512 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK) || 1;
    const parts = [new Uint8Array([totalChunks])];
    for (let i = 0; i < totalChunks; i++) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const chunk = file.slice(i * CHUNK, (i + 1) * CHUNK);
      const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await chunk.arrayBuffer());
      const lenBuf = new Uint8Array(4);
      new DataView(lenBuf.buffer).setUint32(0, 12 + cipher.byteLength, false);
      parts.push(lenBuf, iv, new Uint8Array(cipher));
    }
    return new Blob(parts, { type: 'application/octet-stream' });
  }

  async function decryptBlob(blob) {
    const key = await getEncKey();
    const buf = await blob.arrayBuffer();
    const view = new DataView(buf);
    const totalChunks = new Uint8Array(buf, 0, 1)[0];
    const parts = [];
    let offset = 1;
    for (let i = 0; i < totalChunks; i++) {
      const chunkLen = view.getUint32(offset, false); offset += 4;
      const iv = new Uint8Array(buf, offset, 12);
      const cipher = buf.slice(offset + 12, offset + chunkLen);
      parts.push(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher));
      offset += chunkLen;
    }
    const totalLen = parts.reduce((a, b) => a + b.byteLength, 0);
    const out = new Uint8Array(totalLen);
    let pos = 0;
    for (const p of parts) { out.set(new Uint8Array(p), pos); pos += p.byteLength; }
    return out.buffer;
  }

  function getSafeUser() {
    const u = localStorage.getItem('public_chat_username_v1') || localStorage.getItem('userDbKey') || 'guest';
    return u.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40);
  }

  async function getAuthUser() {
    const cur = firebase.auth().currentUser;
    if (cur) return cur;
    return new Promise(res => {
      const unsub = firebase.auth().onAuthStateChanged(u => { unsub(); res(u); });
    });
  }

  async function getToken() {
    const user = await getAuthUser();
    return user ? user.getIdToken() : null;
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  let _cloudListener = null;
  let _quotaMax = null;
  let CS = {
    leftFolderId: null,
    currentFolderId: null,
    cancelUpload: false,
    currentXhr: null,
    chatFiles: [],
    folders: {},
    files: {},
    clipboard: null,
    dragItem: null,
    selection: [],
    lastSelected: null,
    audioQueue: [],
    audioQueueIdx: -1,
    audioRepeat: 0,
    audioVolume: 1,
  };
  function _selHas(id) { return CS.selection.some(s => s.id === id); }
  function _selAdd(type, id) { if (!_selHas(id)) CS.selection.push({ type, id }); }
  function _selRemove(id) { CS.selection = CS.selection.filter(s => s.id !== id); }
  function _selClear() { CS.selection = []; CS.lastSelected = null; }
  function _selIds() { return CS.selection.map(s => s.id); }
  function injectContextMenuStyles() {
    if (document.getElementById('cloud-ctx-style')) return;
    const s = document.createElement('style');
    s.id = 'cloud-ctx-style';
    s.textContent = `
      #cloudCtxMenu{position:fixed;z-index:99999;background:var(--color-surface);border:1px solid rgba(84,129,204,0.3);border-radius:8px;padding:4px 0;min-width:170px;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:none;}
      #cloudCtxMenu .ctx-item{display:flex;align-items:center;gap:9px;padding:7px 14px;font-size:0.82rem;color:#c9d1e0;cursor:pointer;transition:background 0.12s;}
      #cloudCtxMenu .ctx-item:hover{background:rgba(84,129,204,0.15);color:var(--color-accent);}
      #cloudCtxMenu .ctx-item.ctx-danger:hover{background:rgba(239,68,68,0.15);color:#f87171;}
      #cloudCtxMenu .ctx-sep{height:1px;background:rgba(255,255,255,0.07);margin:3px 0;}
      #cloudCtxMenu .ctx-item i{width:14px;text-align:center;opacity:0.75;}
      .cloud-item{user-select:none;}
      .cloud-tc-pathbar{display:flex;align-items:center;flex-wrap:wrap;gap:2px;padding:4px 10px;background:rgba(84,129,204,0.07);border-bottom:1px solid rgba(84,129,204,0.18);font-size:0.78rem;min-height:28px;flex-shrink:0;}
      .cloud-tc-colrow{display:flex;align-items:center;padding:3px 10px;font-size:0.72rem;color:#64748b;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;}
      .cloud-tc-colrow .col-size{margin-left:auto;width:70px;text-align:right;}
      .cloud-we-content{display:flex;flex-direction:column;overflow:hidden;height:100%;min-height:0;}
      .cloud-list-wrap{flex:1 1 0;overflow:hidden;display:flex;flex-direction:column;min-height:0;}
      .cloud-list-wrap .cloud-list{flex:1 1 0;min-height:0;}
      .cloud-preview-pane{flex:0 0 180px;min-height:56px;max-height:60%;}
      .cloud-preview-resizer{height:5px;background:rgba(84,129,204,0.18);cursor:ns-resize;flex-shrink:0;transition:background 0.15s;}
      .cloud-preview-resizer:hover,.cloud-preview-resizer.dragging{background:rgba(84,129,204,0.45);}
      .cloud-preview-pane{flex:0 0 220px;min-height:56px;max-height:70%;background:rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
      .cloud-preview-empty{display:flex;flex-direction:column;align-items:center;gap:8px;color:#475569;font-size:0.82rem;pointer-events:none;}
      .cloud-preview-empty i{font-size:1.8rem;opacity:0.3;}
      .cloud-preview-img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;}
      .cloud-preview-video{max-width:100%;max-height:100%;border-radius:4px;background:#000;}
      .cloud-preview-text{width:100%;height:100%;overflow:auto;padding:10px 14px;font-size:0.74rem;font-family:monospace;color:#94a3b8;white-space:pre-wrap;word-break:break-all;line-height:1.5;box-sizing:border-box;}
      .cloud-preview-bar{position:absolute;top:6px;right:8px;display:flex;gap:5px;z-index:2;}
      .cloud-preview-bar button{background:rgba(0,0,0,0.5);border:1px solid rgba(84,129,204,0.25);color:#94a3b8;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:0.7rem;transition:color 0.12s,background 0.12s;}
      .cloud-preview-bar button:hover{color:#fff;background:rgba(84,129,204,0.35);}
      .cloud-preview-label{position:absolute;bottom:6px;left:10px;font-size:0.7rem;color:#475569;pointer-events:none;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .cloud-thumb-img{width:28px;height:28px;object-fit:cover;border-radius:3px;flex-shrink:0;}
      .cloud-item.selected{background:rgba(84,129,204,0.16);}
      .cloud-rename-overlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;}
      .cloud-rename-modal{background:var(--color-surface,#1a2235);border:1px solid rgba(84,129,204,0.3);border-radius:12px;padding:24px 26px;min-width:330px;box-shadow:0 12px 40px rgba(0,0,0,0.65);display:flex;flex-direction:column;gap:14px;}
      .cloud-rename-modal h3{margin:0;font-size:0.95rem;font-weight:600;color:#e2e8f0;}
      .cloud-rename-modal input{background:rgba(255,255,255,0.06);border:1px solid rgba(84,129,204,0.3);border-radius:7px;padding:8px 12px;color:#e2e8f0;font-size:0.88rem;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.15s;}
      .cloud-rename-modal input:focus{border-color:var(--color-accent,#5481cc);}
      .cloud-rename-modal .modal-btns{display:flex;gap:8px;justify-content:flex-end;}
      .cloud-rename-modal .modal-btns button{padding:7px 18px;border-radius:7px;border:none;font-size:0.82rem;cursor:pointer;font-weight:500;transition:opacity 0.12s;}
      .cloud-rename-modal .btn-confirm{background:var(--color-accent,#5481cc);color:#fff;}
      .cloud-rename-modal .btn-confirm:hover{opacity:0.85;}
      .cloud-rename-modal .btn-cancel{background:rgba(255,255,255,0.08);color:#94a3b8;}
      .cloud-rename-modal .btn-cancel:hover{background:rgba(255,255,255,0.14);}
      .cloud-confirm-overlay{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;}
      .cloud-confirm-modal{background:var(--color-surface,#1a2235);border:1px solid rgba(84,129,204,0.3);border-radius:12px;padding:24px 26px;min-width:320px;max-width:420px;box-shadow:0 12px 40px rgba(0,0,0,0.65);display:flex;flex-direction:column;gap:14px;}
      .cloud-confirm-modal h3{margin:0;font-size:0.95rem;font-weight:600;color:#e2e8f0;}
      .cloud-confirm-modal p{margin:0;font-size:0.85rem;color:#94a3b8;line-height:1.5;}
      .cloud-confirm-modal .modal-btns{display:flex;gap:8px;justify-content:flex-end;}
      .cloud-confirm-modal .btn-danger{background:#ef4444;color:#fff;padding:7px 18px;border-radius:7px;border:none;font-size:0.82rem;cursor:pointer;font-weight:500;}
      .cloud-confirm-modal .btn-danger:hover{opacity:0.85;}
      .cloud-confirm-modal .btn-cancel{background:rgba(255,255,255,0.08);color:#94a3b8;padding:7px 18px;border-radius:7px;border:none;font-size:0.82rem;cursor:pointer;font-weight:500;}
      .cloud-confirm-modal .btn-cancel:hover{background:rgba(255,255,255,0.14);}
      .cloud-editor-overlay{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;}
      .cloud-editor-modal{background:var(--color-surface,#1a2235);border:1px solid rgba(84,129,204,0.3);border-radius:12px;width:min(700px,92vw);height:min(520px,85vh);box-shadow:0 12px 40px rgba(0,0,0,0.65);display:flex;flex-direction:column;overflow:hidden;}
      .cloud-editor-titlebar{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(84,129,204,0.18);flex-shrink:0;}
      .cloud-editor-titlebar span{flex:1;font-size:0.88rem;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .cloud-editor-toolbar{display:flex;gap:6px;padding:7px 12px;border-bottom:1px solid rgba(84,129,204,0.12);flex-shrink:0;}
      .cloud-editor-toolbar button{background:rgba(84,129,204,0.1);border:1px solid rgba(84,129,204,0.2);color:#94a3b8;border-radius:5px;padding:3px 10px;cursor:pointer;font-size:0.75rem;transition:color 0.12s,background 0.12s;}
      .cloud-editor-toolbar button:hover{color:#fff;background:rgba(84,129,204,0.25);}
      .cloud-editor-textarea{flex:1;resize:none;background:rgba(0,0,0,0.2);border:none;outline:none;padding:14px 16px;color:#e2e8f0;font-family:'Geist Mono',monospace;font-size:0.82rem;line-height:1.6;min-height:0;}
      .cloud-editor-statusbar{padding:5px 14px;border-top:1px solid rgba(84,129,204,0.12);font-size:0.7rem;color:#475569;flex-shrink:0;}
      .cloud-item.drag-over{background:rgba(84,129,204,0.22)!important;outline:2px dashed var(--color-accent);outline-offset:-2px;}
      .cloud-queue-item{display:flex;align-items:center;gap:7px;padding:5px 12px;cursor:pointer;transition:background 0.1s;border-left:2px solid transparent;}
      .cloud-queue-item:hover{background:rgba(84,129,204,0.1);}
      .cloud-queue-item.cloud-queue-active{background:rgba(84,129,204,0.16);border-left-color:var(--color-accent);color:var(--color-accent);}
      .cloud-audio-ctrl{background:none;border:none;color:#94a3b8;cursor:pointer;padding:5px 9px;border-radius:5px;font-size:0.9rem;transition:color 0.12s,background 0.12s;}
      .cloud-audio-ctrl:hover{color:#fff;background:rgba(84,129,204,0.18);}
      .cloud-audio-ctrl.active{color:var(--color-accent);}
      .cloud-queue-drop-hint{text-align:center;padding:14px 10px;font-size:0.74rem;color:#334155;pointer-events:none;}
      .cloud-queue-drop-hint i{display:block;font-size:1.3rem;margin-bottom:6px;opacity:0.2;}
      .cloud-queue-drop-zone-active{background:rgba(84,129,204,0.08)!important;outline:2px dashed rgba(84,129,204,0.4);outline-offset:-2px;}
    `;
    document.head.appendChild(s);
  }

  function getOrCreateCtxMenu() {
    injectContextMenuStyles();
    let m = document.getElementById('cloudCtxMenu');
    if (!m) {
      m = document.createElement('div');
      m.id = 'cloudCtxMenu';
      document.body.appendChild(m);
      document.addEventListener('mousedown', (e) => {
        if (!m.contains(e.target)) hideCtxMenu();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideCtxMenu();
      });
    }
    return m;
  }

  function hideCtxMenu() {
    const m = document.getElementById('cloudCtxMenu');
    if (m) m.style.display = 'none';
  }

  function showCtxMenu(x, y, items) {
    const m = getOrCreateCtxMenu();
    m.innerHTML = items.map(it => {
      if (it === 'sep') return `<div class="ctx-sep"></div>`;
      return `<div class="ctx-item${it.danger ? ' ctx-danger' : ''}" data-action="${it.action}">
        <i class="fas ${it.icon}"></i>${esc(it.label)}
      </div>`;
    }).join('');
    m.querySelectorAll('.ctx-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        hideCtxMenu();
        const fn = window['_cloudCtx_' + el.dataset.action];
        if (fn) fn();
      });
    });
    m.style.display = 'block';
    const vw = window.innerWidth, vh = window.innerHeight;
    const mw = m.offsetWidth || 180, mh = m.offsetHeight || 200;
    m.style.left = (x + mw > vw ? vw - mw - 8 : x) + 'px';
    m.style.top = (y + mh > vh ? vh - mh - 8 : y) + 'px';
  }

  function ctxForFolder(id) {
    const selectedFolders = CS.selection.length > 1 && _selHas(id) ? CS.selection.filter(s => s.type === 'folder') : [{ type: 'folder', id }];
    const multi = selectedFolders.length > 1;
    window._cloudCtx_open = () => !multi && window.cloudNav(id);
    window._cloudCtx_rename = () => !multi && window.cloudRenameFolder(id);
    window._cloudCtx_delete = () => {
      _showConfirmModal('Delete Folder', `Delete ${multi ? selectedFolders.length + ' folders' : `"${CS.folders[id]?.name || id}"`} and all contents? This cannot be undone.`, async () => {
        _opsStart(`Deleting 0 / ${selectedFolders.length}…`);
        for (let i = 0; i < selectedFolders.length; i++) {
          _opsUpdate(i, selectedFolders.length, `Deleting ${i + 1} / ${selectedFolders.length}: ${CS.folders[selectedFolders[i].id]?.name || selectedFolders[i].id}`);
          await deleteCloudFolder(selectedFolders[i].id);
          if (CS.currentFolderId === selectedFolders[i].id) CS.currentFolderId = null;
        }
        _opsEnd(`Deleted ${selectedFolders.length} folder${selectedFolders.length !== 1 ? 's' : ''}`);
        _selClear(); renderCloudBody(); refreshCloudQuota();
      }, 'Delete');
    };
    const items = [];
    if (!multi) items.push({ action: 'open', icon: 'fa-folder-open', label: 'Open' }, 'sep');
    if (!multi) items.push({ action: 'rename', icon: 'fa-pencil', label: 'Rename' }, 'sep');
    items.push({ action: 'delete', icon: 'fa-trash', label: multi ? `Delete ${selectedFolders.length} folders` : 'Delete', danger: true });
    return items;
  }

  function ctxForFile(id) {
    const selectedFiles = CS.selection.length > 1 && _selHas(id) ? [...CS.selection] : [{ type: 'file', id }];
    const fileIds = selectedFiles.filter(s => s.type === 'file').map(s => s.id);
    const multi = selectedFiles.length > 1;
    window._cloudCtx_download = () => fileIds.forEach(fid => window.cloudDownloadFile(fid));
    window._cloudCtx_rename = () => !multi && window.cloudRenameFile(id);
    window._cloudCtx_copy = () => { CS.clipboard = { type: 'copy', items: selectedFiles }; };
    window._cloudCtx_cut = () => { CS.clipboard = { type: 'cut', items: selectedFiles }; renderCloudBody(); };
    window._cloudCtx_delete = () => {
      _showConfirmModal('Delete', `Delete ${multi ? fileIds.length + ' files' : `"${CS.files[id]?.name || id}"`}? This cannot be undone.`, async () => {
        _opsStart(`Deleting 0 / ${fileIds.length}…`);
        for (let i = 0; i < fileIds.length; i++) {
          _opsUpdate(i, fileIds.length, `Deleting ${i + 1} / ${fileIds.length}: ${CS.files[fileIds[i]]?.name || fileIds[i]}`);
          await deleteCloudFile(fileIds[i]);
        }
        _opsEnd(`Deleted ${fileIds.length} file${fileIds.length !== 1 ? 's' : ''}`);
        _selClear(); renderCloudBody(); refreshCloudQuota();
      }, 'Delete');
    };
    const isEditableExt = /\.(txt|md|js|ts|py|json|html|css|sh|c|cpp|csv|log|yaml|yml|xml|ini|toml)$/i.test(CS.files[id]?.name || '');
    const isSingleNonBinary = !multi && isEditableExt;
    if (isSingleNonBinary) {
      window._cloudCtx_edit = () => {
        const meta = CS.files[id];
        (async () => {
          const token = await getToken();
          const url = meta.serverUrl ? `${window.UPLOAD_SERVER}${meta.serverUrl}` : `${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`;
          const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
          const blob = await res.blob();
          const outBuf = meta.encrypted ? new Blob([await decryptBlob(blob)], { type: 'text/plain' }) : blob;
          const text = await outBuf.text();
          _openTextEditor(meta.name, text, async (content) => {
            const tok = await getToken();
            await fetch(`${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } }).catch(() => {});
            await getCloudRef().child(`files/${id}`).remove();
            delete CS.files[id];
            const keysBefore = new Set(Object.keys(CS.files));
            await uploadCloudFiles([new File([new Blob([content], { type: 'text/plain' })], meta.name, { type: 'text/plain' })]);
          });
        })();
      };
    }
    if (!multi) items.push({ action: 'rename', icon: 'fa-pencil', label: 'Rename' });
    if (isSingleNonBinary) items.push({ action: 'edit', icon: 'fa-pen-to-square', label: 'Edit' });
    items.push(
      { action: 'copy', icon: 'fa-copy', label: multi ? `Copy ${fileIds.length} files` : 'Copy' },
      { action: 'cut', icon: 'fa-scissors', label: multi ? `Cut ${fileIds.length} files` : 'Cut' },
      'sep',
      { action: 'delete', icon: 'fa-trash', label: multi ? `Delete ${fileIds.length} files` : 'Delete', danger: true }
    );
    return items;
  }

    function ctxForBackground() {
      const items = [];
      if (CS.clipboard?.items?.length) {
        window._cloudCtx_paste = () => window.cloudPaste();
        items.push({ action: 'paste', icon: 'fa-paste', label: `Paste ${CS.clipboard.items.length} item${CS.clipboard.items.length !== 1 ? 's' : ''}` });
        items.push('sep');
      }
      window._cloudCtx_upload = () => window.cloudUploadTrigger();
      window._cloudCtx_newfolder = () => window.cloudNewFolder();
      window._cloudCtx_newtxt = () => window.cloudNewTextFile();
      items.push({ action: 'upload', icon: 'fa-upload', label: 'Upload files' });
      items.push({ action: 'newfolder', icon: 'fa-folder-plus', label: 'New folder' });
      items.push('sep');
      items.push({ action: 'newtxt', icon: 'fa-file-lines', label: 'New text document (.txt)' });
      return items;
    }

function getCloudRef() {
    return firebase.database().ref(`${CLOUD_DB_PATH}/${getSafeUser()}`);
}

async function loadCloudData() {
    const snap = await getCloudRef().once('value');
    const d = snap.val() || {};
    CS.folders = d.folders || {};
    CS.files = d.files || {};
}

  async function loadChatUploads() {
    const db = firebase.database();
    const username = localStorage.getItem('public_chat_username_v1') || '';
    if (!username) { CS.chatFiles = []; return; }
    let joinedRooms = [];
    try { joinedRooms = JSON.parse(localStorage.getItem('joined_private_rooms') || '[]'); } catch {}
    const results = [];
    for (const code of joinedRooms) {
      try {
        const snap = await db.ref(`private_rooms/${code}/messages`).once('value');
        const messages = snap.val() || {};
        for (const [, msg] of Object.entries(messages)) {
          if (msg.name !== username) continue;
          const files = msg.files || (msg.file ? [msg.file] : []);
          for (const f of files) {
            if (f && f.name && f.name !== 'pfp.png') results.push(f);
          }
        }
      } catch {}
    }
    CS.chatFiles = results;
  }

  async function createFolder(name, parentId) {
    const ref = getCloudRef().child('folders').push();
    const data = { name, parentId: parentId || null, createdAt: new Date().toISOString() };
    await ref.set(data);
    CS.folders[ref.key] = data;
    return ref.key;
  }

  async function renameFolder(id, newName) {
    await getCloudRef().child(`folders/${id}/name`).set(newName);
    if (CS.folders[id]) CS.folders[id].name = newName;
  }

  async function renameFile(id, newName) {
    await getCloudRef().child(`files/${id}/name`).set(newName);
    if (CS.files[id]) CS.files[id].name = newName;
  }

  async function deleteCloudFolder(id) {
    for (const [cid] of Object.entries(CS.folders).filter(([, f]) => f.parentId === id)) {
      await deleteCloudFolder(cid);
    }
    for (const [fid, f] of Object.entries(CS.files).filter(([, f]) => f.folderId === id)) {
      await deleteCloudFile(fid, f);
    }
    await getCloudRef().child(`folders/${id}`).remove();
    delete CS.folders[id];
  }

  async function deleteCloudFile(fileId, meta) {
    const m = meta || CS.files[fileId];
    if (!m) return;
    if (m.serverId && m.safeUser) {
      const token = await getToken();
      if (token) {
        await fetch(`${window.UPLOAD_SERVER}/file/${m.safeUser}/${m.serverId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
    }
    await getCloudRef().child(`files/${fileId}`).remove();
    delete CS.files[fileId];
  }

  async function uploadCloudFiles(files) {
    if (!files.length) return;
    const username = localStorage.getItem('public_chat_username_v1') || getSafeUser();
    const targetFolder = CS.currentFolderId === CHAT_UPLOADS_ID ? null : CS.currentFolderId;
    const progressWrap = document.getElementById('cloudUploadProgress');
    const bar = document.getElementById('cloudProgressBar');
    const label = document.getElementById('cloudProgressLabel');
    const cancelBtn = document.getElementById('cloudCancelBtn');
    CS.cancelUpload = false;
    if (progressWrap) progressWrap.style.display = 'block';
    if (cancelBtn) cancelBtn.onclick = () => { CS.cancelUpload = true; if (CS.currentXhr) CS.currentXhr.abort(); };

    const user = await getAuthUser();
    if (!user) {
      window._alert('Not signed in.');
      if (progressWrap) progressWrap.style.display = 'none';
      return;
    }

    for (let i = 0; i < files.length; i++) {
      if (CS.cancelUpload) break;
      const file = files[i];
      if (label) label.textContent = `Encrypting ${i + 1}/${files.length}: ${file.name}`;
      if (bar) bar.style.width = '0%';
      try {
        const encBlob = await encryptFile(file);
        const encFile = new File([encBlob], `${Date.now()}.bin`, { type: 'application/octet-stream' });
        const doXhr = async (token) => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        CS.currentXhr = xhr;
        xhr.open('POST', `${window.UPLOAD_SERVER}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('x-room-code', 'cloud');
        xhr.setRequestHeader('x-username', username);
        xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = `Uploading ${i + 1}/${files.length} — ${pct}% (${esc(file.name)})`;
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve({ ok: true, data: JSON.parse(xhr.responseText) }); } catch { reject(new Error('Invalid server response')); }
            } else {
            const errMsg = (() => { try { return JSON.parse(xhr.responseText).error || xhr.statusText; } catch { return xhr.statusText; } })();
            resolve({ ok: false, status: xhr.status, error: errMsg });
            }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.onabort = () => reject(new Error('cancelled'));
        const fd = new FormData();
        fd.append('file', encFile);
        xhr.send(fd);
        });

        let token = await user.getIdToken(true);
        let attempt = await doXhr(token);
        if (!attempt.ok && attempt.status === 401) {
        token = await user.getIdToken(true);
        attempt = await doXhr(token);
        }
        if (!attempt.ok) throw new Error(attempt.error || 'Upload failed');
        const result = attempt.data;
        const fileRef = getCloudRef().child('files').push();
        const meta = {
          name: file.name, size: file.size, folderId: targetFolder || null,
          uploadedAt: new Date().toISOString(), serverId: result.id, serverUrl: result.url, safeUser: result.safeUser, encrypted: true
        };
        console.log('[cloud] writing to path:', fileRef.toString(), meta);
        await fileRef.set(meta);
        CS.files[fileRef.key] = meta;
      } catch (e) {
        if (e.message !== 'cancelled') window._alert(`Failed to upload ${file.name}: ${e.message}`);
      }
    }

    CS.currentXhr = null;
    if (progressWrap) progressWrap.style.display = 'none';
    if (bar) bar.style.width = '0%';
    if (cancelBtn) cancelBtn.onclick = null;
    refreshCloudQuota();
    renderCloudBody();
  }

  async function downloadCloudFile(fileId) {
    const meta = CS.files[fileId];
    if (!meta) return;
    const token = await getToken();
    if (!token) { window._alert('Not signed in.'); return; }
    const url = meta.serverUrl
      ? `${window.UPLOAD_SERVER}${meta.serverUrl}`
      : `${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null);
    if (!res || !res.ok) { window._alert('Download failed.'); return; }
    const blob = await res.blob();
    let out = blob;
    if (meta.encrypted) {
      try { out = new Blob([await decryptBlob(blob)]); } catch (e) { window._alert('Decryption failed: ' + e.message); return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(out);
    a.download = meta.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1000);
  }

async function refreshCloudQuota() {
    const fill = document.getElementById('cloudQuotaFill');
    const text = document.getElementById('cloudQuotaText');
    if (!fill || !text) return;
    try {
      if (_quotaMax === null) {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${window.UPLOAD_SERVER}/quota/${getSafeUser()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const q = await res.json();
        _quotaMax = q.max;
      }
      const used = Object.values(CS.files).reduce((a, f) => a + (f.size || 0), 0);
      const pct = Math.min(100, Math.round((used / _quotaMax) * 100));
      fill.style.width = pct + '%';
      fill.style.background = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : 'var(--color-accent)';
      text.textContent = `${fmtBytes(used)} / ${fmtBytes(_quotaMax)}`;
    } catch {}
  }

  function fileIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const m = {
      png: 'fa-file-image', jpg: 'fa-file-image', jpeg: 'fa-file-image', gif: 'fa-file-image', webp: 'fa-file-image',
      mp4: 'fa-file-video', mov: 'fa-file-video', mkv: 'fa-file-video',
      mp3: 'fa-file-audio', wav: 'fa-file-audio', flac: 'fa-file-audio', m4a: 'fa-file-audio', aac: 'fa-file-audio', ogg: 'fa-file-audio',
      pdf: 'fa-file-pdf', txt: 'fa-file-lines', md: 'fa-file-lines',
      doc: 'fa-file-word', docx: 'fa-file-word',
      xls: 'fa-file-excel', xlsx: 'fa-file-excel',
      ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
      zip: 'fa-file-zipper', gz: 'fa-file-zipper', '7z': 'fa-file-zipper', tar: 'fa-file-zipper',
      js: 'fa-file-code', ts: 'fa-file-code', py: 'fa-file-code', cpp: 'fa-file-code',
      c: 'fa-file-code', html: 'fa-file-code', css: 'fa-file-code', json: 'fa-file-code', sh: 'fa-file-code',
    };
    return m[ext] || 'fa-file';
  }

  function childFolders(parentId) {
    return Object.entries(CS.folders)
      .filter(([, f]) => (f.parentId || null) === (parentId || null))
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }

  function filesIn(folderId) {
    if (folderId === CHAT_UPLOADS_ID) {
      return CS.chatFiles.filter(f => f.name !== 'pfp.png').map(f => ['__chat__' + f.url, f]);
    }
    return Object.entries(CS.files)
      .filter(([, f]) => (f.folderId || null) === (folderId || null) && f.name !== 'pfp.png')
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }

  function buildBreadcrumb() { return buildBreadcrumbFor(CS.currentFolderId, 'cloudNav'); }
    function buildBreadcrumbFor(folderId, navFn) {
        const crumbs = [];
        let cur = folderId;
        while (cur && cur !== CHAT_UPLOADS_ID && CS.folders[cur]) {
            crumbs.unshift({ id: cur, name: CS.folders[cur].name });
            cur = CS.folders[cur].parentId || null;
        }
        const parts = [{ id: '', name: 'My Storage' }, ...crumbs];
        return parts.map((c, i) =>
            i < parts.length - 1
                ? `<span class="cloud-crumb" onclick="window.${navFn}('${c.id}')">${esc(c.name)}</span><span class="cloud-crumb-sep">›</span>`
                : `<span class="cloud-crumb active">${esc(c.name)}</span>`
        ).join('');
    }

    function renderItemList(folderId, navFn) {
        if (folderId === undefined) folderId = CS.currentFolderId;
        if (!navFn) navFn = 'cloudNav';
        const isChatUploads = folderId === CHAT_UPLOADS_ID;
        const folders = isChatUploads ? [] : childFolders(folderId);
        const files = filesIn(folderId);
        const isCut = CS.clipboard?.type === 'cut' && CS.clipboard?.items?.some(s => s.id === id);
        let html = '';

    for (const [id, folder] of folders) {
      const cnt = childFolders(id).length + filesIn(id).length;
      html += `<div class="cloud-item cloud-folder${_selHas(id) ? ' selected' : ''}" data-id="${esc(id)}" data-type="folder"
        style="cursor:pointer;"
        onclick="window._cloudSelectItem(this,event)"
        ondblclick="window.${navFn}('${id}')"
        oncontextmenu="window._cloudItemCtx(event,'folder','${id}')"
        draggable="true"
        ondragstart="window._cloudDragStart(event,this,'folder','${esc(id)}')"
        ondragend="window._cloudDragEnd(this)"
        ondragover="window._cloudDragOver(event,this)"
        ondragleave="window._cloudDragLeave(this)"
        ondrop="window._cloudDrop(event,this,'${esc(id)}')">
        <i class="fas fa-folder cloud-icon" style="color:var(--color-accent);"></i>
        <span class="cloud-item-name">${esc(folder.name)}</span>
        <span class="cloud-item-meta">${cnt} item${cnt !== 1 ? 's' : ''}</span>
      </div>`;
    }

    if (isChatUploads) {
        for (const [, f] of files) {
          const isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
          const iconPart = isImg
            ? `<img class="cloud-thumb-img" src="${window.UPLOAD_SERVER}${esc(f.url)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='';" onload="this.style.display='';this.nextElementSibling.style.display='none';"><i class="fas ${fileIcon(f.name)} cloud-icon" style="color:var(--color-accent);opacity:0.8;display:none;"></i>`
            : `<i class="fas ${fileIcon(f.name)} cloud-icon" style="color:var(--color-accent);opacity:0.8;"></i>`;
          html += `<div class="cloud-item cloud-file" style="cursor:pointer;" onclick="window.cloudPreviewChatFile('${esc(f.url)}','${esc(f.name)}',this)">
            ${iconPart}
            <span class="cloud-item-name">${esc(f.name)}</span>
            <span class="cloud-item-meta">${fmtBytes(f.size || 0)}</span>
            <a href="${window.UPLOAD_SERVER}${esc(f.url)}" download="${esc(f.name)}" target="_blank"
              style="margin-left:auto;color:#94a3b8;font-size:0.78rem;padding:3px 6px;border-radius:4px;text-decoration:none;"
              title="Download" onclick="event.stopPropagation()"><i class="fas fa-download"></i></a>
          </div>`;
        }
    } else {
        for (const [id, f] of files) {
          const isCut = CS.clipboard?.type === 'cut' && CS.clipboard?.items?.some(s => s.id === id);
          const isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
          const iconPart = isImg
            ? `<img class="cloud-thumb-img" data-file-id="${esc(id)}" src="" alt="" style="display:none;"><i class="fas ${fileIcon(f.name)} cloud-icon cloud-thumb-placeholder" data-file-id="${esc(id)}" style="color:var(--color-accent);opacity:0.8;"></i>`
            : `<i class="fas ${fileIcon(f.name)} cloud-icon" style="color:var(--color-accent);opacity:0.8;"></i>`;
          html += `<div class="cloud-item cloud-file${_selHas(id) ? ' selected' : ''}" data-id="${esc(id)}" data-type="file"
            style="cursor:pointer;${isCut ? 'opacity:0.45;' : ''}"
            onclick="window.cloudPreviewFile('${id}',this,event)"
            ondblclick="window.cloudDownloadFile('${id}')"
            oncontextmenu="window._cloudItemCtx(event,'file','${id}')"
            draggable="true"e.key === 'delete'
            ondragstart="window._cloudDragStart(event,this,'file','${esc(id)}')"
            ondragend="window._cloudDragEnd(this)">
            ${iconPart}
            <span class="cloud-item-name">${esc(f.name)}</span>
            <span class="cloud-item-meta">${fmtBytes(f.size || 0)} • ${f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : ''}</span>
          </div>`;
        }
    }

    if (!html) html = `<div class="cloud-empty"><i class="fas fa-folder-open"></i><span>Empty folder — right-click to upload</span></div>`;
    return html;
  }
  function renderTreeNodes(parentId, depth) {
    let html = '';
    for (const [id, folder] of childFolders(parentId)) {
      html += `<div class="cloud-tree-node${CS.currentFolderId === id ? ' active' : ''}" style="padding-left:${8 + depth * 14}px" onclick="window.cloudNav('${id}')">
        <i class="fas fa-folder" style="font-size:0.72rem;"></i><span>${esc(folder.name)}</span></div>`;
      html += renderTreeNodes(id, depth + 1);
    }
    return html;
  }

  function renderTree() {
    return `
      <div class="cloud-tree-node${CS.currentFolderId === null ? ' active' : ''}" style="padding-left:8px" onclick="window.cloudNav('')">
        <i class="fas fa-hard-drive" style="font-size:0.72rem;"></i><span>My Storage</span></div>
      ${renderTreeNodes(null, 1)}`;
  }

  function renderCloudBody() {
    const body = document.getElementById('cloudBody');
    if (!body) return;
    const bc = document.getElementById('cloudBreadcrumb');
    if (bc) bc.innerHTML = buildBreadcrumb();
    const style = localStorage.getItem('cloudStorageUIStyle') || 'explorer';

    if (style === 'commander') {
        body.innerHTML = `
            <div class="cloud-tc-wrap" oncontextmenu="window._cloudBgCtx(event)">
            <div class="cloud-tc-pane">
                <div class="cloud-tc-pathbar">${buildBreadcrumbFor(CS.leftFolderId, 'cloudNavLeft')}</div>
                <div class="cloud-tc-colrow"><span>Name</span><span class="col-size">Size</span></div>
                <div class="cloud-list cloud-scroll">${renderItemList(CS.leftFolderId, 'cloudNavLeft')}</div>
            </div>
            <div class="cloud-tc-divider"></div>
            <div class="cloud-tc-pane">
                <div class="cloud-tc-pathbar">${buildBreadcrumbFor(CS.currentFolderId, 'cloudNav')}</div>
                <div class="cloud-tc-colrow"><span>Name</span><span class="col-size">Size</span></div>
                <div class="cloud-list cloud-scroll">${renderItemList(CS.currentFolderId, 'cloudNav')}</div>
            </div>
            </div>`;
    } else {
        body.innerHTML = `
          <div class="cloud-we-wrap" oncontextmenu="window._cloudBgCtx(event)">
            <div class="cloud-we-tree">
              <div class="cloud-pane-header"><i class="fas fa-sitemap"></i> Folders</div>
              <div class="cloud-tree-scroll">${renderTree()}</div>
            </div>
            <div class="cloud-we-content">
              <div class="cloud-list-wrap">
                <div class="cloud-list cloud-scroll">${renderItemList()}</div>
              </div>
              <div id="cloud-preview-resizer" class="cloud-preview-resizer"></div>
              <div id="cloud-preview-pane" class="cloud-preview-pane">
                <div class="cloud-preview-empty"><i class="fas fa-eye"></i><span>Select a file to preview</span></div>
              </div>
            </div>
          </div>`;
        _initPreviewResizer();
        _loadCloudThumbnails();
    }
  }

  window.cloudNav = function (id) {
    CS.currentFolderId = id === CHAT_UPLOADS_ID ? CHAT_UPLOADS_ID : (id || null);
    renderCloudBody();
  };

  window.cloudNavLeft = function(id) {
    CS.leftFolderId = id === CHAT_UPLOADS_ID ? CHAT_UPLOADS_ID : (id || null);
    renderCloudBody();
  };

  window._cloudItemCtx = function (e, type, id) {
    e.preventDefault();
    e.stopPropagation();
    const items = type === 'folder' ? ctxForFolder(id) : ctxForFile(id);
    showCtxMenu(e.clientX, e.clientY, items);
  };

  window._cloudBgCtx = function (e) {
    if (e.target.closest('.cloud-item')) return;
    _selClear();
    document.querySelectorAll('.cloud-item.selected').forEach(el => el.classList.remove('selected'));
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY, ctxForBackground());
  };

  window.cloudNewFolder = async function () {
    const name = await window._prompt('Folder name:');``
    if (!name || !name.trim()) return;
    const parent = CS.currentFolderId === CHAT_UPLOADS_ID ? null : CS.currentFolderId;
    await createFolder(name.trim(), parent);
    renderCloudBody();
  };

  window.cloudRenameFolder = function (id) {
    const cur = CS.folders[id]?.name || '';
    _showRenameModal('Rename Folder', cur, async (n) => {
      await renameFolder(id, n);
      renderCloudBody();
    });
  };

  window.cloudDeleteFolder = async function (id, skipConfirm) {
  const doDelete = async () => {
    await deleteCloudFolder(id);
    if (CS.currentFolderId === id) CS.currentFolderId = null;
    renderCloudBody();
    refreshCloudQuota();
  };
  if (skipConfirm) { doDelete(); return; }
  _showConfirmModal('Delete Folder', 'Delete this folder and all its contents? This cannot be undone.', doDelete, 'Delete');
};
  
  window.cloudRenameFile = function (id) {
    const cur = CS.files[id]?.name || '';
    _showRenameModal('Rename File', cur, async (n) => {
        await renameFile(id, n);
        renderCloudBody();
      }, true);
  };

  window.cloudDeleteFile = async function (id, skipConfirm) {
  const doDelete = async () => {
    await deleteCloudFile(id);
    renderCloudBody();
    refreshCloudQuota();
  };
  if (skipConfirm) { doDelete(); return; }
  _showConfirmModal('Delete File', `Delete "${esc(CS.files[id]?.name || 'this file')}"? This cannot be undone.`, doDelete, 'Delete');
};

  window.cloudDownloadFile = async function (id) {
    await downloadCloudFile(id);
  };

  window.cloudUploadTrigger = function () {
    const inp = document.getElementById('cloudFileInput');
    if (inp) inp.click();
  };

  window.cloudSetStyle = function (s) {
    localStorage.setItem('cloudStorageUIStyle', s);
    renderCloudBody();
  };

  function _showRenameModal(title, currentName, onConfirm, isFile) {
  const ov = document.createElement('div');
  ov.className = 'cloud-rename-overlay';
  ov.innerHTML = `<div class="cloud-rename-modal">
    <h3><i class="fas fa-pencil" style="margin-right:8px;opacity:0.6;"></i>${esc(title)}</h3>
    <input id="_rnmInput" type="text" value="${esc(currentName)}" spellcheck="false" autocomplete="off">
    <div class="modal-btns">
      <button class="btn-cancel">Cancel</button>
      <button class="btn-confirm">Rename</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const inp = ov.querySelector('#_rnmInput');
  const dot = currentName.lastIndexOf('.');
  inp.focus();
  inp.setSelectionRange(0, dot > 0 ? dot : currentName.length);
  const doConfirm = (val) => { onConfirm(val); ov.remove(); };
  const confirm = () => {
    const val = inp.value.trim();
    if (!val || val === currentName) { ov.remove(); return; }
    if (isFile) {
      const oldExt = currentName.includes('.') ? currentName.split('.').pop().toLowerCase() : '';
      const newExt = val.includes('.') ? val.split('.').pop().toLowerCase() : '';
      if (oldExt && newExt && oldExt !== newExt) {
        ov.remove();
        _showConfirmModal('Change File Extension?', 'Changing the file extension may result in the file being unusable. Are you sure?', () => onConfirm(val), 'Change Extension');
        return;
      }
    }
    doConfirm(val);
  };
  ov.querySelector('.btn-confirm').onclick = confirm;
  ov.querySelector('.btn-cancel').onclick = () => ov.remove();
  inp.onkeydown = e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') ov.remove(); };
  ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
}

function _showConfirmModal(title, message, onConfirm, btnLabel) {
  const ov = document.createElement('div');
  ov.className = 'cloud-confirm-overlay';
  ov.innerHTML = `<div class="cloud-confirm-modal">
    <h3><i class="fas fa-triangle-exclamation" style="margin-right:8px;color:#f87171;opacity:0.85;"></i>${esc(title)}</h3>
    <p>${esc(message)}</p>
    <div class="modal-btns">
      <button class="btn-cancel">Cancel</button>
      <button class="btn-danger">${esc(btnLabel || 'Confirm')}</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const dangerBtn = ov.querySelector('.btn-danger');
  dangerBtn.onclick = () => { ov.remove(); onConfirm(); };
  ov.querySelector('.btn-cancel').onclick = () => ov.remove();
  ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
  dangerBtn.focus();
}

function _opsStart(label) {
  const wrap = document.getElementById('cloudUploadProgress');
  const bar = document.getElementById('cloudProgressBar');
  const lbl = document.getElementById('cloudProgressLabel');
  const cancel = document.getElementById('cloudCancelBtn');
  if (!wrap) return;
  if (cancel) cancel.style.display = 'none';
  if (bar) bar.style.width = '0%';
  if (lbl) lbl.textContent = label;
  wrap.style.display = 'block';
}
function _opsUpdate(current, total, label) {
  const bar = document.getElementById('cloudProgressBar');
  const lbl = document.getElementById('cloudProgressLabel');
  const pct = total > 0 ? Math.round((current / total) * 100) : 100;
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = label || `${current} / ${total}`;
}
function _opsEnd(label) {
  const bar = document.getElementById('cloudProgressBar');
  const lbl = document.getElementById('cloudProgressLabel');
  const cancel = document.getElementById('cloudCancelBtn');
  if (bar) bar.style.width = '100%';
  if (lbl) lbl.textContent = label || 'Done';
  setTimeout(() => {
    const wrap = document.getElementById('cloudUploadProgress');
    if (wrap) wrap.style.display = 'none';e.key === 'delete'
    if (bar) bar.style.width = '0%';
    if (cancel) cancel.style.display = '';
  }, 1200);
}

function _setPreviewPane(html) {
  const p = document.getElementById('cloud-preview-pane');
  if (p) p.innerHTML = html;
}

function _markSelected(rowEl) {
  document.querySelectorAll('.cloud-item.selected').forEach(el => el.classList.remove('selected'));
  if (rowEl) rowEl.classList.add('selected');e.key === 'delete'
}

window.cloudPreviewFile = async function (id, rowEl, e) {
  window._cloudSelectItem(rowEl, e);
  const meta = CS.files[id];
  if (!meta) return;
  const name = meta.name || '';
  const ext = (name.split('.').pop() || '').toLowerCase();
  const isImg = /^(png|jpe?g|gif|webp|svg)$/.test(ext);
  const isVid = /^(mp4|mov|mkv|webm)$/.test(ext);
  const isAudio = /^(mp3|wav|flac|ogg|m4a|aac)$/.test(ext);
  const isText = /^(txt|md|js|ts|py|json|html|css|sh|c|cpp|csv|log|yaml|yml|xml|ini|toml)$/.test(ext);
  _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-spinner fa-spin"></i><span>Decrypting…</span></div>`);
  try {
    const token = await getToken();
    if (!token) { _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-lock"></i><span>Not signed in</span></div>`); return; }
    const url = meta.serverUrl ? `${window.UPLOAD_SERVER}${meta.serverUrl}` : `${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    let outBuf = blob;
    if (meta.encrypted) {
      const mimeMap = { mp3:'audio/mpeg', wav:'audio/wav', flac:'audio/flac', ogg:'audio/ogg', m4a:'audio/mp4', aac:'audio/aac', mp4:'video/mp4', mov:'video/quicktime', mkv:'video/x-matroska', webm:'video/webm' };
      const mime = mimeMap[ext] || blob.type || 'application/octet-stream';
      outBuf = new Blob([await decryptBlob(blob)], { type: mimeMap[ext] || 'application/octet-stream' });``
    }
    const objUrl = URL.createObjectURL(outBuf);
    if (isImg) {
      const imgEl = document.querySelector(`.cloud-thumb-img[data-file-id="${id}"]`);
      const phEl = document.querySelector(`.cloud-thumb-placeholder[data-file-id="${id}"]`);
      if (imgEl) { imgEl.src = objUrl; imgEl.style.display = ''; if (phEl) phEl.style.display = 'none'; }
      _setPreviewPane(`
        <img class="cloud-preview-img" src="${objUrl}">
        <div class="cloud-preview-bar">
          <button onclick="window.open('${objUrl}')"><i class="fas fa-up-right-from-square"></i></button>
          <button onclick="document.getElementById('cloud-preview-pane').innerHTML='<div class=cloud-preview-empty><i class=fas fa-eye></i><span>Select a file to preview</span></div>'"><i class="fas fa-xmark"></i></button>
        </div>
        <span class="cloud-preview-label">${esc(name)}</span>`);
    } else if (isVid) {
      _setPreviewPane(`
        <video class="cloud-preview-video" src="${objUrl}" controls></video>
        <div class="cloud-preview-bar">
          <button title="Fullscreen" onclick="this.closest('#cloud-preview-pane').querySelector('video').requestFullscreen()"><i class="fas fa-expand"></i></button>
          <button onclick="const v=document.querySelector('#cloud-preview-pane video');if(v){URL.revokeObjectURL(v.src);}document.getElementById('cloud-preview-pane').innerHTML='<div class=cloud-preview-empty><i class=fas fa-eye></i><span>Select a file to preview</span></div>'"><i class="fas fa-xmark"></i></button>
        </div>
        <span class="cloud-preview-label">${esc(name)}</span>`);
      } else if (isAudio) {
  const mimeType = ext === 'm4a' || ext === 'aac' ? 'audio/mp4' : ext === 'mp3' ? 'audio/mpeg' : ext === 'ogg' ? 'audio/ogg' : `audio/${ext}`;
  const canPlay = document.createElement('audio').canPlayType(mimeType);
  if (!canPlay) {
    _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-file-audio" style="font-size:1.8rem;opacity:0.4;"></i><span>${esc(name)}</span><span style="font-size:0.72rem;color:#475569;text-align:center;">This browser has no audio playing support for the .${esc(ext)} file extension.</span></div>`);
    URL.revokeObjectURL(objUrl);
  } else {
    const existing = CS.audioQueue.findIndex(t => t.id === id);
    if (existing !== -1) {
      window._cloudAudioPlay(existing);
    } else {
      CS.audioQueue.push({ id, name, objUrl });
      window._cloudAudioPlay(CS.audioQueue.length - 1);
    }
  }
    } else if (isText) {
      const text = await outBuf.text();
      _setPreviewPane(`
        <div class="cloud-preview-text">${esc(text)}</div>
        <div class="cloud-preview-bar">
          <button onclick="document.getElementById('cloud-preview-pane').innerHTML='<div class=cloud-preview-empty><i class=fas fa-eye></i><span>Select a file to preview</span></div>'"><i class="fas fa-xmark"></i></button>
        </div>
        <span class="cloud-preview-label">${esc(name)}</span>`);
    } else {
      _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-file"></i><span>${esc(name)}</span><span style="font-size:0.7rem;color:#334155">No preview available</span></div>`);
      URL.revokeObjectURL(objUrl);
    }
  } catch (e) {
    _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-triangle-exclamation"></i><span>Preview failed</span></div>`);
  }
};

function _renderAudioPlayer() {
  const pane = document.getElementById('cloud-preview-pane');
  if (!pane) return;
  const q = CS.audioQueue;
  const idx = CS.audioQueueIdx;
  const cur = q[idx];
  const prevAudio = pane.querySelector('audio');
  const wasPlaying = prevAudio && !prevAudio.paused;
  const prevTime = prevAudio ? prevAudio.currentTime : 0;
  const repeatLabels = ['off', 'all', '1'];
  const repeatTitles = ['Repeat Off', 'Repeat Playlist', 'Repeat Track'];
  pane.innerHTML = `
    <div id="cloud-audio-player" style="display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;">
      <div style="padding:10px 14px 8px;border-bottom:1px solid rgba(84,129,204,0.12);flex-shrink:0;">
        <div style="font-size:0.78rem;color:#e2e8f0;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:7px;" title="${cur ? esc(cur.name) : ''}">
          <i class="fas fa-music" style="color:var(--color-accent);opacity:0.6;margin-right:6px;"></i>${cur ? esc(cur.name) : '<span style="opacity:0.35;">No track</span>'}
        </div>
        <audio id="cloud-audio-el" src="${cur ? cur.objUrl : ''}" controls style="width:100%;height:28px;" ${cur ? '' : 'disabled'}></audio>
        <div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:6px;">
          <button class="cloud-audio-ctrl" id="cloud-audio-prev" title="Previous"><i class="fas fa-backward-step"></i></button>
          <button class="cloud-audio-ctrl" id="cloud-audio-next" title="Next"><i class="fas fa-forward-step"></i></button>
          <button class="cloud-audio-ctrl${CS.audioRepeat > 0 ? ' active' : ''}" id="cloud-audio-repeat" title="${repeatTitles[CS.audioRepeat]}" style="font-size:0.78rem;display:flex;align-items:center;gap:4px;">
            <i class="fas ${CS.audioRepeat === 2 ? 'fa-rotate-right' : 'fa-repeat'}"></i><span style="font-size:0.65rem;">${repeatLabels[CS.audioRepeat]}</span>
          </button>
          ${idx !== -1 ? `<button class="cloud-audio-ctrl" id="cloud-audio-remove-cur" title="Remove from queue" style="margin-left:4px;"><i class="fas fa-trash" style="font-size:0.75rem;"></i></button>` : ''}
        </div>
      </div>
      <div style="padding:5px 12px 3px;font-size:0.67rem;color:#475569;border-bottom:1px solid rgba(84,129,204,0.07);flex-shrink:0;">QUEUE — drag audio files here</div>
      <div id="cloud-audio-queue" style="flex:1;overflow-y:auto;min-height:0;">${
        q.length === 0
          ? `<div class="cloud-queue-drop-hint"><i class="fas fa-music"></i>Drag audio files into the queue</div>`
          : q.map((t, i) => `
            <div class="cloud-queue-item${i === idx ? ' cloud-queue-active' : ''}" data-qi="${i}"
              draggable="true"
              ondragstart="window._cloudQueueItemDragStart(event,${i})">
              <i class="fas fa-music" style="opacity:0.35;font-size:0.7rem;flex-shrink:0;"></i>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.77rem;">${esc(t.name)}</span>
              <button onclick="event.stopPropagation();window._cloudQueueRemove(${i})" style="background:none;border:none;color:#475569;cursor:pointer;padding:0 3px;font-size:0.7rem;" title="Remove"><i class="fas fa-xmark"></i></button>
            </div>`).join('')
      }</div>
    </div>`;
  const audioEl = pane.querySelector('#cloud-audio-el');
  if (audioEl) {
    audioEl.volume = CS.audioVolume;
    if (cur && wasPlaying) { audioEl.currentTime = prevTime; audioEl.play().catch(() => {}); }
    audioEl.addEventListener('volumechange', () => { CS.audioVolume = audioEl.volume; });
    audioEl.onended = () => {
      if (CS.audioRepeat === 2) { audioEl.currentTime = 0; audioEl.play().catch(() => {}); }
      else if (CS.audioRepeat === 1) window._cloudAudioPlay((CS.audioQueueIdx + 1) % CS.audioQueue.length);
      else if (CS.audioQueueIdx < CS.audioQueue.length - 1) window._cloudAudioPlay(CS.audioQueueIdx + 1);
    };
  }
  pane.querySelector('#cloud-audio-prev')?.addEventListener('click', () => {
    if (CS.audioQueueIdx > 0) window._cloudAudioPlay(CS.audioQueueIdx - 1);
  });
  pane.querySelector('#cloud-audio-next')?.addEventListener('click', () => {
    if (CS.audioQueueIdx < CS.audioQueue.length - 1) window._cloudAudioPlay(CS.audioQueueIdx + 1);
  });
  pane.querySelector('#cloud-audio-repeat')?.addEventListener('click', () => {
    const audio = document.getElementById('cloud-audio-el');
    const playing = audio && !audio.paused;
    CS.audioRepeat = (CS.audioRepeat + 1) % 3;
    _renderAudioPlayer();
    if (playing) document.getElementById('cloud-audio-el')?.play().catch(() => {});
  });
  pane.querySelector('#cloud-audio-remove-cur')?.addEventListener('click', () => {
    window._cloudQueueRemove(CS.audioQueueIdx);
  });
  pane.querySelectorAll('.cloud-queue-item').forEach(el => {
    el.addEventListener('click', () => window._cloudAudioPlay(parseInt(el.dataset.qi)));
    el.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); el.style.background = 'rgba(84,129,204,0.18)'; });
    el.addEventListener('dragleave', () => { el.style.background = ''; });
    el.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); el.style.background = ''; window._cloudQueueReorder(e, parseInt(el.dataset.qi)); });
  });
  const queueEl = pane.querySelector('#cloud-audio-queue');
  if (queueEl) {
    queueEl.addEventListener('dragover', e => { if (!e.target.closest('.cloud-queue-item')) { e.preventDefault(); queueEl.classList.add('cloud-queue-drop-zone-active'); } });
    queueEl.addEventListener('dragleave', () => queueEl.classList.remove('cloud-queue-drop-zone-active'));
    queueEl.addEventListener('drop', e => { queueEl.classList.remove('cloud-queue-drop-zone-active'); window._cloudAudioQueueDrop(e); });
  }
}

window._cloudAudioPlay = function (idx) {
  if (idx < 0 || idx >= CS.audioQueue.length) return;
  CS.audioQueueIdx = idx;
  _renderAudioPlayer();
  const audio = document.getElementById('cloud-audio-el');
  if (audio) audio.play().catch(() => {});
};

window._cloudAudioQueueDrop = function (e) {
  e.preventDefault();
  const drag = CS.dragItem;
  if (!drag || drag.type !== 'file') return;
  const meta = CS.files[drag.id];
  if (!meta) return;
  const ext = (meta.name || '').split('.').pop().toLowerCase();
  if (!/^(mp3|wav|flac|ogg|m4a|aac)$/.test(ext)) return;
  if (CS.audioQueue.some(t => t.id === drag.id)) return;
  const pane = document.getElementById('cloud-preview-pane');
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:0.78rem;color:#94a3b8;z-index:10;';
  loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Loading…';
  if (pane) pane.style.position = 'relative', pane.appendChild(loadingDiv);
  (async () => {
    try {
      const token = await getToken();
      const url = meta.serverUrl ? `${window.UPLOAD_SERVER}${meta.serverUrl}` : `${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const blob = await res.blob();
      const mimeMap = { mp3:'audio/mpeg', wav:'audio/wav', flac:'audio/flac', ogg:'audio/ogg', m4a:'audio/mp4', aac:'audio/aac' };
      const outBuf = meta.encrypted ? new Blob([await decryptBlob(blob)], { type: mimeMap[ext] || 'audio/mpeg' }) : blob;
      const objUrl = URL.createObjectURL(outBuf);
      CS.audioQueue.push({ id: drag.id, name: meta.name, objUrl });
      if (CS.audioQueueIdx === -1) { CS.audioQueueIdx = 0; _renderAudioPlayer(); document.getElementById('cloud-audio-el')?.play().catch(() => {}); }
      else _renderAudioPlayer();
    } catch {}
    loadingDiv.remove();
  })();
};

window._cloudQueueItemDragStart = function (e, idx) {
  e.stopPropagation();
  e._queueDragIdx = idx;
  e.dataTransfer.setData('cloud-queue-idx', idx);
};

window._cloudQueueReorder = function (e, targetIdx) {
  const fromIdx = parseInt(e.dataTransfer.getData('cloud-queue-idx'));
  if (isNaN(fromIdx) || fromIdx === targetIdx) return;
  const item = CS.audioQueue.splice(fromIdx, 1)[0];
  CS.audioQueue.splice(targetIdx, 0, item);
  if (CS.audioQueueIdx === fromIdx) CS.audioQueueIdx = targetIdx;
  else if (fromIdx < CS.audioQueueIdx && targetIdx >= CS.audioQueueIdx) CS.audioQueueIdx--;
  else if (fromIdx > CS.audioQueueIdx && targetIdx <= CS.audioQueueIdx) CS.audioQueueIdx++;
  _renderAudioPlayer();
};

window._cloudQueueRemove = function (idx) {
  CS.audioQueue.splice(idx, 1);
  if (CS.audioQueueIdx >= CS.audioQueue.length) CS.audioQueueIdx = CS.audioQueue.length - 1;
  _renderAudioPlayer();
};

window.cloudPreviewChatFile = function (fileUrl, name, rowEl) {
  _markSelected(rowEl);
  const ext = (name.split('.').pop() || '').toLowerCase();
  const isImg = /^(png|jpe?g|gif|webp|svg)$/.test(ext);
  const isVid = /^(mp4|mov|mkv|webm)$/.test(ext);
  const isText = /^(txt|md|json|csv|log|xml|yaml|yml|ini)$/.test(ext);
  const src = `${window.UPLOAD_SERVER}${fileUrl}`;
  if (isImg) {
    _setPreviewPane(`
      <img class="cloud-preview-img" src="${src}">
      <div class="cloud-preview-bar">
        <button onclick="window.open('${src}')"><i class="fas fa-up-right-from-square"></i></button>
        <button onclick="document.getElementById('cloud-preview-pane').innerHTML='<div class=cloud-preview-empty><i class=fas fa-eye></i><span>Select a file to preview</span></div>'"><i class="fas fa-xmark"></i></button>
      </div>
      <span class="cloud-preview-label">${esc(name)}</span>`);
  } else if (isVid) {
    _setPreviewPane(`
      <video class="cloud-preview-video" src="${src}" controls></video>
      <div class="cloud-preview-bar">
        <button title="Fullscreen" onclick="this.closest('#cloud-preview-pane').querySelector('video').requestFullscreen()"><i class="fas fa-expand"></i></button>
        <button onclick="document.getElementById('cloud-preview-pane').innerHTML='<div class=cloud-preview-empty><i class=fas fa-eye></i><span>Select a file to preview</span></div>'"><i class="fas fa-xmark"></i></button>
      </div>
      <span class="cloud-preview-label">${esc(name)}</span>`);
  } else if (isText) {
    fetch(src).then(r => r.text()).then(text => {
      _setPreviewPane(`
        <div class="cloud-preview-text">${esc(text)}</div>
        <div class="cloud-preview-bar">
          <button onclick="document.getElementById('cloud-preview-pane').innerHTML='<div class=cloud-preview-empty><i class=fas fa-eye></i><span>Select a file to preview</span></div>'"><i class="fas fa-xmark"></i></button>
        </div>
        <span class="cloud-preview-label">${esc(name)}</span>`);
    }).catch(() => _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-triangle-exclamation"></i><span>Preview failed</span></div>`));
  } else {
    _setPreviewPane(`<div class="cloud-preview-empty"><i class="fas fa-file"></i><span>${esc(name)}</span><span style="font-size:0.7rem;color:#334155">No preview available</span></div>`);
  }
};

function _loadCloudThumbnails() {
  document.querySelectorAll('.cloud-thumb-img[data-file-id]').forEach(async img => {
    const id = img.dataset.fileId;
    const meta = CS.files[id];
    if (!meta) return;
    try {
      const token = await getToken();
      if (!token) return;
      const url = meta.serverUrl ? `${window.UPLOAD_SERVER}${meta.serverUrl}` : `${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return;
      const blob = await res.blob();
      let out = blob;
      if (meta.encrypted) out = new Blob([await decryptBlob(blob)]);
      const objUrl = URL.createObjectURL(out);
      img.src = objUrl;
      img.style.display = '';
      const ph = document.querySelector(`.cloud-thumb-placeholder[data-file-id="${id}"]`);
      if (ph) ph.style.display = 'none';
    } catch {}
  });
}

function _initPreviewResizer() {
  const resizer = document.getElementById('cloud-preview-resizer');
  const pane = document.getElementById('cloud-preview-pane');
  if (!resizer || !pane) return;
  let startY, startH;
  resizer.addEventListener('mousedown', e => {
    startY = e.clientY;
    startH = pane.offsetHeight;
    resizer.classList.add('dragging');
    const onMove = ev => {
      const delta = startY - ev.clientY;
      const newH = Math.max(56, Math.min(window.innerHeight * 0.7, startH + delta));
      pane.style.flex = `0 0 ${newH}px`;
    };
    const onUp = () => {
      resizer.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

window.cloudPaste = async function () {
  if (!CS.clipboard?.items?.length) return;
  const { type, items } = CS.clipboard;
  const targetFolder = CS.currentFolderId === CHAT_UPLOADS_ID ? null : CS.currentFolderId;
  const opLabel = type === 'cut' ? 'Moving' : 'Copying';
  _opsStart(`${opLabel} 0 / ${items.length}…`);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    _opsUpdate(i, items.length, `${opLabel} ${i + 1} / ${items.length}: ${CS.files[item.id]?.name || CS.folders[item.id]?.name || item.id}`);
    if (type === 'cut' && item.type === 'folder') {
      await getCloudRef().child(`folders/${item.id}/parentId`).set(targetFolder);
      if (CS.folders[item.id]) CS.folders[item.id].parentId = targetFolder;
    } else if (type === 'cut' && item.type === 'file') {
      await getCloudRef().child(`files/${item.id}/folderId`).set(targetFolder);
      if (CS.files[item.id]) CS.files[item.id].folderId = targetFolder;
    } else if (item.type === 'file') {
      const meta = CS.files[item.id];
      if (!meta) continue;
      const token = await getToken();
      if (!token) continue;
      const url = meta.serverUrl ? `${window.UPLOAD_SERVER}${meta.serverUrl}` : `${window.UPLOAD_SERVER}/file/${meta.safeUser}/${meta.serverId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null);
      if (!res || !res.ok) continue;
      const blob = await res.blob();
      const username = localStorage.getItem('public_chat_username_v1') || getSafeUser();
      const fd = new FormData();
      fd.append('file', new File([blob], `${Date.now()}.bin`, { type: 'application/octet-stream' }));
      const uploadRes = await fetch(`${window.UPLOAD_SERVER}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-username': username, 'x-room-code': 'cloud' },
        body: fd
      }).catch(() => null);
      if (!uploadRes || !uploadRes.ok) continue;
      const result = await uploadRes.json();
      const newMeta = { ...meta, folderId: targetFolder, uploadedAt: new Date().toISOString(), serverId: result.id, serverUrl: result.url, safeUser: result.safeUser };
      const newRef = getCloudRef().child('files').push();
      await newRef.set(newMeta);
      CS.files[newRef.key] = newMeta;
    }
  }
  if (type === 'cut') CS.clipboard = null;
  _opsEnd(`${opLabel === 'Moving' ? 'Moved' : 'Copied'} ${items.length} item${items.length !== 1 ? 's' : ''}`);
  _selClear();
  renderCloudBody();
  refreshCloudQuota();
};


window._cloudSelectItem = function (el, e) {
  const id = el.dataset.id;
  const type = el.dataset.type;
  if (!id) return;
  if (e && e.shiftKey && CS.lastSelected) {
    const all = [...document.querySelectorAll('.cloud-item[data-id]')];
    const lastEl = document.querySelector(`.cloud-item[data-id="${CSS.escape(CS.lastSelected)}"]`);
    const iA = all.indexOf(el), iB = lastEl ? all.indexOf(lastEl) : iA;
    const [lo, hi] = iA < iB ? [iA, iB] : [iB, iA];
    all.slice(lo, hi + 1).forEach(item => {
      _selAdd(item.dataset.type, item.dataset.id);
      item.classList.add('selected');
    });
  } else if (e && (e.ctrlKey || e.metaKey)) {
    if (_selHas(id)) { _selRemove(id); el.classList.remove('selected'); }
    else { _selAdd(type, id); el.classList.add('selected'); CS.lastSelected = id; }
    return;
  } else {
  if (_selHas(id)) return;
  _selClear();
  document.querySelectorAll('.cloud-item.selected').forEach(el => el.classList.remove('selected'));
  _selAdd(type, id);
  el.classList.add('selected');
  CS.lastSelected = id;
}
  CS.lastSelected = id;
};
window._cloudDragStart = function (e, el, type, id) {
  if (!_selHas(id)) {
    _selClear();
    document.querySelectorAll('.cloud-item.selected').forEach(el => el.classList.remove('selected'));
    _selAdd(type, id);
    el.classList.add('selected');
  }
  CS.dragItem = { type, id };
  e.dataTransfer.effectAllowed = 'move';
};
window._cloudDragEnd = function (el) {
  el.style.opacity = '';
  CS.dragItem = null;
};
window._cloudDragOver = function (e, el) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  el.classList.add('drag-over');
};
window._cloudDragLeave = function (el) {
  el.classList.remove('drag-over');
};
window._cloudDrop = async function (e, el, targetFolderId) {
  e.preventDefault();
  el.classList.remove('drag-over');
  const toDrag = CS.selection.length > 0 ? [...CS.selection] : (CS.dragItem ? [CS.dragItem] : []);
  CS.dragItem = null;
  if (!toDrag.length) return;
  for (const drag of toDrag) {
    if (drag.id === targetFolderId) continue;
    if (drag.type === 'folder') {
      let check = targetFolderId;
      let isDescendant = false;
      while (check) {
        if (check === drag.id) { isDescendant = true; break; }
        check = CS.folders[check]?.parentId || null;
      }
      if (isDescendant) continue;
      await getCloudRef().child(`folders/${drag.id}/parentId`).set(targetFolderId);
      if (CS.folders[drag.id]) CS.folders[drag.id].parentId = targetFolderId;
    } else {
      await getCloudRef().child(`files/${drag.id}/folderId`).set(targetFolderId);
      if (CS.files[drag.id]) CS.files[drag.id].folderId = targetFolderId;
    }
  }
  _selClear();
  renderCloudBody();
};

function _openTextEditor(fileName, initialContent, onSave) {
  const ov = document.createElement('div');
  ov.className = 'cloud-editor-overlay';
  ov.innerHTML = `<div class="cloud-editor-modal">
    <div class="cloud-editor-titlebar">
      <i class="fas fa-file-lines" style="color:var(--color-accent);opacity:0.7;flex-shrink:0;"></i>
      <span>${esc(fileName)}</span>
      <button id="_edSave" style="background:var(--color-accent);border:none;color:#fff;border-radius:6px;padding:4px 14px;cursor:pointer;font-size:0.78rem;font-weight:500;flex-shrink:0;">Save</button>
      <button id="_edClose" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:1rem;padding:2px 6px;flex-shrink:0;" title="Close & Save"><i class="fas fa-xmark"></i></button>
    </div>
    <div class="cloud-editor-toolbar">
      <button id="_edUndo"><i class="fas fa-rotate-left"></i> Undo</button>
      <button id="_edRedo"><i class="fas fa-rotate-right"></i> Redo</button>
      <span style="width:1px;background:rgba(84,129,204,0.2);margin:0 4px;align-self:stretch;"></span>
      <button id="_edCut"><i class="fas fa-scissors"></i> Cut</button>
      <button id="_edCopy"><i class="fas fa-copy"></i> Copy</button>
      <button id="_edPaste"><i class="fas fa-paste"></i> Paste</button>
    </div>
    <textarea class="cloud-editor-textarea" id="_edArea" spellcheck="false">${esc(initialContent)}</textarea>
    <div class="cloud-editor-statusbar" id="_edStatus">Ready • Ctrl+S to save</div>
  </div>`;
  document.body.appendChild(ov);
  const area = ov.querySelector('#_edArea');
  const status = ov.querySelector('#_edStatus');
  area.focus();
  const save = async () => {
    status.textContent = 'Saving…';
    try { await onSave(area.value); status.textContent = 'Saved!'; } catch { status.textContent = 'Save failed.'; }
    setTimeout(() => { if (status) status.textContent = 'Ready • Ctrl+S to save'; }, 1800);
  };
  ov.querySelector('#_edSave').onclick = save;
  ov.querySelector('#_edClose').onclick = async () => { await save(); ov.remove(); };
  ov.querySelector('#_edUndo').onclick = () => { area.focus(); document.execCommand('undo'); };
  ov.querySelector('#_edRedo').onclick = () => { area.focus(); document.execCommand('redo'); };
  ov.querySelector('#_edCut').onclick = () => { area.focus(); document.execCommand('cut'); };
  ov.querySelector('#_edCopy').onclick = () => { area.focus(); document.execCommand('copy'); };
  ov.querySelector('#_edPaste').onclick = async () => {
    area.focus();
    try {
      const text = await navigator.clipboard.readText();
      const s = area.selectionStart, e = area.selectionEnd;
      area.value = area.value.slice(0, s) + text + area.value.slice(e);
      area.selectionStart = area.selectionEnd = s + text.length;
    } catch { document.execCommand('paste'); }
  };
  area.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); } });
  ov.addEventListener('mousedown', e => { if (e.target === ov) { save(); ov.remove(); } });
}

window.cloudNewTextFile = function () {
  const name = window._prompt('File name:', 'New Text Document.txt');
  if (!name || !name.trim()) return;
  const fileName = name.trim().match(/\.[a-z0-9]+$/i) ? name.trim() : name.trim() + '.txt';
  let savedFileId = null;
  _openTextEditor(fileName, '', async (content) => {
    if (savedFileId && CS.files[savedFileId]) {
      const m = CS.files[savedFileId];
      const tok = await getToken();
      if (tok && m.serverId && m.safeUser) await fetch(`${window.UPLOAD_SERVER}/file/${m.safeUser}/${m.serverId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } }).catch(() => {});
      await getCloudRef().child(`files/${savedFileId}`).remove();
      delete CS.files[savedFileId];
      savedFileId = null;
    }
    const keysBefore = new Set(Object.keys(CS.files));
    await uploadCloudFiles([new File([new Blob([content], { type: 'text/plain' })], fileName, { type: 'text/plain' })]);
    savedFileId = Object.keys(CS.files).find(k => !keysBefore.has(k)) || null;
  });
};

  window.initCloudStorage = async function () {
    CS.currentFolderId = null;
    CS.leftFolderId = null;
    CS.folders = {};
    CS.files = {};
    CS.chatFiles = [];

    const inp = document.getElementById('cloudFileInput');
    if (inp) {
      inp.onchange = async () => {
        const files = Array.from(inp.files);
        inp.value = '';
        if (files.length) await uploadCloudFiles(files);
      };
    }

    renderCloudBody();
    refreshCloudQuota();

    if (!window._cloudKeyListenerAdded) {
  window._cloudKeyListenerAdded = true;
  document.addEventListener('keydown', (e) => {
    const cloudBody = document.getElementById('cloudBody');
    if (!cloudBody || !cloudBody.offsetParent) return;
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    const sel = document.querySelector('.cloud-item.selected');
    const selId = sel?.dataset?.id;
    const selType = sel?.dataset?.type;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (CS.currentFolderId === null) return;
      if (CS.currentFolderId === CHAT_UPLOADS_ID) { window.cloudNav(''); return; }
      window.cloudNav(CS.folders[CS.currentFolderId]?.parentId || '');
    }
    if (e.key === 'Delete' && CS.selection.length) {
      const files = CS.selection.filter(s => s.type === 'file');
      const folders = CS.selection.filter(s => s.type === 'folder');
      const count = CS.selection.length;
      const doDelete = async () => {
  const total = files.length + folders.length;
  _opsStart(`Deleting 0 / ${total}…`);
  let done = 0;
  for (const f of files) {
    _opsUpdate(done, total, `Deleting ${done + 1} / ${total}: ${CS.files[f.id]?.name || f.id}`);
    await deleteCloudFile(f.id);
    done++;
  }
  for (const f of folders) {
    _opsUpdate(done, total, `Deleting ${done + 1} / ${total}: ${CS.folders[f.id]?.name || f.id}`);
    await deleteCloudFolder(f.id);
    if (CS.currentFolderId === f.id) CS.currentFolderId = null;
    done++;
  }
  _opsEnd(`Deleted ${total} item${total !== 1 ? 's' : ''}`);
  _selClear();
  renderCloudBody(); refreshCloudQuota();
};
      if (e.shiftKey) { doDelete(); }
      else { _showConfirmModal('Delete', `Delete ${count} selected item${count !== 1 ? 's' : ''}? This cannot be undone.`, doDelete, 'Delete'); }
    }
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      document.querySelectorAll('.cloud-item[data-id]').forEach(el => { _selAdd(el.dataset.type, el.dataset.id); el.classList.add('selected'); });
    }
    if (e.ctrlKey && e.key === 'c' && CS.selection.length) {
      CS.clipboard = { type: 'copy', items: [...CS.selection] };
    }
    if (e.ctrlKey && e.key === 'x' && CS.selection.length) {
      CS.clipboard = { type: 'cut', items: [...CS.selection] };
      renderCloudBody();
    }
    if ((e.ctrlKey && e.key === 'v') || (e.shiftKey && e.key === 'Insert')) {
      if (CS.clipboard?.items?.length) window.cloudPaste();
    }
  });
}
    if (_cloudListener) { _cloudListener.off(); _cloudListener = null; }
    const user = await getAuthUser();
    if (user) {
      try { await loadChatUploads(); } catch(e) { console.error('[cloud] chat:', e); }
      _cloudListener = getCloudRef();
      _cloudListener.on('value', snap => {
        const d = snap.val() || {};
        CS.folders = d.folders || {};
        CS.files = d.files || {};
        renderCloudBody();
        refreshCloudQuota();
      });
    }
  };
  injectContextMenuStyles();
})();