
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { products, users } from '@/data/mockData';
import ProductGrid from '@/components/products/ProductGrid';
import { User, Settings, MessageSquare, Package } from 'lucide-react';

const Profile = () => {
  // In a real app, this would come from authentication state
  const currentUser = users[0]; // Using the first user as the current user
  
  // Get user's products
  const userProducts = products.filter(product => product.sellerId === currentUser.id);
  
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* User info card */}
          <div className="w-full md:w-1/3">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name}
                    className="w-24 h-24 rounded-full mb-4"
                  />
                  <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                  <p className="text-gray-600 mb-2">{currentUser.department}</p>
                  <p className="text-gray-500 text-sm mb-4">Year {currentUser.year}</p>
                  
                  <Button variant="outline" className="w-full mb-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p>{currentUser.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                    <p>{new Date(currentUser.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
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
                <TabsTrigger value="messages" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex-1">
                  <User className="h-4 w-4 mr-2" />
                  Saved Items
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="listings">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Your Listings</h3>
                    <Button>Add New Listing</Button>
                  </div>
                  
                  {userProducts.length > 0 ? (
                    <ProductGrid products={userProducts} />
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-medium mb-2">No listings yet</h3>
                      <p className="text-gray-600 mb-4">You haven't listed any items for sale.</p>
                      <Button>Create Your First Listing</Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="messages">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6">Your Messages</h3>
                  
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">No messages yet</h3>
                    <p className="text-gray-600">
                      When you contact sellers or receive inquiries, they'll appear here.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="saved">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6">Saved Items</h3>
                  
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">No saved items</h3>
                    <p className="text-gray-600">
                      Items you save will appear here for easy access.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
