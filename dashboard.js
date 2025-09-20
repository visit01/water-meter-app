// ใส่ Firebase config ของโปรเจกต์ของคุณที่นี่ (เหมือนกับใน login.js)
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
const db = firebase.firestore();

let customersData = [];

// ตรวจสอบสถานะการล็อกอินและเปลี่ยนเส้นทาง
auth.onAuthStateChanged(user => {
    if (user) {
        fetchCustomers();
        setupLogout();
    } else {
        window.location.href = "index.html";
    }
});

// ฟังก์ชันสำหรับออกจากระบบ
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out.");
            });
        });
    }
}

// ส่วนที่เหลือของโค้ดสำหรับ Dashboard (fetchCustomers, displayCustomers, searchBox)
// คัดลอกมาจากไฟล์ script.js เดิมได้เลย
// ...
