const fetchData = async () => {
    try {
	const response = await fetch('data.json');
	if (!response.ok) {
	    throw new Error('Network response was not ok');
	}
	const data = await response.json();
	displayPeminjaman(data);
    }
	catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

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
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.peminjaman}</td>
                <td>${item.status}</td>
                <td>${item.tglPeminjaman}</td>
            `;
            tableBody.appendChild(row);
        });
    }
};

const tambahPeminjaman = () => {
    alert('Fitur tambah peminjaman akan segera hadir!');
};

document.getElementById('tambahPeminjaman').addEventListener('click', tambahPeminjaman);

fetchData();
