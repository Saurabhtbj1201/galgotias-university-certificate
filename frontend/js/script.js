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
            alert(message);
        }
    };

    // ✅ Login Modal Logic
    const loginModal = document.getElementById('loginModal');
    const loginIcon = document.getElementById('loginIcon');
    const closeButton = document.querySelector('#loginModal .close-button');

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
        certificateForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const submitButton = certificateForm.querySelector('button[type="submit"]');
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
                        showPopup('Form submitted but failed to send email.', true);
                    }
                );

                showPopup('Form submitted successfully. Your certificate will be generated soon.');
                certificateForm.reset();

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
    const shareOptionsDiv = document.querySelector('#certificatePreview .share-options');

    let currentCertificateNumberForDownload = null;

    if (downloadForm && certificatePreviewDiv && previewContent && downloadButton && shareOptionsDiv) {
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
            shareOptionsDiv.style.display = 'none';

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
                    currentCertificateNumberForDownload = certData.certificateNumber;
                    downloadButton.style.display = 'inline-block';
                    shareOptionsDiv.style.display = 'block';
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
        verifyForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(verifyForm);
            const data = Object.fromEntries(formData.entries());

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
                        <h3>Verification Successful</h3>
                        <table>
                            <tr><th>Field</th><th>Detail</th></tr>
                            <tr><td>Full Name</td><td>${certData.fullName}</td></tr>
                            <tr><td>Certificate Number</td><td>${certData.certificateNumber}</td></tr>
                            <tr><td>Course</td><td>${certData.course}</td></tr>
                            <tr><td>Issue Date</td><td>${new Date(certData.issueDate).toLocaleDateString()}</td></tr>
                            <tr><td>Status</td><td style="color: green; font-weight: bold;">${certData.status}</td></tr>
                        </table>`;
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
});
