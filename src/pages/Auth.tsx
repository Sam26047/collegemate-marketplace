
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import JwtAuthForm from '@/components/auth/JwtAuthForm';
import { useJwtAuth } from '@/context/JwtAuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, setRedirectPath } = useJwtAuth();

  // Handle redirects from URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const redirect = queryParams.get('redirect');
    
    if (redirect) {
      console.log("Setting redirect path:", redirect);
      setRedirectPath(redirect);
    }
  }, [location.search, setRedirectPath]);

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
      toast({
        title: "Already signed in",
        description: "You are already signed in to your account.",
      });
    }
  }, [user, navigate, toast]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Campus Marketplace
            </CardTitle>
            <CardDescription className="text-center">
              Connect with other students to buy and sell items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JwtAuthForm />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Auth;
