// admin.js

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

// เริ่มต้น Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================================
// ส่วนที่ 1: การจัดการสถานะผู้ใช้และสิทธิ์การเข้าถึง
// ==========================================================

// ตรวจสอบสถานะการล็อกอินและบทบาทเมื่อโหลดหน้าเว็บ
auth.onAuthStateChanged(async user => {
    if (user) {
        // ดึงข้อมูลผู้ใช้จาก Firestore
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            // ผู้ใช้เป็น Admin
            console.log("Admin logged in. Loading dashboard data...");
            // เรียกฟังก์ชันสำหรับแสดงข้อมูล
            loadDashboardData();
            setupAdminLogout();
        } else {
            // ไม่ใช่ Admin หรือไม่มีบทบาท
            console.log("User is not an admin. Redirecting to login.");
            await auth.signOut();
            window.location.href = "admin-login.html";
        }
    } else {
        // ไม่ได้ล็อกอิน
        window.location.href = "admin-login.html";
    }
});

// ฟังก์ชันสำหรับจัดการปุ่ม "ออกจากระบบ"
function setupAdminLogout() {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("Admin signed out.");
                window.location.href = "admin-login.html";
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        });
    }
}

// ==========================================================
// ส่วนที่ 2: ฟังก์ชันสำหรับโหลดข้อมูลมาแสดงผล
// ==========================================================

async function loadDashboardData() {
    // โหลดข้อมูลลูกค้า
    await fetchCustomers();
    // โหลดข้อมูลการจดมิเตอร์
    await fetchReadings();
}

// ฟังก์ชันสำหรับดึงข้อมูลลูกค้าทั้งหมด
async function fetchCustomers() {
    const tableBody = document.getElementById('customersTableBody');
    const loadingMessage = document.getElementById('customersLoadingMessage');
    const totalCustomersCount = document.getElementById('totalCustomersCount');
    
    tableBody.innerHTML = '';
    loadingMessage.style.display = 'block';

    try {
        const snapshot = await db.collection('customers').get();
        const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        totalCustomersCount.textContent = customers.length;
        
        customers.forEach(customer => {
            const row = `
                <tr>
                    <td>${customer.name}</td>
                    <td>${customer.meterNumber}</td>
                    <td>${customer.address}</td>
                    <td>${customer.lastReading}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลการจดมิเตอร์ทั้งหมด
async function fetchReadings() {
    const tableBody = document.getElementById('readingsTableBody');
    const loadingMessage = document.getElementById('readingsLoadingMessage');
    const todayReadingsCount = document.getElementById('todayReadingsCount');
    
    tableBody.innerHTML = '';
    loadingMessage.style.display = 'block';

    try {
        const snapshot = await db.collection('readings').orderBy('readingDate', 'desc').get();
        const readings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const today = new Date().setHours(0, 0, 0, 0);

        let todayCount = 0;
        
        // ดึงชื่อเจ้าหน้าที่จาก Firebase UID
        const usersSnapshot = await db.collection('users').get();
        const users = {};
        usersSnapshot.forEach(doc => {
            users[doc.id] = doc.data().name || 'ไม่ระบุชื่อ';
        });

        for (const reading of readings) {
            const readingDate = reading.readingDate.toDate();
            const photoURL = reading.photoURL;

            // ตรวจสอบว่าเป็นการจดมิเตอร์ของวันนี้หรือไม่
            if (readingDate.setHours(0, 0, 0, 0) === today) {
                todayCount++;
            }

            // ดึงชื่อลูกค้าจาก customerId
            const customerDoc = await db.collection('customers').doc(reading.customerId).get();
            const customerName = customerDoc.exists ? customerDoc.data().name : 'ไม่พบข้อมูลลูกค้า';

            const row = `
                <tr>
                    <td>${users[reading.readingBy]}</td>
                    <td>${customerName}</td>
                    <td>${reading.meterNumber}</td>
                    <td>${reading.currentReading}</td>
                    <td>${readingDate.toLocaleDateString('th-TH')}</td>
                    <td><a href="${photoURL}" target="_blank">ดูรูปภาพ</a></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }

        todayReadingsCount.textContent = todayCount;

    } catch (error) {
        console.error("Error fetching readings:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    } finally {
        loadingMessage.style.display = 'none';
    }
}
