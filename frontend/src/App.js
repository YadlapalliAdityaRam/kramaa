import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/common/Navigation/Navbar';
import { Toaster, toast } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

// Pages
import Home from './pages/Home';
import Algorithms from './pages/Algorithms';
import BubbleSortVisualizer from './visualizer/BubbleSortVisualizer';
import GenericVisualizer from './visualizer/GenericVisualizer';
import ComparisonVisualizer from './visualizer/ComparisonVisualizer';
import AlgorithmSpecsComparison from './pages/AlgorithmSpecsComparison';
import Companies from './pages/Companies';
import Visualize from './pages/Visualize';
import CodingPlatform from './pages/CodingPlatform';
import ProblemWorkspace from './pages/ProblemWorkspace';
import LearningPath from './pages/LearningPath';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Contests from './pages/Contests';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Leaderboard from './pages/Leaderboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminProfile from './pages/SuperAdminProfile';
import AdminDashboard from './pages/AdminDashboard';
import Unauthorized from './pages/Unauthorized';
import CompanyDashboard from './pages/CompanyDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CreateProblem from './pages/admin/CreateProblem';
import EditProblem from './pages/admin/EditProblem';
import CreateContest from './pages/admin/CreateContest';
import EditContest from './pages/admin/EditContest';
import ContestParticipation from './pages/ContestParticipation';
import ContestProblemView from './pages/ContestProblemView';
import ContestLeaderboard from './components/contest/ContestLeaderboard';
import CompanyForm from './pages/admin/CompanyForm';
import AdminManagement from './components/admin/AdminManagement';
import AuditLogViewer from './components/admin/AuditLogViewer';
import SystemHealth from './components/admin/dashboard/SystemHealth';
import EmergencyZone from './pages/admin/EmergencyZone';
import ProblemList from './components/admin/dashboard/ProblemList';
import SubmissionMonitor from './components/admin/dashboard/SubmissionMonitor';
import ContestList from './components/admin/dashboard/ContestList';
import UserManagement from './components/admin/dashboard/UserManagement';
import CompanyManagement from './components/admin/dashboard/CompanyManagement';
import ProblemMasterList from './pages/admin/ProblemMasterList';
import AdminProblemStats from './pages/admin/AdminProblemStats';
import AdminMasterList from './pages/admin/AdminMasterList';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import TicketDashboard from './pages/admin/TicketDashboard';
import AdminProfile from './pages/admin/AdminProfile';

import { loadUser, logout } from './redux/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    const onAuthExpired = (event) => {
      const message = event?.detail?.message || 'Session expired. Please login again.';
      dispatch(logout());
      toast.error(message);

      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('krama:auth-expired', onAuthExpired);
    return () => window.removeEventListener('krama:auth-expired', onAuthExpired);
  }, [dispatch, location.pathname, navigate]);

  // Hide Navbar for Problem Workspace (e.g., /coding-platform/two-sum) but show for list (/coding-platform)
  const shouldHideNavbar = /^\/coding-platform\/[^/]+$/.test(location.pathname);

  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      {!shouldHideNavbar && <Navbar />}
      <main className="main-content" style={{ paddingTop: shouldHideNavbar ? '0' : 'var(--nav-height)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Algorithms */}
          <Route path="/algorithms" element={<Algorithms />} />
          <Route path="/algorithms/sorting/bubble" element={<BubbleSortVisualizer />} />

          {/* Generic Route for other algorithms */}
          <Route path="/algorithms/:category/:algorithm" element={<GenericVisualizer />} />

          <Route path="/companies" element={<Companies />} />


          {/* New Routes */}
          <Route path="/company/:companyName" element={<CompanyDashboard />} />
          <Route path="/compare" element={<AlgorithmSpecsComparison />} />
          <Route path="/visualize" element={<Visualize />} />
          <Route path="/coding-platform/:id" element={<ProblemWorkspace />} />
          <Route path="/coding-platform" element={<CodingPlatform />} />
          <Route path="/learning-path" element={<LearningPath />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile/:username?" element={<Profile />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/contest/:id" element={<ContestParticipation />} />
          <Route path="/contest/:contestId/problem/:problemId" element={<ContestProblemView />} />
          <Route path="/contest/:id/leaderboard" element={<ContestLeaderboard />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<SuperAdminProfile />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="problems" element={<AdminMasterList />} />
              <Route path="problems/admin/:id" element={<AdminAnalytics />} />
              <Route path="contests" element={<ContestList />} />
              <Route path="tickets" element={<TicketDashboard />} />
              <Route path="audit" element={<AuditLogViewer />} />
              <Route path="health" element={<SystemHealth />} />
              <Route path="emergency" element={<EmergencyZone />} />
            </Route>
          </Route>



          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="problems" element={<ProblemList />} />
              <Route path="contests" element={<ContestList />} />
              <Route path="submissions" element={<SubmissionMonitor />} />
              <Route path="companies" element={<CompanyManagement />} />
              <Route path="audit-logs" element={<AuditLogViewer />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="tickets" element={<TicketDashboard />} />
            </Route>

            <Route path="/admin/companies/new" element={<CompanyForm />} />
            <Route path="/admin/companies/edit/:id" element={<CompanyForm />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/create-contest" element={<CreateContest />} />
            <Route path="/admin/edit-contest/:id" element={<EditContest />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route path="/admin/create-problem" element={<CreateProblem />} />
            <Route path="/admin/edit-problem/:id" element={<EditProblem />} />
          </Route>


          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div >
  );
};

function App() {
  return (
    <Router>
      <AppContent />
      <Analytics />
    </Router>
  );
}

export default App;
