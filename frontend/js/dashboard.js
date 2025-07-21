document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://galgotias-university-certificate.onrender.com/api';
    
    // DOM Elements
    const certificatesTableBody = document.getElementById('certificatesTableBody');
    const searchInput = document.getElementById('searchInput');
    const refreshButton = document.getElementById('refreshButton');
    
    // Modal Elements
    const detailsModal = document.getElementById('detailsModal');
    const updateModal = document.getElementById('updateModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const detailsCloseButton = document.getElementById('detailsCloseButton');
    const updateCloseButton = document.getElementById('updateCloseButton');
    const deleteCloseButton = document.getElementById('deleteCloseButton');
    const updateCertificateBtn = document.getElementById('updateCertificateBtn');
    const deleteCertificateBtn = document.getElementById('deleteCertificateBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const updateCancelBtn = document.getElementById('updateCancelBtn');
    
    // Form Elements
    const updateCertificateForm = document.getElementById('updateCertificateForm');
    
    // Variables to store current certificate data
    let currentCertificates = [];
    let currentCertificate = null;
    
    // Pagination variables
    const certificatesPerPage = 10;
    let currentPage = 1;
    
    // ===== Functions =====
    
    // Fetch all certificates
    async function fetchCertificates() {
        try {
            certificatesTableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="5" class="loading-message">Loading certificates...</td>
                </tr>
            `;
            
            const response = await fetch(`${API_BASE_URL}/certificate/all`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch certificates');
            }
            
            currentCertificates = result;
            renderCertificates();
            
        } catch (error) {
            console.error('Error fetching certificates:', error);
            certificatesTableBody.innerHTML = `
                <tr class="error-row">
                    <td colspan="5" class="error-message">Error loading certificates. ${error.message}</td>
                </tr>
            `;
        }
    }
    
    // Render certificates in the table
    function renderCertificates() {
        if (!currentCertificates || currentCertificates.length === 0) {
            certificatesTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5" class="empty-message">No certificates found.</td>
                </tr>
            `;
            return;
        }
        
        // Filter certificates based on search term
        const searchTerm = searchInput.value.toLowerCase();
        const filteredCertificates = currentCertificates.filter(cert => 
            cert.fullName.toLowerCase().includes(searchTerm) || 
            cert.admissionNumber.toLowerCase().includes(searchTerm)
        );
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredCertificates.length / certificatesPerPage);
        const startIndex = (currentPage - 1) * certificatesPerPage;
        const endIndex = startIndex + certificatesPerPage;
        const paginatedCertificates = filteredCertificates.slice(startIndex, endIndex);
        
        // Generate table rows
        let tableHtml = '';
        paginatedCertificates.forEach(cert => {
            tableHtml += `
                <tr data-id="${cert._id}">
                    <td>${cert.fullName}</td>
                    <td>${cert.course}</td>
                    <td>${cert.admissionNumber}</td>
                    <td>${cert.section}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn details-btn" data-id="${cert._id}">Details</button>
                            <button class="action-btn update-btn" data-id="${cert._id}">Update</button>
                            <button class="action-btn delete-btn" data-id="${cert._id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        certificatesTableBody.innerHTML = tableHtml;
        
        // Generate pagination controls
        renderPagination(totalPages);
        
        // Add event listeners to the buttons
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', () => showCertificateDetails(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', () => showUpdateForm(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => showDeleteConfirmation(btn.getAttribute('data-id')));
        });
    }
    
    // Render pagination controls
    function renderPagination(totalPages) {
        const paginationControls = document.getElementById('paginationControls');
        if (!paginationControls) return;
        
        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }
        
        let paginationHtml = '';
        
        // Previous button
        paginationHtml += `
            <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
                &laquo; Prev
            </button>
        `;
        
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `
                <button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHtml += `
            <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
                Next &raquo;
            </button>
        `;
        
        paginationControls.innerHTML = paginationHtml;
        
        // Add event listeners to pagination buttons
        document.querySelectorAll('.page-btn').forEach(btn => {
            if (btn.classList.contains('prev-btn')) {
                btn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderCertificates();
                    }
                });
            } else if (btn.classList.contains('next-btn')) {
                btn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderCertificates();
                    }
                });
            } else {
                btn.addEventListener('click', () => {
                    currentPage = parseInt(btn.getAttribute('data-page'));
                    renderCertificates();
                });
            }
        });
    }
    
    // Show certificate details in modal
    function showCertificateDetails(certificateId) {
        currentCertificate = currentCertificates.find(cert => cert._id === certificateId);
        
        if (!currentCertificate) return;
        
        const certificateDetails = document.getElementById('certificateDetails');
        
        // Format the date of birth and issue date
        const dobDate = new Date(currentCertificate.dob).toLocaleDateString();
        const issueDateFormatted = new Date(currentCertificate.issueDate).toLocaleDateString();
        
        certificateDetails.innerHTML = `
            <dl>
                <dt>ID</dt>
                <dd>${currentCertificate._id}</dd>
                
                <dt>Full Name</dt>
                <dd>${currentCertificate.fullName}</dd>
                
                <dt>Mobile</dt>
                <dd>${currentCertificate.mobile}</dd>
                
                <dt>Email</dt>
                <dd>${currentCertificate.email}</dd>
                
                <dt>Date of Birth</dt>
                <dd>${dobDate}</dd>
                
                <dt>College</dt>
                <dd>${currentCertificate.college}</dd>
                
                <dt>Course</dt>
                <dd>${currentCertificate.course}</dd>
                
                <dt>Admission Number</dt>
                <dd>${currentCertificate.admissionNumber}</dd>
                
                <dt>Section</dt>
                <dd>${currentCertificate.section}</dd>
                
                <dt>Semester</dt>
                <dd>${currentCertificate.semester}</dd>
                
                <dt>Address</dt>
                <dd>${currentCertificate.address}</dd>
                
                <dt>Certificate Number</dt>
                <dd>${currentCertificate.certificateNumber}</dd>
                
                <dt>Issue Date</dt>
                <dd>${issueDateFormatted}</dd>
                
                <dt>Version</dt>
                <dd>${currentCertificate.__v}</dd>
            </dl>
        `;
        
        detailsModal.style.display = 'block';
    }
    
    // Show update form in modal
    function showUpdateForm(certificateId) {
        currentCertificate = currentCertificates.find(cert => cert._id === certificateId);
        
        if (!currentCertificate) return;
        
        // Fill the form with current certificate data
        document.getElementById('updateCertificateId').value = currentCertificate._id;
        document.getElementById('updateFullName').value = currentCertificate.fullName;
        document.getElementById('updateMobile').value = currentCertificate.mobile;
        document.getElementById('updateEmail').value = currentCertificate.email;
        
        // Format date for input field (YYYY-MM-DD)
        const dobDate = new Date(currentCertificate.dob);
        const formattedDob = dobDate.toISOString().split('T')[0];
        document.getElementById('updateDob').value = formattedDob;
        
        document.getElementById('updateCollege').value = currentCertificate.college;
        document.getElementById('updateCourse').value = currentCertificate.course;
        document.getElementById('updateAdmissionNumber').value = currentCertificate.admissionNumber;
        document.getElementById('updateSection').value = currentCertificate.section;
        document.getElementById('updateSemester').value = currentCertificate.semester;
        document.getElementById('updateAddress').value = currentCertificate.address;
        document.getElementById('updateCertificateNumber').value = currentCertificate.certificateNumber;
        
        // Close the details modal if it's open
        detailsModal.style.display = 'none';
        
        // Show the update modal
        updateModal.style.display = 'block';
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(certificateId) {
        currentCertificate = currentCertificates.find(cert => cert._id === certificateId);
        
        if (!currentCertificate) return;
        
        // Close the details modal if it's open
        detailsModal.style.display = 'none';
        
        // Show the delete confirmation modal
        deleteConfirmModal.style.display = 'block';
    }
    
    // Update certificate
    async function updateCertificate(formData) {
        try {
            const certificateId = formData.get('_id') || currentCertificate._id;
            
            const data = {
                fullName: formData.get('fullName'),
                mobile: formData.get('mobile'),
                email: formData.get('email'),
                dob: formData.get('dob'),
                college: formData.get('college'),
                course: formData.get('course'),
                admissionNumber: formData.get('admissionNumber'),
                section: formData.get('section'),
                semester: formData.get('semester'),
                address: formData.get('address')
            };
            
            const response = await fetch(`${API_BASE_URL}/certificate/${certificateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update certificate');
            }
            
            // Close the modal
            updateModal.style.display = 'none';
            
            // Show success message
            showPopup('Certificate updated successfully');
            
            // Refresh certificates
            await fetchCertificates();
            
        } catch (error) {
            console.error('Error updating certificate:', error);
            showPopup(error.message || 'Error updating certificate', true);
        }
    }
    
    // Delete certificate
    async function deleteCertificate(certificateId) {
        try {
            const response = await fetch(`${API_BASE_URL}/certificate/${certificateId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to delete certificate');
            }
            
            // Close the modal
            deleteConfirmModal.style.display = 'none';
            
            // Show success message
            showPopup('Certificate deleted successfully');
            
            // Refresh certificates
            await fetchCertificates();
            
        } catch (error) {
            console.error('Error deleting certificate:', error);
            showPopup(error.message || 'Error deleting certificate', true);
        }
    }
    
    // Show popup message
    function showPopup(message, isError = false) {
        if (typeof window.showPopup === 'function') {
            window.showPopup(message, isError);
        } else {
            alert(message);
        }
    }
    
    // ===== Event Listeners =====
    
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1; // Reset to first page when searching
            renderCertificates();
        });
    }
    
    // Refresh button
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchCertificates);
    }
    
    // Details modal close button
    if (detailsCloseButton) {
        detailsCloseButton.addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
    }
    
    // Update modal close button
    if (updateCloseButton) {
        updateCloseButton.addEventListener('click', () => {
            updateModal.style.display = 'none';
        });
    }
    
    // Delete modal close button
    if (deleteCloseButton) {
        deleteCloseButton.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    }
    
    // Update button in details modal
    if (updateCertificateBtn) {
        updateCertificateBtn.addEventListener('click', () => {
            detailsModal.style.display = 'none';
            showUpdateForm(currentCertificate._id);
        });
    }
    
    // Delete button in details modal
    if (deleteCertificateBtn) {
        deleteCertificateBtn.addEventListener('click', () => {
            detailsModal.style.display = 'none';
            showDeleteConfirmation(currentCertificate._id);
        });
    }
    
    // Cancel button in update modal
    if (updateCancelBtn) {
        updateCancelBtn.addEventListener('click', () => {
            updateModal.style.display = 'none';
        });
    }
    
    // Cancel button in delete confirmation modal
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    }
    
    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (currentCertificate && currentCertificate._id) {
                deleteCertificate(currentCertificate._id);
            }
        });
    }
    
    // Update certificate form submission
    if (updateCertificateForm) {
        updateCertificateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(updateCertificateForm);
            await updateCertificate(formData);
        });
    }
    
    // Close modals when clicking outside of them
    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
        if (e.target === updateModal) {
            updateModal.style.display = 'none';
        }
        if (e.target === deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
        }
    });
    
    // ===== Initialize =====
    
    // Fetch certificates when page loads
    fetchCertificates();
});
