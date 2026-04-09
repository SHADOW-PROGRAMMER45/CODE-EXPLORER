
const firebaseConfig = {
    apiKey: "AIzaSyAXytuEOoK_aGOlDSnVVsQsRFppCYdHTAc",
    authDomain: "codevault-c7cdf.firebaseapp.com",
    projectId: "codevault-c7cdf",
    storageBucket: "codevault-c7cdf.firebasestorage.app",
    messagingSenderId: "315423955057",
    appId: "1:315423955057:web:b005a9bf0564caaefa23d0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- AUTH LOGIC ---
async function loginAdmin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
        const err = document.getElementById('auth-error');
        err.innerText = "Error: " + e.message;
        err.style.display = 'block';
    }
}

function logoutAdmin() { auth.signOut(); }

auth.onAuthStateChanged((user) => {
    document.getElementById('login-section').style.display = user ? 'none' : 'block';
    document.getElementById('admin-fields').style.display = user ? 'block' : 'none';
    document.getElementById('auth-status').style.background = user ? 'var(--accent)' : 'var(--danger)';
    fetchVault(); 
});

// --- NAVIGATION ---
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links button, .sidebar button').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(document.getElementById('nav-'+pageId)) document.getElementById('nav-'+pageId).classList.add('active');
    if(pageId === 'vault') fetchVault();
    window.scrollTo(0,0);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

// --- DATABASE ---
async function publishCode() {
    const title = document.getElementById('titleInput').value.trim();
    const desc = document.getElementById('descInput').value.trim();
    const code = document.getElementById('codeInput').value.trim();
    const img = document.getElementById('imageUrl').value.trim();

    if(!title || !desc || !code) return alert("Fill all fields!");

    try {
        await db.collection("codes").add({
            title, desc, code,
            img: img || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("DEPLOYED!");
        navigate('vault');
    } catch (e) { alert("Error: " + e.message); }
}

function fetchVault() {
    const container = document.getElementById('projectList');
    db.collection("codes").orderBy("createdAt", "desc").get().then((snapshot) => {
        document.getElementById('loading-msg').style.display = 'none';
        container.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const delBtn = auth.currentUser ? `<button onclick="deleteCode('${doc.id}', event)" style="background:var(--danger); color:white; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:10px;">DELETE</button>` : '';
            return `
                <div class="banner" onclick="viewCode('${doc.id}')">
                    <img src="${data.img}" class="banner-img">
                    <div class="banner-overlay">
                        <div>
                            <h2 style="font-size:1.4rem;">${data.title}</h2>
                            <p style="color:var(--text-dim); font-size:0.85rem;">${data.desc}</p>
                        </div>
                        <div style="display:flex; align-items:center;">
                            <button style="background:var(--primary); color:white; border:none; padding:10px 18px; border-radius:10px; font-weight:700; cursor:pointer;">GET CODE</button>
                            ${delBtn}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

async function deleteCode(id, event) {
    event.stopPropagation();
    if(confirm("Delete this code?")) {
        await db.collection("codes").doc(id).delete();
        fetchVault();
    }
}

async function viewCode(id) {
    const doc = await db.collection("codes").doc(id).get();
    if(doc.exists) {
        document.getElementById('viewer-title').innerText = doc.data().title;
        document.getElementById('code-display').innerText = doc.data().code;
        navigate('viewer');
    }
}

function copyCode() {
    const text = document.getElementById('code-display').innerText;
    navigator.clipboard.writeText(text).then(() => alert("COPIED"));
}

window.onload = () => navigate('home');
