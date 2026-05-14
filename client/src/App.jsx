import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import GlobalLoader from './components/GlobalLoader';

// Lazy Loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const Network = lazy(() => import('./pages/Network'));
const Impact = lazy(() => import('./pages/Impact'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const HIDashboard = lazy(() => import('./pages/hi/HIDashboard'));
const GCSDashboard = lazy(() => import('./pages/gcs/GCSDashboard'));
const IndividualDashboard = lazy(() => import('./pages/individual/IndividualDashboard'));
const HIAnalytics = lazy(() => import('./pages/hi/HIAnalytics'));
const HIEcosystem = lazy(() => import('./pages/hi/HIEcosystem'));
const HISettings = lazy(() => import('./pages/hi/HISettings'));
const HIOperations = lazy(() => import('./pages/hi/HIOperations'));
const HIEcoCoins = lazy(() => import('./pages/hi/HIEcoCoins'));
const HIOnboarding = lazy(() => import('./pages/hi/HIOnboarding'));
const HIMessages = lazy(() => import('./pages/hi/HIMessages'));

const GCSPartners = lazy(() => import('./pages/gcs/GCSPartners'));
const GCSRequests = lazy(() => import('./pages/gcs/GCSRequests'));
const GCSAnalytics = lazy(() => import('./pages/gcs/GCSAnalytics'));
const GCSEcosystem = lazy(() => import('./pages/gcs/GCSEcosystem'));
const GCSSettings = lazy(() => import('./pages/gcs/GCSSettings'));
const GCSOnboarding = lazy(() => import('./pages/gcs/GCSOnboarding'));
const GCSEquipment = lazy(() => import('./pages/gcs/GCSEquipment'));
const GCSMessages = lazy(() => import('./pages/gcs/GCSMessages'));
const IndividualAnalytics = lazy(() => import('./pages/individual/IndividualAnalytics'));
const IndividualEcosystem = lazy(() => import('./pages/individual/IndividualEcosystem'));
const IndividualSettings = lazy(() => import('./pages/individual/IndividualSettings'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setRole(session.user.user_metadata.role);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setRole(session.user.user_metadata.role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      if (session) {
        setRoleLoading(true);
        try {
          // Priority 1: Exact database record (Source of Truth)
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (data?.role) {
            setRole(data.role);
          } else {
            // Fallback: Auth Metadata if SQL profile isn't ready
            const metadataRole = session.user.user_metadata?.role || 'individual';
            setRole(metadataRole);
          }
        } catch (err) {
          console.error("Role resolution error:", err);
          setRole('individual');
        } finally {
          setRoleLoading(false);
        }
      }
    };
    
    checkRole();
  }, [session, role]);

  const [isProfileComplete, setIsProfileComplete] = useState(null);

  useEffect(() => {
    // Optimization: if we already confirmed completeness, skip DB hit
    if (isProfileComplete === true) return;

    // Hard blocker check for GCS specifically
    if (role === 'gcs' && session) {
       supabase.from('gcs_profiles').select('is_profile_complete').eq('id', session.user.id).single()
       .then(({ data }) => setIsProfileComplete(data?.is_profile_complete === true))
       .catch(() => setIsProfileComplete(false));
    } else if (role === 'hospitality' && session) {
       supabase.from('hospitality_profiles').select('is_profile_complete').eq('id', session.user.id).single()
       .then(({ data }) => setIsProfileComplete(data?.is_profile_complete === true))
       .catch(() => setIsProfileComplete(false));
    } else if (role && role !== 'gcs' && role !== 'hospitality') {
       setIsProfileComplete(true);
    }
  }, [role, session, location.pathname, isProfileComplete]);

  if (loading) {
    return <GlobalLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (roleLoading) {
    return <GlobalLoader />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
     console.error("Access denied for role:", role, "expected:", allowedRoles);
     return <Navigate to="/login" replace />;
  }

  // Interceptor for GCS/HI incomplete profiles
  if (role === 'gcs' || role === 'hospitality') {
     if (isProfileComplete === null) {
         return <GlobalLoader />; 
     }
     
     const onboardingPath = role === 'gcs' ? '/gcs/onboarding' : '/hi/onboarding';
     if (!isProfileComplete && window.location.pathname !== onboardingPath) {
         return <Navigate to={onboardingPath} replace />;
     }
  }

  return children;
};


function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          className: 'font-sans text-[11px] font-bold uppercase tracking-widest',
          style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '12px 20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          }
        }} 
      />
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/network" element={<Network />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/hi/*" element={<ProtectedRoute allowedRoles={['hospitality']}><HIDashboard /></ProtectedRoute>} />
          <Route path="/hi/analytics" element={<ProtectedRoute allowedRoles={['hospitality']}><HIAnalytics /></ProtectedRoute>} />
          <Route path="/hi/ecosystem" element={<ProtectedRoute allowedRoles={['hospitality']}><HIEcosystem /></ProtectedRoute>} />
          <Route path="/hi/settings" element={<ProtectedRoute allowedRoles={['hospitality']}><HISettings /></ProtectedRoute>} />
          <Route path="/hi/operations" element={<ProtectedRoute allowedRoles={['hospitality']}><HIOperations /></ProtectedRoute>} />
          <Route path="/hi/onboarding" element={<ProtectedRoute allowedRoles={['hospitality']}><HIOnboarding /></ProtectedRoute>} />
          <Route path="/hi/ecocoins" element={<ProtectedRoute allowedRoles={['hospitality']}><HIEcoCoins /></ProtectedRoute>} />
          <Route path="/hi/messages" element={<ProtectedRoute allowedRoles={['hospitality']}><HIMessages /></ProtectedRoute>} />
          <Route path="/hospitality/*" element={<Navigate to="/hi" replace />} />
          <Route path="/gcs/*" element={<ProtectedRoute allowedRoles={['gcs']}><GCSDashboard /></ProtectedRoute>} />
          <Route path="/gcs/onboarding" element={<ProtectedRoute allowedRoles={['gcs']}><GCSOnboarding /></ProtectedRoute>} />
          <Route path="/gcs/partners" element={<ProtectedRoute allowedRoles={['gcs']}><GCSPartners /></ProtectedRoute>} />
          <Route path="/gcs/requests" element={<ProtectedRoute allowedRoles={['gcs']}><GCSRequests /></ProtectedRoute>} />
          <Route path="/gcs/analytics" element={<ProtectedRoute allowedRoles={['gcs']}><GCSAnalytics /></ProtectedRoute>} />
          <Route path="/gcs/ecosystem" element={<ProtectedRoute allowedRoles={['gcs']}><GCSEcosystem /></ProtectedRoute>} />
          <Route path="/gcs/settings" element={<ProtectedRoute allowedRoles={['gcs']}><GCSSettings /></ProtectedRoute>} />
          <Route path="/gcs/equipment" element={<ProtectedRoute allowedRoles={['gcs']}><GCSEquipment /></ProtectedRoute>} />
          <Route path="/gcs/messages" element={<ProtectedRoute allowedRoles={['gcs']}><GCSMessages /></ProtectedRoute>} />
          <Route path="/individual/*" element={<ProtectedRoute allowedRoles={['individual']}><IndividualDashboard /></ProtectedRoute>} />
          <Route path="/individual/analytics" element={<ProtectedRoute allowedRoles={['individual']}><IndividualAnalytics /></ProtectedRoute>} />
          <Route path="/individual/ecosystem" element={<ProtectedRoute allowedRoles={['individual']}><IndividualEcosystem /></ProtectedRoute>} />
          <Route path="/individual/settings" element={<ProtectedRoute allowedRoles={['individual']}><IndividualSettings /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
