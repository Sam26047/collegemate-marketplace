
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ProductGrid from '@/components/products/ProductGrid';
import { User, Settings, MessageSquare, Package, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  
  // Edit profile state
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number>(1);
  const [bio, setBio] = useState('');
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to view your profile',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    // Load user data
    if (profile) {
      setUsername(profile.username || '');
      setDepartment(profile.department || '');
      setYear(profile.year || 1);
      setBio(profile.bio || '');
    }
    
    loadUserData();
  }, [user, profile, navigate, toast]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (productsError) throw productsError;
      setUserProducts(productsData || []);
      
      // Fetch favorite products
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('*, products(*)')
        .eq('user_id', user.id);
      
      if (favoritesError) throw favoritesError;
      
      const favorites = favoritesData?.map(fav => fav.products) || [];
      setFavoriteProducts(favorites);
    } catch (error: any) {
      console.error('Error loading user data:', error.message);
      toast({
        title: 'Error',
        description: 'Could not load your profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          department,
          year,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      
      setEditing(false);
      refreshProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please sign in to view your profile.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MainLayout>
    );
  }

  const renderSkeleton = () => (
    <div className="flex flex-col md:flex-row gap-8 mb-10">
      <div className="w-full md:w-1/3">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
            </div>
            <Skeleton className="h-1 w-full my-6" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-full md:w-2/3">
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {loading ? (
          renderSkeleton()
        ) : (
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            {/* User info card */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardContent className="p-6">
                  {editing ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold mb-2">Edit Profile</h2>
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          Username
                        </label>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          className="mb-3"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          Department
                        </label>
                        <Input
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="mb-3"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          Year
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="6"
                          value={year}
                          onChange={(e) => setYear(parseInt(e.target.value) || 1)}
                          className="mb-3"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          Bio
                        </label>
                        <Input
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself"
                          className="mb-4"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateProfile}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                          <User className="h-12 w-12 text-gray-500" />
                        </div>
                        <h2 className="text-2xl font-bold">{profile?.username || user.email}</h2>
                        <p className="text-gray-600 mb-2">{profile?.department || 'Department not specified'}</p>
                        {profile?.year && (
                          <p className="text-gray-500 text-sm mb-4">Year {profile.year}</p>
                        )}
                        
                        <Button variant="outline" className="w-full mb-2" onClick={() => setEditing(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                          <p>{user.email}</p>
                        </div>
                        {profile?.bio && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
                            <p>{profile.bio}</p>
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                          <p>{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs section */}
            <div className="w-full md:w-2/3">
              <Tabs defaultValue="listings">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="listings" className="flex-1">
                    <Package className="h-4 w-4 mr-2" />
                    My Listings
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Saved Items
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="listings">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Your Listings</h3>
                      <Button onClick={() => navigate('/sell')}>Add New Listing</Button>
                    </div>
                    
                    {userProducts.length > 0 ? (
                      <ProductGrid products={userProducts} />
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No listings yet</h3>
                        <p className="text-gray-600 mb-4">You haven't listed any items for sale.</p>
                        <Button onClick={() => navigate('/sell')}>Create Your First Listing</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="saved">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-6">Saved Items</h3>
                    
                    {favoriteProducts.length > 0 ? (
                      <ProductGrid products={favoriteProducts} />
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No saved items</h3>
                        <p className="text-gray-600 mb-4">
                          Items you save will appear here for easy access.
                        </p>
                        <Button onClick={() => navigate('/')}>Browse Items</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="messages">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-6">Your Messages</h3>
                    
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Messages Center</h3>
                      <p className="text-gray-600 mb-4">
                        View and manage your conversations with buyers and sellers.
                      </p>
                      <Button onClick={() => navigate('/messages')}>Go to Messages</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;
