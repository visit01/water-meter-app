// reading.js

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
const storage = firebase.storage();

let customerId = null;
let loggedInUser = null;
let lastReadingValue = 0;
let lastMeterNumber = null;
let userAgencyId = null;

// ==========================================================
// ส่วนที่ 1: การจัดการสถานะผู้ใช้และดึงข้อมูลลูกค้า
// ==========================================================

auth.onAuthStateChanged(async user => {
    if (user) {
        loggedInUser = user;
        document.getElementById('userEmail').textContent = loggedInUser.email;
        
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            userAgencyId = userDoc.data().agencyId;
            document.getElementById('userName').textContent = userDoc.data().name || 'ไม่ระบุชื่อ';
        }

        const params = new URLSearchParams(window.location.search);
        customerId = params.get('customerId');
        
        if (customerId && userAgencyId) {
            fetchCustomerData(customerId);
        } else {
            document.getElementById('statusMessage').textContent = 'ไม่พบข้อมูลลูกค้า หรือไม่มีสังกัดหน่วยงาน';
        }
        setupLogout();
        setupVoiceInput();
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

async function fetchCustomerData(id) {
    try {
        const docRef = await db.collection("customers").doc(id).get();
        if (docRef.exists && docRef.data().agencyId === userAgencyId) {
            const data = docRef.data();
            lastReadingValue = data.lastReading || 0;
            lastMeterNumber = data.meterNumber;
            document.getElementById('customerName').textContent = data.name;
            document.getElementById('customerAddress').textContent = data.address;
            document.getElementById('meterNumber').textContent = data.meterNumber;
            document.getElementById('lastReading').textContent = data.lastReading || 0;
        } else {
            document.getElementById('statusMessage').textContent = 'ไม่พบข้อมูลลูกค้า หรือไม่มีสังกัดหน่วยงาน';
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

    // ตรวจสอบค่าของ agencyId ก่อนบันทึก
    if (!loggedInUser || !loggedInUser.uid || !userAgencyId) {
        document.getElementById('statusMessage').style.color = 'red';
        document.getElementById('statusMessage').textContent = 'ข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้หรือสังกัดหน่วยงาน';
        console.error("No user data or agencyId found.");
        return;
    }

    if (!photoFile) {
        document.getElementById('statusMessage').style.color = 'red';
        document.getElementById('statusMessage').textContent = 'กรุณาอัปโหลดรูปภาพ';
        return;
    }

    if (currentReading <= lastReadingValue) {
        document.getElementById('statusMessage').style.color = 'red';
        document.getElementById('statusMessage').textContent = `เลขมิเตอร์ใหม่ต้องมากกว่าครั้งล่าสุด (${lastReadingValue})`;
        return;
    }

    try {
        const storageRef = storage.ref();
        const photoPath = `readings/${customerId}/${Date.now()}-${photoFile.name}`;
        const photoRef = storageRef.child(photoPath);
        await photoRef.put(photoFile);
        const photoURL = await photoRef.getDownloadURL();

        await db.collection("readings").add({
            customerId: customerId,
            meterNumber: lastMeterNumber,
            currentReading: currentReading,
            previousReading: lastReadingValue,
            readingDate: firebase.firestore.FieldValue.serverTimestamp(),
            readingBy: loggedInUser.uid, 
            photoURL: photoURL,
            agencyId: userAgencyId // บันทึก agencyId ลงใน readings collection
        });

        await db.collection("customers").doc(customerId).update({
            lastReading: currentReading
        });

        document.getElementById('statusMessage').style.color = 'green';
        document.getElementById('statusMessage').textContent = 'บันทึกข้อมูลสำเร็จ!';
        
        readingForm.reset();
        
    } catch (error) {
        console.error("Error saving data:", error);
        document.getElementById('statusMessage').style.color = 'red';
        document.getElementById('statusMessage').textContent = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message;
    }
});

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
// ส่วนที่ 3: ฟังก์ชันการป้อนตัวเลขด้วยเสียง (Web Speech API)
// ==========================================================
function setupVoiceInput() {
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    const currentReadingInput = document.getElementById('currentReading');
    const voiceStatus = document.getElementById('voiceStatus');

    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'th-TH';
        recognition.onstart = () => {
            voiceStatus.classList.remove('d-none');
            voiceStatus.textContent = 'กำลังฟัง... โปรดพูดตัวเลข';
            voiceInputBtn.disabled = true;
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const numbers = transcript.match(/\d+/g);
            
            if (numbers) {
                currentReadingInput.value = numbers.join('');
            } else {
                currentReadingInput.value = '';
            }
            voiceStatus.textContent = '';
        };

        recognition.onend = () => {
            voiceStatus.classList.add('d-none');
            voiceInputBtn.disabled = false;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceStatus.textContent = 'เกิดข้อผิดพลาด: ' + event.error;
            voiceInputBtn.disabled = false;
        };

        voiceInputBtn.addEventListener('click', () => {
            recognition.start();
        });

    } else {
        voiceInputBtn.style.display = 'none';
        console.warn('Web Speech API is not supported in this browser.');
    }
}
