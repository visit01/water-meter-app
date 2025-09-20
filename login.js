// ใส่ Firebase config ของโปรเจกต์ของคุณที่นี่
const firebaseConfig = {
  apiKey: "AIzaSyB1GsiG6eFkmae-eP1i9rSeleuwZPyfCqs",
  authDomain: "smart-water-meter-24ea9.firebaseapp.com",
  projectId: "smart-water-meter-24ea9",
  storageBucket: "smart-water-meter-24ea9.firebasestorage.app",
  messagingSenderId: "11062650999",
  appId: "1:11062650999:web:3afd85b204d42ed6b4be72",
  measurementId: "G-9EZVLS42W4"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageElement = document.getElementById('errorMessage');

// ตรวจสอบสถานะการล็อกอินและเปลี่ยนเส้นทาง
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = "dashboard.html";
    }
});

// จัดการการส่งฟอร์มล็อกอิน
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // ไม่ต้องทำอะไรตรงนี้ เพราะ onAuthStateChanged จะจัดการการเปลี่ยนเส้นทาง
            })
            .catch(error => {
                errorMessageElement.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
            });
    });
}
