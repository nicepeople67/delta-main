window.verifyAdminCredentials = async function(email, pass) {
    const auth = firebase.auth();
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        await auth.signInAnonymously();
        return true;
    } catch(e) {
        await auth.signInAnonymously().catch(() => {});
        return false;
    }
};

let db = null;
function ensureDbReady(timeoutMs = 5000) {
    return new Promise((resolve) => {
        if (window.firebaseInitialized && firebase.apps && firebase.apps.length) {
            db = firebase.database();
            return resolve(db);
        }
        const start = Date.now();
        const id = setInterval(() => {
            if (window.firebaseInitialized && firebase.apps && firebase.apps.length) {
                clearInterval(id);
                db = firebase.database();
                return resolve(db);
            }
            if (Date.now() - start > timeoutMs) {
                clearInterval(id);
                console.warn('Timed out waiting for Firebase initialization');
                return resolve(null);
            }
        }, 100);
    });
}

console.log('login.js loaded');

async function loginFormHandler(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName')?.value.trim() || '';
    const lastName = document.getElementById('lastName')?.value.trim() || '';
    const fullName = `${firstName} ${lastName}`;
    const dbSafeName = fullName.toLowerCase().replace(/\s+/g, '_');
    try {
        await ensureDbReady();
        const user = await firebase.auth().signInAnonymously().then(r => r.user);
        const whitelistSnap = await db.ref(`whitelist/${dbSafeName}`).get();
        if (!whitelistSnap.exists()) {
            try {
                await db.ref(`login_attempts/${user.uid}`).set({ ts: firebase.database.ServerValue.TIMESTAMP });
            } catch {
                alert("Too many attempts. Please wait.");
                return;
            }
            alert("Access revoked.");
            return;
        }
        console.log("Authenticated with Firebase!");

        if (!db) {
            console.error('Database handle is not available');
            alert('Service temporarily unavailable.');
            return;
        }

        const banSnap = await db.ref(`banned_users/${dbSafeName}`).get();
        if (banSnap.exists()) {
            alert("You are banned.");
            return;
        }

        const sessionSnap = await db.ref(`logged_users/${dbSafeName}`).get();

        if (sessionSnap.exists()) {
            const userIp = await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => "0.0.0.0");
            const reqRef = db.ref(`login_requests/${dbSafeName}`);
            
            await reqRef.set({ 
                name: fullName, 
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending',
                uid: user.uid,
                ip: userIp,         
                browser: navigator.userAgent  
            });

            const formEl = document.getElementById('login-form');
            if (formEl) formEl.style.display = 'none';
            const statusDiv = document.getElementById('login-status');
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.querySelector('div').nextSibling.textContent = " Waiting for admin approval..."; 
            }

            reqRef.on('value', async (snap) => {
            const val = snap.val();
            if (val?.status === 'approved') {
                reqRef.off();
                try {
                    await completeLogin(dbSafeName, fullName, userIp, navigator.userAgent);
                    await reqRef.remove();
                } catch (err) {
                    console.error("Login failed:", err);
                }
            } else if (val?.status === 'declined') {
                reqRef.off();
                await reqRef.remove();
                alert("Your request was declined.");
                location.reload();
            }
        });
        } else {
            const userIp = await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => "Unknown");
            const reqRef = db.ref(`login_requests/${dbSafeName}`);

            await reqRef.set({
                name: fullName,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'pending',
                uid: user.uid,
                ip: userIp,
                browser: navigator.userAgent
            });

            const formEl = document.getElementById('login-form');
            if (formEl) formEl.style.display = 'none';
            const statusDiv = document.getElementById('login-status');
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.querySelector('div').nextSibling.textContent = " Waiting for admin approval...";
            }

            reqRef.on('value', async (snap) => {
                const val = snap.val();
                if (val?.status === 'approved') {
                    reqRef.off();
                    try {
                        await completeLogin(dbSafeName, fullName, userIp, navigator.userAgent);
                        await reqRef.remove();
                    } catch (err) {
                        console.error("Login failed:", err);
                    }
                } else if (val?.status === 'declined') {
                    reqRef.off();
                    await reqRef.remove();
                    window._alert("Your request was declined.");
                    location.reload();
                }
            });
        }
    } catch (err) { 
        console.error("Err:", err);
        location.replace('/403.html');
    }
}

function bindLoginForm(timeoutMs = 5000) {
    const el = document.getElementById('login-form');
    if (el) {
        el.addEventListener('submit', loginFormHandler);
        console.log('login form handler attached');
        return;
    }
    const start = Date.now();
    const id = setInterval(() => {
        const f = document.getElementById('login-form');
        if (f) {
            clearInterval(id);
            f.addEventListener('submit', loginFormHandler);
            console.log('login form handler attached (delayed)');
            return;
        }
        if (Date.now() - start > timeoutMs) {
            clearInterval(id);
            console.warn('Could not find #login-form to attach handler');
        }
    }, 200);
}

bindLoginForm();
async function completeLogin(dbSafeName, fullName, userIp, browser) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("No authenticated user found at completeLogin");
        return;
    }

    await ensureDbReady();

    localStorage.setItem('userDbKey', dbSafeName); 
    localStorage.setItem('loginToken', Date.now().toString());
    const updates = {};
    updates[`logged_users/${dbSafeName}`] = {
        name: fullName,
        uid: user.uid, 
        ts: Date.now(),
        ip: userIp,
        browser: browser
    };
    updates[`login_requests/${dbSafeName}`] = null;

    try {
        await db.ref().update(updates);
        
        console.log("Login and cleanup successful.");
        window.location.replace('/index.html');
    } catch (e) {
        console.error("Final write failed:", e);
        alert("Permission denied at final step");
    }
}