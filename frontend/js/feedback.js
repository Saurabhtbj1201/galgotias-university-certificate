document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://galgotias-university-certificate.onrender.com/api';
    
    // DOM Elements
    const feedbackTableBody = document.getElementById('feedbackTableBody');
    const searchInput = document.getElementById('searchInput');
    const refreshButton = document.getElementById('refreshButton');
    
    // Modal Elements
    const detailsModal = document.getElementById('detailsModal');
    const detailsCloseButton = document.getElementById('detailsCloseButton');
    const feedbackDetails = document.getElementById('feedbackDetails');
    const markReviewedBtn = document.getElementById('markReviewedBtn');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    
    // Variables to store current feedback data
    let currentFeedbacks = [];
    let currentFeedback = null;
    
    // Pagination variables
    const feedbacksPerPage = 10;
    let currentPage = 1;
    
    // ===== Functions =====
    
    // Fetch all feedbacks
    async function fetchFeedbacks() {
        try {
            feedbackTableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="7" class="loading-message">Loading feedback entries...</td>
                </tr>
            `;
            
            const response = await fetch(`${API_BASE_URL}/feedback/all`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch feedbacks');
            }
            
            currentFeedbacks = result;
            renderFeedbacks();
            
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            feedbackTableBody.innerHTML = `
                <tr class="error-row">
                    <td colspan="7" class="error-message">Error loading feedbacks. ${error.message}</td>
                </tr>
            `;
        }
    }
    
    // Render feedbacks in the table
    function renderFeedbacks() {
        if (!currentFeedbacks || currentFeedbacks.length === 0) {
            feedbackTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7" class="empty-message">No feedback entries found.</td>
                </tr>
            `;
            return;
        }
        
        // Filter feedbacks based on search term
        const searchTerm = searchInput.value.toLowerCase();
        const filteredFeedbacks = currentFeedbacks.filter(feedback => 
            feedback.name.toLowerCase().includes(searchTerm) || 
            feedback.email.toLowerCase().includes(searchTerm) ||
            feedback.subject.toLowerCase().includes(searchTerm)
        );
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);
        const startIndex = (currentPage - 1) * feedbacksPerPage;
        const endIndex = startIndex + feedbacksPerPage;
        const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);
        
        // Generate table rows
        let tableHtml = '';
        paginatedFeedbacks.forEach(feedback => {
            // Format date
            const date = new Date(feedback.createdAt).toLocaleDateString();
            
            // Truncate message for table display
            const truncatedMessage = feedback.message.length > 50 
                ? feedback.message.substring(0, 50) + '...' 
                : feedback.message;
            
            // Determine status
            const status = feedback.status || 'pending';
            const statusClass = status === 'reviewed' ? 'status-reviewed' : 'status-pending';
            
            tableHtml += `
                <tr data-id="${feedback._id}">
                    <td>${feedback.name}</td>
                    <td>${feedback.email}</td>
                    <td>${feedback.subject}</td>
                    <td class="message-cell">${truncatedMessage}</td>
                    <td>${date}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn details-btn" data-id="${feedback._id}">Details</button>
                            ${status !== 'reviewed' ? 
                                `<button class="action-btn review-btn" data-id="${feedback._id}">Mark Reviewed</button>` : 
                                ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        feedbackTableBody.innerHTML = tableHtml;
        
        // Generate pagination controls
        renderPagination(totalPages);
        
        // Add event listeners to the buttons
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', () => showFeedbackDetails(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.review-btn').forEach(btn => {
            btn.addEventListener('click', () => updateFeedbackStatus(btn.getAttribute('data-id'), 'reviewed'));
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
                        renderFeedbacks();
                    }
                });
            } else if (btn.classList.contains('next-btn')) {
                btn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderFeedbacks();
                    }
                });
            } else {
                btn.addEventListener('click', () => {
                    currentPage = parseInt(btn.getAttribute('data-page'));
                    renderFeedbacks();
                });
            }
        });
    }
    
    // Show feedback details in modal
    function showFeedbackDetails(feedbackId) {
        currentFeedback = currentFeedbacks.find(feedback => feedback._id === feedbackId);
        
        if (!currentFeedback) return;
        
        // Format date
        const date = new Date(currentFeedback.createdAt).toLocaleDateString();
        const time = new Date(currentFeedback.createdAt).toLocaleTimeString();
        
        // Determine status
        const status = currentFeedback.status || 'pending';
        const statusClass = status === 'reviewed' ? 'status-reviewed' : 'status-pending';
        
        feedbackDetails.innerHTML = `
            <dl>
                <dt>Name</dt>
                <dd>${currentFeedback.name}</dd>
                
                <dt>Email</dt>
                <dd>${currentFeedback.email}</dd>
                
                <dt>Subject</dt>
                <dd>${currentFeedback.subject}</dd>
                
                <dt>Message</dt>
                <dd class="message">${currentFeedback.message}</dd>
                
                <dt>Submitted On</dt>
                <dd>${date} at ${time}</dd>
                
                <dt>Status</dt>
                <dd><span class="status-badge ${statusClass}">${status}</span></dd>
            </dl>
        `;
        
        // Show or hide Mark as Reviewed button based on current status
        if (markReviewedBtn) {
            if (status === 'reviewed') {
                markReviewedBtn.style.display = 'none';
            } else {
                markReviewedBtn.style.display = 'inline-block';
            }
        }
        
        detailsModal.style.display = 'block';
    }
    
    // Update feedback status
    async function updateFeedbackStatus(feedbackId, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update feedback status');
            }
            
            // Show success message
            showPopup('Feedback status updated successfully');
            
            // Close modal if open
            if (detailsModal.style.display === 'block') {
                detailsModal.style.display = 'none';
            }
            
            // Refresh feedbacks
            await fetchFeedbacks();
            
        } catch (error) {
            console.error('Error updating feedback status:', error);
            showPopup(error.message || 'Error updating feedback status', true);
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
            renderFeedbacks();
        });
    }
    
    // Refresh button
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchFeedbacks);
    }
    
    // Details modal close button
    if (detailsCloseButton) {
        detailsCloseButton.addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
    }
    
    // Close details button
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
    }
    
    // Mark as Reviewed button in details modal
    if (markReviewedBtn) {
        markReviewedBtn.addEventListener('click', () => {
            if (currentFeedback && currentFeedback._id) {
                updateFeedbackStatus(currentFeedback._id, 'reviewed');
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
    
    // ===== Initialize =====
    
    // Fetch feedbacks when page loads
    fetchFeedbacks();
});
