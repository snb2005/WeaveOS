import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface BrowserProps {
  isElectron?: boolean;
}

const Browser: React.FC<BrowserProps> = ({ isElectron = false }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: 'New Tab',
      url: 'about:blank',
      isActive: true,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
    }
  ]);
  
  const [addressBarValue, setAddressBarValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: '1', title: 'Google', url: 'https://www.google.com', favicon: '🔍' },
    { id: '2', title: 'GitHub', url: 'https://github.com', favicon: '🐙' },
    { id: '3', title: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: '📚' },
    { id: '4', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', favicon: '🦎' },
    { id: '5', title: 'IPFS Gateway', url: 'https://ipfs.io', favicon: '🌐' },
  ]);
  
  const [showBookmarkBar, setShowBookmarkBar] = useState(true);
  const webviewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find(tab => tab.isActive);

  // Check if running in Electron environment
  const isElectronEnvironment = useCallback(() => {
    return typeof window !== 'undefined' && 
           (window as any).require && 
           (window as any).process?.type;
  }, []);

  useEffect(() => {
    if (activeTab) {
      setAddressBarValue(activeTab.url === 'about:blank' ? '' : activeTab.url);
    }
  }, [activeTab]);

  // Electron-specific webview handling
  useEffect(() => {
    if (isElectronEnvironment() && webviewRef.current) {
      const webview = webviewRef.current;
      
      webview.addEventListener('did-start-loading', () => {
        if (activeTab) {
          updateTabLoading(activeTab.id, true);
        }
      });

      webview.addEventListener('did-stop-loading', () => {
        if (activeTab) {
          updateTabLoading(activeTab.id, false);
          updateTabTitle(activeTab.id, webview.getTitle() || 'Untitled');
          setTabs(prev => prev.map(tab => 
            tab.isActive ? { 
              ...tab, 
              canGoBack: webview.canGoBack(),
              canGoForward: webview.canGoForward()
            } : tab
          ));
        }
      });

      webview.addEventListener('page-favicon-updated', (event: any) => {
        if (activeTab && event.favicons && event.favicons.length > 0) {
          updateTabFavicon(activeTab.id, event.favicons[0]);
        }
      });

      webview.addEventListener('new-window', (event: any) => {
        event.preventDefault();
        createNewTab(event.url);
      });
    }
  }, [activeTab, isElectronEnvironment]);

  const createNewTab = (url: string = 'about:blank') => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'New Tab',
      url,
      isActive: true,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
    };

    setTabs(prev => prev.map(tab => ({ ...tab, isActive: false })).concat(newTab));
    if (url !== 'about:blank') {
      navigate(url);
    }
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (newTabs.length === 0) {
        return [{
          id: Date.now().toString(),
          title: 'New Tab',
          url: 'about:blank',
          isActive: true,
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
        }];
      }
      
      const closedTab = prev.find(tab => tab.id === tabId);
      if (closedTab?.isActive && newTabs.length > 0) {
        newTabs[0].isActive = true;
      }
      
      return newTabs;
    });
  };

  const switchTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
  };

  const updateTabTitle = (tabId: string, title: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, title: title.slice(0, 50) } : tab
    ));
  };

  const updateTabLoading = (tabId: string, isLoading: boolean) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, isLoading } : tab
    ));
  };

  const updateTabFavicon = (tabId: string, favicon: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, favicon } : tab
    ));
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const processUrl = (input: string): string => {
    const trimmed = input.trim();
    
    // Handle special Chromium pages
    if (trimmed.startsWith('chrome://')) {
      if (trimmed === 'chrome://dino') {
        return 'data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Chrome Dino Game</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 90vh;
              }
              .game-container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              .dino {
                font-size: 48px;
                animation: bounce 2s infinite;
              }
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
              }
              .instructions {
                margin: 20px 0;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="game-container">
              <h1 style="color: #535353; margin-bottom: 20px;">🦕 Chrome Dino Game</h1>
              <div class="dino">🦕</div>
              <div class="instructions">
                <p>Press <kbd>Spacebar</kbd> to start the game!</p>
                <p><em>Note: This is a demonstration. The actual Chrome Dino game is available when offline.</em></p>
              </div>
            </div>
            <script>
              document.addEventListener('keydown', function(e) {
                if (e.code === 'Space') {
                  alert('🦕 DINO JUMP! In the real Chrome browser, this would start the offline dinosaur game.');
                }
              });
            </script>
          </body>
          </html>
        `);
      }
      // Handle other chrome:// pages
      return trimmed;
    }
    
    // Handle IPFS protocol
    if (trimmed.startsWith('ipfs://')) {
      const hash = trimmed.slice(7);
      return `https://ipfs.io/ipfs/${hash}`;
    }
    
    // Handle file:// protocol for local HTML files
    if (trimmed.startsWith('file://') || trimmed.endsWith('.html') || trimmed.endsWith('.htm')) {
      if (!trimmed.startsWith('file://') && !isValidUrl(trimmed)) {
        return `file://${trimmed}`;
      }
      return trimmed;
    }
    
    // If it's already a valid URL, use it
    if (isValidUrl(trimmed)) {
      return trimmed;
    }
    
    // If it doesn't have a protocol and doesn't look like a search query, add https://
    if (!trimmed.includes(' ') && (trimmed.includes('.') || trimmed.includes(':'))) {
      return `https://${trimmed}`;
    }
    
    // Otherwise, treat as Google search
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  };

  const navigate = (url: string) => {
    if (!activeTab) return;
    
    const processedUrl = processUrl(url);
    
    // Update tab URL
    setTabs(prev => prev.map(tab => 
      tab.isActive ? { 
        ...tab, 
        url: processedUrl, 
        isLoading: true,
        title: 'Loading...',
        canGoBack: false,
        canGoForward: false
      } : tab
    ));
    
    // Update history
    setHistory(prev => {
      const newHistory = [...prev, processedUrl];
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
    
    setAddressBarValue(processedUrl);

    // Navigate using appropriate method
    if (isElectronEnvironment() && webviewRef.current) {
      webviewRef.current.loadURL(processedUrl);
    } else if (iframeRef.current) {
      iframeRef.current.src = processedUrl;
    }
  };

  const goBack = () => {
    if (isElectronEnvironment() && webviewRef.current && webviewRef.current.canGoBack()) {
      webviewRef.current.goBack();
    } else if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const url = history[newIndex];
      setHistoryIndex(newIndex);
      navigate(url);
    }
  };

  const goForward = () => {
    if (isElectronEnvironment() && webviewRef.current && webviewRef.current.canGoForward()) {
      webviewRef.current.goForward();
    } else if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const url = history[newIndex];
      setHistoryIndex(newIndex);
      navigate(url);
    }
  };

  const reload = () => {
    if (isElectronEnvironment() && webviewRef.current) {
      webviewRef.current.reload();
    } else if (activeTab && iframeRef.current) {
      updateTabLoading(activeTab.id, true);
      iframeRef.current.src = activeTab.url;
    }
  };

  const addBookmark = () => {
    if (!activeTab || activeTab.url === 'about:blank') return;
    
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title: activeTab.title,
      url: activeTab.url,
      favicon: activeTab.favicon || '🔖'
    };
    
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const removeBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
  };

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(addressBarValue);
  };

  const handleIframeLoad = () => {
    if (activeTab) {
      updateTabLoading(activeTab.id, false);
      
      try {
        if (iframeRef.current?.contentDocument) {
          const title = iframeRef.current.contentDocument.title || 'Untitled';
          updateTabTitle(activeTab.id, title);
        }
      } catch (e) {
        updateTabTitle(activeTab.id, new URL(activeTab.url).hostname);
      }
    }
  };

  const renderContent = () => {
    if (!activeTab || activeTab.url === 'about:blank') {
      return (
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-center max-w-4xl mx-auto p-8">
            <h1 className="text-5xl font-light text-gray-800 mb-6">Weave Browser</h1>
            <p className="text-gray-600 mb-8 text-lg">Start browsing by entering a URL or search term above</p>
            
            {/* Quick Access Grid */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6 max-w-3xl mx-auto mb-8">
              {bookmarks.slice(0, 10).map(bookmark => (
                <button
                  key={bookmark.id}
                  onClick={() => navigate(bookmark.url)}
                  className="group p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                    {bookmark.favicon}
                  </div>
                  <div className="text-sm font-medium text-gray-800">{bookmark.title}</div>
                </button>
              ))}
            </div>

            {/* Search Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => navigate('chrome://dino')}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="text-xl mb-2">🦕</div>
                <div className="text-sm font-medium text-blue-800">Chrome Dino</div>
              </button>
              <button
                onClick={() => navigate('ipfs://QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o')}
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="text-xl mb-2">🌐</div>
                <div className="text-sm font-medium text-purple-800">IPFS Demo</div>
              </button>
              <button
                onClick={() => navigate('example.html')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="text-xl mb-2">📄</div>
                <div className="text-sm font-medium text-green-800">Local HTML</div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Render Electron webview if available
    if (isElectronEnvironment()) {
      return (
        <div className="relative w-full h-full">
          <webview
            ref={webviewRef}
            src={activeTab.url}
            className="w-full h-full"
            allowpopups={true}
            webpreferences="contextIsolation=yes,nodeIntegration=no"
          />
          {activeTab.isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">Loading...</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback to iframe for non-Electron environments
    return (
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          src={activeTab.url}
          className="w-full h-full border-none"
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads"
          title={activeTab.title}
        />
        {activeTab.isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600 font-medium">Loading...</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Bar */}
      <div className="flex bg-gray-100 border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`group flex items-center min-w-48 max-w-64 px-4 py-3 border-r border-gray-200 cursor-pointer relative ${
                tab.isActive ? 'bg-white' : 'bg-gray-100 hover:bg-gray-50'
              }`}
              onClick={() => switchTab(tab.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                {tab.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3 flex-shrink-0"></div>
                ) : (
                  <span className="mr-3 text-sm flex-shrink-0">{tab.favicon || '🌐'}</span>
                )}
                <span className="text-sm truncate text-gray-800 font-medium">{tab.title}</span>
              </div>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-2 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <span className="text-xs text-gray-500">✕</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => createNewTab()}
          className="flex items-center justify-center w-12 bg-gray-100 hover:bg-gray-50 border-r border-gray-200 transition-colors"
        >
          <span className="text-lg text-gray-600">+</span>
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center p-3 bg-white border-b border-gray-200 gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">←</span>
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">→</span>
          </button>
          <button
            onClick={reload}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            <span className="text-lg">⟳</span>
          </button>
        </div>

        <form onSubmit={handleAddressBarSubmit} className="flex-1 mx-4">
          <input
            type="text"
            value={addressBarValue}
            onChange={(e) => setAddressBarValue(e.target.value)}
            placeholder="Search Google or type a URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-1">
          <button
            onClick={addBookmark}
            disabled={!activeTab || activeTab.url === 'about:blank'}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Add bookmark"
          >
            <span className="text-lg">⭐</span>
          </button>
          <button
            onClick={() => setShowBookmarkBar(!showBookmarkBar)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Toggle bookmark bar"
          >
            <span className="text-lg">📖</span>
          </button>
        </div>
      </div>

      {/* Bookmark Bar */}
      {showBookmarkBar && (
        <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          {bookmarks.map(bookmark => (
            <button
              key={bookmark.id}
              onClick={() => navigate(bookmark.url)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap text-sm border border-gray-200 group"
            >
              <span className="text-sm">{bookmark.favicon}</span>
              <span className="text-gray-800 font-medium">{bookmark.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(bookmark.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                ✕
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default Browser;
