const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Render will set the PORT environment variable

// Middleware
// For production, you should restrict CORS to your specific frontend domain
// Example: app.use(cors({ origin: 'https://your-frontend-name.onrender.com' }));
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies

// MongoDB Connection
// IMPORTANT: For production, use environment variables for sensitive data like DB URIs.
const MONGO_URI = process.env.MONGO_URI; // Ensure this is set in Render's environment variables

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if DB connection fails
    });

// Mongoose Schema and Model for Certificate
const certificateSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    dob: { type: Date, required: true },
    college: { type: String, required: true },
    course: { type: String, required: true },
    admissionNumber: { type: String, required: true, unique: true }, // Assuming admission number should be unique
    section: { type: String, required: true },
    semester: { type: String, required: true },
    address: { type: String, required: true },
    certificateNumber: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// --- API Endpoints ---

// 1. Create/Submit Certificate
app.post('/api/certificate', async (req, res) => {
    try {
        const {
            name, // from get_certificate.html form
            mobile, email, dob, college, course,
            admissionNumber, section, semester, address
        } = req.body;

        // Validate required fields (basic validation)
        if (!name || !mobile || !email || !dob || !college || !course || !admissionNumber || !section || !semester || !address) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        
        // Check if a certificate with this admission number already exists
        const existingCertificateByAdmissionNo = await Certificate.findOne({ admissionNumber });
        if (existingCertificateByAdmissionNo) {
            return res.status(409).json({ message: 'A certificate with this admission number already exists.' });
        }

        // Generate unique certificate number
        const certificateNumber = `GU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newCertificate = new Certificate({
            fullName: name, // Map 'name' from form to 'fullName' in schema
            mobile,
            email,
            dob: new Date(dob), // Ensure DOB is stored as Date
            college,
            course,
            admissionNumber,
            section,
            semester,
            address,
            certificateNumber
        });

        await newCertificate.save();
        res.status(201).json({ 
            message: 'Certificate created successfully!', 
            certificateNumber: newCertificate.certificateNumber,
            id: newCertificate._id 
        });

    } catch (error) {
        console.error('Error creating certificate:', error);
        if (error.code === 11000) { // Duplicate key error (e.g. for certificateNumber if somehow not unique)
             return res.status(409).json({ message: 'Duplicate entry. This certificate might already exist or there was a conflict.' });
        }
        res.status(500).json({ message: 'Server error while creating certificate.' });
    }
});

// 2. Fetch Certificate for Download
app.post('/api/certificate/fetch', async (req, res) => {
    try {
        const { fullName, admissionNumber, dob } = req.body;

        if (!fullName || !admissionNumber || !dob) {
            return res.status(400).json({ message: 'Full name, admission number, and date of birth are required.' });
        }

        const certificate = await Certificate.findOne({
            fullName: new RegExp(`^${fullName}$`, 'i'), // Case-insensitive match
            admissionNumber,
            dob: new Date(dob)
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found with the provided details.' });
        }

        res.status(200).json(certificate);

    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ message: 'Server error while fetching certificate.' });
    }
});

// 3. Verify Certificate
app.post('/api/certificate/verify', async (req, res) => {
    try {
        const { certificateNumber, fullName } = req.body;

        if (!certificateNumber || !fullName) {
            return res.status(400).json({ message: 'Certificate number and full name are required for verification.' });
        }

        const certificate = await Certificate.findOne({
            certificateNumber,
            fullName: new RegExp(`^${fullName}$`, 'i') // Case-insensitive match
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found or details do not match.' });
        }

        // Return relevant details for verification
        res.status(200).json({
            fullName: certificate.fullName,
            course: certificate.course,
            admissionNumber: certificate.admissionNumber,
            certificateNumber: certificate.certificateNumber,
            issueDate: certificate.issueDate,
            status: "Verified"
        });

    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ message: 'Server error while verifying certificate.' });
    }
});

// 4. Download Certificate as PDF
app.get('/api/certificate/download-pdf/:certificateNumber', async (req, res) => {
    try {
        const { certificateNumber } = req.params;

        if (!certificateNumber) {
            return res.status(400).json({ message: 'Certificate number is required.' });
        }

        const certificate = await Certificate.findOne({ certificateNumber });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 0 // We'll handle margins manually for border
        });

        const filename = `Certificate-${certificate.fullName.replace(/\s+/g, '_')}-${certificate.certificateNumber}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // --- Define Colors ---
        const borderColor = '#b8860b'; // DarkGoldenRod
        const innerBorderColor = '#daa520'; // Goldenrod
        const universityNameColor = '#8B0000'; // Dark Red
        const achievementTitleColor = '#504020'; // Dark Brown
        const studentNameColor = '#8B0000'; // Dark Red
        const textColor = '#333333'; // Dark Gray for general text
        const footerTextColor = '#222222';

        // --- Page Dimensions ---
        const pageW = doc.page.width;
        const pageH = doc.page.height;

        // --- Draw Borders ---
        const outerMargin = 30; // Margin from page edge to outer border
        const innerMargin = 5;  // Space between outer and inner border
        const borderThickness = 8;
        const innerBorderThickness = 1;

        // Outer Border
        doc.lineWidth(borderThickness)
           .rect(outerMargin, outerMargin, pageW - 2 * outerMargin, pageH - 2 * outerMargin)
           .stroke(borderColor);

        // Inner Border
        const innerRectX = outerMargin + borderThickness / 2 + innerMargin;
        const innerRectY = outerMargin + borderThickness / 2 + innerMargin;
        const innerRectW = pageW - 2 * (outerMargin + borderThickness / 2 + innerMargin);
        const innerRectH = pageH - 2 * (outerMargin + borderThickness / 2 + innerMargin);
        
        doc.lineWidth(innerBorderThickness)
           .rect(innerRectX, innerRectY, innerRectW, innerRectH)
           .stroke(innerBorderColor);

        // Content Area Margins (inside the borders)
        const contentMargin = outerMargin + borderThickness + innerMargin + innerBorderThickness + 20; // Further margin for content

        // --- Add content to the PDF ---

        // Logo
        const logoPath = path.join(__dirname, 'assets', 'logo.png');
        const logoWidth = 350; // Adjusted logo width
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, pageW / 2 - logoWidth / 2, contentMargin, { width: logoWidth });
        } else {
            console.warn('Logo not found at:', logoPath);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor)
               .text('Galgotias University Logo Placeholder', pageW / 2 - 100, contentMargin + 20, { width: 200, align: 'center' });
        }
        doc.moveDown(10); // Spacing after logo

        // University Name - This is already positioned after the logo and its moveDown

        // "Certificate of Achievement"
        doc.font('Helvetica-Bold').fontSize(22).fillColor(achievementTitleColor)
           .text('Certificate of Achievement', contentMargin, doc.y, { align: 'center', width: pageW - 2 * contentMargin });
        doc.moveDown(1);

        // "This is to certify that"
        doc.font('Helvetica').fontSize(16).fillColor(textColor)
           .text('This is to certify that', contentMargin, doc.y, { align: 'center', width: pageW - 2 * contentMargin });
        doc.moveDown(0.5);

        // Student Name
        doc.font('Times-BoldItalic').fontSize(28).fillColor(studentNameColor)
           .text(certificate.fullName, contentMargin, doc.y, { align: 'center', width: pageW - 2 * contentMargin });
        
        // Underline for student name (manual line drawing)
        const studentNameTextActualWidth = doc.widthOfString(certificate.fullName); 
        const studentNameContainingBlockWidth = pageW - 2 * contentMargin; 
        const studentNameUnderlineStartX = contentMargin + (studentNameContainingBlockWidth - studentNameTextActualWidth) / 2;
        const studentNameY = doc.y - (doc.currentLineHeight() * 0.2); 
        
        doc.lineWidth(1.5).moveTo(studentNameUnderlineStartX, studentNameY)
           .lineTo(studentNameUnderlineStartX + studentNameTextActualWidth, studentNameY)
           .stroke(borderColor);
        doc.moveDown(0.5);

        // "has successfully completed the course [Course Name] - demonstrating dedication, academic excellence, and commitment to learning."
        const beforeCourse = 'has successfully completed the course ';
        const afterCourse = ' - demonstrating dedication, academic excellence, and commitment to learning.';

        // Calculate widths for centering
        const beforeWidth = doc.widthOfString(beforeCourse, { font: 'Helvetica', size: 16 });
        const courseWidth = doc.widthOfString(certificate.course, { font: 'Helvetica-Bold', size: 16 });
        const afterWidth = doc.widthOfString(afterCourse, { font: 'Helvetica', size: 16 });
        const totalWidth = beforeWidth + courseWidth + afterWidth;
        const startX = contentMargin + ((pageW - 2 * contentMargin) - totalWidth) / 2;
        const y = doc.y;

        doc.font('Helvetica').fontSize(16).fillColor(textColor)
           .text(beforeCourse, startX, y, { continued: true });
        doc.font('Helvetica-Bold').fontSize(16).fillColor(textColor)
           .text(certificate.course, { continued: true });
        doc.font('Helvetica').fontSize(16).fillColor(textColor)
           .text(afterCourse);
        doc.moveDown(0.5);

        // "fulfilled all academic requirements"
        doc.font('Helvetica').fontSize(16).fillColor(textColor)
           .text('Throughout the duration of the course, he has fulfilled all academic requirements, completed assigned coursework, and participated in relevant academic activities as per the standards prescribed by Galgotias University.', contentMargin, doc.y, { align: 'center', width: pageW - 2 * contentMargin });
        doc.moveDown(1);
        
        // Other Details
        const detailsTextContainerWidth = pageW - 2 * contentMargin;
        doc.font('Helvetica').fontSize(12).fillColor(textColor);

        // Bold "Admission Number" and the value
        const admissionLabel = 'Admission Number: ';
        const admissionValue = certificate.admissionNumber;

        // Calculate width for label and value for centering
        const labelWidth = doc.widthOfString(admissionLabel, { font: 'Helvetica-Bold' });
        const valueWidth = doc.widthOfString(admissionValue, { font: 'Helvetica-Bold' });
        const totalWidth = labelWidth + valueWidth;
        const startX = contentMargin + (detailsTextContainerWidth - totalWidth) / 2;
        const y = doc.y;

        doc.font('Helvetica-Bold').text(admissionLabel, startX, y, { continued: true });
        doc.font('Helvetica-Bold').text(admissionValue);
        doc.moveDown(2); // Increased spacing before signatures

        // --- Signatures Section ---
        const signatureY = doc.y; // Y position for both signatures
        const signatureImageWidth = 80; // Desired width for signature images
        const signatureImageHeight = 40; // Desired height for signature images
        const signatureTextOffsetY = 5; // Space between image and text
        const signatureBlockWidth = (pageW - 2 * contentMargin) / 2 - 20; // Width for each signature block (Dean/HOD)
        const deanSignatureX = contentMargin + 50; // X position for Dean's signature block (left)
        const hodSignatureX = pageW / 2 + 10; // X position for HOD's signature block (right)

        // Dean's Signature
        const deanSignPath = path.join(__dirname, 'assets', 'Dean.png');
        if (fs.existsSync(deanSignPath)) {
            doc.image(deanSignPath, deanSignatureX + (signatureBlockWidth - signatureImageWidth) / 2, signatureY, {
                width: signatureImageWidth,
                height: signatureImageHeight,
                align: 'center'
            });
        } else {
            console.warn('Dean.png not found at:', deanSignPath);
            doc.font('Helvetica').fontSize(10).fillColor(textColor)
               .text('[Dean Sign Placeholder]', deanSignatureX, signatureY + signatureImageHeight / 2 - 5, { width: signatureBlockWidth, align: 'center' });
        }
        doc.font('Helvetica').fontSize(11).fillColor(textColor)
           .text('Signature of Dean', deanSignatureX, signatureY + signatureImageHeight + signatureTextOffsetY, {
               width: signatureBlockWidth,
               align: 'center'
           });

        // HOD's Signature
        // Note: We use the same 'signatureY' so they are on the same line.
        // PDFKit places subsequent elements based on the last 'y' position, so we need to manage 'y' carefully if drawing text for Dean first.
        // For images, it's less of an issue if they are placed at absolute coordinates.
        // For text, we'll use the original signatureY for HOD's text as well.
        const hodSignPath = path.join(__dirname, 'assets', 'HOD.png');
        if (fs.existsSync(hodSignPath)) {
            doc.image(hodSignPath, hodSignatureX + (signatureBlockWidth - signatureImageWidth) / 2, signatureY, {
                width: signatureImageWidth,
                height: signatureImageHeight,
                align: 'center'
            });
        } else {
            console.warn('HOD.png not found at:', hodSignPath);
            doc.font('Helvetica').fontSize(10).fillColor(textColor)
               .text('[HOD Sign Placeholder]', hodSignatureX, signatureY + signatureImageHeight / 2 - 5, { width: signatureBlockWidth, align: 'center' });
        }
        doc.font('Helvetica').fontSize(11).fillColor(textColor)
           .text('Signature of HOD', hodSignatureX, signatureY + signatureImageHeight + signatureTextOffsetY, {
               width: signatureBlockWidth,
               align: 'center'
           });
        
        // Move down significantly after signatures before the footer line
        doc.y = signatureY + signatureImageHeight + signatureTextOffsetY + 30; // Ensure enough space before footer line


        // Footer section for Certificate Number and Issue Date
        const footerY = pageH - contentMargin - 10; // Position from bottom
        doc.font('Helvetica').fontSize(11).fillColor(footerTextColor);
        
        // Draw a line above footer text
        doc.lineWidth(0.5).moveTo(contentMargin, footerY - 10)
           .lineTo(pageW - contentMargin, footerY - 10)
           .stroke(innerBorderColor);

        doc.text(`Certificate No: ${certificate.certificateNumber}`, contentMargin, footerY, { 
            align: 'left', 
            width: (pageW - 2 * contentMargin) / 2 - 10 // Half width minus some padding
        });
        doc.text(`Date of Issue: ${new Date(certificate.issueDate).toLocaleDateString()}`, pageW / 2 + 10, footerY, {
            align: 'right',
            width: (pageW - 2 * contentMargin) / 2 - 10 // Half width minus some padding
        });

        // Finalize the PDF and end the stream
        doc.end();

    } catch (error) {
        console.error('Error generating PDF certificate:', error);
        // Avoid sending JSON error if headers already sent for PDF
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error while generating PDF certificate.' });
        } else {
            // If headers are sent, we can only end the response. The client might get a corrupted PDF.
            res.end();
        }
    }
});


// Global error handler (optional, for unhandled routes or other errors)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Log the port Render assigns
});
