# Kramaa - Advanced Algorithm Visualizer & Learning Platform

Kramaa is a comprehensive platform designed to help users visualize, learn, and practice algorithms. It combines interactive animations with a robust coding environment and administrative tools.

## 🚀 Features

### 🔹 Algorithm Visualization
- **Interactive Animations:** Visual representations of sorting and pathfinding algorithms.
- **Custom Inputs:** Users can provide their own data to see how algorithms process it.
- **Step-by-Step Execution:** Control speed and flow of the visualization.

### 🔹 Code Playground & Execution
- **Multi-Language Support:** Run code in C++, Java, Python, and JavaScript.
- **Local Execution Engine:** Secure and isolated code execution using local compilers.
- **Real-time Feedback:** Instant output and error reporting.

### 🔹 Admin & Super Admin Panels
- **Dashboard:** comprehensive overview of system stats (users, submissions, problems).
- **User Management:** View, manage, and update user roles (Admin/User).
- **Audit Logs:** Track all critical system actions for security and accountability.
- **System Health:** Monitor server status and error rates.
- **Content Management:** Create and manage coding problems and contests.

### 🔹 User Experience
- **Modern UI:** Sleek, responsive design with glassmorphism effects.
- **Authentication:** Secure login and registration system.
- **Profile Management:** Track progress and submission history.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **Execution:** Child Processes with Local Compilers (GCC, JDK, Python)

## 📦 Installation

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. **Run the application:**
   - Frontend: `npm run dev` in `frontend/`
   - Backend: `npm run dev` in `backend/`

## Concurrent Motion

Route changes and loading feedback use layered motion so overlapping effects stay independent:

1. The outer route shell fades from transparent to visible.
2. Its inner content settles upward at the same time.
3. The top progress indicator advances independently while a route or request is busy.
4. Blocking loaders animate their panel entry, ring rotation, and progress sweep on separate nested elements.

For example, a new page can fade in while its content settles upward and the progress bar advances. Because opacity and transform belong to different elements, neither animation cancels the other. This pattern is useful for portfolio page transitions, button hover feedback, onboarding panels, and asynchronous form submission states.

Run `npm run verify:motion` to validate the layered animation contract.
