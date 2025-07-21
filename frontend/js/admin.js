document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://galgotias-university-certificate.onrender.com/api';
    
    // DOM Elements
    const addAdminForm = document.getElementById('addAdminForm');
    const adminFormMessage = document.getElementById('adminFormMessage');
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');
    const refreshAdminUsersButton = document.getElementById('refreshAdminUsersButton');
    
    // Modal Elements
    const updateUserModal = document.getElementById('updateUserModal');
    const updateUserForm = document.getElementById('updateUserForm');
    const updateUserMessage = document.getElementById('updateUserMessage');
    const updateUserCloseButton = document.getElementById('updateUserCloseButton');
    const updateUserCancelBtn = document.getElementById('updateUserCancelBtn');
    
    // Store all admin users
    let allAdminUsers = [];
    let currentUser = null;
    
    // ===== Functions =====
    
    // Fetch all admin users
    async function fetchAdminUsers() {
        try {
            adminUsersTableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="4" class="loading-message">Loading admin users...</td>
                </tr>
            `;
            
            const response = await fetch(`${API_BASE_URL}/admin/users`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch admin users');
            }
            
            allAdminUsers = result;
            renderAdminUsers();
            
        } catch (error) {
            console.error('Error fetching admin users:', error);
            adminUsersTableBody.innerHTML = `
                <tr class="error-row">
                    <td colspan="4" class="error-message">Error loading admin users. ${error.message}</td>
                </tr>
            `;
        }
    }
    
    // Render admin users in table
    function renderAdminUsers() {
        if (!allAdminUsers || allAdminUsers.length === 0) {
            adminUsersTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="4" class="empty-message">No admin users found.</td>
                </tr>
            `;
            return;
        }
        
        let tableHtml = '';
        allAdminUsers.forEach(user => {
            // Mask the Aadhar number for privacy
            const maskedAadhar = user.aadhar ? 
                user.aadhar.substring(0, 4) + "********" : 
                "Not provided";
            
            tableHtml += `
                <tr data-id="${user._id}">
                    <td>${user._id}</td>
                    <td>${user.email}</td>
                    <td>${maskedAadhar}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn update-btn" data-id="${user._id}">Update</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        adminUsersTableBody.innerHTML = tableHtml;
        
        // Add event listeners to update buttons
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', () => showUpdateUserForm(btn.getAttribute('data-id')));
        });
    }
    
    // Show the update user form
    function showUpdateUserForm(userId) {
        currentUser = allAdminUsers.find(user => user._id === userId);
        
        if (!currentUser) return;
        
        document.getElementById('updateUserId').value = currentUser._id;
        document.getElementById('updateUserEmail').value = currentUser.email;
        document.getElementById('updateUserAadhar').value = currentUser.aadhar;
        
        // Clear password fields
        document.getElementById('updateUserPassword').value = '';
        document.getElementById('updateUserConfirmPassword').value = '';
        
        // Clear any previous messages
        updateUserMessage.textContent = '';
        updateUserMessage.classList.remove('active', 'error', 'success');
        
        // Show the modal
        updateUserModal.style.display = 'block';
    }
    
    // Add a new admin user
    async function addAdminUser(formData) {
        try {
            // Check if passwords match
            if (formData.get('password') !== formData.get('confirmPassword')) {
                throw new Error('Passwords do not match.');
            }
            
            const data = {
                email: formData.get('email'),
                aadhar: formData.get('aadhar'),
                password: formData.get('password')
            };
            
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to add admin user');
            }
            
            // Show success message
            adminFormMessage.textContent = 'Admin user added successfully!';
            adminFormMessage.classList.remove('error');
            adminFormMessage.classList.add('active', 'success');
            
            // Clear form
            addAdminForm.reset();
            
            // Refresh admin users list
            await fetchAdminUsers();
            
            // Hide success message after a few seconds
            setTimeout(() => {
                adminFormMessage.classList.remove('active');
            }, 3000);
            
        } catch (error) {
            console.error('Error adding admin user:', error);
            adminFormMessage.textContent = error.message || 'Error adding admin user';
            adminFormMessage.classList.remove('success');
            adminFormMessage.classList.add('active', 'error');
        }
    }
    
    // Update an admin user
    async function updateAdminUser(formData) {
        try {
            const userId = formData.get('userId') || document.getElementById('updateUserId').value;
            
            // Check if password fields are filled and match
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password || confirmPassword) {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match.');
                }
            }
            
            const data = {
                email: formData.get('email'),
                aadhar: formData.get('aadhar')
            };
            
            // Only include password if it's provided
            if (password) {
                data.password = password;
            }
            
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update admin user');
            }
            
            // Show success message
            updateUserMessage.textContent = 'Admin user updated successfully!';
            updateUserMessage.classList.remove('error');
            updateUserMessage.classList.add('active', 'success');
            
            // Refresh admin users list
            await fetchAdminUsers();
            
            // Hide success message and close modal after a few seconds
            setTimeout(() => {
                updateUserMessage.classList.remove('active');
                updateUserModal.style.display = 'none';
            }, 2000);
            
        } catch (error) {
            console.error('Error updating admin user:', error);
            updateUserMessage.textContent = error.message || 'Error updating admin user';
            updateUserMessage.classList.remove('success');
            updateUserMessage.classList.add('active', 'error');
        }
    }
    
    // ===== Event Listeners =====
    
    // Add admin form submission
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addAdminForm);
            await addAdminUser(formData);
        });
    }
    
    // Update admin form submission
    if (updateUserForm) {
        updateUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(updateUserForm);
            await updateAdminUser(formData);
        });
    }
    
    // Refresh button
    if (refreshAdminUsersButton) {
        refreshAdminUsersButton.addEventListener('click', fetchAdminUsers);
    }
    
    // Modal close buttons
    if (updateUserCloseButton) {
        updateUserCloseButton.addEventListener('click', () => {
            updateUserModal.style.display = 'none';
        });
    }
    
    if (updateUserCancelBtn) {
        updateUserCancelBtn.addEventListener('click', () => {
            updateUserModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === updateUserModal) {
            updateUserModal.style.display = 'none';
        }
    });
    
    // ===== Initialize =====
    
    // Fetch admin users when page loads
    fetchAdminUsers();
});
