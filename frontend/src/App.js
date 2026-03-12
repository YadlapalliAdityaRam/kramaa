import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/common/Navigation/Navbar';
import { Toaster, toast } from 'react-hot-toast';
import LoaderOverlay from './components/common/LoaderOverlay';
import TopProgressBar from './components/common/TopProgressBar';
import PageTransition from './components/common/PageTransition';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import NetworkStatusHandler from './components/common/NetworkStatusHandler';

// Pages
import Home from './pages/Home';
import Algorithms from './pages/Algorithms';
import BubbleSortVisualizer from './visualizer/BubbleSortVisualizer';
import InsertionSortVisualizer from './visualizer/InsertionSortVisualizer';
import CycleSortVisualizer from './visualizer/CycleSortVisualizer';
import BucketSortVisualizer from './visualizer/BucketSortVisualizer';
import HeapSortVisualizer from './visualizer/HeapSortVisualizer';
import RadixSortVisualizer from './visualizer/RadixSortVisualizer';
import SelectionSortVisualizer from './visualizer/SelectionSortVisualizer';
import ShellSortVisualizer from './visualizer/ShellSortVisualizer';
import TimSortVisualizer from './visualizer/TimSortVisualizer';
import BinarySearchVisualizer from './visualizer/BinarySearchVisualizer';
import ExponentialSearchVisualizer from './visualizer/ExponentialSearchVisualizer';
import InterpolationSearchVisualizer from './visualizer/InterpolationSearchVisualizer';
import JumpSearchVisualizer from './visualizer/JumpSearchVisualizer';
import BSTVisualizer from './visualizer/BSTVisualizer';

import EggDropVisualizer from './visualizer/EggDropVisualizer';
import SieveVisualizer from './visualizer/SieveVisualizer';
import QuickSortVisualizer from './visualizer/QuickSortVisualizer';
import BFSVisualizer from './visualizer/BFSVisualizer';
import DFSVisualizer from './visualizer/DFSVisualizer';
import KosarajuVisualizer from './visualizer/KosarajuVisualizer';
import TopologicalSortVisualizer from './visualizer/TopologicalSortVisualizer';
import SplayTreeVisualizer from './visualizer/SplayTreeVisualizer';
import TrieVisualizer from './visualizer/TrieVisualizer';
import AVLTreeVisualizer from './visualizer/AVLTreeVisualizer';
import RedBlackTreeVisualizer from './visualizer/RedBlackTreeVisualizer';
import HeapVisualizer from './visualizer/HeapVisualizer';
import KnapsackVisualizer from './visualizer/KnapsackVisualizer';
import CoinChangeVisualizer from './visualizer/CoinChangeVisualizer';
import CoinChangeWaysVisualizer from './visualizer/CoinChangeWaysVisualizer';
import EditDistanceVisualizer from './visualizer/EditDistanceVisualizer';
import LCSVisualizer from './visualizer/LCSVisualizer';
import LISVisualizer from './visualizer/LISVisualizer';
import MatrixChainVisualizer from './visualizer/MatrixChainVisualizer';
import RodCuttingVisualizer from './visualizer/RodCuttingVisualizer';
import SubsetSumVisualizer from './visualizer/SubsetSumVisualizer';
import ActivitySelectionVisualizer from './visualizer/ActivitySelectionVisualizer';
import HuffmanCodingVisualizer from './visualizer/HuffmanCodingVisualizer';
import FractionalKnapsackVisualizer from './visualizer/FractionalKnapsackVisualizer';
import SentinelLinearSearchVisualizer from './visualizer/SentinelLinearSearchVisualizer';
import JobSequencingVisualizer from './visualizer/JobSequencingVisualizer';
import KMPVisualizer from './visualizer/KMPVisualizer';
import RabinKarpVisualizer from './visualizer/RabinKarpVisualizer';
import ZAlgorithmVisualizer from './visualizer/ZAlgorithmVisualizer';
import ManacherVisualizer from './visualizer/ManacherVisualizer';
import EuclideanGcdVisualizer from './visualizer/EuclideanGcdVisualizer';
import FastExponentiationVisualizer from './visualizer/FastExponentiationVisualizer';
import GenericVisualizer from './visualizer/GenericVisualizer';
import RatInMazeVisualizer from './visualizer/RatInMazeVisualizer';
import NQueensVisualizer from './visualizer/NQueensVisualizer';
import FloydCycleVisualizer from './visualizer/FloydCycleVisualizer';
import PrimsVisualizer from './visualizer/PrimsVisualizer';
import ComparisonVisualizer from './visualizer/ComparisonVisualizer';
import AStarVisualizer from './visualizer/AStarVisualizer';
import BoyerMooreVisualizer from './visualizer/BoyerMooreVisualizer';
import CocktailShakerVisualizer from './visualizer/CocktailShakerVisualizer';
import PalindromePartitioningVisualizer from './visualizer/PalindromePartitioningVisualizer';
import CombSortVisualizer from './visualizer/CombSortVisualizer';
import CountingSortVisualizer from './visualizer/CountingSortVisualizer';
import FibonacciSearchVisualizer from './visualizer/FibonacciSearchVisualizer';
import DijkstraVisualizer from './visualizer/DijkstraVisualizer';
import MergeSortVisualizer from './visualizer/MergeSortVisualizer';
import KruskalsVisualizer from './visualizer/KruskalsVisualizer';
import BitManipulationVisualizer from './visualizer/BitManipulationVisualizer';
import BellmanFordVisualizer from './visualizer/BellmanFordVisualizer';
import FloydWarshallVisualizer from './visualizer/FloydWarshallVisualizer';
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
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyEmailOtp from './pages/auth/VerifyEmailOtp';
import Leaderboard from './pages/Leaderboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminProfile from './pages/SuperAdminProfile';
import AdminReports from './pages/AdminReports';
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
import DailyChallengesManager from './components/admin/dashboard/DailyChallengesManager';
import SocialControlCenter from './components/admin/dashboard/SocialControlCenter';
import ProblemMasterList from './pages/admin/ProblemMasterList';
import AdminProblemStats from './pages/admin/AdminProblemStats';
import AdminMasterList from './pages/admin/AdminMasterList';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import TicketDashboard from './pages/admin/TicketDashboard';
import AdminProfile from './pages/admin/AdminProfile';

import { loadUser, logout } from './redux/slices/authSlice';
import { AUTH_LOGOUT_BROADCAST_KEY } from './utils/sessionIsolation';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [appReady, setAppReady] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const minVisibleTimer = new Promise((resolve) => setTimeout(resolve, 900));
      const maxVisibleTimer = new Promise((resolve) => setTimeout(resolve, 1150));

      const loadPromise = dispatch(loadUser());
      await Promise.race([
        Promise.allSettled([loadPromise, minVisibleTimer]),
        maxVisibleTimer
      ]);

      if (cancelled) return;
      setAppReady(true);
      
      // Signal that the app is ready to NetworkStatusHandler to clear slow connection timeout
      window.dispatchEvent(new CustomEvent('app-ready'));

      requestAnimationFrame(() => {
        if (!cancelled) setShowInitialLoader(false);
      });
    };
    init();

    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    const onStorageEvent = (event) => {
      if (!event) return;

      const logoutMarkerUpdated = event.key === AUTH_LOGOUT_BROADCAST_KEY && !!event.newValue;
      const tokenRemoved = event.key === 'token' && !event.newValue;
      if (!logoutMarkerUpdated && !tokenRemoved) return;

      // Keep navigation inside SPA to avoid static-host 404s on direct /login requests.
      dispatch(logout());
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('storage', onStorageEvent);
    return () => window.removeEventListener('storage', onStorageEvent);
  }, [dispatch, location.pathname, navigate]);

  // Hide Navbar for Problem Workspace (e.g., /coding-platform/two-sum) but show for list (/coding-platform)
  const shouldHideNavbar = /^\/coding-platform\/[^/]+$/.test(location.pathname);

  return (
    <NetworkStatusHandler>
      <div className="app-container">
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {appReady && (
          <>
            <TopProgressBar />
            {!shouldHideNavbar && <Navbar />}
            <PageTransition>
              <AppErrorBoundary key={`${location.pathname}${location.search}`}>
                <main className="main-content" style={{ paddingTop: shouldHideNavbar ? '0' : 'var(--nav-height)' }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    {/* Algorithms */}
                    <Route path="/algorithms" element={<Algorithms />} />
                    <Route path="/algorithms/sorting/bubble" element={<BubbleSortVisualizer />} />
                    <Route path="/algorithms/sorting/selection" element={<SelectionSortVisualizer />} />
                    <Route path="/algorithms/sorting/insertion" element={<InsertionSortVisualizer />} />
                    <Route path="/algorithms/sorting/shell" element={<ShellSortVisualizer />} />
                    <Route path="/algorithms/sorting/bucket" element={<BucketSortVisualizer />} />
                    <Route path="/algorithms/sorting/heap" element={<HeapSortVisualizer />} />
                    <Route path="/algorithms/sorting/cocktail-shaker" element={<CocktailShakerVisualizer />} />
                    <Route path="/algorithms/sorting/comb" element={<CombSortVisualizer />} />
                    <Route path="/algorithms/sorting/counting" element={<CountingSortVisualizer />} />
                    <Route path="/algorithms/sorting/radix" element={<RadixSortVisualizer />} />
                    <Route path="/algorithms/sorting/tim" element={<TimSortVisualizer />} />
                    <Route path="/algorithms/sorting/merge" element={<MergeSortVisualizer />} />
                    <Route path="/algorithms/sorting/cycle-sort" element={<CycleSortVisualizer />} />
                    <Route path="/algorithms/graphs/a-star" element={<AStarVisualizer />} />
                    <Route path="/algorithms/graphs/dijkstra" element={<DijkstraVisualizer />} />
                    <Route path="/algorithms/graphs/kruskals-mst" element={<KruskalsVisualizer />} />
                    <Route path="/algorithms/graphs/prims" element={<PrimsVisualizer />} />
                    {/* Generic Route for other algorithms */}
                    <Route path="/algorithms/backtracking/rat-in-maze" element={<RatInMazeVisualizer />} />
                    <Route path="/algorithms/backtracking/n-queens" element={<NQueensVisualizer />} />
                    <Route path="/algorithms/graphs/floyd-cycle" element={<FloydCycleVisualizer />} />
                    <Route path="/algorithms/graphs/floyd-warshall" element={<FloydWarshallVisualizer />} />
                    <Route path="/algorithms/string/boyer-moore" element={<BoyerMooreVisualizer />} />
                    <Route path="/algorithms/searching/binary" element={<BinarySearchVisualizer />} />
                    <Route path="/algorithms/searching/exponential-search" element={<ExponentialSearchVisualizer />} />
                    <Route path="/algorithms/searching/fibonacci-search" element={<FibonacciSearchVisualizer />} />
                    <Route path="/algorithms/searching/interpolation-search" element={<InterpolationSearchVisualizer />} />
                    <Route path="/algorithms/searching/jump-search" element={<JumpSearchVisualizer />} />
                    <Route path="/algorithms/searching/sentinel-linear" element={<SentinelLinearSearchVisualizer />} />

                    <Route path="/algorithms/math/sieve" element={<SieveVisualizer />} />
                    <Route path="/algorithms/sorting/quick" element={<QuickSortVisualizer />} />
                    <Route path="/algorithms/graphs/bfs" element={<BFSVisualizer />} />

                    <Route path="/algorithms/graphs/dfs" element={<DFSVisualizer />} />
                    <Route path="/algorithms/graphs/kosaraju" element={<KosarajuVisualizer />} />
                    <Route path="/algorithms/graphs/topological-sort" element={<TopologicalSortVisualizer />} />
                    <Route path="/algorithms/math/bit-manipulation" element={<BitManipulationVisualizer />} />
                    <Route path="/algorithms/trees/red-black-tree" element={<RedBlackTreeVisualizer />} />
                    <Route path="/algorithms/trees/splay" element={<SplayTreeVisualizer />} />
                    <Route path="/algorithms/trees/trie" element={<TrieVisualizer />} />
                    <Route path="/algorithms/trees/bst" element={<BSTVisualizer />} />
                    <Route path="/algorithms/trees/priority-queue" element={<HeapVisualizer />} />
                    <Route path="/algorithms/dp/knapsack" element={<KnapsackVisualizer />} />
                    <Route path="/algorithms/dp/coin-change" element={<CoinChangeVisualizer />} />
                    <Route path="/algorithms/dp/coin-change-ways" element={<CoinChangeWaysVisualizer />} />
                    <Route path="/algorithms/dp/subset-sum" element={<SubsetSumVisualizer />} />
                    <Route path="/algorithms/dp/edit-distance" element={<EditDistanceVisualizer />} />
                    <Route path="/algorithms/dp/lcs" element={<LCSVisualizer />} />


                    <Route path="/algorithms/dp/lis" element={<LISVisualizer />} />
                    <Route path="/algorithms/dp/matrix-chain" element={<MatrixChainVisualizer />} />
                    <Route path="/algorithms/dp/rod-cutting" element={<RodCuttingVisualizer />} />
                    <Route path="/algorithms/dp/egg-drop" element={<EggDropVisualizer />} />
                    <Route path="/algorithms/dp/palindrome-partitioning" element={<PalindromePartitioningVisualizer />} />

                    <Route path="/algorithms/greedy/activity-selection" element={<ActivitySelectionVisualizer />} />
                    <Route path="/algorithms/greedy/huffman" element={<HuffmanCodingVisualizer />} />
                    <Route path="/algorithms/greedy/fractional-knapsack" element={<FractionalKnapsackVisualizer />} />
                    <Route path="/algorithms/greedy/job-sequencing" element={<JobSequencingVisualizer />} />

                    <Route path="/algorithms/string/kmp" element={<KMPVisualizer />} />
                    <Route path="/algorithms/string/rabin-karp" element={<RabinKarpVisualizer />} />
                    <Route path="/algorithms/string/z-algorithm" element={<ZAlgorithmVisualizer />} />
                    <Route path="/algorithms/string/manacher" element={<ManacherVisualizer />} />


                    <Route path="/algorithms/math/euclidean-gcd" element={<EuclideanGcdVisualizer />} />
                    <Route path="/algorithms/math/fast-exponentiation" element={<FastExponentiationVisualizer />} />


                    {/* Trees */}
                    <Route path="/algorithms/trees/avl" element={<AVLTreeVisualizer />} />

                    {/* Fallback generic route for any other algorithm under /algorithms */}
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
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/verify-email-otp" element={<VerifyEmailOtp />} />
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
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="tickets" element={<TicketDashboard />} />
                        <Route path="daily-challenges" element={<DailyChallengesManager />} />
                        <Route path="social" element={<SocialControlCenter />} />
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
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="audit-logs" element={<AuditLogViewer />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="tickets" element={<TicketDashboard />} />
                        <Route path="daily-challenges" element={<DailyChallengesManager />} />
                        <Route path="social" element={<SocialControlCenter />} />
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
              </AppErrorBoundary>
            </PageTransition>
          </>
        )}
        <LoaderOverlay visible={showInitialLoader} message="Kramaa" />
      </div >
    </NetworkStatusHandler>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
