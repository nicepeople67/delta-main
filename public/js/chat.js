let window_chatGlobalState = null;

function getDbSafeName(name) {
  return (name || 'Guest').toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function displayNameFromSafe(safe) {
  if (!safe) return '';
  try {
    return safe.replace(/_/g, ' ').split(/\s+/).map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '').join(' ').trim();
  } catch (e) { return safe; }
}

window.initGlobalChatListeners = function () {
  const db = firebase.database();
  const auth = firebase.auth();

  auth.onAuthStateChanged((user) => {
    if (!user) {
      auth.signInAnonymously().catch(e => console.error("Auth failed:", e));
      return;
    }
    
    if (!window_chatGlobalState) {
      window_chatGlobalState = {
        db: db,
        roomsRef: db.ref('private_rooms'),
        listeners: new Map()
      };
    }

    if (document.getElementById('messages')) {
          window.initPublicChat();
        } else {
          const _chatObserver = new MutationObserver(() => {
            if (document.getElementById('messages')) {
              _chatObserver.disconnect();
              window.initPublicChat();
            }
          });
          _chatObserver.observe(document.body, { childList: true, subtree: true });
        }
  });
};

(async () => {
  const getIP = async () => {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  };

  const ipToInt = ip =>
    ip.split(".").reduce((acc, oct) => (acc << 8) + +oct, 0) >>> 0;

  const inCIDR = (ip, cidr) => {
    const [range, bits] = cidr.split("/");
    const mask = ~(2 ** (32 - bits) - 1);
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  };

  const loadBlacklist = async () => {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/X4BNet/lists_vpn@main/ipv4.txt"
    );
    const text = await res.text();
    return text.split("\n").map(l => l.trim()).filter(Boolean);
  };

  const ip = await getIP();
  const blacklist = await loadBlacklist();

  if (blacklist.some(cidr => inCIDR(ip, cidr))) {
    location.replace("/403.html");
  }
})();

window.initPublicChat = function () {
  const db = firebase.database();
  const publicTypingRef = db.ref('private_rooms'); 
  const roomsRef = db.ref('private_rooms'); 
  const UI = {
      chatTitle: document.getElementById('chatTitle'),
      messages: document.getElementById('messages'),
      input: document.getElementById('messageInput'),
      sendBtn: document.getElementById('sendBtn'),
      cooldownTimer: document.getElementById('cooldownTimer'),
      clearBtn: document.getElementById('clearBtn'),
      clearInputBtn: document.getElementById('clearInputBtn'),
      status: document.getElementById('status'),
      channelStatus: document.getElementById('channelStatus'),
      typingIndicator: document.getElementById('typingIndicator'),
      roomCodeInput: document.getElementById('roomCodeInput'),
      joinRoomBtn: document.getElementById('joinRoomBtn'),
      createRoomBtn: document.getElementById('createRoomBtn'),
      roomList: document.getElementById('roomList'),
      chatSidebarBadge: document.getElementById('chat-notification-badge'),
      deleteAllFilesBtn: document.getElementById('deleteAllFilesBtn'),
      uploadFileBtn: document.getElementById('uploadFileBtn'),
      fileInput: document.getElementById('fileInput'),
      uploadProgress: document.getElementById('uploadProgress')
  };
  const LS_NAME = 'public_chat_username_v1';
  const LS_ROOMS = 'joined_private_rooms';
  let isAdmin = false;
  const _adminUid = firebase.auth().currentUser?.uid;
  if (_adminUid) {
    db.ref(`admins/${_adminUid}`).once('value', snap => { isAdmin = snap.exists(); });
  }
      const pfpCache = new Map();
      db.ref('user_pfps').on('value', snap => {
        const all = snap.val() || {};
        pfpCache.clear();
        Object.entries(all).forEach(([k, v]) => pfpCache.set(k, typeof v === 'object' ? v.url : v));
        document.querySelectorAll('.avatar[data-pfp-user]').forEach(el => {
          const url = pfpCache.get(el.dataset.pfpUser);
          if(url){ el.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.textContent=this.dataset.pfpFallback">`; }
          else { el.innerHTML = ''; el.textContent = el.dataset.pfpFallback || '?'; }
        });
      }, err => console.error('pfpCache listener error:', err));
    
  let State = {
    isCooldown: false,
    currentRoomCode: null,
    currentTypingRef: publicTypingRef,
    chatListeners: { added: null, changed: null, removed: null },
    chatQueryRef: null,
    typingListener: null,
    typingTimeout: null,
    roomNotifications: new Map(),
    roomListeners: new Map(), 
    renderedMessageIds: new Set(),
    pendingFiles: [],
    lastMsgName: null,
    lastMsgTs: null,
    lastRenderedDate: null,
  };
const userDbKey = localStorage.getItem('userDbKey');

async function restoreUsernameFromFirebase(uid) {
  const snap = await db.ref('logged_users').orderByChild('uid').equalTo(uid).limitToFirst(1).get();
  if (snap.exists()) {
    const [key] = Object.keys(snap.val());
    localStorage.setItem('userDbKey', key);
    const derivedName = key.replace(/_/g, ' ')
      .split(/\s+/).map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ').trim();
    localStorage.setItem(LS_NAME, derivedName);
    db.ref(`taken_usernames/${derivedName}`).transaction(current => current === null ? uid : current);
    db.ref(`user_uid_map/${uid}`).set(key).catch(() => {});
    if (State.currentChatRef) {
      startListeningToChat();
    }
  }
}
const uid = firebase.auth().currentUser?.uid;
if (userDbKey && uid) {
  const derivedName = userDbKey.replace(/_/g, ' ')
    .split(/\s+/).map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ').trim();
  localStorage.setItem(LS_NAME, derivedName);
  db.ref(`taken_usernames/${derivedName}`).transaction(current => current === null ? uid : current);
  db.ref(`user_uid_map/${uid}`).set(userDbKey).catch(() => {});
} else if (!userDbKey && uid) {
  restoreUsernameFromFirebase(uid);
}
  function nowIso(){ return new Date().toISOString(); }
  function timeShort(iso){
    try {
      const d = new Date(iso);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today - 86400000);
      const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const time = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      if(msgDay.getTime() === today.getTime()) return `Today at ${time}`;
      if(msgDay.getTime() === yesterday.getTime()) return `Yesterday at ${time}`;
      return d.toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'}) + ` at ${time}`;
    } catch(e){ return ''; }
  }
  function makeAvatarLetter(name){ return (name||'?').slice(0,1).toUpperCase(); }
  function escapeHtml(str){
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
  function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
function isChatActive() {
    return window.location.pathname === '/chat';
}
function updateSidebarNotification(totalNewMessages) {
    if (!UI.chatSidebarBadge) { return; }
    if (totalNewMessages > 0) {
        UI.chatSidebarBadge.textContent = totalNewMessages > 99 ? '99+' : totalNewMessages;
        UI.chatSidebarBadge.classList.remove('hidden');
    } else {
        UI.chatSidebarBadge.classList.add('hidden');
        UI.chatSidebarBadge.textContent = '0';
    }
}
function recalculateTotalNotifications() {
    if (isChatActive()) {
        updateSidebarNotification(0);
        return;
    }
    let total = 0;
    State.roomNotifications.forEach(notif => {
        total += (notif.newMsgCount || 0);
    });
    updateSidebarNotification(total);
}
  function getRoomsDbRef() {
    const key = localStorage.getItem('userDbKey');
    if (!key) return null;
    return db.ref('user_settings/' + key + '/joined_rooms');
  }
  function getJoinedRooms() {
    try {
      return JSON.parse(localStorage.getItem(LS_ROOMS) || '[]');
    } catch {
      return [];
    }
  }
  function persistRooms(rooms) {
    localStorage.setItem(LS_ROOMS, JSON.stringify(rooms));
    const ref = getRoomsDbRef();
    if (ref) ref.set(rooms).catch(() => {});
  }
  function saveJoinedRoom(code) {
    const rooms = getJoinedRooms();
    if (!rooms.includes(code)) {
      rooms.push(code);
      persistRooms(rooms);
    }
  }
  function removeJoinedRoom(code) {
    const rooms = getJoinedRooms();
    const index = rooms.indexOf(code);
    if (index > -1) {
      rooms.splice(index, 1);
      persistRooms(rooms);
    }
  }
  async function syncRoomsFromCloud() {
    const ref = getRoomsDbRef();
    if (!ref) return;
    const snap = await ref.once('value');
    const remote = snap.val();
    if (!Array.isArray(remote) || remote.length === 0) {
      const local = getJoinedRooms();
      if (local.length > 0) ref.set(local).catch(() => {});
      return;
    }
    const local = getJoinedRooms();
    const merged = [...new Set([...local, ...remote])];
    localStorage.setItem(LS_ROOMS, JSON.stringify(merged));
    if (merged.length !== remote.length) ref.set(merged).catch(() => {});
  }
  function showUsernameModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <h2 style="color: var(--color-accent); text-shadow: 0 0 8px var(--color-accent-shadow);">Welcome to Delta Chat</h2>
        <p style="color: #ccc; margin-bottom: 20px;">Choose a username to get started:</p>
        <input id="usernameModalInput" type="text" placeholder="Enter username" maxlength="20" 
          style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--color-accent); background: rgba(10, 10, 20, 0.8); color: white; margin-bottom: 20px; font-size: 1rem;" />
        <div style="display: flex; gap: 10px;">
          <button onclick="confirmUsernameFromModal();" 
            style="flex: 1; padding: 12px; background: var(--color-accent); color: var(--color-background); border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">
            Confirm
          </button>
          <button onclick="randomUsernameFromModal();" 
            style="flex: 1; padding: 12px; background: rgba(100, 200, 255, 0.2); color: var(--color-accent); border: 2px solid var(--color-accent); border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">
            Random
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('usernameModalInput').focus();
    document.getElementById('usernameModalInput').addEventListener('keydown', (e) => {
      if(e.key === 'Enter') confirmUsernameFromModal();
    });
  }
  window.confirmUsernameFromModal = async function() {
    const input = document.getElementById('usernameModalInput');
    const v = (input.value || '').trim().slice(0, 20);
    const lookup = v.toLowerCase();
    
  const BLACKLIST = [
      'admin', 
      'administrator', 
      'owner', 
      'mod', 
      'staff', 
      'delta', 
      'system', 
      'stonks', 
      'stonk', 
      'svth', 
      'moderator', 
      'mods', 
      'deltamods', 
      'deltamoderator', 
      'tristan',
      'ethan',
      'realethan',
      'realtristan',
      'deltastaff',
      'deltamod',
      'deltamoderators',
      'deltastaffs',
      'deltamod1',
      'deltamod2',
      'deltamod3',
      'deltamod4',
      'deltamod5',
      'deltamod6',
      'deltamod7',
      'deltamod8',
      'deltamod9',
      'deltamod10',
      'realstonks',
      'realstonk',
      'realadmin',
      'realadministrator',
      'realowner',
      'realmod',
      'realstaff',
      'realimaqual',   
      'imaqual',
      "stok",
      "stoks"
  ];

    if(!v){ 
        window._alert('Please enter a username'); 
        return; 
    }

    if (BLACKLIST.includes(lookup)) {
        const user = window._prompt("This username is reserved for staff. Enter admin username:");
        if (!user) return;

        const pass = window._prompt("Enter admin password:");
        if (!pass) return;

        if (typeof window.verifyAdminCredentials !== 'function') {
            window._alert("Authentication system not available. Please try again.");
            return;
        }

        const isValid = await window.verifyAdminCredentials(user, pass);
        if (!isValid) {
            window._alert("Incorrect credentials. GET OUT!");
            return; 
        }
    }
    const LS_NAME = 'public_chat_username_v1';
    const LS_USERNAME_SET = 'public_chat_username_set_v1';

    localStorage.setItem(LS_NAME, v);
    localStorage.setItem(LS_USERNAME_SET, 'true');

    const overlay = document.querySelector('.modal-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    } else if (overlay) {
        overlay.remove();
    }

    if (window.initGlobalChatListeners) {
        return 0;
    }
};
  window.randomUsernameFromModal = function() {
    const anon = 'Guest' + Math.floor(Math.random()*9999);
    localStorage.setItem(LS_NAME, anon);
    localStorage.setItem(LS_USERNAME_SET, 'true');
    const overlay = document.querySelector('.modal-overlay');
    if(overlay) document.body.removeChild(overlay);
  };
  if (UI.clearBtn) UI.clearBtn.onclick = () => { 
    if(window._confirm('Clear all messages in this chat?')) {
      if (UI.messages) UI.messages.innerHTML = ''; 
    }
  };
  if (UI.clearInputBtn) UI.clearInputBtn.onclick = () => {
    if (UI.input) {
      UI.input.value = '';
      UI.input.focus();
    }
  };
  if (UI.createRoomBtn) UI.createRoomBtn.onclick = () => {
    const newCode = generateRoomCode();
    const roomRef = roomsRef.child(newCode);
    roomRef.set({ name: `Room ${newCode}`, ts: nowIso(), creatorUid: firebase.auth().currentUser.uid })
      .then(() => {
        if (UI.roomCodeInput) UI.roomCodeInput.value = newCode;
        joinRoom(newCode); 
        showRoomCodeModal(newCode);
      })
      .catch(err => {
        window._alert('Failed to create room: ' + err.message);
        console.error(err);
      });
    logEvent('ROOM_CREATE', { roomName: newCode });
  };
  if (UI.joinRoomBtn) UI.joinRoomBtn.onclick = () => {
    const code = (UI.roomCodeInput ? UI.roomCodeInput.value : '').trim().toUpperCase();
    if(code.length !== 6 || !/^[A-Z0-9]+$/.test(code)){
      window._alert('Room code must be a 6-character alphanumeric code.');
      return;
    }
    joinRoom(code);
  };
function deleteRoom(code) {
    if (!window._confirm(`Are you sure you want to delete room ${code} and leave it? This will also remove the room from the database if you are the last person.`)) {
        return;
    }
    removeJoinedRoom(code);
    stopRoomMessageNotificationListeners(code);
    const el = document.getElementById(`room-${code}`);
    if (el) el.remove();
    State.roomNotifications.delete(code);
    if (code === State.currentRoomCode) {
        showChatLobby();
    }
    roomsRef.child(code).remove()
        .then(() => {
            window._alert(`Room ${code} removed.`);
            recalculateTotalNotifications();
        })
        .catch(err => {
            console.error(err);
        });
}
  function renderRoomInList(code, name, isActive) {
    let button = document.getElementById(`room-${code}`);
    if (!button) {
      button = document.createElement('button');
      button.id = `room-${code}`;
      button.dataset.code = code;
      button.onclick = () => joinRoom(code);
      UI.roomList.insertBefore(button, UI.roomList.firstChild);
    }
    button.innerHTML = `${escapeHtml(name)} <small>(${code})</small>`;
    const renameIcon = document.createElement('span');
    renameIcon.className = 'rename-icon';
    renameIcon.textContent = '✎';
    renameIcon.onclick = (e) => {
      e.stopPropagation();
      renameRoom(code, name);
    };
    button.appendChild(renameIcon);
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'rename-icon';
    deleteIcon.textContent = '🗑️';
    deleteIcon.title = 'Delete Room';
    deleteIcon.onclick = (e) => {
      e.stopPropagation();
      deleteRoom(code);
    };
    button.appendChild(deleteIcon);
    if (isActive) {
      [...UI.roomList.querySelectorAll('button')].forEach(el => el.classList.remove('active'));
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
    const notif = State.roomNotifications.get(code);
    if(notif) {
        setRoomNotification(code, notif.newMsgCount || 0, notif.typing);
    }
    updateRoomsOverview();
    if (State.currentRoomCode) updateOtherRoomsPanel();
  }
  function renameRoom(code, currentName) {
    const newName = window._prompt(`Rename room ${code}. Current name: "${currentName}"`, currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      roomsRef.child(code).child('name').set(newName.trim().slice(0, 30))
        .catch(err => window._alert('Failed to rename room: ' + err.message));
    }
  }
  function stopRoomMessageNotificationListeners(roomCode) {
      if (State.roomListeners.has(roomCode)) {
          roomsRef.child(roomCode).child('messages').off('child_added'); 
          roomsRef.child(roomCode).child('typing').off('value');      
          State.roomListeners.delete(roomCode);
      }
  }
  function startListeningToRooms() {
    const joinedRooms = getJoinedRooms();
    joinedRooms.forEach(code => {
      roomsRef.child(code).on('value', snap => {
        const roomData = snap.val();
        if(!roomData) {
          removeJoinedRoom(code);
          roomsRef.child(code).off();
          stopRoomMessageNotificationListeners(code);
          const el = document.getElementById(`room-${code}`);
          if(el) el.remove();
          State.roomNotifications.delete(code);
          recalculateTotalNotifications();
          if (code === State.currentRoomCode) { showChatLobby(); }
          else { updateRoomsOverview(); updateOtherRoomsPanel(); }
          return;
        }
        const name = roomData.name || `Private Room ${code}`;
        renderRoomInList(code, name, code === State.currentRoomCode);
        const current = State.roomNotifications.get(code) || { newMsgCount: 0, typing: [] };
        if(!current.isListening) {
            startRoomMessageNotificationListener(code);
            State.roomNotifications.set(code, { ...current, isListening: true });
            State.roomListeners.set(code, true);
        }
      });
    });
  }
  if (window.Notification && Notification.permission !== 'granted') {
    setTimeout(() => { 
        Notification.requestPermission(p => {
          if (p === 'denied') {
          }
        });
    }, 2000);
  }
  function setRoomNotification(code, newMsgCount, typingNames) { 
    if (!code) return; 
    const button = document.getElementById(`room-${code}`);
    if (!button) return;
    let badge = button.querySelector('.notification-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge'; 
        badge.style.position = 'absolute';
        badge.style.top = '1px';
        badge.style.right = '2px';
        badge.style.width = '20px';
        badge.style.height = '20px';
        badge.style.background = 'var(--danger)';
        badge.style.borderRadius = '50%';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = 'bold';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.color = '#fff';
        badge.style.transform = 'translate(50%, -55%)';
        button.appendChild(badge);
    }
    if (!isChatActive() || code !== State.currentRoomCode) { 
        if (newMsgCount > 0) {
            badge.textContent = newMsgCount > 9 ? '9+' : newMsgCount;
            badge.classList.remove('hidden');
            badge.style.display = 'flex';
        } else {
            badge.classList.add('hidden');
            badge.style.display = 'none';
        }
    } else {
        badge.classList.add('hidden');
        badge.style.display = 'none';
    }
    const hasNewMessage = newMsgCount > 0;
    const msgMark = hasNewMessage ? ' • New' : '';
    const typingMark = typingNames && typingNames.length > 0 ? ' • Typing' : '';
    const style = (hasNewMessage || (typingNames && typingNames.length > 0)) ? 'style="color: var(--accent); font-weight: 600;"' : ''; 
    const smallEl = button.querySelector('small');
    if (smallEl) {
      const originalCodeMatch = smallEl.textContent.match(/\(([A-Z0-9]+)\)/); 
      const originalCode = originalCodeMatch ? originalCodeMatch[0] : `(${code})`;
      let statusText = '';
      if(code !== State.currentRoomCode) {
         statusText = `${msgMark}${typingMark}`;
      }
      if (code === 'PUBLIC') {
          smallEl.innerHTML = `<span ${style}>${statusText}</span>`;
      } else {
          smallEl.innerHTML = `<span ${style}>${originalCode}${statusText}</span>`;
      }
    }
  }
function startPublicMessageNotificationListener() {
    const nameMe = localStorage.getItem(LS_NAME);
    const code = 'PUBLIC';
    publicChatRef.limitToLast(1).on('child_added', (snapshot) => { 
        const data = snapshot.val(); 
        if (data.name !== nameMe && State.currentRoomCode !== null) { 
            const current = State.roomNotifications.get(code) || { newMsgCount: 0, typing: [] }; 
            if (!isChatActive()) { 
                if (current.newMsgCount === 0 && Notification.permission === 'granted' && !document.hasFocus()) { 
                    new Notification(`Delta Chat: New message in Public Channel`, {
                        body: `${data.name}: ${data.text.slice(0, 50)}${data.text.length > 50 ? '...' : ''}`,
                    });
                }
                const newCount = current.newMsgCount + 1; 
                State.roomNotifications.set(code, { ...current, newMsgCount: newCount, isListening: true });
                setRoomNotification(code, newCount, current.typing);
                recalculateTotalNotifications();
            }
        }
    });
    publicTypingRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      const currentSafe = getDbSafeName(localStorage.getItem(LS_NAME) || '');
      const safeNames = Object.keys(data).filter(n => data[n] === true && n !== currentSafe);
      const displayNames = safeNames.map(displayNameFromSafe);
      const code = 'PUBLIC';
      const current = State.roomNotifications.get(code) || { newMsgCount: 0, typing: [] }; 
      State.roomNotifications.set(code, { ...current, typing: displayNames });
      if(State.currentRoomCode !== null) {
        setRoomNotification(code, current.newMsgCount, displayNames);
      }
    });
    State.roomListeners.set(code, true);
}
function displayCustomNotification(senderName, timestamp) {
  const enabled = localStorage.getItem('chatNotificationsEnabled') !== 'false';
  if (!enabled) return;
  
  let container = document.getElementById('notifications-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notifications-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.maxWidth = '400px';
    document.body.appendChild(container);
  }
  
  const notifId = 'notif-' + Date.now();
  const timeStr = timeShort(timestamp);
  
  const notifEl = document.createElement('div');
  notifEl.id = notifId;
  notifEl.className = 'custom-notification';
  notifEl.innerHTML = `
    <div class="custom-notification-content">
      <div class="custom-notification-sender">${escapeHtml(senderName)} sent a message</div>
      <div class="custom-notification-time">${escapeHtml(timeStr)}</div>
    </div>
    <button class="custom-notification-close" onclick="document.getElementById('${notifId}').remove();" title="Dismiss">×</button>
  `;
  
  container.appendChild(notifEl);
  
  setTimeout(() => {
    if (document.getElementById(notifId)) {
      document.getElementById(notifId).remove();
    }
  }, 8000);
}
  function startRoomMessageNotificationListener(roomCode) {
    const nameMe = localStorage.getItem(LS_NAME);
    roomsRef.child(roomCode).child('messages').limitToLast(1).on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (data.name !== nameMe && roomCode !== State.currentRoomCode) {
        displayCustomNotification(data.name, data.ts);
        const current = State.roomNotifications.get(roomCode) || { newMsgCount: 0, typing: [] }; 
        if (!isChatActive()) {
            if (current.newMsgCount === 0 && Notification.permission === 'granted' && !document.hasFocus()) { 
                new Notification(`Delta Chat: New message in ${roomCode}`, {
                    body: `${data.name}: ${data.text.slice(0, 50)}${data.text.length > 50 ? '...' : ''}`,
                });
            }
            const newCount = current.newMsgCount + 1;
            State.roomNotifications.set(roomCode, { 
                ...current,
                newMsgCount: newCount
            });
            setRoomNotification(roomCode, newCount, current.typing); 
            recalculateTotalNotifications();
        }
      }
    });
    roomsRef.child(roomCode).child('typing').on('value', (snap) => {
      const data = snap.val() || {};
      const currentSafe = getDbSafeName(localStorage.getItem(LS_NAME) || '');
      const safeNames = Object.keys(data).filter(n => data[n] === true && n !== currentSafe);
      const displayNames = safeNames.map(displayNameFromSafe);
      if (roomCode !== State.currentRoomCode) {
        const current = State.roomNotifications.get(roomCode) || { newMsgCount: 0, typing: [] }; 
        State.roomNotifications.set(roomCode, { newMsgCount: current.newMsgCount, typing: displayNames, isListening: true }); 
        setRoomNotification(roomCode, current.newMsgCount, displayNames); 
      }
    });
  }
  function switchToChannel(chatRef, typingRef, roomCode, title, statusText, inputPlaceholder){
    if(State.chatListeners.added && State.chatQueryRef) State.chatQueryRef.off('child_added', State.chatListeners.added);
    if(State.chatListeners.changed) State.currentChatRef.off('child_changed', State.chatListeners.changed);
    if(State.chatListeners.removed) State.currentChatRef.off('child_removed', State.chatListeners.removed);
    if(State.typingListener) State.currentTypingRef.off('value', State.typingListener);
    State.currentChatRef = chatRef;
    const safeName = getDbSafeName(localStorage.getItem(LS_NAME) || '');
    State.currentTypingRef.child(safeName).set(false);
    State.currentTypingRef = typingRef;
    State.currentRoomCode = roomCode;
    if(UI.deleteAllFilesBtn) UI.deleteAllFilesBtn.style.display = roomCode !== null ? 'inline-flex' : 'none';
      if (roomCode !== null) {
        State.isCooldown = false;
        UI.sendBtn.disabled = false;
        UI.cooldownTimer.classList.add('hidden');
      }
    UI.chatTitle.textContent = title;
    UI.channelStatus.textContent = statusText;
    UI.input.placeholder = inputPlaceholder;
    State.pendingFiles = [];
    renderPendingQueue();
    startListeningToChat();
    startListeningToTyping();
  }
  function showChatLobby() {
    const noRoomsState = document.getElementById('noRoomsState');
    const roomsOverviewState = document.getElementById('roomsOverviewState');
    const chatAreaWrap = document.getElementById('chatAreaWrap');
    State.currentRoomCode = null;
    if(UI.deleteAllFilesBtn) UI.deleteAllFilesBtn.style.display = 'none';
    if (chatAreaWrap) chatAreaWrap.style.display = 'none';
    const joinedRooms = getJoinedRooms();
    if (joinedRooms.length === 0) {
      if (noRoomsState) noRoomsState.style.display = 'flex';
      if (roomsOverviewState) roomsOverviewState.style.display = 'none';
    } else {
      if (noRoomsState) noRoomsState.style.display = 'none';
      if (roomsOverviewState) {
        roomsOverviewState.style.display = 'flex';
        updateRoomsOverview();
      }
    }
    [...UI.roomList.querySelectorAll('button')].forEach(el => el.classList.remove('active'));
    if (UI.chatTitle) UI.chatTitle.textContent = 'Delta Chat';
    if (UI.channelStatus) UI.channelStatus.textContent = 'Select a room to start chatting';
  }
  function updateRoomsOverview() {
    const list = document.getElementById('roomsOverviewList');
    if (!list) return;
    const joinedRooms = getJoinedRooms();
    list.innerHTML = '';
    joinedRooms.forEach(code => {
      const roomBtn = document.getElementById(`room-${code}`);
      const rawText = roomBtn ? roomBtn.childNodes[0].textContent.trim() : `Room ${code}`;
      const btn = document.createElement('button');
      btn.style.cssText = 'width:100%;text-align:left;padding:12px 16px;border-radius:10px;background:rgba(84,129,204,0.08);border:1px solid rgba(84,129,204,0.15);color:inherit;cursor:pointer;font-size:0.95rem;display:flex;align-items:center;gap:10px;transition:background 0.2s;position:relative;';
      btn.onmouseover = () => btn.style.background = 'rgba(84,129,204,0.18)';
      btn.onmouseout = () => btn.style.background = 'rgba(84,129,204,0.08)';
      btn.innerHTML = `<i class="fas fa-lock" style="color:var(--accent);opacity:0.7;font-size:0.82rem;flex-shrink:0;"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(rawText)}</span>`;
      btn.onclick = () => joinRoom(code);
      list.appendChild(btn);
    });
  }
  function updateOtherRoomsPanel() {
    const panel = document.getElementById('otherRoomsPanel');
    const otherRoomsList = document.getElementById('otherRoomsList');
    const chatAreaWrap = document.getElementById('chatAreaWrap');
    if (!panel || !otherRoomsList || !chatAreaWrap) return;
    const joinedRooms = getJoinedRooms().filter(c => c !== State.currentRoomCode);
    if (joinedRooms.length === 0) {
      panel.style.display = 'none';
      chatAreaWrap.style.gridTemplateColumns = '1fr';
    } else {
      otherRoomsList.innerHTML = '';
      joinedRooms.forEach(code => {
        const roomBtn = document.getElementById(`room-${code}`);
        const rawText = roomBtn ? roomBtn.childNodes[0].textContent.trim() : `Room ${code}`;
        const btn = document.createElement('button');
        btn.style.cssText = 'width:100%;text-align:left;padding:8px 10px;border-radius:8px;background:rgba(84,129,204,0.07);border:1px solid rgba(84,129,204,0.12);color:inherit;cursor:pointer;font-size:0.82rem;display:flex;align-items:center;gap:7px;transition:background 0.2s;';
        btn.onmouseover = () => btn.style.background = 'rgba(84,129,204,0.18)';
        btn.onmouseout = () => btn.style.background = 'rgba(84,129,204,0.07)';
        btn.innerHTML = `<i class="fas fa-lock" style="color:var(--accent);opacity:0.6;font-size:0.72rem;flex-shrink:0;"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(rawText)}</span>`;
        btn.onclick = () => joinRoom(code);
        otherRoomsList.appendChild(btn);
      });
      panel.style.display = 'flex';
      chatAreaWrap.style.gridTemplateColumns = '1fr 180px';
    }
  }
  function switchToPublic() {
    showChatLobby();
  }
  function joinRoom(code){
    const roomRef = roomsRef.child(code);
    const privateChatRef = roomRef.child('messages');
    const privateTypingRef = roomRef.child('typing');
    const noRoomsState = document.getElementById('noRoomsState');
    const roomsOverviewState = document.getElementById('roomsOverviewState');
    const chatAreaWrap = document.getElementById('chatAreaWrap');
    if (noRoomsState) noRoomsState.style.display = 'none';
    if (roomsOverviewState) roomsOverviewState.style.display = 'none';
    if (chatAreaWrap) chatAreaWrap.style.display = 'grid';
    switchToChannel(
      privateChatRef,
      privateTypingRef,
      code,
      `Delta Chat`,
      `Private room: ${code} • only people with code can read/post`,
      `Message ${code}... (Shift+Enter for newline)`
    );
    roomRef.once('value', snap => {
      const roomData = snap.val();
      if(!roomData) {
        window._alert(`Room ${code} does not exist or has been deleted.`);
        showChatLobby();
        return;
      }
      const roomName = roomData.name || `Private Room ${code}`;
      saveJoinedRoom(code);
      renderRoomInList(code, roomName, true);
      if (!State.roomListeners.has('name_' + code)) {
        roomsRef.child(code).child('name').on('value', snap => {
            if (!snap.val()) return;
            renderRoomInList(code, snap.val(), code === State.currentRoomCode);
        });
        State.roomListeners.set('name_' + code, true);
      }
      const current = State.roomNotifications.get(code) || { newMsgCount: 0, typing: [] };
      State.roomNotifications.set(code, { ...current, newMsgCount: 0, isListening: true });
      setRoomNotification(code, 0, current.typing);
      recalculateTotalNotifications();
      if (!current.isListening) {
          startRoomMessageNotificationListener(code);
          State.roomListeners.set(code, true);
      }
      updateOtherRoomsPanel();
    }).catch(err => {
      console.error(err);
      showChatLobby();
    });
  }
  function showRoomCodeModal(code) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <h2>Room Created!</h2>
        <p>Share this code with your friends. Anyone that doesn't have it can't join.</p>
        <pre>${code}</pre>
        <button id="copyCodeBtn">Copy Code</button>
        <button onclick="document.body.removeChild(this.closest('.modal-overlay'));" class="ghost">Got it</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('copyCodeBtn').onclick = () => {
      navigator.clipboard.writeText(code)
        .then(() => {
          document.getElementById('copyCodeBtn').textContent = 'Copied!';
          setTimeout(() => document.body.removeChild(overlay), 1000);
        })
        .catch(err => {
          window._alert('Could not copy code. Please copy manually: ' + code);
          console.error('Copy failed:', err);
        });
    };
  }
const FILE_TYPE_MAP = {
  'png':'PNG Image','jpeg':'JPEG Image','jpg':'JPEG Image',
  'mp3':'MP3 Audio','mp4':'MP4 Video','flac':'FLAC Audio','wav':'WAV Audio',
  'mov':'QuickTime Video','mkv':'Matroska Video',
  'txt':'Plain Text','docx':'Word Document','docm':'Word Document (Macro)',
  'doc':'Word 97-2003 Document','xlsx':'Excel Spreadsheet','xlsm':'Excel Spreadsheet (Macro)',
  'xls':'Excel 97-2003 Spreadsheet','pptx':'PowerPoint Presentation',
  'pptm':'PowerPoint Presentation (Macro)','ppt':'PowerPoint 97-2003 Presentation',
  'zip':'ZIP Archive','7z':'7-Zip Archive','tar':'TAR Archive',
  'tar.gz':'Gzip TAR Archive','tar.bz2':'Bzip2 TAR Archive',
  'gz':'Gzip Archive','bz2':'Bzip2 Archive',
  'iso':'ISO Disc Image','img':'Disk Image',
  'html':'HTML Document','js':'JavaScript','css':'CSS Stylesheet',
  'cpp':'C++ Source','asm':'Assembly Source','py':'Python Script',
  'go':'Go Source','rs':'Rust Source','java':'Java Source',
  'rlib':'Rust Library','h':'C/C++ Header','c':'C Source','k':'K Source',
  'dll':'Windows Library','so':'Linux Shared Library',
  'json':'JSON Data','bat':'Windows Batch Script','sh':'Shell Script','exe':'Windows Executable'
};
function formatBytes(b){
  if(b<1024) return b+' B';
  if(b<1048576) return (b/1024).toFixed(1)+' KB';
  if(b<1073741824) return (b/1048576).toFixed(1)+' MB';
  return (b/1073741824).toFixed(2)+' GB';
}
function getFileExt(name){
  const n = name.toLowerCase();
  if(n.endsWith('.tar.gz')) return 'tar.gz';
  if(n.endsWith('.tar.bz2')) return 'tar.bz2';
  return (n.split('.').pop() || '');
}
function renderFileMessage(file){
  const ext = getFileExt(file.name);
  const typeLabel = FILE_TYPE_MAP[ext] || 'Unknown File Type';
  const sz = formatBytes(file.size);
  const url = escapeHtml(`${window.UPLOAD_SERVER}${file.url}`);
  const nameEsc = escapeHtml(file.name);
  const dlLink = `<a href="${url}" download="${nameEsc}" class="file-dl-link" target="_blank"><i class="fas fa-download"></i> ${nameEsc}</a>`;
  if(['png','jpg','jpeg'].includes(ext)){
    return `<div class="file-msg-wrap"><img src="${url}" class="file-preview-img" onclick="window.open('${url}','_blank')" alt="${nameEsc}"><div class="file-meta">${dlLink}<span class="file-size">${sz}</span></div></div>`;
  }
  if(['mp4','mov','mkv'].includes(ext)){
    return `<div class="file-msg-wrap"><video controls style="max-width:320px;max-height:200px;border-radius:8px;"><source src="${url}"></video><div class="file-meta">${dlLink}<span class="file-size">${sz}</span></div></div>`;
  }
  if(['mp3','wav','flac'].includes(ext)){
    return `<div class="file-msg-wrap"><audio controls style="width:100%;max-width:320px;"><source src="${url}"></audio><div class="file-meta">${dlLink}<span class="file-size">${sz}</span></div></div>`;
  }
  if(['txt','json','js','html','css','py','sh','bat','cpp','c','h','asm','go','rs','java','k'].includes(ext)){
    const pid = 'fp'+Math.random().toString(36).slice(2);
    setTimeout(()=>{
      const el=document.getElementById(pid);
      if(!el) return;
      fetch(`${window.UPLOAD_SERVER}${file.url}`)
        .then(r=>r.text())
        .then(t=>{ el.textContent=t.slice(0,3000)+(t.length>3000?'\n[truncated…]':''); })
        .catch(()=>{ el.textContent='Preview unavailable.'; });
    },0);
    return `<div class="file-msg-wrap"><div class="file-text-preview"><pre id="${pid}">Loading…</pre></div><div class="file-meta">${dlLink}<span class="file-size">${sz}</span><span class="file-type-label">${escapeHtml(typeLabel)}</span></div></div>`;
  }
  return `<div class="file-msg-wrap file-generic"><i class="fas fa-file" style="font-size:2rem;opacity:0.55;flex-shrink:0;"></i><div style="flex:1;min-width:0;"><div style="font-weight:600;word-break:break-all;font-size:0.9rem;">${nameEsc}</div><div style="font-size:0.78rem;opacity:0.6;margin-top:2px;">${escapeHtml(typeLabel)} • ${sz}</div><div style="margin-top:6px;">${dlLink}</div></div></div>`;
}
async function refreshQuotaBar() {
  const fill = document.getElementById('quotaBarFill');
  const text = document.getElementById('quotaBarText');
  if (!fill || !text) return;
  try {
    const username = localStorage.getItem(LS_NAME) || 'Guest';
    const safeUser = username.toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,40);
    const token = await firebase.auth().currentUser?.getIdToken();
    if (!token) return;
    const [quotaRes, cloudSnap] = await Promise.all([
      fetch(`${window.UPLOAD_SERVER}/quota/${safeUser}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      firebase.database().ref(`user_cloud/${safeUser}/files`).once('value')
    ]);
    if (!quotaRes.ok) return;
    const q = await quotaRes.json();
    const files = cloudSnap.val() || {};
    const used = Object.values(files).reduce((a, f) => a + (f.size || 0), 0);
    const pct = Math.min(100, Math.round((used / q.max) * 100));
    fill.style.width = pct + '%';
    fill.style.background = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : 'var(--color-accent)';
    text.textContent = `${formatBytes(used)} / ${formatBytes(q.max)}`;
  } catch {}
}
async function deleteFileForMessage(msgId) {
  try {
    const snap = await State.currentChatRef.child(msgId).once('value');
    const data = snap.val();
    const toDelete = data?.files || (data?.file ? [data.file] : []);
    for(const f of toDelete){
      if(f?.id && f?.safeUser){
        const token = await firebase.auth().currentUser?.getIdToken();
await fetch(`${window.UPLOAD_SERVER}/file/${f.safeUser}/${f.id}`, { method:'DELETE', headers:{ 'Authorization': `Bearer ${token}` } }).catch(()=>{});
      }
    }
    if(toDelete.length) refreshQuotaBar();
  } catch {}
  try {
    const snap = await State.currentChatRef.child(msgId).once('value');
    const data = snap.val();
    const toDelete = data?.files || (data?.file ? [data.file] : []);
    for(const f of toDelete){
      if(f?.id && f?.safeUser){
        const token = await firebase.auth().currentUser?.getIdToken();
await fetch(`${window.UPLOAD_SERVER}/file/${f.safeUser}/${f.id}`, { method:'DELETE', headers:{ 'Authorization': `Bearer ${token}` } }).catch(()=>{});
      }
    }
  } catch {}
}
async function uploadSingleFile(file, username) {
  const safeUser = username.toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,40);
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${window.UPLOAD_SERVER}/upload`, {
    method:'POST',
    headers:{ 'x-username': username, 'x-room-code': State.currentRoomCode || 'public' },
    body: fd
  });
  if(!res.ok){ const e=await res.json(); throw new Error(e.error||res.statusText); }
  return await res.json();
}
async function deleteAllRoomFiles(){
  if(!State.currentRoomCode) return;
  if(!window._confirm('Delete ALL files shared in this room for everyone? This cannot be undone.')) return;
  const snap = await State.currentChatRef.once('value');
  const messages = snap.val() || {};
  const fileMsgs = Object.entries(messages).filter(([,v])=>v.file);
  if(!fileMsgs.length){ window._alert('No file messages found.'); return; }
  let deleted=0;
  for(const [msgId, msgData] of fileMsgs){
    if(msgData.file?.id && msgData.file?.safeUser){
      try{
        const token = await firebase.auth().currentUser?.getIdToken();
        await fetch(`${window.UPLOAD_SERVER}/file/${msgData.file.safeUser}/${msgData.file.id}`, { method:'DELETE', headers:{ 'Authorization': `Bearer ${token}` } });
      }catch{}
    }
    deleteFileForMessage(msgId).then(() => State.currentChatRef.child(msgId).remove())
    deleted++;
  }
  window._alert(`Deleted ${deleted} file message(s).`);
}
async function sendMessage() {
    try {
      const fingerprint = (typeof window.getBrowserFingerprint === 'function') ? window.getBrowserFingerprint() : 'unknown_fingerprint';

      if (!firebase.auth().currentUser) {
        await firebase.auth().signInAnonymously();
      }

      const muteSnap = await db.ref(`muted_users/${fingerprint}`).once('value');
      if (muteSnap.exists()) {
        window._alert("You are muted.");
        if (UI.input) UI.input.value = '';
        return;
      }

      const text = (UI.input ? UI.input.value : '').trim();
      if (text.length > 2000) return window._alert('Message too long (max 2000 characters).', 'error');
      if (State.currentRoomCode === null && State.isCooldown) return;

      const name = localStorage.getItem(LS_NAME) || "Guest";
      const user = firebase.auth().currentUser;
      const dbKey = localStorage.getItem('userDbKey') || user.uid;
      if (!text && State.pendingFiles.length === 0) return;

      const _whitelistKey = getDbSafeName(name);
          const _wlSnap = await db.ref(`whitelist/${_whitelistKey}`).get();
          if (!_wlSnap.exists()) {
            window._alert('Your account is not whitelisted.');
            return;
          }

      if(State.pendingFiles.length > 0) {
        const bar = document.getElementById('uploadProgressBar');
        const label = document.getElementById('uploadProgressLabel');
        const cancelBtn = document.getElementById('cancelUploadBtn');
        if(UI.uploadProgress) UI.uploadProgress.style.display='block';
        const filesToSend = [...State.pendingFiles];
        State.pendingFiles = [];
        renderPendingQueue();
        let cancelled = false;
        let currentXhr = null;
        if(cancelBtn) cancelBtn.onclick = () => {
          cancelled = true;
          if(currentXhr) currentXhr.abort();
        };
        const uploadedFiles = [];
        for(let i=0; i<filesToSend.length; i++){
          if(cancelled) break;
          const f = filesToSend[i];
          if(label) label.textContent = `Uploading ${i+1}/${filesToSend.length}: ${f.name}`;
          if(bar) bar.style.width = '0%';
          try {
            const result = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              currentXhr = xhr;
              xhr.open('POST', `${window.UPLOAD_SERVER}/upload`);
              xhr.setRequestHeader('x-username', name);
              xhr.upload.onprogress = (e) => {
                if(!e.lengthComputable) return;
                const pct = Math.round((e.loaded/e.total)*100);
                if(bar) bar.style.width = pct+'%';
                if(label) label.textContent = `File ${i+1}/${filesToSend.length} — ${pct}% (${escapeHtml(f.name)})`;
              };
              xhr.onload = () => {
                if(xhr.status>=200 && xhr.status<300){ try{ resolve(JSON.parse(xhr.responseText)); }catch(e){ reject(new Error('Invalid response')); } }
                else { try{ reject(new Error(JSON.parse(xhr.responseText).error||xhr.statusText)); }catch{ reject(new Error(xhr.statusText)); } }
              };
              xhr.onerror = () => reject(new Error('Network error'));
              xhr.onabort = () => reject(new Error('cancelled'));
              const fd = new FormData();
              fd.append('file', f);
              firebase.auth().currentUser.getIdToken().then(token => {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(fd);
              }).catch(() => reject(new Error('auth error')));
            });
            uploadedFiles.push({ url: result.url, name: result.name, size: result.size, id: result.id, safeUser: result.safeUser });
          } catch(e) {
            if(!cancelled) window._alert(`Failed to upload ${f.name}: ${e.message}`);
          }
        }
        if(UI.uploadProgress) UI.uploadProgress.style.display='none';
        if(bar) bar.style.width='0%';
        if(cancelBtn) cancelBtn.onclick = null;
        currentXhr = null;
        if(cancelled || uploadedFiles.length === 0) return;
        const msg = { text: text||'', name, uid: user.uid, dbKey, ts: nowIso(), files: uploadedFiles };
        await State.currentChatRef.push(msg);
      } else {
        if(!text) return;
        const msg = { text, name, uid: user.uid, dbKey, ts: nowIso() };
        await State.currentChatRef.push(msg);
      }
      if (UI.input) UI.input.value = '';
      updateTypingStatus();
      if (State.currentRoomCode === null) startCooldown();
      refreshQuotaBar();
    } catch (err) {
      console.error('sendMessage failed:', err);
      if (err && err.code === 'PERMISSION_DENIED') return;
    }
  }

function startCooldown() {
    State.isCooldown = true;
    UI.sendBtn.disabled = true;
    UI.cooldownTimer.classList.remove('hidden');
    
    let timeLeft = 5;
    UI.cooldownTimer.textContent = timeLeft + 's';

    const countdown = setInterval(() => {
        timeLeft--;
        UI.cooldownTimer.textContent = timeLeft + 's';
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            State.isCooldown = false;
            UI.sendBtn.disabled = false;
            UI.cooldownTimer.classList.add('hidden');
        }
    }, 1000);
}
const pendingPreview = document.getElementById('pendingFilesPreview');
  function renderPendingQueue() {
    if(!pendingPreview) return;
    if(State.pendingFiles.length === 0){ pendingPreview.style.display='none'; pendingPreview.innerHTML=''; return; }
    pendingPreview.style.display='flex';
    pendingPreview.innerHTML = State.pendingFiles.map((f,i) =>
      `<div class="pending-file-chip" id="pchip-${i}"><span title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span><button onclick="window._removePendingFile(${i})" title="Remove">✕</button></div>`
    ).join('');
  }
  window._removePendingFile = (i) => {
    State.pendingFiles.splice(i,1);
    renderPendingQueue();
  };
  function addFilesToQueue(files) {
    const MAX_CLIENT = 5 * 1024 ** 3;
    for(const f of files){
      if(f.size > MAX_CLIENT){ window._alert(`${f.name} exceeds the 5 GB limit and was skipped.`); continue; }
      State.pendingFiles.push(f);
    }
    renderPendingQueue();
  }
  if(UI.uploadFileBtn) UI.uploadFileBtn.onclick = () => UI.fileInput && UI.fileInput.click();
  if(UI.fileInput) UI.fileInput.onchange = (e) => {
    if(!e.target.files.length) return;
    addFilesToQueue(Array.from(e.target.files));
    e.target.value = '';
  };
  if(UI.input) UI.input.addEventListener('paste', (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const fileItems = items.filter(it => it.kind === 'file');
    if(!fileItems.length) return;
    e.preventDefault();
    addFilesToQueue(fileItems.map(it => it.getAsFile()).filter(Boolean));
  });
  if(UI.deleteAllFilesBtn) UI.deleteAllFilesBtn.onclick = deleteAllRoomFiles;
  if(UI.sendBtn) UI.sendBtn.onclick = sendMessage;
  refreshQuotaBar();
  if (UI.input) UI.input.onkeydown = (e) => {
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  };
  function updateTypingStatus() {
    if (!firebase.auth().currentUser) return; 
    
    const name = localStorage.getItem('public_chat_username_v1') || "Guest";
    const safeName = getDbSafeName(name);
    
    State.currentTypingRef.child(safeName).onDisconnect().set(false);
    State.currentTypingRef.child(safeName).set(true);
    clearTimeout(State.typingTimeout);
    State.typingTimeout = setTimeout(() => {
      State.currentTypingRef.child(safeName).set(false);
    }, 1500);
  }
  function startListeningToTyping(){
    State.typingListener = State.currentTypingRef.on('value', snap => {
      const data = snap.val() || {};
      const currentSafe = getDbSafeName(localStorage.getItem(LS_NAME) || '');
      const safeNames = Object.keys(data).filter(n => data[n] === true && n !== currentSafe);
      const names = safeNames.map(displayNameFromSafe);
      if(names.length === 0){ UI.typingIndicator.textContent = ''; return; }
      if(names.length === 1) UI.typingIndicator.textContent = `${names[0]} is typing…`;
      else if(names.length <= 3) UI.typingIndicator.textContent = `${names.join(', ')} are typing…`;
      else UI.typingIndicator.textContent = `Several people are typing…`;
    });
  }
  const connectedRef = db.ref('.info/connected');
  connectedRef.on('value', snap => {
    const v = snap.val();
    UI.status.textContent = v ? 'Online' : 'Offline';
  });
  function appendMessage(data, id){
    const {name, text, ts, edited, editedTs} = data;
    if(!id || State.renderedMessageIds.has(id)){
      if(State.renderedMessageIds.has(id)) return;
    }
    const me = (localStorage.getItem(LS_NAME) || '').toLowerCase();
    const isMe = me && name && (name.toLowerCase() === me);
    const msgTs = new Date(ts || nowIso());
    const isGrouped = State.lastMsgName === (name || 'Guest') &&
      State.lastMsgTs &&
      (msgTs - State.lastMsgTs) <= 10 * 60 * 1000;
    State.lastMsgName = name || 'Guest';
    State.lastMsgTs = msgTs;
    const msgDate = new Date(ts || nowIso());
    const msgDayKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`;
    if(State.lastRenderedDate !== msgDayKey){
      State.lastRenderedDate = msgDayKey;
      const divider = document.createElement('div');
      divider.className = 'day-divider';
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today - 86400000);
      const mDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
      let label;
      if(mDay.getTime() === today.getTime()) label = 'Today';
      else if(mDay.getTime() === yesterday.getTime()) label = 'Yesterday';
      else label = msgDate.toLocaleDateString([], {weekday:'long', month:'long', day:'numeric', year:'numeric'});
      divider.innerHTML = `<span>${label}</span>`;
      UI.messages.appendChild(divider);
      State.lastMsgName = null;
      State.lastMsgTs = null;
    }
    const wrap = document.createElement('div');
    wrap.className = 'msg' + (isMe ? ' you' : '') + (isGrouped ? ' msg-grouped' : '');
    wrap.dataset.id = id;
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    const safeUserKey = (name||'G').toLowerCase().replace(/[^a-z0-9]/g,'_');
    avatar.dataset.pfpUser = safeUserKey;
    avatar.dataset.pfpFallback = makeAvatarLetter(name||'G');
    const cachedPfp = pfpCache.get(safeUserKey);
    if(cachedPfp){ avatar.innerHTML = `<img src="${cachedPfp}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent=this.parentElement.dataset.pfpFallback">`; }
    else { avatar.textContent = makeAvatarLetter(name||'G'); }
    const body = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = data.files ? data.files.map(renderFileMessage).join('') : data.file ? renderFileMessage(data.file) : escapeHtml(text).replace(/\n/g,'<br>');
    if((data.files||data.file) && text) {
      const textNode = document.createElement('div');
      textNode.style.marginBottom='6px';
      textNode.innerHTML = escapeHtml(text).replace(/\n/g,'<br>');
      bubble.prepend(textNode);
    }
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${name || 'Guest'} • ${timeShort(ts || nowIso())}`;
    if(edited){
      const tag = document.createElement('span');
      tag.className = 'editedTag';
      tag.textContent = 'edited';
      meta.appendChild(tag);
    }
    if(isMe){
      const editBtn = document.createElement('span');
      editBtn.textContent = "✎";
      editBtn.title = "Edit message";
      editBtn.style.cursor = "pointer";
      editBtn.style.opacity = "0.75";
      editBtn.style.fontSize = "13px";
      editBtn.style.marginLeft = "6px";
      editBtn.onclick = (function(msgId) { return function() { startEditingMessage(msgId); }; })(id);
      meta.appendChild(editBtn);
      const deleteMsgBtn = document.createElement('span');
      deleteMsgBtn.textContent = "✖";
      deleteMsgBtn.title = "Delete message";
      deleteMsgBtn.style.cursor = "pointer";
      deleteMsgBtn.style.opacity = "0.75";
      deleteMsgBtn.style.fontSize = "13px";
      deleteMsgBtn.style.marginLeft = "8px";
      deleteMsgBtn.onclick = (function(msgId) { 
        return function(event) {
          event.stopPropagation();
          const doDelete = () => {
            deleteFileForMessage(msgId).then(() => {
              State.currentChatRef.child(msgId).remove(function(error) {
                if (error) window._alert('Failed to delete message: ' + error.message);
              });
            });
          };
          if(event.shiftKey){
            doDelete();
          } else {
            if(window._confirm('Are you sure you want to delete this message? Tip: Press LShift+LMB to remove without confirmation.')){
              doDelete();
            }
          }
        };
      })(id);
      meta.appendChild(deleteMsgBtn);
    }
    body.appendChild(meta);
    body.appendChild(bubble);
    wrap.appendChild(avatar);
    wrap.appendChild(body);
    UI.messages.appendChild(wrap);
    UI.messages.scrollTop = UI.messages.scrollHeight;
    State.renderedMessageIds.add(id);
  }
  function startListeningToChat(){
    State.renderedMessageIds.clear(); 
    UI.messages.innerHTML = '';
    State.lastRenderedDate = null;
    State.lastMsgName = null;
    State.lastMsgTs = null;
    State.chatQueryRef = State.currentChatRef.limitToLast(100);
    State.chatQueryRef.on('child_added', State.chatListeners.added = (snapshot) => {
  const data = snapshot.val();
  appendMessage(data, snapshot.key);
});
    State.currentChatRef.on('child_changed', State.chatListeners.changed = (snapshot) => {
      const id = snapshot.key;
      const data = snapshot.val();
      const msgEl = [...UI.messages.children].find(el => el.dataset && el.dataset.id === id);
      if(!msgEl){
        appendMessage(data, id);
        return;
      }
      let bubble = msgEl.querySelector('.bubble');
      if(!bubble){
        const textarea = msgEl.querySelector('textarea');
        if(textarea){
          const controls = msgEl.querySelector('.edit-controls');
          if(controls) controls.remove();
          bubble = document.createElement('div');
          bubble.className = 'bubble';
          textarea.replaceWith(bubble);
        }
      }
      if(bubble){
        bubble.innerHTML = data.files ? data.files.map(renderFileMessage).join('') : data.file ? renderFileMessage(data.file) : escapeHtml(data.text).replace(/\n/g,'<br>');
      }
      const meta = msgEl.querySelector('.meta');
      if(meta){
        const oldTag = meta.querySelector('.editedTag');
        if(oldTag) oldTag.remove();
        const oldEditBtn = meta.querySelector('span[title="Edit message"]');
        if(oldEditBtn) oldEditBtn.remove();
        const oldDeleteBtn = meta.querySelector('span[title="Delete message"]');
        if(oldDeleteBtn) oldDeleteBtn.remove();
        meta.textContent = `${data.name || 'Guest'} • ${timeShort(data.ts || nowIso())}`;
        if(data.edited){
          const tag = document.createElement('span');
          tag.className = 'editedTag';
          tag.textContent = 'edited';
          meta.appendChild(tag);
        }
        const me = (localStorage.getItem(LS_NAME) || '').toLowerCase();
        if(me && data.name && data.name.toLowerCase() === me){
          const editBtn = document.createElement('span');
          editBtn.textContent = "✎";
          editBtn.title = "Edit message";
          editBtn.style.cursor = "pointer";
          editBtn.style.opacity = "0.75";
          editBtn.style.fontSize = "13px";
          editBtn.style.marginLeft = "6px";
          editBtn.onclick = (function(msgId) { return function() { startEditingMessage(msgId); }; })(id);
          meta.appendChild(editBtn);
          const deleteMsgBtn = document.createElement('span');
          deleteMsgBtn.textContent = "✖";
          deleteMsgBtn.title = "Delete message";
          deleteMsgBtn.style.cursor = "pointer";
          deleteMsgBtn.style.opacity = "0.75";
          deleteMsgBtn.style.fontSize = "13px";
          deleteMsgBtn.style.marginLeft = "8px";
          deleteMsgBtn.onclick = (function(msgId) { 
            return function(event) {
              event.stopPropagation();
              if(event.shiftKey){
                deleteFileForMessage(msgId).then(() => State.currentChatRef.child(msgId).remove()).catch(err => {
                  window._alert('Failed to delete message: ' + err.message);
                });
              } else {
                if(window._confirm('Are you sure you want to delete this message? Tip: Shift+click to remove without confirmation.')){
                  deleteFileForMessage(msgId).then(() => State.currentChatRef.child(msgId).remove()).catch(err => {
                    window._alert('Failed to delete message: ' + err.message);
                  });
                }
              }
            };
          })(id);
          meta.appendChild(deleteMsgBtn);
        }
      }
    });
    State.currentChatRef.on('child_removed', State.chatListeners.removed = (snapshot) => {
      const id = snapshot.key;
      const msgEl = [...UI.messages.children].find(el => el.dataset && el.dataset.id === id);
      if(msgEl) msgEl.remove();
      State.renderedMessageIds.delete(id);
    });
  }
  function startEditingMessage(id){
    const msgEl = [...UI.messages.children].find(el => el.dataset && el.dataset.id === id);
    if(!msgEl) return;
    const bubble = msgEl.querySelector('.bubble');
    if(!bubble) return;
    State.currentChatRef.child(id).once('value').then(snap => {
      const data = snap.val() || {};
      const originalText = data.text || '';
      const textarea = document.createElement('textarea');
      textarea.value = originalText;
      textarea.style.width = "100%";
      textarea.style.minHeight = "48px";
      textarea.style.borderRadius = "6px";
      textarea.style.padding = "6px";
      textarea.style.resize = "vertical";
      bubble.replaceWith(textarea);
      const controls = document.createElement('div');
      controls.className = 'edit-controls';
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'ghost';
      controls.appendChild(saveBtn);
      controls.appendChild(cancelBtn);
      const body = msgEl.querySelector('div:nth-child(2)');
      body.appendChild(controls);
      cancelBtn.onclick = () => {
        const newBubble = document.createElement('div');
        newBubble.className = 'bubble';
        newBubble.innerHTML = escapeHtml(originalText).replace(/\n/g,'<br>');
        textarea.replaceWith(newBubble);
        controls.remove();
        State.currentChatRef.child(id).once('value', snap => {
          State.chatListeners.changed(snap);
        });
      };
      saveBtn.onclick = (function(msgId) {
        return function() {
          const newText = textarea.value.trim();
          if(newText.length === 0){
            window._alert('Message cannot be empty.');
            return;
          }
          State.currentChatRef.child(msgId).once('value', function(snap) {
            const originalData = snap.val() || {};
            const updatePayload = {
              ...originalData,
              text: newText,
              edited: true,
              editedTs: nowIso()
            };
            State.currentChatRef.child(msgId).set(updatePayload, function(error) {
              if (error) {
                window._alert('Failed to save edit: ' + error.message);
              } else {
                controls.remove();
              }
            });
          });
        };
      })(id);
      textarea.addEventListener('keydown', e => {
        if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
          e.preventDefault();
          saveBtn.click();
        }
      });
      textarea.focus();
    }).catch(err => {
      return;
    });
  }
  window.addEventListener('keydown', e=>{
    if(e.key === '/' && document.activeElement !== UI.input && document.activeElement !== UI.usernameInput && document.activeElement !== UI.roomCodeInput){
      e.preventDefault();
      UI.input.focus();
    }
  });
  window.startListeningToRooms = startListeningToRooms;
  window.startPublicMessageNotificationListener = startPublicMessageNotificationListener;
  const noRoomsCreateBtn = document.getElementById('noRoomsCreateBtn');
  const noRoomsJoinBtn = document.getElementById('noRoomsJoinBtn');
  if (noRoomsCreateBtn && UI.createRoomBtn) noRoomsCreateBtn.onclick = () => UI.createRoomBtn.click();
  if (noRoomsJoinBtn && UI.roomCodeInput) noRoomsJoinBtn.onclick = () => { UI.roomCodeInput.focus(); };
  UI.input.oninput = updateTypingStatus;
  syncRoomsFromCloud().catch(() => {}).finally(() => {
    startListeningToRooms();
    showChatLobby();
  });
};
document.addEventListener('DOMContentLoaded', () => {
  window.initGlobalChatListeners();
});