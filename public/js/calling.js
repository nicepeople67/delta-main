(function() {
  let callActive = false, currentCode = null;

  function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

  function myName() { return localStorage.getItem('public_chat_username_v1') || 'Guest'; }

  function showOverlay(code) {
    currentCode = code;
    callActive = true;
    document.getElementById('call-code-val').textContent = code;
    document.getElementById('call-overlay').classList.remove('hidden');
  }

  function hideOverlay() {
    callActive = false;
    document.getElementById('call-overlay').classList.add('hidden');
    if (window.leaveCall) window.leaveCall();
    document.getElementById('remote-videos').innerHTML = '';
    document.getElementById('call-chat-messages').innerHTML = '';
  }

  function showToast(msg) {
    const t = document.getElementById('call-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.add('hidden'), 6000);
  }

  window.setRemoteStream = function(stream, uid) {
    const container = document.getElementById('remote-videos');
    let video = document.getElementById('rv-' + uid);
    if (!video) {
      video = document.createElement('video');
      video.id = 'rv-' + uid;
      video.autoplay = true;
      video.playsinline = true;
      video.className = 'remote-video-el';
      container.appendChild(video);
    }
    video.srcObject = stream;
    document.getElementById('call-no-video-msg').style.display = 'none';
  };

  window.removeRemoteVideo = function(uid) {
    const el = document.getElementById('rv-' + uid);
    if (el) el.remove();
    if (!document.getElementById('remote-videos').children.length) {
      document.getElementById('call-no-video-msg').style.display = 'flex';
    }
  };

  window.updateCallParticipants = function(n) {
    const el = document.getElementById('call-participant-badge');
    if (el) el.textContent = n + ' participant' + (n !== 1 ? 's' : '');
  };

  function sendCallChatMsg() {
    const input = document.getElementById('call-chat-input');
    const text = input.value.trim();
    if (!text || !currentCode) return;
    const name = myName();
    const db = firebase.database();
    db.ref(`calls/${currentCode}/chat`).push({ text, name, ts: firebase.database.ServerValue.TIMESTAMP });
    input.value = '';
  }

  function appendCallMsg(data, isMine) {
    const box = document.getElementById('call-chat-messages');
    const div = document.createElement('div');
    div.className = 'call-msg' + (isMine ? ' mine' : '');
    function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    div.innerHTML = `<div class="call-msg-name">${_esc(data.name)}</div>${_esc(data.text)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function startCallChatListener(code) {
    firebase.database().ref(`calls/${code}/chat`).limitToLast(50).on('child_added', snap => {
      const d = snap.val();
      appendCallMsg(d, d.name === myName());
    });
  }

window.initCalling = function() {
    document.getElementById('start-call-btn')?.addEventListener('click', async () => {
      const code = genCode();
      showOverlay(code);
      showToast('Call code: ' + code + ' — click the code to copy');
      await window.joinCallRoom(code, myName());
      startCallChatListener(code);
    });

    document.getElementById('open-join-call-btn')?.addEventListener('click', () => {
      document.getElementById('join-call-modal').classList.remove('hidden');
      document.getElementById('join-call-code-input').focus();
    });

    document.getElementById('join-call-cancel')?.addEventListener('click', () => {
      document.getElementById('join-call-modal').classList.add('hidden');
    });

    document.getElementById('join-call-confirm')?.addEventListener('click', async () => {
      const code = document.getElementById('join-call-code-input').value.trim().toUpperCase();
      if (code.length !== 6) { alert('Enter a valid 6-character code.'); return; }
      document.getElementById('join-call-modal').classList.add('hidden');
      showOverlay(code);
      await window.joinCallRoom(code, myName());
      startCallChatListener(code);
    });

    document.getElementById('end-call-btn')?.addEventListener('click', hideOverlay);

    document.getElementById('call-mute-btn')?.addEventListener('click', function() {
      const muted = window.callToggleMute();
      this.classList.toggle('active', muted);
      this.querySelector('i').className = muted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
    });

    document.getElementById('call-cam-btn')?.addEventListener('click', function() {
      const off = window.callToggleCamera();
      this.classList.toggle('active', off);
      this.querySelector('i').className = off ? 'fas fa-video-slash' : 'fas fa-video';
    });

    document.getElementById('call-screen-btn')?.addEventListener('click', async function() {
      const sharing = await window.callToggleScreen();
      this.classList.toggle('active', sharing);
      this.querySelector('i').className = sharing ? 'fas fa-stop-circle' : 'fas fa-desktop';
    });

    document.getElementById('call-code-pill')?.addEventListener('click', () => {
      if (!currentCode) return;
      navigator.clipboard.writeText(currentCode);
      showToast('Code ' + currentCode + ' copied!');
    });

    document.getElementById('call-chat-send')?.addEventListener('click', sendCallChatMsg);

    document.getElementById('call-chat-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCallChatMsg(); }
    });

    document.getElementById('join-call-code-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('join-call-confirm').click();
    });
  };
})();