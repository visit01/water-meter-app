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

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================================
// ส่วนที่ 1: การประกาศฟังก์ชันทั้งหมด (ย้ายมาไว้ด้านบนสุด)
// ==========================================================

async function loadDashboardData() {
    await fetchCustomers();
    await fetchReadings();
}

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

async function fetchReadings() {
    const tableBody = document.getElementById('readingsTableBody');
    const loadingMessage = document.getElementById('readingsLoadingMessage');
    const todayReadingsCount = document.getElementById('todayReadingsCount');
    
    tableBody.innerHTML = '';
    loadingMessage.style.display = 'block';

    try {
        const readingsSnapshot = await db.collection('readings').orderBy('readingDate', 'desc').get();
        const readings = readingsSnapshot.docs.map(doc => doc.data());

        const today = new Date().setHours(0, 0, 0, 0);
        let todayCount = 0;
        
        const usersMap = {};
        const customersMap = {};

        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => {
            usersMap[doc.id] = doc.data().name || 'ไม่ระบุชื่อ';
        });

        const customersSnapshot = await db.collection('customers').get();
        customersSnapshot.forEach(doc => {
            customersMap[doc.id] = doc.data().name || 'ไม่ระบุชื่อลูกค้า';
        });

        readings.forEach(reading => {
            const readingDate = reading.readingDate.toDate();
            const photoURL = reading.photoURL;

            if (readingDate.setHours(0, 0, 0, 0) === today) {
                todayCount++;
            }

            const staffName = usersMap[reading.readingBy] || 'ไม่ระบุชื่อเจ้าหน้าที่';
            const customerName = customersMap[reading.customerId] || 'ไม่ระบุชื่อลูกค้า';

            const row = `
                <tr>
                    <td>${staffName}</td>
                    <td>${customerName}</td>
                    <td>${reading.meterNumber}</td>
                    <td>${reading.currentReading}</td>
                    <td>${readingDate.toLocaleDateString('th-TH')}</td>
                    <td><a href="${photoURL}" target="_blank">ดูรูปภาพ</a></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        todayReadingsCount.textContent = todayCount;

    } catch (error) {
        console.error("Error fetching readings:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

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

// ==========================================================
// ส่วนที่ 2: การจัดการสถานะผู้ใช้ (เรียกฟังก์ชันที่ประกาศไว้แล้ว)
// ==========================================================

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
