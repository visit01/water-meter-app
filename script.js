// ต้องเชื่อมต่อ Firebase SDK ในไฟล์ HTML ก่อน
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

// ใส่ Firebase config ของโปรเจกต์ของคุณที่นี่ (จำเป็นมาก)
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

let customersData = [];

// ==========================================================
// ส่วนที่ 1: ฟังก์ชันสำหรับจัดการการแสดงผลและการทำงานของ Dashboard
// ==========================================================

// ฟังก์ชันสำหรับดึงข้อมูลลูกค้าจาก Firestore
async function fetchCustomers() {
    const customerListDiv = document.getElementById('customerList');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loadingMessage.style.display = 'block'; // แสดงข้อความ "กำลังโหลด"

    try {
        const snapshot = await db.collection('customers').get();
        customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        displayCustomers(customersData);
    } catch (error) {
        console.error("Error fetching customers: ", error);
        customerListDiv.innerHTML = '<p class="text-danger text-center">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>';
    } finally {
        loadingMessage.style.display = 'none'; // ซ่อนข้อความ "กำลังโหลด"
    }
}

// ฟังก์ชันสำหรับแสดงผลข้อมูลลูกค้าในรูปแบบการ์ด
function displayCustomers(customers) {
    const customerListDiv = document.getElementById('customerList');
    customerListDiv.innerHTML = '';
    
    if (customers.length === 0) {
        customerListDiv.innerHTML = '<p class="text-center text-muted">ไม่พบข้อมูลลูกค้า</p>';
        return;
    }

    customers.forEach(customer => {
        const cardHtml = `
            <div class="col-12">
                <div class="card customer-card shadow-sm" data-id="${customer.id}">
                    <div class="card-body">
                        <h5 class="card-title">${customer.name}</h5>
                        <p class="card-text"><strong>เลขมิเตอร์:</strong> ${customer.meterNumber}</p>
                        <p class="card-text text-muted">ที่อยู่: ${customer.address}</p>
                    </div>
                </div>
            </div>
        `;
        customerListDiv.innerHTML += cardHtml;
    });
}

// ฟังก์ชันสำหรับจัดการการค้นหาลูกค้า
function setupSearch() {
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredCustomers = customersData.filter(customer => {
                return customer.name.toLowerCase().includes(searchTerm) || 
                       customer.meterNumber.toLowerCase().includes(searchTerm);
            });
            displayCustomers(filteredCustomers);
        });
    }
}

// ฟังก์ชันสำหรับจัดการปุ่ม "ออกจากระบบ"
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out.");
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        });
    }
}

// ==========================================================
// ส่วนที่ 2: ฟังก์ชันสำหรับจัดการการล็อกอิน
// ==========================================================

// ฟังก์ชันสำหรับจัดการการส่งฟอร์มล็อกอิน
function handleLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const errorMessageElement = document.getElementById('errorMessage');
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // ไม่ต้องทำอะไร เพราะ onAuthStateChanged จะจัดการการเปลี่ยนเส้นทางเอง
                })
                .catch(error => {
                    errorMessageElement.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
                });
        });
    }
}

// ==========================================================
// ส่วนที่ 3: การจัดการสถานะผู้ใช้เมื่อโหลดหน้าเว็บ
// ==========================================================

// ตรวจสอบสถานะการล็อกอินของผู้ใช้เมื่อโหลดหน้าเว็บ
auth.onAuthStateChanged(user => {
    // ผู้ใช้ล็อกอินอยู่
    if (user) {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            // ถ้าอยู่หน้า Login ให้เปลี่ยนไปหน้า Dashboard
            window.location.href = "dashboard.html";
        } else {
            // ถ้าอยู่หน้า Dashboard ให้ดึงข้อมูลมาแสดงผลและตั้งค่าปุ่มต่างๆ
            fetchCustomers();
            setupLogout();
            setupSearch();
        }
    } else {
        // ผู้ใช้ไม่ได้ล็อกอิน
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            // ถ้าอยู่หน้า Dashboard ให้เปลี่ยนไปหน้า Login
            window.location.href = "index.html";
        }
    }
});

// เรียกใช้ฟังก์ชัน handleLogin() ทันทีที่โหลดหน้าเว็บ
handleLogin();
