
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import JwtAuthForm from '@/components/auth/JwtAuthForm';
import { useJwtAuth } from '@/context/JwtAuthContext';

const JwtAuth: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useJwtAuth();

  useEffect(() => {
    // Redirect to home if already logged in
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <JwtAuthForm />
      </div>
    </MainLayout>
  );
};

export default JwtAuth;
