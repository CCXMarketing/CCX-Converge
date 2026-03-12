import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import RadarLayout from './modules/radar/RadarLayout';
import ProspectListLayout from './modules/prospects/ProspectListLayout';
import EnablementLayout from './modules/enablement/EnablementLayout';
import EconomicsLayout from './modules/economics/EconomicsLayout';
import DashboardLayout from './modules/dashboard/DashboardLayout';
import ScoutLayout from './modules/scout/ScoutLayout';
import StanLayout from './modules/stan/StanLayout';
import ReportingLayout from './modules/reporting/ReportingLayout';
import IntegrationsLayout from './modules/integrations/IntegrationsLayout';
import { AuthProvider } from './shared/contexts/AuthContext';


// Placeholder component for modules not yet built
function Placeholder({ name }) {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <p className="text-lg text-gray-400">{name} — coming soon</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardLayout />} />
            <Route path="radar" element={<RadarLayout />} />
            <Route path="prospects" element={<ProspectListLayout />} />
            <Route path="scout" element={<ScoutLayout />} />
            <Route path="stan" element={<StanLayout />} />
            <Route path="integrations" element={<IntegrationsLayout />} />
            <Route path="reporting" element={<ReportingLayout />} />
            <Route path="enablement" element={<EnablementLayout />} />
            <Route path="economics" element={<EconomicsLayout />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
