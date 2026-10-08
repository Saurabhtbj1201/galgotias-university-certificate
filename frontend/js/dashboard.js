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
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const updateCancelBtn = document.getElementById('updateCancelBtn');
    
    // Form Elements
    const updateCertificateForm = document.getElementById('updateCertificateForm');
    
    // Variables to store current certificate data
    let currentCertificates = [];
    let currentCertificate = null;
    
    // Incremental loading state
    const certificatesPerPage = 10;
    let visibleCertificateCount = certificatesPerPage;
    
    // ===== Functions =====

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(value) {
        if (!value) return 'Not available';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
    
    // Fetch all certificates
    async function fetchCertificates() {
        try {
            certificatesTableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6" class="loading-message">Loading certificates...</td>
                </tr>
            `;
            
            const response = await fetch(`${API_BASE_URL}/certificate/all`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch certificates');
            }
            
            currentCertificates = result;
            visibleCertificateCount = certificatesPerPage;
            renderCertificates();
            
        } catch (error) {
            console.error('Error fetching certificates:', error);
            certificatesTableBody.innerHTML = `
                <tr class="error-row">
                    <td colspan="6" class="error-message">Error loading certificates. ${escapeHtml(error.message)}</td>
                </tr>
            `;
        }
    }
    
    // Render certificates in the table
    function renderCertificates() {
        if (!currentCertificates || currentCertificates.length === 0) {
            certificatesTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6" class="empty-message">No certificates found.</td>
                </tr>
            `;
            return;
        }
        
        // Filter certificates based on search term
        const searchTerm = searchInput.value.toLowerCase();
        const filteredCertificates = currentCertificates.filter(cert => 
            String(cert.fullName || '').toLowerCase().includes(searchTerm) ||
            String(cert.admissionNumber || '').toLowerCase().includes(searchTerm)
        );

        if (filteredCertificates.length === 0) {
            certificatesTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6" class="empty-message">No certificates match your search.</td>
                </tr>
            `;
            renderLoadMore(0);
            return;
        }
        
        const visibleCertificates = filteredCertificates.slice(0, visibleCertificateCount);
        
        // Generate table rows
        let tableHtml = '';
        visibleCertificates.forEach(cert => {
            tableHtml += `
                <tr data-id="${cert._id}">
                    <td>${formatDate(cert.issueDate)}</td>
                    <td>${escapeHtml(cert.fullName)}</td>
                    <td>${escapeHtml(cert.course)}</td>
                    <td>${escapeHtml(cert.admissionNumber)}</td>
                    <td>${escapeHtml(cert.section)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn details-btn" data-id="${cert._id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                                Details
                            </button>
                            <button class="action-btn update-btn" data-id="${cert._id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                                Update
                            </button>
                            <button class="action-btn delete-btn" data-id="${cert._id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6"/></svg>
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        certificatesTableBody.innerHTML = tableHtml;
        
        renderLoadMore(filteredCertificates.length);
        
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
    
    // Render a load-more control while keeping all records in the same table.
    function renderLoadMore(totalResults) {
        const paginationControls = document.getElementById('paginationControls');
        if (!paginationControls) return;
        
        if (totalResults <= certificatesPerPage && visibleCertificateCount >= totalResults) {
            paginationControls.innerHTML = '';
            return;
        }

        const remaining = totalResults - visibleCertificateCount;
        paginationControls.innerHTML = `
            <span class="result-count">Showing ${Math.min(visibleCertificateCount, totalResults)} of ${totalResults}</span>
            <button class="load-more-btn" type="button" aria-label="Load more certificates" ${remaining <= 0 ? 'hidden' : ''}>
                Load more <span aria-hidden="true">(${Math.min(certificatesPerPage, remaining)})</span>
            </button>
        `;

        const loadMoreButton = paginationControls.querySelector('.load-more-btn');
        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', () => {
                visibleCertificateCount += certificatesPerPage;
                renderCertificates();
            });
        }
    }
    
    // Show certificate details in modal
    function showCertificateDetails(certificateId) {
        currentCertificate = currentCertificates.find(cert => cert._id === certificateId);
        
        if (!currentCertificate) return;
        
        const certificateDetails = document.getElementById('certificateDetails');
        
        // Format the date of birth and issue date
        const dobDate = formatDate(currentCertificate.dob);
        const issueDateFormatted = formatDate(currentCertificate.issueDate);
        const formattedGender = currentCertificate.gender
            ? currentCertificate.gender.charAt(0).toUpperCase() + currentCertificate.gender.slice(1).toLowerCase()
            : 'Not specified';
        
        certificateDetails.innerHTML = `
            <div class="certificate-preview">
                <div class="certificate-design">
                    <div class="certificate-border">
                        <div class="certificate-header">
                            <img src="images/logo.png" alt="Galgotias University Logo" class="certificate-logo">
                            <h1>Galgotias University</h1>
                            <h2>Certificate of Achievement</h2>
                        </div>
                        <div class="certificate-body">
                            <p class="certify-text">This is to certify that</p>
                            <p class="student-name">${escapeHtml(currentCertificate.fullName)}</p>
                            <p class="course-text">has successfully completed the course</p>
                            <p class="course-name">${escapeHtml(currentCertificate.course)}</p>
                            <p class="details-text">
                                Admission Number: ${escapeHtml(currentCertificate.admissionNumber)}<br>
                                Date of Birth: ${formatDate(currentCertificate.dob)}
                            </p>
                        </div>
                        <div class="certificate-footer">
                            <p class="certificate-number">Certificate No: ${escapeHtml(currentCertificate.certificateNumber)}</p>
                            <p class="issue-date">Date of Issue: ${formatDate(currentCertificate.issueDate)}</p>
                        </div>
                    </div>
                </div>
                <button id="detailsDownloadBtn" class="btn download-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>
                    </svg>
                    Download Certificate
                </button>
            </div>
            <div class="certificate-information">
                <h3>Candidate &amp; Certificate Information</h3>
                <dl>
                <dt>ID</dt>
                <dd>${escapeHtml(currentCertificate._id)}</dd>
                
                <dt>Full Name</dt>
                <dd>${escapeHtml(currentCertificate.fullName)}</dd>

                <dt>Gender</dt>
                <dd>${formattedGender}</dd>
                
                <dt>Mobile</dt>
                <dd>${escapeHtml(currentCertificate.mobile)}</dd>
                
                <dt>Email</dt>
                <dd>${escapeHtml(currentCertificate.email)}</dd>
                
                <dt>Date of Birth</dt>
                <dd>${dobDate}</dd>
                
                <dt>College</dt>
                <dd>${escapeHtml(currentCertificate.college)}</dd>
                
                <dt>Course</dt>
                <dd>${escapeHtml(currentCertificate.course)}</dd>
                
                <dt>Admission Number</dt>
                <dd>${escapeHtml(currentCertificate.admissionNumber)}</dd>
                
                <dt>Section</dt>
                <dd>${escapeHtml(currentCertificate.section)}</dd>
                
                <dt>Semester</dt>
                <dd>${escapeHtml(currentCertificate.semester)}</dd>
                
                <dt>Address</dt>
                <dd>${escapeHtml(currentCertificate.address)}</dd>
                
                <dt>Certificate Number</dt>
                <dd>${escapeHtml(currentCertificate.certificateNumber)}</dd>
                
                <dt>Issue Date</dt>
                <dd>${issueDateFormatted}</dd>
                
                <dt>Version</dt>
                <dd>${escapeHtml(currentCertificate.__v)}</dd>
                </dl>
                <div class="certificate-information-actions">
                    <button id="deleteCertificateBtn" class="btn delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6"/></svg>
                        Delete
                    </button>
                    <button id="updateCertificateBtn" class="btn update-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1-1 4Z"/></svg>
                        Update
                    </button>
                    <button id="detailsCloseAction" class="btn cancel-btn">
                        <span aria-hidden="true">&times;</span>
                        Close
                    </button>
                </div>
            </div>
        `;

        certificateDetails.querySelector('#detailsDownloadBtn').addEventListener('click', () => {
            if (currentCertificate.certificateNumber) {
                window.open(`${API_BASE_URL}/certificate/download-pdf/${encodeURIComponent(currentCertificate.certificateNumber)}`, '_blank');
            }
        });

        certificateDetails.querySelector('#updateCertificateBtn').addEventListener('click', () => {
            detailsModal.style.display = 'none';
            showUpdateForm(currentCertificate._id);
        });

        certificateDetails.querySelector('#deleteCertificateBtn').addEventListener('click', () => {
            detailsModal.style.display = 'none';
            showDeleteConfirmation(currentCertificate._id);
        });

        certificateDetails.querySelector('#detailsCloseAction').addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
        
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
        document.getElementById('updateIssueDate').value = currentCertificate.issueDate
            ? new Date(currentCertificate.issueDate).toISOString().split('T')[0]
            : '';
        document.getElementById('updateVersion').value = currentCertificate.__v ?? '';
        document.getElementById('updateGender').value = (currentCertificate.gender || '').toLowerCase();
        
        // Close the details modal if it's open
        detailsModal.style.display = 'none';
        
        // Show the update modal
        updateModal.style.display = 'block';
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(certificateId) {
        currentCertificate = currentCertificates.find(cert => cert._id === certificateId);
        
        if (!currentCertificate) return;

        document.getElementById('deleteCertificateName').textContent = currentCertificate.fullName || 'Not available';
        document.getElementById('deleteCertificateCourse').textContent = currentCertificate.course || 'Not available';
        document.getElementById('deleteCertificateAdmission').textContent = currentCertificate.admissionNumber || 'Not available';
        
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
                gender: formData.get('gender'),
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
        visibleCertificateCount = certificatesPerPage;
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
