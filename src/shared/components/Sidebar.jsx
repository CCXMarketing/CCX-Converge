import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  Users,
  Search,
  Bot,
  Plug,
  BarChart3,
  GraduationCap,
  DollarSign,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/radar', label: 'Radar', icon: Radar },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/scout', label: 'Scout', icon: Search },
  { to: '/stan', label: 'Stan', icon: Bot },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/reporting', label: 'Reporting', icon: BarChart3 },
  { to: '/enablement', label: 'Enablement', icon: GraduationCap },
  { to: '/economics', label: 'Economics', icon: DollarSign },
];

export default function Sidebar() {
  return (
    <nav className="flex w-56 flex-col bg-[#404041]">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-lg font-bold text-white">Converge</span>
      </div>

      {/* Navigation */}
      <ul className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-[#ADC837]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
