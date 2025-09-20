// ต้องเชื่อมต่อ Firebase SDK ในไฟล์ HTML ก่อน
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"></script>

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
const db = firebase.firestore();
const storage = firebase.storage();

let customerId = null;
let loggedInUser = null;
let lastReadingValue = 0;

// ==========================================================
// ส่วนที่ 1: การจัดการสถานะผู้ใช้และดึงข้อมูลลูกค้า
// ==========================================================

// ตรวจสอบสถานะการล็อกอินของผู้ใช้เมื่อโหลดหน้าเว็บ
auth.onAuthStateChanged(user => {
    if (user) {
        loggedInUser = user;
        const params = new URLSearchParams(window.location.search);
        customerId = params.get('customerId');
        
        if (customerId) {
            fetchCustomerData(customerId);
        } else {
            document.getElementById('statusMessage').textContent = 'ไม่พบข้อมูลลูกค้า';
        }
        setupLogout();
    } else {
        window.location.href = "index.html";
    }
});

// ฟังก์ชันสำหรับดึงข้อมูลลูกค้าจาก Firestore
async function fetchCustomerData(id) {
    try {
        const docRef = db.collection("customers").doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            lastReadingValue = data.lastReading;

            document.getElementById('customerName').textContent = data.name;
            document.getElementById('customerAddress').textContent = data.address;
            document.getElementById('meterNumber').textContent = data.meterNumber;
            document.getElementById('lastReading').textContent = data.lastReading;
        } else {
            document.getElementById('statusMessage').textContent = 'ไม่พบข้อมูลลูกค้า';
        }
    } catch (error) {
        console.error("Error fetching customer data:", error);
        document.getElementById('statusMessage').textContent = 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า';
    }
}

// ==========================================================
// ส่วนที่ 2: การจัดการฟอร์มและบันทึกข้อมูล
// ==========================================================

const readingForm = document.getElementById('readingForm');
readingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('statusMessage').style.color = 'black';
    document.getElementById('statusMessage').textContent = 'กำลังบันทึกข้อมูล...';

    const currentReadingInput = document.getElementById('currentReading');
    const meterPhotoInput = document.getElementById('meterPhoto');
    const currentReading = parseFloat(currentReadingInput.value);
    const photoFile = meterPhotoInput.files[0];

    // ตรวจสอบความถูกต้องของเลขมิเตอร์
    if (currentReading <= lastReadingValue) {
        document.getElementById('statusMessage').style.color = 'red';
        document.getElementById('statusMessage').textContent = 'เลขมิเตอร์ใหม่ต้องมากกว่าครั้งล่าสุด';
        return;
    }

    try {
        // อัปโหลดรูปภาพไปยัง Cloud Storage
        const storageRef = storage.ref();
        const photoPath = `readings/${customerId}/${Date.now()}-${photoFile.name}`;
        const photoRef = storageRef.child(photoPath);
        await photoRef.put(photoFile);
        const photoURL = await photoRef.getDownloadURL();

        // บันทึกข้อมูลการจดมิเตอร์ลง Firestore
        await db.collection("readings").add({
            customerId: customerId,
            meterNumber: document.getElementById('meterNumber').textContent,
            currentReading: currentReading,
            previousReading: lastReadingValue,
            readingDate: firebase.firestore.FieldValue.serverTimestamp(),
            readingBy: loggedInUser.uid,
            photoURL: photoURL
        });

        // อัปเดตเลขมิเตอร์ล่าสุดใน Collection 'customers'
        await db.collection("customers").doc(customerId).update({
            lastReading: currentReading
        });

        document.getElementById('statusMessage').style.color = 'green';
        document.getElementById('statusMessage').textContent = 'บันทึกข้อมูลสำเร็จ!';
        
        // ล้างฟอร์ม
        readingForm.reset();
        
    } catch (error) {
        console.error("Error saving data:", error);
        document.getElementById('statusMessage').style.color = 'red';
        document.getElementById('statusMessage').textContent = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message;
    }
});

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
