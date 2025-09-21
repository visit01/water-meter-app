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

let customers = [];
let html5QrCode = null;

// ==========================================================
// ส่วนที่ 1: การจัดการสถานะผู้ใช้และดึงข้อมูล
// ==========================================================

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        fetchUserName(user.uid);
        
        fetchCustomers();
        setupSearch();
        setupLogout();
        setupQrCodeScanner();
    } else {
        window.location.href = "index.html";
    }
});

async function fetchUserName(uid) {
    try {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
            document.getElementById('userName').textContent = userDoc.data().name || 'ไม่ระบุชื่อ';
        } else {
            document.getElementById('userName').textContent = 'ไม่ระบุชื่อ';
        }
    } catch (error) {
        console.error("Error fetching user name:", error);
    }
}

async function fetchCustomers() {
    const customersList = document.getElementById('customersList');
    const loadingMessage = document.getElementById('loadingMessage');
    customersList.innerHTML = '';
    loadingMessage.style.display = 'block';

    try {
        const snapshot = await db.collection('customers').orderBy('name').get();
        customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayCustomers(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        customersList.innerHTML = '<p class="text-danger text-center">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayCustomers(customerArray) {
    const customersList = document.getElementById('customersList');
    customersList.innerHTML = '';
    if (customerArray.length === 0) {
        customersList.innerHTML = '<p class="text-center text-muted">ไม่พบข้อมูลลูกค้าที่ตรงกับการค้นหา</p>';
    }
    customerArray.forEach(customer => {
        const item = document.createElement('a');
        item.href = `reading.html?customerId=${customer.id}`;
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <h5 class="mb-1">${customer.name}</h5>
                <small class="text-muted">เลขมิเตอร์: ${customer.meterNumber}</small>
            </div>
            <span class="badge bg-primary rounded-pill">เลขล่าสุด: ${customer.lastReading || 0}</span>
        `;
        customersList.appendChild(item);
    });
}

// ==========================================================
// ส่วนที่ 2: การจัดการฟังก์ชันอื่นๆ
// ==========================================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCustomers = customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) || 
            customer.meterNumber.includes(searchTerm)
        );
        displayCustomers(filteredCustomers);
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        });
    }
}

// ฟังก์ชันสำหรับสแกน QR Code
function setupQrCodeScanner() {
    const scanQrCodeBtn = document.getElementById('scanQrCodeBtn');
    const qrReaderDiv = document.getElementById('qr-reader');
    const searchInput = document.getElementById('searchInput');
    
    // ตั้งค่า HTML5 Qrcode
    html5QrCode = new Html5Qrcode("qr-reader");

    scanQrCodeBtn.addEventListener('click', () => {
        // เริ่มสแกนเมื่อคลิกปุ่ม
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                // เมื่อสแกนสำเร็จ
                searchInput.value = decodedText;
                
                // กระตุ้น Event 'input' เพื่อให้ค้นหาลูกค้าทันที
                const event = new Event('input');
                searchInput.dispatchEvent(event);
                
                // หยุดการทำงานของกล้อง
                html5QrCode.stop().then(() => {
                    qrReaderDiv.style.display = 'none';
                }).catch(err => {
                    console.error("Failed to stop scanner:", err);
                });
            },
            (errorMessage) => {
                // แสดงข้อผิดพลาด
            }
        ).catch(err => {
            console.error("Failed to start scanner:", err);
            alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง");
        });
    });
}
