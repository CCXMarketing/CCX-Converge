import { Search, UserCircle } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search…"
          className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#ADC837] focus:ring-1 focus:ring-[#ADC837]"
        />
      </div>

      {/* User avatar */}
      <button className="flex items-center gap-2 rounded-md p-1 text-gray-500 hover:bg-gray-100">
        <UserCircle size={28} />
      </button>
    </header>
  );
}
