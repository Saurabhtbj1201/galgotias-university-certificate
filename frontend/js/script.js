document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://galgotias-university-certificate.onrender.com/api';

    // ✅ Toggle menu
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function () {
            mainNav.classList.toggle('active');
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            menuToggle.classList.toggle('active');
        });
    }

    // ✅ Popup display logic
    window.showPopup = function (message, isError = false) {
        const popup = document.getElementById('popupMessage');
        if (popup) {
            popup.innerHTML = `<p>${message}</p>`;
            popup.classList.remove('error', 'success', 'active');
            popup.classList.add(isError ? 'error' : 'success');
            popup.classList.add('active');

            setTimeout(() => {
                popup.classList.remove('active');
            }, 4000);
        } else {
            // Check for login error message container as fallback
            const loginErrorMessage = document.getElementById('loginErrorMessage');
            if (loginErrorMessage && document.getElementById('loginModal').style.display === 'block') {
                // Only display in login error message if login modal is visible
                loginErrorMessage.textContent = message;
                loginErrorMessage.classList.remove('success', 'error');
                loginErrorMessage.classList.add(isError ? 'error' : 'success');
                loginErrorMessage.classList.add('active');

                setTimeout(() => {
                    loginErrorMessage.classList.remove('active');
                }, 4000);
            } else {
                // Fallback to alert only if necessary
                alert(message);
            }
        }
    };

    // ✅ Login Modal Logic
    const loginModal = document.getElementById('loginModal');
    const loginIcon = document.getElementById('loginIcon');
    const closeButton = document.querySelector('#loginModal .close-button');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const resetFormContainer = document.getElementById('resetFormContainer');
    const resetStepOne = document.getElementById('resetStepOne');
    const resetStepTwo = document.getElementById('resetStepTwo');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const backToLoginLink = document.getElementById('backToLogin');

    // Function to show error message
    const showErrorMessage = (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active', 'error');
        }
    };

    // Function to show success message
    const showSuccessMessage = (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('error');
            errorElement.classList.add('active', 'success');
        }
    };

    // Function to clear message
    const clearMessage = (elementId) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('active', 'error', 'success');
        }
    };

    if (loginModal && loginIcon && closeButton) {
        loginIcon.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'block';
        });

        closeButton.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });

        // Toggle between login and reset password forms
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginFormContainer.style.display = 'none';
                resetFormContainer.style.display = 'block';
                resetStepOne.style.display = 'block';
                resetStepTwo.style.display = 'none';
                clearMessage('resetVerifyErrorMessage');
                clearMessage('resetPasswordErrorMessage');

                // Reset the forms
                if (document.getElementById('resetVerifyForm')) {
                    document.getElementById('resetVerifyForm').reset();
                }
                if (document.getElementById('resetPasswordForm')) {
                    document.getElementById('resetPasswordForm').reset();
                }
            });
        }

        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                resetFormContainer.style.display = 'none';
                loginFormContainer.style.display = 'block';
                clearMessage('loginErrorMessage');
            });
        }
    }

    // ✅ Reset Password Step 1: Verify Account
    const resetVerifyForm = document.getElementById('resetVerifyForm');
    if (resetVerifyForm) {
        resetVerifyForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            clearMessage('resetVerifyErrorMessage');

            const submitButton = resetVerifyForm.querySelector('button[type="submit"]');
            const emailInput = document.getElementById('resetEmail');
            const aadharInput = document.getElementById('resetAadhar');

            // Basic validation
            if (!emailInput.value || !aadharInput.value) {
                showErrorMessage('resetVerifyErrorMessage', 'Please enter both email and Aadhar number.');
                return;
            }

            const data = {
                email: emailInput.value,
                aadhar: aadharInput.value
            };

            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/verify-reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!response.ok) {
                    showErrorMessage('resetVerifyErrorMessage', result.message || `Verification failed: ${response.status}`);
                    return;
                }

                // Store the email for step 2
                sessionStorage.setItem('resetEmail', emailInput.value);

                // Show step 2
                resetStepOne.style.display = 'none';
                resetStepTwo.style.display = 'block';
                clearMessage('resetPasswordErrorMessage');

            } catch (error) {
                console.error('Verification error:', error);
                showErrorMessage('resetVerifyErrorMessage', 'Unable to connect to the server. Please try again.');
            } finally {
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });
    }

    // ✅ Reset Password Step 2: Set New Password
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            clearMessage('resetPasswordErrorMessage');

            const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
            const newPasswordInput = document.getElementById('newPassword');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const email = sessionStorage.getItem('resetEmail');

            // Basic validation
            if (!newPasswordInput.value || !confirmPasswordInput.value) {
                showErrorMessage('resetPasswordErrorMessage', 'Please enter and confirm your new password.');
                return;
            }

            if (newPasswordInput.value !== confirmPasswordInput.value) {
                showErrorMessage('resetPasswordErrorMessage', 'Passwords do not match.');
                return;
            }

            if (!email) {
                showErrorMessage('resetPasswordErrorMessage', 'Session expired. Please start over.');
                return;
            }

            const data = {
                email: email,
                password: newPasswordInput.value
            };

            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!response.ok) {
                    showErrorMessage('resetPasswordErrorMessage', result.message || `Password reset failed: ${response.status}`);
                    return;
                }

                // Show success message
                showSuccessMessage('resetPasswordErrorMessage', 'Password reset successful! You can now login with your new password.');

                // Clear session storage
                sessionStorage.removeItem('resetEmail');

                // Return to login form after a delay
                setTimeout(() => {
                    resetFormContainer.style.display = 'none';
                    loginFormContainer.style.display = 'block';
                    clearMessage('loginErrorMessage');
                    showSuccessMessage('loginErrorMessage', 'Password reset successful! Please login with your new password.');
                    resetPasswordForm.reset();
                }, 2000);

            } catch (error) {
                console.error('Password reset error:', error);
                showErrorMessage('resetPasswordErrorMessage', 'Unable to connect to the server. Please try again.');
            } finally {
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });
    }

    // ✅ Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginErrorMessage = document.getElementById('loginErrorMessage');

        // Function to display login form errors
        const showLoginError = (message) => {
            if (loginErrorMessage) {
                loginErrorMessage.textContent = message;
                loginErrorMessage.classList.remove('success');
                loginErrorMessage.classList.add('active', 'error');
            }
        };

        // Function to display login form success
        const showLoginSuccess = (message) => {
            if (loginErrorMessage) {
                loginErrorMessage.textContent = message;
                loginErrorMessage.classList.remove('error');
                loginErrorMessage.classList.add('active', 'success');
            }
        };

        // Function to clear login form messages
        const clearLoginMessage = () => {
            if (loginErrorMessage) {
                loginErrorMessage.textContent = '';
                loginErrorMessage.classList.remove('active', 'error', 'success');
            }
        };

        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            console.log('Login form submitted'); // Debug log

            // Clear any previous messages
            clearLoginMessage();

            const submitButton = loginForm.querySelector('button[type="submit"]');
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const captchaInput = document.getElementById('loginCaptcha');
            const captchaText = document.getElementById('captchaText');

            // Basic client-side validation
            if (!emailInput.value || !passwordInput.value) {
                showLoginError('Please enter both email and password.');
                return;
            }

            // Validate captcha (case-sensitive check)
            if (!captchaInput.value) {
                showLoginError('Please enter the captcha code.');
                return;
            }

            if (captchaInput.value !== captchaText.textContent) {
                showLoginError('The captcha code you entered is incorrect. Please try again.');
                return;
            }

            const data = {
                email: emailInput.value,
                password: passwordInput.value
            };

            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            try {
                console.log('Sending login request to:', `${API_BASE_URL}/auth/login`);
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                console.log('Login response:', result);

                if (!response.ok) {
                    // Handle different error scenarios with specific messages in the form
                    if (response.status === 401) {
                        showLoginError('Invalid email or password. Please check your credentials and try again.');
                    } else if (response.status === 404) {
                        showLoginError('Email not found. Please check if you have registered with this email.');
                    } else {
                        showLoginError(result.message || `Login failed: ${response.status}`);
                    }
                    return;
                }

                // Store user info in session storage
                sessionStorage.setItem('user', JSON.stringify({
                    email: result.user.email,
                    isLoggedIn: true
                }));

                // Show success message in form
                showLoginSuccess('Login successful! Redirecting to dashboard...');

                // Also use popup for success message
                showPopup('Login successful! Redirecting to dashboard...');

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

            } catch (error) {
                console.error('Login error:', error);
                // Use popup for network errors
                showPopup('Unable to connect to the server. Please check your internet connection and try again.', true);
            } finally {
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });

        // Clear messages when user starts typing
        const loginInputs = [
            document.getElementById('loginEmail'),
            document.getElementById('loginPassword'),
            document.getElementById('loginCaptcha')
        ];

        loginInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', clearLoginMessage);
            }
        });
    }

    // ✅ Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: "ipHNAODxySu5reLqm",
        });
    } else {
        console.error("EmailJS library not loaded.");
    }

    // ✅ Certificate Form Submission
    const certificateForm = document.getElementById('certificateForm');
    if (certificateForm) {
        const validationRules = {
            name: value => value.trim() ? '' : 'Full name is required.',
            gender: value => value ? '' : 'Please select your gender.',
            mobile: value => /^\d{10}$/.test(value) ? '' : 'Enter exactly 10 digits without a country code.',
            email: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : 'Enter a valid email address, for example name@example.com.',
            dob: value => value ? '' : 'Date of birth is required.',
            college: value => value.trim() ? '' : 'College name is required.',
            course: value => value.trim() ? '' : 'Course is required.',
            admissionNumber: value => /^[A-Z0-9]+$/.test(value) ? '' : 'Use capital letters and numbers only.',
            section: value => /^(?:[1-9]|[1-9][0-9]|[A-Z])$/.test(value) ? '' : 'Use a number from 1 to 99 or one letter from A to Z.',
            semester: value => value ? '' : 'Please select your semester.',
            address: value => value.trim() ? '' : 'Address is required.'
        };

        function setFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(`${fieldId}Error`);
            if (!field || !error) return Boolean(message);

            field.classList.toggle('has-error', Boolean(message));
            field.setAttribute('aria-invalid', String(Boolean(message)));
            error.textContent = message;
            error.hidden = !message;
            return Boolean(message);
        }

        function validateField(fieldId) {
            const field = document.getElementById(fieldId);
            const rule = validationRules[fieldId];
            return field && rule ? !setFieldError(fieldId, rule(field.value)) : true;
        }

        const validationFields = Object.keys(validationRules);
        validationFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            field.addEventListener('input', () => {
                if (fieldId === 'mobile') field.value = field.value.replace(/\D/g, '').slice(0, 10);
                if (fieldId === 'admissionNumber') field.value = field.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (fieldId === 'section') field.value = field.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);
                validateField(fieldId);
            });
            field.addEventListener('blur', () => validateField(fieldId));
        });

        certificateForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const submitButton = certificateForm.querySelector('button[type="submit"]');
            const hasValidationErrors = validationFields
                .map(fieldId => validateField(fieldId))
                .some(isValid => !isValid);
            if (hasValidationErrors) {
                const firstError = certificateForm.querySelector('.has-error');
                if (firstError) firstError.focus();
                return;
            }

            const formData = new FormData(certificateForm);
            const data = Object.fromEntries(formData.entries());

            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/certificate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!response.ok) {
                    showPopup(result.message || `Error: ${response.status}`, true);
                    return;
                }

                // Send confirmation email
                await emailjs.send('service_gu', 'template_gu', {
                    to_email: data.email,
                    user_name: data.name,
                    full_name: data.name,
                    admission_number: data.admissionNumber,
                    dob: data.dob
                }).then(
                    (response) => {
                        console.log('✅ EmailJS Success:', response.status, response.text);
                    },
                    (error) => {
                        console.error('❌ EmailJS Error:', error);
                    }
                );

                // ✅ Fetch the newly created certificate and show preview modal
                const certNumber = result.certificateNumber;
                const certPreviewModal = document.getElementById('certPreviewModal');
                const certModalPreviewContent = document.getElementById('certModalPreviewContent');
                const certModalDownloadBtn = document.getElementById('certModalDownloadBtn');
                const closeCertModal = document.getElementById('closeCertModal');

                if (certPreviewModal && certModalPreviewContent) {
                    // Fetch full certificate data
                    const fetchResp = await fetch(`${API_BASE_URL}/certificate/fetch`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ admissionNumber: data.admissionNumber, dob: data.dob })
                    });
                    const certData = await fetchResp.json();

                    if (fetchResp.ok && certData) {
                        certModalPreviewContent.innerHTML = `
                            <div class="certificate-design">
                                <div class="certificate-border">
                                    <div class="certificate-header">
                                        <img src="images/logo.png" alt="Galgotias University Logo" class="certificate-logo">
                                        <h1>Galgotias University</h1>
                                        <h2>Certificate of Achievement</h2>
                                    </div>
                                    <div class="certificate-body">
                                        <p class="certify-text">This is to certify that</p>
                                        <p class="student-name">${certData.fullName}</p>
                                        <p class="course-text">has successfully completed the course</p>
                                        <p class="course-name">${certData.course}</p>
                                        <p class="details-text">
                                            Admission Number: ${certData.admissionNumber}<br>
                                            Date of Birth: ${new Date(certData.dob).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div class="certificate-footer">
                                        <p class="certificate-number">Certificate No: ${certData.certificateNumber}</p>
                                        <p class="issue-date">Date of Issue: ${new Date(certData.issueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>`;

                        // Wire up download button
                        if (certModalDownloadBtn) {
                            certModalDownloadBtn.onclick = () => {
                                const pdfUrl = `${API_BASE_URL}/certificate/download-pdf/${certData.certificateNumber}`;
                                window.open(pdfUrl, '_blank');
                            };
                        }

                        // Wire up close button
                        if (closeCertModal) {
                            closeCertModal.onclick = () => { certPreviewModal.style.display = 'none'; };
                        }
                        window.addEventListener('click', (e) => {
                            if (e.target === certPreviewModal) certPreviewModal.style.display = 'none';
                        });

                        // Show modal
                        certPreviewModal.style.display = 'block';
                        certificateForm.reset();
                    } else {
                        showPopup('Certificate saved! You can download it from the Download page.', false);
                        certificateForm.reset();
                    }
                }

            } catch (error) {
                console.error('Form submission error:', error);
                showPopup(error.message || 'Error submitting form. Please try again.', true);
            } finally {
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });
    }

    // ✅ Certificate Download Logic
    const downloadForm = document.getElementById('downloadForm');
    const certificatePreviewDiv = document.getElementById('certificatePreview');
    const previewContent = document.getElementById('previewContent');
    const downloadButton = document.getElementById('downloadButton');

    let currentCertificateNumberForDownload = null;

    if (downloadForm && certificatePreviewDiv && previewContent && downloadButton) {
        const escapePreviewValue = value => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        const formatPreviewDate = value => value ? new Date(value).toLocaleDateString(undefined, {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        }) : 'Not available';
        const maskMobile = value => {
            const mobile = String(value ?? '');
            return mobile.length > 5 ? `${'*'.repeat(mobile.length - 5)}${mobile.slice(-5)}` : mobile;
        };
        const maskEmail = value => {
            const [username, domain] = String(value ?? '').split('@');
            if (!username || !domain) return 'Not available';
            return `${username.slice(0, 2)}*****${username.slice(-2)}@${domain}`;
        };

        downloadForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const submitButton = downloadForm.querySelector('button[type="submit"]');
            const formData = new FormData(downloadForm);
            const data = Object.fromEntries(formData.entries());



            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            previewContent.innerHTML = `<p>Fetching certificate...</p>`;
            certificatePreviewDiv.classList.remove('hidden');
            downloadButton.style.display = 'none';

            try {
                const response = await fetch(`${API_BASE_URL}/certificate/fetch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const certData = await response.json();

                if (!response.ok) {
                    previewContent.innerHTML = `<p style="color: red;">${certData.message || `Error: ${response.status}`}</p>`;
                    return;
                }

                if (certData) {
                    previewContent.innerHTML = `
                        <div class="download-result-layout">
                            <div class="download-result-certificate">
                                <div class="certificate-design">
                                    <div class="certificate-border">
                                        <div class="certificate-header">
                                            <img src="images/logo.png" alt="Galgotias University Logo" class="certificate-logo">
                                            <h1>Galgotias University</h1>
                                            <h2>Certificate of Achievement</h2>
                                        </div>
                                        <div class="certificate-body">
                                            <p class="certify-text">This is to certify that</p>
                                            <p class="student-name">${escapePreviewValue(certData.fullName)}</p>
                                            <p class="course-text">has successfully completed the course</p>
                                            <p class="course-name">${escapePreviewValue(certData.course)}</p>
                                            <p class="details-text">
                                                Admission Number: ${escapePreviewValue(certData.admissionNumber)}<br>
                                                Date of Birth: ${formatPreviewDate(certData.dob)}
                                            </p>
                                        </div>
                                        <div class="certificate-footer">
                                            <p class="certificate-number">Certificate No: ${escapePreviewValue(certData.certificateNumber)}</p>
                                            <p class="issue-date">Date of Issue: ${formatPreviewDate(certData.issueDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <aside class="download-candidate-information">
                                <h3>Candidate &amp; Certificate Information</h3>
                                <dl>
                                    <div><dt>Name</dt><dd>${escapePreviewValue(certData.fullName)}</dd></div>
                                    <div><dt>Gender</dt><dd>${escapePreviewValue(certData.gender || 'Not available')}</dd></div>
                                    <div><dt>Date of Birth</dt><dd>${formatPreviewDate(certData.dob)}</dd></div>
                                    <div><dt>Mobile</dt><dd>${escapePreviewValue(maskMobile(certData.mobile))}</dd></div>
                                    <div><dt>Email</dt><dd>${escapePreviewValue(maskEmail(certData.email))}</dd></div>
                                    <div><dt>College</dt><dd>${escapePreviewValue(certData.college)}</dd></div>
                                    <div><dt>Course</dt><dd>${escapePreviewValue(certData.course)}</dd></div>
                                    <div><dt>Admission Number</dt><dd>${escapePreviewValue(certData.admissionNumber)}</dd></div>
                                    <div><dt>Section</dt><dd>${escapePreviewValue(certData.section)}</dd></div>
                                    <div><dt>Semester</dt><dd>${escapePreviewValue(certData.semester)}</dd></div>
                                    <div><dt>Address</dt><dd>${escapePreviewValue(certData.address)}</dd></div>
                                    <div><dt>Certificate Number</dt><dd>${escapePreviewValue(certData.certificateNumber)}</dd></div>
                                    <div><dt>Issue Date</dt><dd>${formatPreviewDate(certData.issueDate)}</dd></div>
                                </dl>
                            </aside>
                            <p class="download-admin-note">If you notice any incorrect or inaccurate information, please contact the administrator through the <a href="/contact.html">Contact Us</a> page.</p>
                        </div>
                    `;
                    currentCertificateNumberForDownload = certData.certificateNumber;
                    downloadButton.style.display = 'inline-block';
                }

            } catch (error) {
                console.error('Error fetching certificate:', error);
                previewContent.innerHTML = `<p style="color: red;">${error.message}</p>`;
            } finally {
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });

        downloadButton.addEventListener('click', function () {
            if (currentCertificateNumberForDownload) {
                const pdfUrl = `${API_BASE_URL}/certificate/download-pdf/${currentCertificateNumberForDownload}`;
                window.open(pdfUrl, '_blank');
            } else {
                showPopup('Please fetch certificate details first.', true);
            }
        });
    }

    // ✅ Share Options
    window.shareOn = function (platform) {
        const certificateURL = window.location.href;
        const certificateText = "Check out my new certificate from Galgotias University!";
        let shareURL = '';

        if (platform === 'linkedin') {
            shareURL = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(certificateURL)}&title=${encodeURIComponent(certificateText)}`;
        } else if (platform === 'twitter') {
            shareURL = `https://twitter.com/intent/tweet?url=${encodeURIComponent(certificateURL)}&text=${encodeURIComponent(certificateText)}`;
        } else if (platform === 'email') {
            shareURL = `mailto:?subject=${encodeURIComponent(certificateText)}&body=${encodeURIComponent(certificateURL)}`;
        }

        if (shareURL) {
            window.open(shareURL, '_blank');
        } else {
            alert(`Sharing on ${platform} not supported.`);
        }
    };

    // ✅ Certificate Verification
    const verifyForm = document.getElementById('verifyForm');
    const verificationResultDiv = document.getElementById('verificationResult');

    if (verifyForm && verificationResultDiv) {
        const escapeVerificationValue = value => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        const formatVerificationDate = value => value ? new Date(value).toLocaleDateString(undefined, {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        }) : 'Not available';

        verifyForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(verifyForm);
            const data = Object.fromEntries(formData.entries());

            verificationResultDiv.style.display = 'block';
            verificationResultDiv.innerHTML = `<p>Verifying...</p>`;

            try {
                const response = await fetch(`${API_BASE_URL}/certificate/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const certData = await response.json();

                if (!response.ok) {
                    verificationResultDiv.innerHTML = `<p style="color: red; font-weight: bold;">${certData.message || 'Verification failed.'}</p>`;
                    return;
                }

                if (certData.status === "Verified") {
                    verificationResultDiv.innerHTML = `
                        <div class="verification-result-layout">
                            <div class="verification-result-certificate">
                                <div class="certificate-design">
                                    <div class="certificate-border">
                                        <div class="certificate-header">
                                            <img src="images/logo.png" alt="Galgotias University Logo" class="certificate-logo">
                                            <h1>Galgotias University</h1>
                                            <h2>Certificate of Achievement</h2>
                                        </div>
                                        <div class="certificate-body">
                                            <p class="certify-text">This is to certify that</p>
                                            <p class="student-name">${escapeVerificationValue(certData.fullName)}</p>
                                            <p class="course-text">has successfully completed the course</p>
                                            <p class="course-name">${escapeVerificationValue(certData.course)}</p>
                                            <p class="details-text">
                                                Admission Number: ${escapeVerificationValue(certData.admissionNumber)}<br>
                                                Section: ${escapeVerificationValue(certData.section)}
                                            </p>
                                        </div>
                                        <div class="certificate-footer">
                                            <p class="certificate-number">Certificate No: ${escapeVerificationValue(certData.certificateNumber)}</p>
                                            <p class="issue-date">Date of Issue: ${formatVerificationDate(certData.issueDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <aside class="verification-candidate-information">
                                <div class="verification-status"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Verified</div>
                                <h3>Candidate &amp; Certificate Information</h3>
                                <dl>
                                    <div><dt>Name</dt><dd>${escapeVerificationValue(certData.fullName)}</dd></div>
                                    <div><dt>Gender</dt><dd>${escapeVerificationValue(certData.gender || 'Not available')}</dd></div>
                                    <div><dt>College</dt><dd>${escapeVerificationValue(certData.college)}</dd></div>
                                    <div><dt>Course</dt><dd>${escapeVerificationValue(certData.course)}</dd></div>
                                    <div><dt>Admission Number</dt><dd>${escapeVerificationValue(certData.admissionNumber)}</dd></div>
                                    <div><dt>Section</dt><dd>${escapeVerificationValue(certData.section)}</dd></div>
                                    <div><dt>Semester</dt><dd>${escapeVerificationValue(certData.semester)}</dd></div>
                                    <div><dt>Certificate Number</dt><dd>${escapeVerificationValue(certData.certificateNumber)}</dd></div>
                                    <div><dt>Issue Date</dt><dd>${formatVerificationDate(certData.issueDate)}</dd></div>
                                </dl>
                            </aside>
                            <p class="verification-admin-note">If you find any incorrect information, please contact the administrator through the <a href="/contact.html">Contact Us</a> page.</p>
                        </div>`;
                } else {
                    verificationResultDiv.innerHTML = `<p style="color: red;">Certificate not found or invalid details.</p>`;
                }

            } catch (error) {
                console.error('Verification error:', error);
                verificationResultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
            }
        });
    }

    // ✅ Feedback Submission
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const submitButton = feedbackForm.querySelector('button[type="submit"]');
            const formData = new FormData(feedbackForm);
            const data = Object.fromEntries(formData.entries());

            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!response.ok) {
                    showPopup(result.message || `Error: ${response.status}`, true);
                    return;
                }

                showPopup('Thank you! Your feedback has been submitted successfully.');
                feedbackForm.reset();

            } catch (error) {
                console.error('Feedback submission error:', error);
                showPopup(error.message || 'Error submitting feedback. Please try again.', true);
            } finally {
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });
    }

    // ✅ Logout functionality
    const logoutIcon = document.getElementById('logoutIcon');
    if (logoutIcon) {
        logoutIcon.addEventListener('click', function (e) {
            e.preventDefault();

            // Clear the user session
            sessionStorage.removeItem('user');

            // Show success message
            if (typeof showPopup === 'function') {
                showPopup('You have been successfully logged out.');
            } else {
                alert('You have been successfully logged out.');
            }

            // Redirect to index/home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    // ✅ Update user information in the header
    function updateUserInfo() {
        const userEmailElement = document.getElementById('userEmail');
        const userInfo = sessionStorage.getItem('user');

        if (userInfo && userEmailElement) {
            const user = JSON.parse(userInfo);
            userEmailElement.textContent = user.email || '';
        }
    }

    // Run user info update on page load
    updateUserInfo();

    // Check authentication status and update UI
    function checkAuth() {
        const userInfo = sessionStorage.getItem('user');
        const isProtectedPage = window.location.pathname.includes('dashboard.html') ||
            window.location.pathname.includes('feedback.html') ||
            window.location.pathname.includes('admin.html');

        if (!userInfo && isProtectedPage) {
            // If not logged in and on a protected page, redirect to login
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Run auth check on page load
    checkAuth();

    // Add additional protection against browser back button after logout
    window.addEventListener('pageshow', function (event) {
        // Check if the page is being loaded from browser cache (back button)
        if (event.persisted) {
            // Run authentication check again
            checkAuth();
        }
    });

    // Ensure protected pages are always checked when accessed
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            const isProtectedPage = window.location.pathname.includes('dashboard.html') ||
                window.location.pathname.includes('feedback.html') ||
                window.location.pathname.includes('admin.html');
            if (isProtectedPage) {
                checkAuth();
            }
        }
    });
});
