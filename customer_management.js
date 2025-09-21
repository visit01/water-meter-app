// customer_management.js

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

let customers = [];
let agencies = {};
let currentAgencyId = null;

// ==========================================================
// ส่วนที่ 1: การจัดการสถานะผู้ใช้และการโหลดข้อมูลเริ่มต้น
// ==========================================================

auth.onAuthStateChanged(async user => {
    if (user) {
        // ตรวจสอบบทบาทของผู้ใช้
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            currentAgencyId = userDoc.data().agencyId;
            if (currentAgencyId) {
                // โหลดข้อมูลหน่วยงานทั้งหมดสำหรับ dropdown และข้อมูลลูกค้า
                await fetchAgencies();
                await fetchCustomers();
                setupEventListeners();
            } else {
                console.error("Admin user does not have an agencyId.");
                alert("บัญชีผู้ดูแลระบบไม่มีสังกัดหน่วยงาน กรุณาติดต่อผู้ดูแลระบบสูงสุด");
                auth.signOut();
            }
        } else {
            console.error("User is not an admin.");
            auth.signOut();
        }
    } else {
        window.location.href = "admin-login.html";
    }
});

async function fetchAgencies() {
    try {
        const snapshot = await db.collection('agencies').get();
        snapshot.docs.forEach(doc => {
            agencies[doc.id] = doc.data().agencyName;
        });
        populateAgencyDropdown();
    } catch (error) {
        console.error("Error fetching agencies:", error);
    }
}

function populateAgencyDropdown() {
    const select = document.getElementById('agencySelect');
    select.innerHTML = '';
    
    // เรียงลำดับ dropdown ตามชื่อ agency
    const sortedAgencyIds = Object.keys(agencies).sort((a, b) => agencies[a].localeCompare(agencies[b], 'th'));

    sortedAgencyIds.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = agencies[id];
        select.appendChild(option);
    });
    
    // ตั้งค่า dropdown ให้เลือก agency ของ admin ที่ล็อกอินอยู่เป็นค่าเริ่มต้น
    if (currentAgencyId) {
        select.value = currentAgencyId;
    }
}

async function fetchCustomers() {
    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">กำลังโหลดข้อมูล...</td></tr>';

    try {
        const snapshot = await db.collection('customers').where('agencyId', '==', currentAgencyId).get();
        customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayCustomers(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</td></tr>';
    }
}

function displayCustomers(customerArray) {
    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = '';
    if (customerArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">ไม่พบข้อมูลลูกค้า</td></tr>';
    }

    customerArray.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.address}</td>
            <td>${customer.meterNumber}</td>
            <td>${customer.lastReading || 0}</td>
            <td>${agencies[customer.agencyId] || 'ไม่ระบุ'}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-id="${customer.id}" data-bs-toggle="modal" data-bs-target="#customerModal">แก้ไข</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${customer.id}">ลบ</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================================
// ส่วนที่ 2: การจัดการฟอร์มและ Events
// ==========================================================

function setupEventListeners() {
    const customerForm = document.getElementById('customerForm');
    const modalTitle = document.getElementById('customerModalLabel');
    const customerIdInput = document.getElementById('customerId');
    const addNewBtn = document.getElementById('addNewBtn');

    // เปิด Modal สำหรับเพิ่มลูกค้าใหม่
    addNewBtn.addEventListener('click', () => {
        modalTitle.textContent = 'เพิ่มลูกค้าใหม่';
        customerForm.reset();
        customerIdInput.value = '';
        document.getElementById('agencySelect').value = currentAgencyId; // ตั้งค่าเริ่มต้น
    });

    // Event สำหรับการส่งฟอร์ม (เพิ่ม/แก้ไข)
    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const customerData = {
            agencyId: document.getElementById('agencySelect').value,
            name: document.getElementById('customerName').value,
            address: document.getElementById('customerAddress').value,
            meterNumber: document.getElementById('meterNumber').value,
            lastReading: parseFloat(document.getElementById('lastReading').value) || 0,
            location: new firebase.firestore.GeoPoint(0, 0) // ค่าเริ่มต้น
        };

        const id = customerIdInput.value;
        try {
            if (id) {
                // แก้ไขข้อมูล
                await db.collection('customers').doc(id).update(customerData);
                alert('แก้ไขข้อมูลลูกค้าสำเร็จ!');
            } else {
                // เพิ่มข้อมูลใหม่
                await db.collection('customers').add(customerData);
                alert('เพิ่มลูกค้าใหม่สำเร็จ!');
            }
            // ปิด Modal และโหลดข้อมูลใหม่
            const modal = bootstrap.Modal.getInstance(document.getElementById('customerModal'));
            modal.hide();
            fetchCustomers();
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
        }
    });

    // Event สำหรับปุ่ม "แก้ไข" (ใช้ Event Delegation)
    document.getElementById('customersTableBody').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            const customerToEdit = customers.find(c => c.id === id);
            if (customerToEdit) {
                modalTitle.textContent = 'แก้ไขข้อมูลลูกค้า';
                customerIdInput.value = customerToEdit.id;
                document.getElementById('agencySelect').value = customerToEdit.agencyId;
                document.getElementById('customerName').value = customerToEdit.name;
                document.getElementById('customerAddress').value = customerToEdit.address;
                document.getElementById('meterNumber').value = customerToEdit.meterNumber;
                document.getElementById('lastReading').value = customerToEdit.lastReading;
            }
        }
    });
    
    // Event สำหรับปุ่ม "ลบ" (ใช้ Event Delegation)
    document.getElementById('customersTableBody').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้ารายนี้?')) {
                try {
                    await db.collection('customers').doc(id).delete();
                    alert('ลบลูกค้าสำเร็จ!');
                    fetchCustomers();
                } catch (error) {
                    console.error("Error deleting customer:", error);
                    alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
                }
            }
        }
    });

    // Event สำหรับแถบค้นหา
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCustomers = customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) || 
            customer.meterNumber.toLowerCase().includes(searchTerm) ||
            customer.address.toLowerCase().includes(searchTerm)
        );
        displayCustomers(filteredCustomers);
    });

    // Event สำหรับปุ่มออกจากระบบ
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = "admin-login.html";
        });
    });
}
