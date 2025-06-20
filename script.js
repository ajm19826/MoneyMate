    // Your Firebase config - replace with your own config!
    const firebaseConfig = {
      apiKey: "AIzaSyBAcBB3TLtMARRiZtx9LWk2cvjBGhvMmHs",
      authDomain: "contractcenterllc-a03b8.firebaseapp.com",
      projectId: "contractcenterllc-a03b8",
      storageBucket: "contractcenterllc-a03b8.appspot.com",
      messagingSenderId: "81369682933",
      appId: "1:81369682933:web:80abc059816096234086bc",
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- UI Elements ---
    const sidebarItems = document.querySelectorAll('.sidebar ul li[data-section]');
    const sections = document.querySelectorAll('.content-section');
    const sectionTitle = document.getElementById('sectionTitle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutBtn = document.getElementById('logoutBtn');

    const addRecordBtn = document.getElementById('addRecordBtn');
    const recordModal = document.getElementById('recordModal');
    const closeRecordModalBtn = document.getElementById('closeRecordModal');

    const recordDate = document.getElementById('recordDate');
    const recordType = document.getElementById('recordType');
    const recordDesc = document.getElementById('recordDesc');
    const recordAmount = document.getElementById('recordAmount');
    const saveRecordBtn = document.getElementById('saveRecordBtn');

    const authModal = document.getElementById('authModal');
    const closeAuthModalBtn = document.getElementById('closeAuthModal');
    const authTitle = document.getElementById('authTitle');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authActionBtn = document.getElementById('authActionBtn');
    const toggleAuthText = document.getElementById('toggleAuthText');
    const toggleAuthLink = document.getElementById('toggleAuthLink');

    // Data
    let records = [];
    let editingRecordId = null;
    let currentUser = null;

    // --- Functions ---

    // Navigation handler
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        showSection(item.getAttribute('data-section'));
      });
    });

    function showSection(section) {
      sections.forEach(sec => (sec.style.display = 'none'));
      switch (section) {
        case 'home':
          document.getElementById('homeSection').style.display = 'block';
          sectionTitle.textContent = 'Finance Overview';
          break;
        case 'bills':
          document.getElementById('billsSection').style.display = 'block';
          sectionTitle.textContent = 'Bills';
          break;
        case 'income':
          document.getElementById('incomeSection').style.display = 'block';
          sectionTitle.textContent = 'Income';
          break;
        case 'expenses':
          document.getElementById('expensesSection').style.display = 'block';
          sectionTitle.textContent = 'Expenses';
          break;
        case 'records':
          document.getElementById('recordsSection').style.display = 'block';
          sectionTitle.textContent = 'All Records';
          break;
      }
      renderTables();
    }

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
    });

    // Modal open/close handlers
    addRecordBtn.addEventListener('click', () => {
      openRecordModal();
    });
    closeRecordModalBtn.addEventListener('click', () => {
      closeRecordModal();
    });

    function openRecordModal(record = null) {
      recordModal.classList.add('active');
      if (record) {
        editingRecordId = record.id;
        recordDate.value = record.date;
        recordType.value = record.type;
        recordDesc.value = record.description;
        recordAmount.value = record.amount;
        document.getElementById('recordModalTitle').textContent = 'Edit Record';
      } else {
        editingRecordId = null;
        recordDate.value = '';
        recordType.value = 'Income';
        recordDesc.value = '';
        recordAmount.value = '';
        document.getElementById('recordModalTitle').textContent = 'Add New Record';
      }
    }
    function closeRecordModal() {
      recordModal.classList.remove('active');
      clearRecordInputs();
    }
    function clearRecordInputs() {
      recordDate.value = '';
      recordType.value = 'Income';
      recordDesc.value = '';
      recordAmount.value = '';
      editingRecordId = null;
    }

    // Add or update record in Firestore
    saveRecordBtn.addEventListener('click', async () => {
      const date = recordDate.value;
      const type = recordType.value;
      const description = recordDesc.value.trim();
      const amount = parseFloat(recordAmount.value);

      if (!date || !description || isNaN(amount)) {
        alert('Please fill all fields correctly.');
        return;
      }

      try {
        if (editingRecordId) {
          // Update existing
          await db
            .collection('users')
            .doc(currentUser.uid)
            .collection('records')
            .doc(editingRecordId)
            .set({ date, type, description, amount });
        } else {
          // Add new
          await db
            .collection('users')
            .doc(currentUser.uid)
            .collection('records')
            .add({ date, type, description, amount });
        }
        closeRecordModal();
        loadRecords();
      } catch (error) {
        alert('Error saving record: ' + error.message);
      }
    });

    // Delete record
    async function deleteRecord(id) {
      if (!confirm('Are you sure you want to delete this record?')) return;
      try {
        await db
          .collection('users')
          .doc(currentUser.uid)
          .collection('records')
          .doc(id)
          .delete();
        loadRecords();
      } catch (error) {
        alert('Error deleting record: ' + error.message);
      }
    }

    // Load records from Firestore
    async function loadRecords() {
      if (!currentUser) return;
      const snapshot = await db
        .collection('users')
        .doc(currentUser.uid)
        .collection('records')
        .orderBy('date', 'desc')
        .get();
      records = snapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });
      renderTables();
      updateStats();
      updateChart();
    }

    // Render tables filtered by type and search
    function renderTables() {
      const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

      function renderTableBody(tbodyId, filterType) {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        const filtered = records.filter(
          r =>
            (filterType === 'All' || r.type === filterType) &&
            (r.description.toLowerCase().includes(searchTerm) || r.date.includes(searchTerm))
        );
        filtered.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.date}</td>
            <td>${r.type}</td>
            <td>${r.description}</td>
            <td>$${r.amount.toFixed(2)}</td>
            <td>
              <button class="delete-btn" onclick="deleteRecord('${r.id}')"><i class="fas fa-trash"></i></button>
              <button onclick="openRecordModal(${JSON.stringify(r).replace(/"/g, '&quot;')})"><i class="fas fa-edit"></i></button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      renderTableBody('recordsBody', 'All');
      renderTableBody('billsBody', 'Bill');
      renderTableBody('incomeBody', 'Income');
      renderTableBody('expensesBody', 'Expense');
    }

    // Update total income, expenses, balance
    function updateStats() {
      const income = records.filter(r => r.type === 'Income').reduce((sum, r) => sum + r.amount, 0);
      const expenses = records.filter(r => r.type === 'Expense' || r.type === 'Bill').reduce((sum, r) => sum + r.amount, 0);
      const balance = income - expenses;

      document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
      document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
      document.getElementById('balance').textContent = `$${balance.toFixed(2)}`;
    }

    // Chart.js setup
    let financeChart = null;

    function updateChart() {
      if (!financeChart) {
        const ctx = document.getElementById('financeChart').getContext('2d');
        financeChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
              label: 'Finance Breakdown',
              data: [0, 0],
              backgroundColor: ['#1abc9c', '#e74c3c'],
              hoverOffset: 30
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: { enabled: true }
            }
          }
        });
      }
      const income = records.filter(r => r.type === 'Income').reduce((sum, r) => sum + r.amount, 0);
      const expenses = records.filter(r => r.type === 'Expense' || r.type === 'Bill').reduce((sum, r) => sum + r.amount, 0);
      financeChart.data.datasets[0].data = [income, expenses];
      financeChart.update();
    }

    // Export data to JSON file
    document.getElementById('exportBtn').addEventListener('click', () => {
      if (!records.length) {
        alert('No records to export!');
        return;
      }
      const dataStr = JSON.stringify(records);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MoneyMate_Records_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import data from JSON file and save to Firestore
    document.getElementById('importFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const importedRecords = JSON.parse(text);
        if (!Array.isArray(importedRecords)) throw new Error('Invalid data format');
        const batch = db.batch();
        importedRecords.forEach(r => {
          const docRef = db.collection('users').doc(currentUser.uid).collection('records').doc();
          batch.set(docRef, r);
        });
        await batch.commit();
        alert('Data imported successfully!');
        loadRecords();
      } catch (error) {
        alert('Failed to import data: ' + error.message);
      }
      e.target.value = ''; // reset input
    });

    // Search filter
    document.getElementById('searchInput').addEventListener('input', () => {
      renderTables();
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
      auth.signOut();
    });

    // Auth modal toggle
    let isLogin = true;

    function openAuthModal() {
      authModal.classList.add('active');
      resetAuthForm();
    }
    function closeAuthModal() {
      authModal.classList.remove('active');
    }
    function resetAuthForm() {
      authEmail.value = '';
      authPassword.value = '';
      isLogin = true;
      authTitle.textContent = 'Login';
      authActionBtn.textContent = 'Login';
      toggleAuthText.textContent = "Don't have an account?";
      toggleAuthLink.textContent = 'Register here';
    }

    toggleAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      if (isLogin) {
        authTitle.textContent = 'Login';
        authActionBtn.textContent = 'Login';
        toggleAuthText.textContent = "Don't have an account?";
        toggleAuthLink.textContent = 'Register here';
      } else {
        authTitle.textContent = 'Register';
        authActionBtn.textContent = 'Register';
        toggleAuthText.textContent = 'Already have an account?';
        toggleAuthLink.textContent = 'Login here';
      }
    });

    authActionBtn.addEventListener('click', () => {
      const email = authEmail.value.trim();
      const password = authPassword.value.trim();

      if (!email || !password) {
        alert('Please fill in both fields.');
        return;
      }

      if (isLogin) {
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            closeAuthModal();
          })
          .catch(err => alert(err.message));
      } else {
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            alert('Registration successful! Please login now.');
            isLogin = true;
            resetAuthForm();
          })
          .catch(err => alert(err.message));
      }
    });

    closeAuthModalBtn.addEventListener('click', closeAuthModal);

    // Auth state listener
    auth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        document.querySelector('.sidebar').style.display = 'flex';
        document.querySelector('.main').style.display = 'flex';
        closeAuthModal();
        loadRecords();
      } else {
        currentUser = null;
        document.querySelector('.sidebar').style.display = 'none';
        document.querySelector('.main').style.display = 'none';
        openAuthModal();
      }
    });

    // Expose these for inline HTML event handlers
    window.deleteRecord = deleteRecord;
    window.openRecordModal = openRecordModal;

    // Initialize with home section visible
    showSection('home');