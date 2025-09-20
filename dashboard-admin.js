// dashboard-admin.js

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB1GsiG6eFkmae-eP1i9rSeleuwZPyfCqs",
  authDomain: "smart-water-meter-24ea9.firebaseapp.com",
  projectId: "smart-water-meter-24ea9",
  storageBucket: "smart-water-meter-24ea9.firebasestorage.app",
  messagingSenderId: "11062650999",
  appId: "1:11062650999:web:3afd85b204d42ed6b4be72",
  measurementId: "G-9EZVLS42W4"
};

// เริ่มต้น Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ตรวจสอบสถานะการล็อกอินและบทบาทเมื่อโหลดหน้าเว็บ
auth.onAuthStateChanged(async user => {
    if (user) {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            loadDashboardData();
            setupAdminLogout();
        } else {
            await auth.signOut();
            window.location.href = "admin-login.html";
        }
    } else {
        window.location.href = "admin-login.html";
    }
});

// ฟังก์ชันสำหรับจัดการปุ่ม "ออกจากระบบ"
function setupAdminLogout() {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = "admin-login.html";
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        });
    }
}

// *** คัดลอกฟังก์ชันเหล่านี้มาจาก admin.js เดิม แล้วนำมาวางตรงนี้ ***
// async function loadDashboardData() { ... }
// async function fetchCustomers() { ... }
// async function fetchReadings() { ... }
