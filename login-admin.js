// login-admin.js

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

const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminErrorMessage = document.getElementById('adminErrorMessage');

// จัดการการส่งฟอร์มล็อกอิน
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminErrorMessage.textContent = '';

        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            const userDocRef = db.collection("users").doc(user.uid);
            const userDoc = await userDocRef.get();

            if (userDoc.exists && userDoc.data().role === 'admin') {
                window.location.href = "admin-dashboard.html";
            } else {
                await auth.signOut();
                adminErrorMessage.textContent = "ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล";
            }
        } catch (error) {
            console.error("Login failed:", error.message);
            adminErrorMessage.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        }
    });
}
