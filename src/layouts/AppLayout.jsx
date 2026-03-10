import { Outlet } from 'react-router-dom';
import Sidebar from '../shared/components/Sidebar';
import TopBar from '../shared/components/TopBar';
import { useAuth } from '../shared/contexts/AuthContext';
import LoginPage from '../shared/components/LoginPage';

export default function AppLayout() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#02475A]"></div>
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show the app if authenticated
  return (
    <div className="flex h-screen overflow-hidden font-['Nunito_Sans',sans-serif]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}