# Galgotias University Certificate App

A full-stack web application to generate, download, and verify student certificates for Galgotias University.

## Table of Contents
1. [Key Features](#key-features)  
2. [Pages & Usage](#pages--usage)  
3. [Folder Structure](#folder-structure)  
4. [Getting Started](#getting-started)  
5. [Live Demo](#live-demo)  
6. [Tech Stack](#tech-stack)  

## Key Features
- Generate unique certificate numbers and store records in MongoDB  
- Download certificates as beautifully styled PDFs (with university logo & signatures)  
- Verify certificate authenticity by certificate number and student name  
- Responsive frontend with navigation, forms, and results  
- CORS-enabled API for seamless client-server interaction  

## Pages & Usage
- **index.html**: Homepage with stats & quick links to all flows.  
- **get_certificate.html**: Fill form (name, mobile, email, DOB, college, course, admission no., section, semester, address) to generate a certificate record.  
- **download_certificate.html**: Enter name, admission number, DOB to fetch your record, preview details, then download PDF and share via LinkedIn/Twitter/Email.  
- **verify_certificate.html**: Provide certificate number & full name to confirm authenticity; returns status and details.  
- **about.html**: University overview, mission, and core values.  
- **contact.html**: Campus address, phone/email contacts, & directions for visitors.  

## Folder Structure
```
Galgotias-Certificate-app\   
└── frontend\
    ├── css\
    │   └── style.css 
    ├── images\      
    ├── js\
    │   └── script.js  
    ├── index.html
    ├── get_certificate.html
    ├── download_certificate.html
    ├── verify_certificate.html
    ├── about.html
    └── contact.html
```

## Getting Started

1. Clone the repo  
   ```bash
   git clone https://github.com/Saurabhtbj1201/galgotias-university-certificate.git
   cd galgotias-university-certificate
   ```

2. Backend setup  
   ```bash
   cd backend
   npm install
   export MONGO_URI=<Your MongoDB URI>
   npm start
   ```

3. Frontend setup  
   Simply open any `.html` in `frontend/` or serve via a static server:  
   ```bash
   cd frontend
   npx http-server .  # or live-server
   ```

## Live Demo
https://galgotias-university-certificate.vercel.app/

## Tech Stack
- Node.js & Express  
- MongoDB & Mongoose  
- PDFKit for dynamic PDF generation  
- Vanilla HTML, CSS & JavaScript  
- CORS & body-parser middleware  

