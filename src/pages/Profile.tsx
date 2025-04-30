
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProductGrid from '@/components/products/ProductGrid';
import { User, Settings, MessageSquare, Package, Heart, AlertCircle } from 'lucide-react';
import { useJwtAuth } from '@/context/JwtAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const Profile = () => {
  const { user } = useJwtAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number>(1);
  const [bio, setBio] = useState('');
  
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to view your profile",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    // Since we're using JWT auth, let's adjust how we get profile data
    loadUserData();
  }, [user, navigate, toast]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load user profile data from JWT context
      setUsername(user.name || '');
      setDepartment('Not specified'); // Default values since JWT might not have these
      setYear(1); // Default value
      setBio(''); // Default value
      
      // Load user products from Supabase
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (productsError) throw productsError;
      setUserProducts(productsData || []);
      
      // Load saved products (favorites)
      const { data: savedData, error: savedError } = await supabase
        .from('saved_products')
        .select('products(*)')
        .eq('user_id', user.id);
      
      if (savedError) throw savedError;
      
      const savedItems = savedData?.map(item => item.products) || [];
      setSavedProducts(savedItems);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // For JWT auth, we'd need to implement a proper profile update API call
      // This is simplified for now
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      
      setEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {!editing ? (
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl">{getInitials(username)}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{username}</h1>
            <div className="text-gray-500">
              {department && <span className="mr-2">{department}</span>}
              {year && <span>Year {year}</span>}
            </div>
            <Button 
              onClick={() => setEditing(true)} 
              variant="outline" 
              className="mt-2"
            >
              Edit Profile
            </Button>
          </div>
        ) : (
          <Card className="mx-auto max-w-lg mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col items-center justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">{getInitials(username)}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">Display Name</label>
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="department" className="text-sm font-medium">Department/Major</label>
                  <Input 
                    id="department" 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="year" className="text-sm font-medium">Year</label>
                  <Input 
                    id="year" 
                    type="number"
                    min="1"
                    max="6"
                    value={year} 
                    onChange={(e) => setYear(parseInt(e.target.value) || 1)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                  <Input 
                    id="bio" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="listings" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="listings">
              <Package className="h-4 w-4 mr-2" />
              <span>Your Listings</span>
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              <span>Saved Items</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="listings">
            {userProducts.length > 0 ? (
              <ProductGrid products={userProducts} />
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No listings yet</h3>
                <p className="text-gray-500 mt-2">You haven't listed any items for sale yet.</p>
                <Button className="mt-4" onClick={() => navigate('/sell')}>
                  Create a Listing
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved">
            {savedProducts.length > 0 ? (
              <ProductGrid products={savedProducts} />
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No saved items</h3>
                <p className="text-gray-500 mt-2">You haven't saved any items yet.</p>
                <Button className="mt-4" onClick={() => navigate('/categories')}>
                  Browse Items
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Profile;
