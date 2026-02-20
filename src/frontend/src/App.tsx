import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import ReportListPage from './pages/ReportListPage';
import CreateReportPage from './pages/CreateReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AttackPathPage from './pages/AttackPathPage';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ReportListPage,
});

const createRoute_ = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreateReportPage,
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/report/$id',
  component: ReportDetailPage,
});

const attackPathRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attack-path',
  component: AttackPathPage,
});

const routeTree = rootRoute.addChildren([indexRoute, createRoute_, detailRoute, attackPathRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup if authenticated but no profile
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <RouterProvider router={router} />
      {showProfileSetup && <ProfileSetupModal />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}
