// customer-management.js

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

let userAgencyId = null;
let userAgencyName = null;
let customers = [];
const customerModal = new bootstrap.Modal(document.getElementById('customerModal'));

// ==========================================================
// ส่วนที่ 1: การจัดการ Authentication และการดึงข้อมูล
// ==========================================================

auth.onAuthStateChanged(async user => {
    if (user) {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            userAgencyId = userDoc.data().agencyId;
            if (userAgencyId) {
                // ดึง agencyName มาแสดงใน dropdown
                const agencyDoc = await db.collection("agencies").doc(userAgencyId).get();
                if (agencyDoc.exists) {
                    userAgencyName = agencyDoc.data().agencyName;
                    document.getElementById('agencyOption').textContent = userAgencyName;
                }

                // แสดงข้อมูลผู้ใช้ที่ล็อกอิน
                document.getElementById('userName').textContent = userDoc.data().name || 'ไม่ระบุชื่อ';
                document.getElementById('userEmail').textContent = user.email;

                fetchCustomers();
                setupLogout();
                setupSearch();
                setupCrudEvents();
            } else {
                auth.signOut();
                window.location.href = "admin-login.html";
            }
        } else {
            auth.signOut();
            window.location.href = "admin-login.html";
        }
    } else {
        window.location.href = "admin-login.html";
    }
});

async function fetchCustomers() {
    const customerTableBody = document.getElementById('customerTableBody');
    const loadingMessage = document.getElementById('customerLoadingMessage');
    customerTableBody.innerHTML = '';
    loadingMessage.style.display = 'block';

    try {
        const snapshot = await db.collection('customers').where('agencyId', '==', userAgencyId).get();
        customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayCustomers(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        customerTableBody.innerHTML = '<tr><td colspan="4" class="text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayCustomers(customerArray) {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = '';
    if (customerArray.length === 0) {
        customerTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">ไม่พบข้อมูลลูกค้า</td></tr>';
        return;
    }

    customerArray.forEach(customer => {
        const row = `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.meterNumber}</td>
                <td>${customer.lastReading || 0}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${customer.id}" data-bs-toggle="modal" data-bs-target="#customerModal">แก้ไข</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${customer.id}">ลบ</button>
                </td>
            </tr>
        `;
        customerTableBody.innerHTML += row;
    });
}

// ==========================================================
// ส่วนที่ 2: ฟังก์ชันสำหรับจัดการ CRUD และ Event
// ==========================================================

function setupCrudEvents() {
    // การสร้างลูกค้า
    document.getElementById('customerForm').addEventListener('submit', handleFormSubmit);

    // การแก้ไขลูกค้า
    document.getElementById('customerTableBody').addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const customerId = e.target.dataset.id;
            const customerToEdit = customers.find(c => c.id === customerId);

            document.getElementById('customerModalLabel').textContent = 'แก้ไขข้อมูลลูกค้า';
            document.getElementById('customerId').value = customerId;
            document.getElementById('customerNameInput').value = customerToEdit.name;
            document.getElementById('meterNumberInput').value = customerToEdit.meterNumber;
            document.getElementById('customerAddressInput').value = customerToEdit.address;
            document.getElementById('lastReadingInput').value = customerToEdit.lastReading;
            document.getElementById('customerLocationInput').value = customerToEdit.location;
        }
    });

    // การลบลูกค้า
    document.getElementById('customerTableBody').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const customerId = e.target.dataset.id;
            if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้าคนนี้?')) {
                await deleteCustomer(customerId);
            }
        }
    });

    // การ reset form เมื่อ modal ปิด
    customerModal._element.addEventListener('hidden.bs.modal', () => {
        document.getElementById('customerModalLabel').textContent = 'เพิ่มลูกค้าใหม่';
        document.getElementById('customerForm').reset();
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const customerId = document.getElementById('customerId').value;
    const customerData = {
        agencyId: userAgencyId,
        name: document.getElementById('customerNameInput').value,
        meterNumber: document.getElementById('meterNumberInput').value,
        address: document.getElementById('customerAddressInput').value,
        lastReading: parseFloat(document.getElementById('lastReadingInput').value),
        location: document.getElementById('customerLocationInput').value,
    };

    if (customerId) {
        // อัปเดตลูกค้า
        await db.collection('customers').doc(customerId).update(customerData);
    } else {
        // เพิ่มลูกค้าใหม่
        await db.collection('customers').add(customerData);
    }
    
    customerModal.hide();
    fetchCustomers(); // โหลดข้อมูลใหม่
}

async function deleteCustomer(id) {
    try {
        await db.collection('customers').doc(id).delete();
        fetchCustomers(); // โหลดข้อมูลใหม่
    } catch (error) {
        console.error("Error deleting customer:", error);
        alert("เกิดข้อผิดพลาดในการลบลูกค้า");
    }
}

// ... (ส่วนที่เหลือของโค้ด: setupSearch, setupLogout) ...
