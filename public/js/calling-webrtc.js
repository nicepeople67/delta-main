(function() {
  const ICE = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  let db, auth, localStream, screenStream;
  let pcs = {};
  let callCode = null, myUid = null, callRef = null;

  let iceListenerRefs = {};
  let answerListenerRefs = {};

  function getDb() {
    if (!db) { db = firebase.database(); auth = firebase.auth(); }
    return db;
  }

  async function getMedia() {
    if (localStream) return localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (e) {
      try { localStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e2) { localStream = new MediaStream(); }
    }
    const lv = document.getElementById('local-video');
    if (lv) lv.srcObject = localStream;
    return localStream;
  }

  async function makePc(remoteUid) {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcs[remoteUid] = pc;
    const stream = await getMedia();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      getDb().ref(`calls/${callCode}/ice/${myUid}_${remoteUid}`).push({
        c: candidate.candidate, m: candidate.sdpMid, i: candidate.sdpMLineIndex
      });
    };

    pc.ontrack = ({ streams }) => {
      if (streams[0] && window.setRemoteStream) window.setRemoteStream(streams[0], remoteUid);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close(); delete pcs[remoteUid];
        if (iceListenerRefs[remoteUid]) { iceListenerRefs[remoteUid].off(); delete iceListenerRefs[remoteUid]; }
        if (answerListenerRefs[remoteUid]) { answerListenerRefs[remoteUid].off(); delete answerListenerRefs[remoteUid]; }
        if (window.removeRemoteVideo) window.removeRemoteVideo(remoteUid);
      }
    };

    const iceRef = getDb().ref(`calls/${callCode}/ice/${remoteUid}_${myUid}`);
    iceListenerRefs[remoteUid] = iceRef;
    iceRef.on('child_added', snap => {
      const d = snap.val();
      pc.addIceCandidate(new RTCIceCandidate({ candidate: d.c, sdpMid: d.m, sdpMLineIndex: d.i })).catch(() => {});
    });

    return pc;
  }

  async function sendOffer(remoteUid) {
    // Clean up any stale listeners for this uid before creating new ones
    if (answerListenerRefs[remoteUid]) { answerListenerRefs[remoteUid].off(); delete answerListenerRefs[remoteUid]; }

    const pc = await makePc(remoteUid);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await getDb().ref(`calls/${callCode}/offers/${myUid}_${remoteUid}`).set({ type: offer.type, sdp: offer.sdp });

    const answerRef = getDb().ref(`calls/${callCode}/answers/${remoteUid}_${myUid}`);
    answerListenerRefs[remoteUid] = answerRef;
    answerRef.on('value', async snap => {
      if (!snap.exists() || pc.signalingState !== 'have-local-offer') return;
      await pc.setRemoteDescription(new RTCSessionDescription(snap.val())).catch(() => {});
    });
  }

  async function handleOffer(fromUid, offer) {
    if (pcs[fromUid]) {
      if (!isStalePC(pcs[fromUid])) return;
      cleanUpPeer(fromUid);
    }
    const pc = await makePc(fromUid);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await getDb().ref(`calls/${callCode}/answers/${myUid}_${fromUid}`).set({ type: answer.type, sdp: answer.sdp });
  }
  function isStalePC(pc) {
    const s = pc.connectionState || pc.iceConnectionState;
    return s === 'closed' || s === 'failed' || s === 'disconnected';
  }

  function cleanUpPeer(uid) {
    if (pcs[uid]) { pcs[uid].close(); delete pcs[uid]; }
    if (iceListenerRefs[uid]) { iceListenerRefs[uid].off(); delete iceListenerRefs[uid]; }
    if (answerListenerRefs[uid]) { answerListenerRefs[uid].off(); delete answerListenerRefs[uid]; }
    if (window.removeRemoteVideo) window.removeRemoteVideo(uid);
    if (callRef && myUid) {
      callRef.child(`offers/${myUid}_${uid}`).remove();
      callRef.child(`answers/${myUid}_${uid}`).remove();
      callRef.child(`ice/${myUid}_${uid}`).remove();
    }
  }

  window.joinCallRoom = async function(code, userName) {
    const db = getDb();
    const user = auth.currentUser;
    if (!user) return;
    callCode = code; myUid = user.uid;
    callRef = db.ref(`calls/${code}`);

    try {
      const [offersSnap, answersSnap, iceSnap] = await Promise.all([
        callRef.child('offers').orderByKey().startAt(myUid + '_').endAt(myUid + '_\uf8ff').once('value'),
        callRef.child('answers').orderByKey().startAt(myUid + '_').endAt(myUid + '_\uf8ff').once('value'),
        callRef.child('ice').orderByKey().startAt(myUid + '_').endAt(myUid + '_\uf8ff').once('value'),
      ]);
      const removes = [];
      [offersSnap, answersSnap, iceSnap].forEach(snap =>
        snap.forEach(child => removes.push(child.ref.remove()))
      );
      await Promise.all(removes);
    } catch (e) {}

    await getMedia();
    await callRef.child(`participants/${myUid}`).set({ name: userName, ts: firebase.database.ServerValue.TIMESTAMP });
    callRef.child(`participants/${myUid}`).onDisconnect().remove();

    callRef.child('participants').on('child_added', async snap => {
      const uid = snap.key;
      if (uid === myUid) return;
      if (pcs[uid]) {
        if (isStalePC(pcs[uid])) {
          cleanUpPeer(uid);
        } else {
          return;
        }
      }

      if (myUid > uid) await sendOffer(uid);
    });
    callRef.child('participants').on('child_removed', async snap => {
      const uid = snap.key;
      if (uid === myUid) return;
      cleanUpPeer(uid);
      const rejoined = await callRef.child(`participants/${uid}`).once('value');
      if (rejoined.exists() && myUid > uid) {
        await sendOffer(uid);
      }
    });

    const handleOfferSnap = snap => {
      const [from, to] = snap.key.split('_');
      if (to === myUid) handleOffer(from, snap.val());
    };
    callRef.child('offers').on('child_added', handleOfferSnap);
    callRef.child('offers').on('child_changed', handleOfferSnap);

    callRef.child('participants').on('value', snap => {
      if (window.updateCallParticipants) window.updateCallParticipants(snap.numChildren());
      if (window.updateCallParticipantList) window.updateCallParticipantList(snap.val());
    });
  };

  window.leaveCall = async function() {
    if (callRef) {
      callRef.child('participants').off();
      callRef.child('offers').off('child_added');
      callRef.child('offers').off('child_changed');
    }
    Object.values(iceListenerRefs).forEach(ref => ref.off());
    iceListenerRefs = {};
    Object.values(answerListenerRefs).forEach(ref => ref.off());
    answerListenerRefs = {};

    if (callRef && myUid) {
      const removes = [callRef.child(`participants/${myUid}`).remove()];
      Object.keys(pcs).forEach(uid => {
        removes.push(callRef.child(`offers/${myUid}_${uid}`).remove());
        removes.push(callRef.child(`answers/${myUid}_${uid}`).remove());
        removes.push(callRef.child(`ice/${myUid}_${uid}`).remove());
      });
      await Promise.all(removes).catch(() => {});
    }

    Object.values(pcs).forEach(pc => pc.close());
    pcs = {};
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if (screenStream) { screenStream.getTracks().forEach(t => t.stop()); screenStream = null; }
    callCode = null; myUid = null; callRef = null;
    const lv = document.getElementById('local-video');
    if (lv) lv.srcObject = null;
    const rv = document.getElementById('remote-videos');
    if (rv) rv.innerHTML = '';
  };

  window.callToggleMute = function() {
    if (!localStream) return false;
    const t = localStream.getAudioTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled;
    return !t.enabled;
  };

  window.callToggleCamera = function() {
    if (!localStream) return false;
    const t = localStream.getVideoTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled;
    const lv = document.getElementById('local-video');
    if (lv) lv.style.opacity = t.enabled ? '1' : '0.3';
    return !t.enabled;
  };

  window.callToggleScreen = async function() {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      screenStream = null;
      const vt = localStream?.getVideoTracks()[0];
      for (const [uid, pc] of Object.entries(pcs)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          if (vt) {
            await sender.replaceTrack(vt).catch(() => {});
          } else {
            pc.removeTrack(sender);
            if (myUid > uid) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await getDb().ref(`calls/${callCode}/offers/${myUid}_${uid}`).set({ type: offer.type, sdp: offer.sdp });
            }
          }
        }
      }
      const lv = document.getElementById('local-video');
      if (lv && localStream) lv.srcObject = localStream;
      return false;
    }

    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const st = screenStream.getVideoTracks()[0];

      for (const [uid, pc] of Object.entries(pcs)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(st).catch(() => {});
        } else {
          pc.addTrack(st, screenStream);
          if (myUid > uid) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await getDb().ref(`calls/${callCode}/offers/${myUid}_${uid}`).set({ type: offer.type, sdp: offer.sdp });
          }
        }
      }

      const lv = document.getElementById('local-video');
      if (lv) {
        const ms = new MediaStream([st, ...(localStream?.getAudioTracks() || [])]);
        lv.srcObject = ms;
      }
      st.onended = () => window.callToggleScreen();
      return true;
    } catch (e) { return false; }
  };
})();