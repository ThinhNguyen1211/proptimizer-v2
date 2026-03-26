import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { HelmetProvider } from 'react-helmet-async'
import { ArrowLeft } from 'lucide-react'
import { Hub } from 'aws-amplify/utils'
import proptimizerLogo256 from './assets/proptimizer-256x256.svg'
import Optimizer from './components/Optimizer'
import LandingPage from './pages/LandingPage'
import CustomAuth from './components/CustomAuth'
import Navbar from './components/Navbar'
import ChatPage from './pages/ChatPage'
import TemplatesPage from './pages/TemplatesPage'
import SettingsPage from './pages/SettingsPage'
import { syncTokenToExtension, clearExtensionTokens } from './utils/extensionSync'

function AppContent() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showLogin, setShowLogin] = useState(false);
  const [extensionSynced, setExtensionSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // User state monitoring
  }, [user, isAuthenticating]);

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          setIsAuthenticating(true);
          setTimeout(() => {
            window.location.href = '/optimizer';
          }, 500);
          break;
        case 'signedOut':
          clearExtensionTokens();
          setExtensionSynced(false);
          setIsAuthenticating(false);
          navigate('/', { replace: true });
          break;
        case 'tokenRefresh':
          break;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle deep linking for template sharing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deepLinkTemplateId = params.get('templateId');
    
    if (deepLinkTemplateId && !location.pathname.startsWith('/templates')) {
      window.history.replaceState({}, '', `/templates?templateId=${deepLinkTemplateId}`);
    }
  }, [location]);

  // Sync auth token to extension when user logs in (and periodically)
  useEffect(() => {
    if (user && !extensionSynced && !isSyncing) {
      setIsSyncing(true);
      syncTokenToExtension()
        .then(() => {
          setExtensionSynced(true);
        })
        .catch((err) => {
          console.warn('Extension sync failed (extension may not be installed):', err.message);
          setExtensionSynced(true);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
    
    // Also re-sync on page visibility change (user switches back to tab)
    if (user && extensionSynced) {
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          syncTokenToExtension().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      
      // Re-sync periodically (every 4 hours) to keep extension tokens valid
      const interval = setInterval(() => {
        syncTokenToExtension().catch(() => {});
      }, 4 * 60 * 60 * 1000);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [user, extensionSynced, isSyncing]);

  // Show loading state while authenticating
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 animate-pulse">
            <img src={proptimizerLogo256} alt="Proptimizer Logo" className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Signing you in...</h2>
          <p className="text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar 
          userEmail={user.signInDetails?.loginId}
          onSignOut={signOut}
        />

        <Routes>
          {/* Optimizer Route */}
          <Route path="/optimizer" element={
            <main className="flex-1 overflow-y-auto">
              <Optimizer isLoggedIn={!!user} />
            </main>
          } />

          {/* Chat Route */}
          <Route path="/chat" element={<ChatPage />} />

          {/* Templates Routes - SUB-ROUTES */}
          <Route path="/templates" element={<TemplatesPage view="feed" />} />
          <Route path="/templates/my-library" element={<TemplatesPage view="library" />} />
          <Route path="/templates/saved" element={<TemplatesPage view="saved" />} />

          {/* Settings Route */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/optimizer" replace />} />
          <Route path="*" element={<Navigate to="/optimizer" replace />} />
        </Routes>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 relative">
        <button
          onClick={() => setShowLogin(false)}
          className="absolute top-8 left-8 flex items-center space-x-2 text-gray-500 hover:text-[#00bcd4] transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <img src={proptimizerLogo256} alt="Proptimizer Logo" className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%] mb-3">Welcome to Proptimizer</h1>
            <p className="text-gray-500">Sign in to start optimizing your prompts with AI</p>
          </div>

          <CustomAuth />
        </div>
      </div>
    );
  }

  return <LandingPage onGetStarted={() => setShowLogin(true)} />;
}

function App() {
  return (
    <HelmetProvider>
      <Authenticator.Provider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </Authenticator.Provider>
    </HelmetProvider>
  );
}

export default App;
