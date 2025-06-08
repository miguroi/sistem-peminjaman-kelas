const API_BASE_URL = 'http://localhost:8080/api/v1';

let proposalsData = [];
let currentUser = null;
let currentPage = 1;
let pageSize = 10;

// Utility functions
const showError = (message) => {
    alert(`Error: ${message}`);
};

const showSuccess = (message) => {
    alert(`Success: ${message}`);
};

const formatErrorMessage = (errorData) => {
    let message = errorData.title || 'An error occurred';

    if (errorData.detail) {
        message = errorData.detail;
    }

    // Handle validation errors
    if (errorData.validation_errors && Array.isArray(errorData.validation_errors)) {
        const validationMessages = [];
        errorData.validation_errors.forEach(errorObj => {
            Object.keys(errorObj).forEach(field => {
                const fieldError = errorObj[field];
                if (fieldError.translation) {
                    validationMessages.push(`${field}: ${fieldError.translation}`);
                }
            });
        });

        if (validationMessages.length > 0) {
            message = validationMessages.join('\n');
        }
    }

    return message;
};

const makeApiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            window.location.href = 'login.html';
            return;
        }

        // Handle 201 Created with empty body
        if (response.status === 201) {
            const text = await response.text();
            if (!text || text.trim() === '') {
                return {}; // Return empty object for successful creation
            } else {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return {}; // Return empty object if JSON parsing fails
                }
            }
        }

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = formatErrorMessage(data);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Load user info
const loadUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        currentUser = JSON.parse(userInfo);
    } else {
        window.location.href = 'login.html';
    }
};

// Fetch proposals from API
const fetchProposals = async () => {
    try {
        const response = await makeApiCall(`/proposals?page=${currentPage}&size=${pageSize}`);
        proposalsData = response.proposals || [];
        displayProposals(proposalsData);
        updatePagination(response.pagination);
    } catch (error) {
        showError('Failed to fetch proposals: ' + error.message);
    }
};

// Display proposals in table
const displayProposals = (data) => {
    const tableBody = document.getElementById('peminjamanTableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center;">No data available in table</td>
        `;
        tableBody.appendChild(row);
    } else {
        data.forEach((proposal) => {
            const row = document.createElement('tr');

            let actionCell = '';
            if (currentUser.role === 'admin' && proposal.status === 'pending') {
                actionCell = `
                    <td>
                        <button onclick="showReplyForm('${proposal.id}')">Reply</button>
                        <button onclick="viewProposalDetail('${proposal.id}')">View Details</button>
                    </td>
                `;
            } else {
                actionCell = `
                    <td>
                        <button onclick="viewProposalDetail('${proposal.id}')">View Details</button>
                    </td>
                `;
            }

            const statusBadge = getStatusBadge(proposal.status);

            row.innerHTML = `
                <td>${proposal.purpose}</td>
                <td>${proposal.proposer_name}</td>
                <td>${statusBadge}</td>
                ${actionCell}
            `;
            tableBody.appendChild(row);
        });
    }
};

// Get status badge with color
const getStatusBadge = (status) => {
    const statusColors = {
        'pending': '#ffc107',
        'approved': '#28a745',
        'rejected': '#dc3545'
    };

    return `<span style="background-color: ${statusColors[status]}; color: white; padding: 2px 8px; border-radius: 4px;">${status.toUpperCase()}</span>`;
};

// Update pagination info
const updatePagination = (pagination) => {
    // You can implement pagination controls here if needed
    console.log('Pagination:', pagination);
};

// View proposal detail
const viewProposalDetail = async (proposalId) => {
    try {
        const response = await makeApiCall(`/proposals/${proposalId}`);
        const proposal = response.proposal;

        let detailHtml = `
            <h3>Proposal Details</h3>
            <p><strong>Purpose:</strong> ${proposal.purpose}</p>
            <p><strong>Course:</strong> ${proposal.course}</p>
            <p><strong>Class ID:</strong> ${proposal.class_id}</p>
            <p><strong>Lecturer:</strong> ${proposal.lecturer}</p>
            <p><strong>Start Time:</strong> ${new Date(proposal.starts_at).toLocaleString()}</p>
            <p><strong>End Time:</strong> ${new Date(proposal.ends_at).toLocaleString()}</p>
            <p><strong>Occupancy:</strong> ${proposal.occupancy}</p>
            <p><strong>Status:</strong> ${proposal.status}</p>
            <p><strong>Proposer:</strong> ${proposal.proposer_name}</p>
            <p><strong>Created:</strong> ${new Date(proposal.created_at).toLocaleString()}</p>
        `;

        if (proposal.note) {
            detailHtml += `<p><strong>Note:</strong> ${proposal.note}</p>`;
        }

        if (proposal.reply) {
            detailHtml += `
                <h4>Admin Reply</h4>
                <p><strong>Admin:</strong> ${proposal.reply.admin_name}</p>
                <p><strong>Decision:</strong> ${proposal.reply.is_approved ? 'APPROVED' : 'REJECTED'}</p>
            `;
            if (proposal.reply.room) {
                detailHtml += `<p><strong>Room:</strong> ${proposal.reply.room}</p>`;
            }
            if (proposal.reply.note) {
                detailHtml += `<p><strong>Admin Note:</strong> ${proposal.reply.note}</p>`;
            }
            detailHtml += `<p><strong>Reply Date:</strong> ${new Date(proposal.reply.created_at).toLocaleString()}</p>`;
        }

        // Simple modal display
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
            align-items: center; z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white; padding: 20px; border-radius: 8px; 
            max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
        `;

        modalContent.innerHTML = detailHtml + '<button onclick="this.closest(\'.modal\').remove()">Close</button>';
        modal.className = 'modal';
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

    } catch (error) {
        showError('Failed to fetch proposal details: ' + error.message);
    }
};

// Show reply form for admin
const showReplyForm = (proposalId) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
        align-items: center; z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; padding: 20px; border-radius: 8px; 
        max-width: 400px; width: 90%;
    `;

    modalContent.innerHTML = `
        <h3>Reply to Proposal</h3>
        <form id="replyForm">
            <label>
                <input type="radio" name="decision" value="approve" required> Approve
            </label><br>
            <label>
                <input type="radio" name="decision" value="reject" required> Reject
            </label><br><br>
            
            <label for="room">Room (required if approving):</label>
            <input type="text" id="room" name="room" placeholder="e.g., F2.1"><br><br>
            
            <label for="adminNote">Note:</label>
            <textarea id="adminNote" name="adminNote" rows="3" style="width: 100%;"></textarea><br><br>
            
            <button type="button" onclick="submitReply('${proposalId}')">Submit Reply</button>
            <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
        </form>
    `;

    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
};

// Submit admin reply
const submitReply = async (proposalId) => {
    const form = document.getElementById('replyForm');
    const formData = new FormData(form);
    const decision = formData.get('decision');
    const room = formData.get('room');
    const note = formData.get('adminNote');

    if (!decision) {
        showError('Please select approve or reject');
        return;
    }

    if (decision === 'approve' && !room) {
        showError('Room is required when approving a proposal');
        return;
    }

    const replyData = {
        is_approved: decision === 'approve',
        note: note || null
    };

    if (decision === 'approve') {
        replyData.room = room;
    }

    try {
        await makeApiCall(`/proposals/${proposalId}/replies`, 'POST', replyData);
        showSuccess('Reply submitted successfully');
        document.querySelector('.modal').remove();
        fetchProposals(); // Refresh the list
    } catch (error) {
        showError('Failed to submit reply: ' + error.message);
    }
};

// Toggle form visibility (only for students)
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

// Submit new proposal
const submitProposal = async () => {
    const kelas = document.getElementById('kelas').value;
    const tujuan = document.getElementById('tujuan').value;
    const mataKuliah = document.getElementById('mataKuliah').value;
    const dosenPengampu = document.getElementById('dosenPengampu').value;
    const tanggal = document.getElementById('tanggal').value;
    const jamMulai = document.getElementById('jamMulai').value;
    const jamSelesai = document.getElementById('jamSelesai').value;
    const kapasitas = document.getElementById('kapasitas').value;
    const catatanTambahan = document.getElementById('catatanTambahan').value;

    // Validate required fields
    if (!kelas || !tujuan || !mataKuliah || !dosenPengampu || !tanggal || !jamMulai || !jamSelesai || !kapasitas) {
        showError('Please fill in all required fields');
        return;
    }

    // Combine date and time for starts_at and ends_at
    const startsAt = new Date(`${tanggal}T${jamMulai}:00`);
    const endsAt = new Date(`${tanggal}T${jamSelesai}:00`);

    // Validate that end time is after start time
    if (endsAt <= startsAt) {
        showError('End time must be after start time');
        return;
    }

    const proposalData = {
        purpose: tujuan,
        course: mataKuliah,
        class_id: kelas,
        lecturer: dosenPengampu,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        occupancy: parseInt(kapasitas),
        note: catatanTambahan || null
    };

    try {
        await makeApiCall('/proposals', 'POST', proposalData);
        showSuccess('Proposal submitted successfully');

        // Reset form and switch view
        document.getElementById('peminjamanFormElement').reset();
        document.getElementById('peminjamanForm').style.display = 'none';
        document.getElementById('dataPeminjaman').style.display = 'block';

        // Refresh proposals list
        fetchProposals();
    } catch (error) {
        showError('Failed to submit proposal: ' + error.message);
    }
};

// Filter proposals by status (for admin)
function filterProposals() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;

    const statusValue = statusFilter.value;
    const filteredData = statusValue ?
      proposalsData.filter(proposal => proposal.status === statusValue) :
      proposalsData;
    displayProposals(filteredData);
}

// Logout function
const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'login.html';
};

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load user info and check authentication
    loadUserInfo();

    // Load initial data
    fetchProposals();

    // Set up event listeners only if elements exist
    const tambahButton = document.getElementById('tambahPeminjaman');
    if (tambahButton) {
        tambahButton.addEventListener('click', tambahPeminjaman);
    }

    const submitButton = document.getElementById('submitPeminjaman');
    if (submitButton) {
        submitButton.addEventListener('click', submitProposal);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Update page title based on user role
    if (currentUser) {
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle && currentUser.role === 'admin') {
            pageTitle.textContent = 'Admin Dashboard - Proposal Management';
        }
    }
});

// Update the current date
const updateCurrentDate = () => {
    const dateElement = document.querySelector('.page-date');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

// Call on page load
updateCurrentDate();
