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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer
<div align="center">

### © Made with ❤️ by Saurabh Kumar. All Rights Reserved 2025

<!-- Profile Section with Photo and Follow Button -->
<a href="https://github.com/Saurabhtbj1201">
  <img src="https://github.com/Saurabhtbj1201.png" width="100" style="border-radius: 50%; border: 3px solid #0366d6;" alt="Saurabh Profile"/>
</a>

### [Saurabh Kumar](https://github.com/Saurabhtbj1201)

<a href="https://github.com/Saurabhtbj1201">
  <img src="https://img.shields.io/github/followers/Saurabhtbj1201?label=Follow&style=social" alt="GitHub Follow"/>
</a>

### 🔗 Connect With Me

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/saurabhtbj1201)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/saurabhtbj1201)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/saurabhtbj1201)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://facebook.com/saurabh.tbj)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=todoist&logoColor=white)](https://gu-saurabh.site)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/9798024301)

---

<p align="center">

  <strong>Made with ❤️ by Saurabh Kumar</strong>
  <br>
  ⭐ Star this repo if you find it helpful!
</p>

![Repo Views](https://komarev.com/ghpvc/?username=Saurabhtbj1201&style=flat-square&color=red)

</div>

---

<div align="center">

### 💝 If you like this project, please give it a ⭐ and share it with others!

**Happy Coding! 🚀**

</div>
