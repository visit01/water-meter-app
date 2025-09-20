// dashboard.js

// Firebase config and initialization (copy and paste your config here)
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

// --- All function definitions go here, before onAuthStateChanged ---

// Function to set up the logout button
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

// Function to display customer data
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

// Function to fetch customers from Firestore
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

// Function to handle search
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

// --- Now, onAuthStateChanged can safely call the functions ---

auth.onAuthStateChanged(user => {
    if (user) {
        fetchCustomers();
        setupLogout();
    } else {
        window.location.href = "index.html";
    }
});
