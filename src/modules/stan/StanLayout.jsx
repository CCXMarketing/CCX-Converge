import { useState } from 'react';
import StanChat from './StanChat';
import StanTools from './StanTools';

const StanLayout = () => {
  const [activePanel, setActivePanel] = useState('chat');
  const [splitView, setSplitView] = useState(true);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ADC837] to-[#02475A] flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#02475A]">Stan</h1>
              <p className="text-xs text-gray-500">AI-Powered Partner Intelligence Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile panel switcher */}
            <div className="flex items-center gap-1 lg:hidden bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActivePanel('chat')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activePanel === 'chat'
                    ? 'bg-[#02475A] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#02475A]'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActivePanel('tools')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activePanel === 'tools'
                    ? 'bg-[#02475A] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#02475A]'
                }`}
              >
                Tools
              </button>
            </div>

            {/* Desktop split toggle */}
            <button
              onClick={() => setSplitView(!splitView)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#02475A] hover:bg-gray-100 transition-colors"
            >
              {splitView ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Single View
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  Split View
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {splitView ? (
          <div className="hidden lg:grid lg:grid-cols-2 h-full divide-x divide-gray-200">
            <div className="h-full overflow-hidden flex flex-col">
              <StanChat />
            </div>
            <div className="h-full overflow-hidden flex flex-col">
              <StanTools />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex h-full">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setActivePanel('chat')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePanel === 'chat'
                      ? 'bg-[#02475A] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#02475A] hover:bg-white'
                  }`}
                >
                  Context Chat
                </button>
                <button
                  onClick={() => setActivePanel('tools')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePanel === 'tools'
                      ? 'bg-[#02475A] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#02475A] hover:bg-white'
                  }`}
                >
                  Tools
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {activePanel === 'chat' ? <StanChat /> : <StanTools />}
              </div>
            </div>
          </div>
        )}

        {/* Mobile */}
        <div className="lg:hidden h-full">
          {activePanel === 'chat' ? <StanChat /> : <StanTools />}
        </div>
      </div>
    </div>
  );
};

export default StanLayout;