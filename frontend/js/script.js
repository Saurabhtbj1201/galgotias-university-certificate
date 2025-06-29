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

            // Hide popup after 4 seconds
            setTimeout(() => {
                popup.classList.remove('active');
            }, 4000);
        } else {
            alert(message);
        }
    };


    // ✅ Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: "ipHNAODxySu5reLqm",
        });
    } else {
        console.error("EmailJS library not loaded.");
    }

    // ✅ Form submission
    const certificateForm = document.getElementById('certificateForm');
    if (certificateForm) {
        certificateForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const submitButton = certificateForm.querySelector('button[type="submit"]');
            const formData = new FormData(certificateForm);
            const data = Object.fromEntries(formData.entries());

            // Add loading state to submit button
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

                // ✅ Send email
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
                // Remove loading state from submit button
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });
    }

    // Handle Download Form Submission (download_certificate.html)
    const downloadForm = document.getElementById('downloadForm');
    const certificatePreviewDiv = document.getElementById('certificatePreview'); // Renamed for clarity
    const previewContent = document.getElementById('previewContent');
    const downloadButton = document.getElementById('downloadButton'); // Get the download button
    const shareOptionsDiv = document.querySelector('#certificatePreview .share-options');


    let currentCertificateNumberForDownload = null; // Store certificate number for download

    if (downloadForm && certificatePreviewDiv && previewContent && downloadButton && shareOptionsDiv) {
        downloadForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const submitButton = downloadForm.querySelector('button[type="submit"]');
            const formData = new FormData(downloadForm);
            const data = Object.fromEntries(formData.entries());

            console.log('Fetching certificate with details:', data);

            // Add loading state to submit button
            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
            }

            previewContent.innerHTML = `<p>Fetching certificate...</p>`; // Loading state
            certificatePreviewDiv.classList.remove('hidden');
            certificatePreviewDiv.style.display = '';
            downloadButton.style.display = 'none'; // Hide initially
            shareOptionsDiv.style.display = 'none'; // Hide initially

            try {
                const response = await fetch(`${API_BASE_URL}/certificate/fetch`, {
                    method: 'POST', // Using POST to send multiple criteria
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const certData = await response.json();

                if (!response.ok) {
                    previewContent.innerHTML = `<p style="color: red;">${certData.message || `Error: ${response.status}`}</p>`;
                    currentCertificateNumberForDownload = null;
                    downloadButton.style.display = 'none';
                    shareOptionsDiv.style.display = 'none';
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
                        </div>
                    `;
                    currentCertificateNumberForDownload = certData.certificateNumber; // Store for download
                    downloadButton.style.display = 'inline-block'; // Show download button
                    shareOptionsDiv.style.display = 'block'; // Show share options
                } else {
                    previewContent.innerHTML = `<p>Certificate not found for the provided details.</p>`;
                    downloadButton.style.display = 'none';
                    shareOptionsDiv.style.display = 'none';
                    currentCertificateNumberForDownload = null;
                }
            } catch (error) {
                console.error('Error fetching certificate:', error);
                previewContent.innerHTML = `<p style="color: red;">Error fetching certificate: ${error.message}</p>`;
                downloadButton.style.display = 'none';
                shareOptionsDiv.style.display = 'none';
                currentCertificateNumberForDownload = null;
            } finally {
                // Remove loading state from submit button
                if (submitButton) {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }
            }
        });

        // Add event listener for the actual PDF download button
        downloadButton.addEventListener('click', function () {
            if (currentCertificateNumberForDownload) {
                const pdfUrl = `${API_BASE_URL}/certificate/download-pdf/${currentCertificateNumberForDownload}`;
                // Open in new tab to trigger download or display
                window.open(pdfUrl, '_blank');
            } else {
                showPopup('Please fetch certificate details first.', true);
            }
        });
    }

    // Share functions for download_certificate.html
    window.shareOn = function (platform) {
        const certificateURL = window.location.href; // Or a specific certificate link
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
            alert(`Sharing on ${platform} (URL: ${certificateURL})`);
        }
    };

    // Handle Verification Form Submission (verify_certificate.html)
    const verifyForm = document.getElementById('verifyForm');
    const verificationResultDiv = document.getElementById('verificationResult');

    if (verifyForm && verificationResultDiv) {
        verifyForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(verifyForm);
            const data = Object.fromEntries(formData.entries());
            console.log('Verifying certificate with details:', data);
            verificationResultDiv.innerHTML = `<p>Verifying...</p>`; // Loading state

            try {
                const response = await fetch(`${API_BASE_URL}/certificate/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const certData = await response.json();

                if (!response.ok) {
                    // throw new Error(certData.message || 'Verification failed or certificate not found.');
                    verificationResultDiv.innerHTML = `<p style="color: red; font-weight: bold;">${certData.message || `Error: ${response.status}`}</p>`;
                    return;
                }

                if (certData && certData.status === "Verified") {
                    verificationResultDiv.innerHTML = `
                        <h3>Verification Successful</h3>
                        <table>
                            <tr><th>Field</th><th>Detail</th></tr>
                            <tr><td>Full Name</td><td>${certData.fullName}</td></tr>
                            <tr><td>Certificate Number</td><td>${certData.certificateNumber}</td></tr>
                            <tr><td>Course</td><td>${certData.course}</td></tr>
                            <tr><td>Issue Date</td><td>${new Date(certData.issueDate).toLocaleDateString()}</td></tr>
                            <tr><td>Status</td><td style="color: green; font-weight: bold;">${certData.status}</td></tr>
                        </table>
                    `;
                } else { // Should be handled by !response.ok now
                    verificationResultDiv.innerHTML = `<p style="color: red; font-weight: bold;">Certificate not found or details do not match.</p>`;
                }
            } catch (error) {
                console.error('Error verifying certificate:', error);
                verificationResultDiv.innerHTML = `<p style="color: red;">Error verifying certificate: ${error.message}</p>`;
            }
        });
    }
});

