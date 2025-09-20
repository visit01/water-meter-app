// dashboard.js

// Firebase config และการเริ่มต้น (อย่าลืมเปลี่ยนเป็นของโปรเจกต์คุณ)
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

// ==========================================================
// ส่วนที่ 1: ฟังก์ชันสำหรับจัดการการแสดงผลและการทำงานของ Dashboard
// ==========================================================

async function fetchCustomers() {
    const customerListDiv = document.getElementById('customerList');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loadingMessage.style.display = 'block';

    try {
        const snapshot = await db.collection('customers').get();
        customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        displayCustomers(customersData);
    } catch (error) {
        console.error("Error fetching customers: ", error);
        customerListDiv.innerHTML = '<p class="text-danger text-center">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// ฟังก์ชันสำหรับแสดงผลข้อมูลลูกค้าในรูปแบบการ์ด (แก้ไขส่วนนี้)
function displayCustomers(customers) {
    const customerListDiv = document.getElementById('customerList');
    customerListDiv.innerHTML = '';
    
    if (customers.length === 0) {
        customerListDiv.innerHTML = '<p class="text-center text-muted">ไม่พบข้อมูลลูกค้า</p>';
        return;
    }

    customers.forEach(customer => {
        const cardHtml = `
            <div class="card customer-card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${customer.name}</h5>
                    <p class="card-text"><strong>เลขมิเตอร์:</strong> ${customer.meterNumber}</p>
                    <p class="card-text text-muted">ที่อยู่: ${customer.address}</p>
                </div>
            </div>
        `;
        
        // สร้าง div ใหม่และใส่ HTML ของ card เข้าไป
        const cardContainer = document.createElement('div');
        cardContainer.className = 'col-12';
        cardContainer.innerHTML = cardHtml;
        
        // เพิ่ม Event Listener ให้กับการ์ดแต่ละใบ
        const card = cardContainer.querySelector('.customer-card');
        card.addEventListener('click', () => {
            // เมื่อคลิก จะนำไปยังหน้า reading.html พร้อมส่ง Customer ID ไปด้วย
            window.location.href = `reading.html?customerId=${customer.id}`;
        });

        customerListDiv.appendChild(cardContainer);
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
// ส่วนที่ 2: การจัดการสถานะผู้ใช้เมื่อโหลดหน้าเว็บ
// ==========================================================

auth.onAuthStateChanged(user => {
    if (user) {
        fetchCustomers();
        setupLogout();
        setupSearch();
    } else {
        window.location.href = "index.html";
    }
});
