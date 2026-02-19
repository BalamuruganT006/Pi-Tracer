<div align="center">

# 🥧 Pi-Tracer (𝝅-tracer)

### *A High-Fidelity Execution Visualizer for Python*

Transform abstract code logic into interactive, step-by-step flow diagrams to debug with clarity.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.1-black.svg?logo=three.js)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Demo](#-demo) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🎯 Core Capabilities
- **🔍 Real-Time Code Tracing**: Step through Python code execution line by line
- **📊 Interactive Flow Diagrams**: Visualize program flow with stunning 3D graphics
- **🎨 Monaco Editor Integration**: Professional code editing experience
- **🔥 Firebase Authentication**: Secure user authentication and session management
- **⚡ Lightning Fast**: Built with Vite for optimal performance
- **🎭 Beautiful Animations**: Smooth transitions with Framer Motion

### 🛠️ Tech Stack
- **Frontend**: React 18, Three.js, React Three Fiber
- **Editor**: Monaco Editor (VS Code's editor)
- **3D Graphics**: Three.js with React Three Fiber & Drei
- **Animation**: Framer Motion & React Spring
- **Backend**: Python with Firebase integration
- **Build Tool**: Vite

---

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Python** (3.8 or higher)
- **Firebase Account** (for authentication)

### 🚀 Quick Start

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/BalamuruganT006/Pi-Tracer.git
cd Pi-Tracer
```

#### 2️⃣ Backend Setup
```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase credentials
```

**Backend Environment Variables** (`.env`):
```env
DEBUG=true
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json
FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

#### 3️⃣ Frontend Setup
```bash
cd ../Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4️⃣ Start the Application
```bash
# Terminal 1 - Backend
cd Backend
python app.py

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

Visit **http://localhost:5173** (or the URL shown in your terminal) 🎉

---

## 💻 Usage

### Basic Workflow

1. **📝 Write Your Code**
   - Open Pi-Tracer in your browser
   - Use the integrated Monaco editor to write or paste your Python code

2. **▶️ Execute & Visualize**
   - Click "Run" to start tracing
   - Watch as your code execution is visualized in real-time

3. **🔍 Debug Interactively**
   - Step through execution line by line
   - Inspect variables at each step
   - Visualize data structures in 3D

### Example

```python
def fibonacci(n):
    """Calculate Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(5)
print(f"Fibonacci(5) = {result}")
```

Pi-Tracer will visualize:
- ✅ Function call hierarchy
- ✅ Variable state changes
- ✅ Recursive call tree
- ✅ Return value flow

---

## 🎬 Screenshots/Demo

### 🖼️ Main Interface
> *Interactive code editor with real-time visualization*

### 🌊 Execution Flow
> *3D visualization of program execution*

### 📊 Variable Inspector
> *Track variable changes throughout execution*

---

## 🏗️ Project Structure

```
Pi-Tracer/
├── Backend/                 # Python backend
│   ├── .env.example        # Environment variables template
│   ├── app.py              # Main backend application
│   └── requirements.txt    # Python dependencies
│
├── Frontend/               # React frontend
│   ├── src/                # Source files
│   ├── public/             # Static assets
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
│
├── debug2.json             # Debug trace data
├── debug_response.json     # Debug response samples
└── README.md               # You are here!
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Report Bugs
Found a bug? [Open an issue](https://github.com/BalamuruganT006/Pi-Tracer/issues/new) with:
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### 💡 Suggest Features
Have an idea? [Create a feature request](https://github.com/BalamuruganT006/Pi-Tracer/issues/new) and tell us about it!

### 🔧 Submit Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Pi-Tracer.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues

### 📝 Contribution Guidelines
- ✅ Write clear commit messages
- ✅ Update documentation as needed
- ✅ Test your changes thoroughly
- ✅ Follow the existing code style
- ✅ Be respectful and constructive

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 BalamuruganT006

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Monaco Editor** - For the amazing code editor
- **Three.js** - For stunning 3D graphics
- **React** - For the robust UI framework
- **Firebase** - For authentication services
- **Vite** - For lightning-fast development

---

## 📞 Contact & Support

- **Author**: [BalamuruganT006](https://github.com/BalamuruganT006)
- **Project**: [Pi-Tracer](https://github.com/BalamuruganT006/Pi-Tracer)
- **Issues**: [Report a bug](https://github.com/BalamuruganT006/Pi-Tracer/issues)

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

Made with ❤️ and lots of ☕ by [BalamuruganT006](https://github.com/BalamuruganT006)

[⬆ Back to Top](#-pi-tracer-tracer)

</div>
