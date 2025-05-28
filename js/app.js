let peminjamanDataArray = [];
let userRole = localStorage.getItem('userRole') || 'user';

const fetchData = async () => {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        peminjamanDataArray = data;
        displayPeminjaman(peminjamanDataArray);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
};

const displayPeminjaman = (data) => {
    const tableBody = document.getElementById('peminjamanTableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" style="text-align: center;">No data available in table</td>
        `;
        tableBody.appendChild(row);
    } else {
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            let statusCell = `
                <td>${item.status}</td>
            `;

            if (userRole === 'admin') {
                statusCell = `
                    <td>
                        ${item.status}
                        <button onclick="approvePeminjaman(${index})">Approve</button>
                        <button onclick="unapprovePeminjaman(${index})">Unapprove</button>
                    </td>
                `;
            }

            row.innerHTML = `
                <td>${item.tujuan}</td>
                ${statusCell}
                <td>${item.tanggal} ${item.jamPeminjaman}</td>
            `;
            tableBody.appendChild(row);
        });
    }
};

const tambahPeminjaman = () => {
    const form = document.getElementById('peminjamanForm');
    const dataSection = document.getElementById('dataPeminjaman');

    if (form.style.display === 'none') {
        form.style.display = 'block';
        dataSection.style.display = 'none';
    } else {
        form.style.display = 'none';
        dataSection.style.display = 'block';
    }
};

const addPeminjamanData = (peminjamanData) => {
    peminjamanDataArray.push(peminjamanData);
    displayPeminjaman(peminjamanDataArray);
};

const approvePeminjaman = (index) => {
    peminjamanDataArray[index].status = 'approved';
    displayPeminjaman(peminjamanDataArray);
    saveDataToJSON();
};

const unapprovePeminjaman = (index) => {
    peminjamanDataArray[index].status = 'unapproved';
    displayPeminjaman(peminjamanDataArray);
    saveDataToJSON();
};

const saveDataToJSON = () => {
    const dataStr = JSON.stringify(peminjamanDataArray);
    localStorage.setItem('peminjamanData', dataStr);
};

const loadDataFromJSON = () => {
    const dataStr = localStorage.getItem('peminjamanData');
    if (dataStr) {
        peminjamanDataArray = JSON.parse(dataStr);
        displayPeminjaman(peminjamanDataArray);
    }
};

document.getElementById('tambahPeminjaman').addEventListener('click', tambahPeminjaman);

document.getElementById('submitPeminjaman').addEventListener('click', function() {
    const namaLengkap = document.getElementById('namaLengkap').value;
    const programStudi = document.getElementById('programStudi').value;
    const kelas = document.getElementById('kelas').value;
    const tujuan = document.getElementById('tujuan').value;
    const mataKuliah = document.getElementById('mataKuliah').value;
    const dosenPengampu = document.getElementById('dosenPengampu').value;
    const tanggal = document.getElementById('tanggal').value;
    const jamPeminjaman = document.getElementById('jamPeminjaman').value;
    const kapasitas = document.getElementById('kapasitas').value;
    const catatanTambahan = document.getElementById('catatanTambahan').value;

    const peminjamanData = {
        namaLengkap,
        programStudi,
        kelas,
        tujuan,
        mataKuliah,
        dosenPengampu,
        tanggal,
        jamPeminjaman,
        kapasitas,
        catatanTambahan,
        status: 'waiting'
    };

    addPeminjamanData(peminjamanData);
    saveDataToJSON();

    document.getElementById('peminjamanFormElement').reset();
    document.getElementById('peminjamanForm').style.display = 'none';
    document.getElementById('dataPeminjaman').style.display = 'block';
});

document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem('userRole');
    window.location.href = 'login.html'; 
});


window.onload = loadDataFromJSON;

