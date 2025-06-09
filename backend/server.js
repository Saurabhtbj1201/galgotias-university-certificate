const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies

// MongoDB Connection
// IMPORTANT: For production, use environment variables for sensitive data like DB URIs.
const MONGO_URI = 'mongodb+srv://saurabhtbj143:dHnZtR418tPCh1av@certificate.o6oezvn.mongodb.net/?retryWrites=true&w=majority&appName=certificate';

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
        const logoWidth = 100; // Adjusted logo width
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, pageW / 2 - logoWidth / 2, contentMargin, { width: logoWidth });
        } else {
            console.warn('Logo not found at:', logoPath);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor)
               .text('Galgotias University Logo Placeholder', pageW / 2 - 100, contentMargin + 20, { width: 200, align: 'center' });
        }
        doc.moveDown(3); // Spacing after logo

        // University Name
        doc.font('Helvetica-Bold').fontSize(28).fillColor(universityNameColor)
           .text('GALGOTIAS UNIVERSITY', contentMargin, doc.y, { align: 'center', width: pageW - 2 * contentMargin });
        doc.moveDown(0.8);

        // "Certificate of Achievement"
        doc.font('Helvetica-Bold').fontSize(22).fillColor(achievementTitleColor)
           .text('Certificate of Achievement', { align: 'center' });
        doc.moveDown(1.5);

        // "This is to certify that"
        doc.font('Helvetica').fontSize(16).fillColor(textColor)
           .text('This is to certify that', { align: 'center' });
        doc.moveDown(1);

        // Student Name
        // For cursive/script fonts, you'd need to register the font file. Using Times-BoldItalic as a fallback.
        doc.font('Times-BoldItalic').fontSize(28).fillColor(studentNameColor)
           .text(certificate.fullName, { align: 'center' });
        // Underline for student name (manual line drawing)
        const studentNameWidth = doc.widthOfString(certificate.fullName);
        const studentNameY = doc.y - (doc.currentLineHeight() * 0.2); // Adjust Y to be just under text
        doc.lineWidth(1.5).moveTo(pageW/2 - studentNameWidth/2, studentNameY)
           .lineTo(pageW/2 + studentNameWidth/2, studentNameY)
           .stroke(borderColor);
        doc.moveDown(1.5);


        // "has successfully completed the course"
        doc.font('Helvetica').fontSize(16).fillColor(textColor)
           .text('has successfully completed the course', { align: 'center' });
        doc.moveDown(0.5);

        // Course Name
        doc.font('Helvetica-Bold').fontSize(20).fillColor(textColor)
           .text(certificate.course, { align: 'center' });
        doc.moveDown(1.5);
        
        // Other Details
        doc.font('Helvetica').fontSize(12).fillColor(textColor);
        doc.text(`Admission Number: ${certificate.admissionNumber}`, { align: 'center' });
        doc.text(`Date of Birth: ${new Date(certificate.dob).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);


        // Footer section for Certificate Number and Issue Date
        const footerY = pageH - contentMargin - 20; // Position from bottom
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
    console.log(`Server is running on http://localhost:${PORT}`);
});
