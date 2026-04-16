import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AdminRedirectPage = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/admin');
    }
  }, []);

  if (typeof window === 'undefined') {
    return <Navigate to="/admin" replace />;
  }

  return null;
};

export default AdminRedirectPage;
