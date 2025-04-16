
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import CategoryList from '@/components/categories/CategoryList';
import ProductGrid from '@/components/products/ProductGrid';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch featured products (random selection)
      const { data: featuredData } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .limit(4);
      
      setFeaturedProducts(featuredData || []);
      
      // Fetch recent products
      const { data: recentData } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8);
      
      setRecentProducts(recentData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/categories?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-marketplace-primary to-indigo-500 rounded-xl text-white mb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Buy and sell within your campus community
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Find textbooks, lab equipment, study materials and more from fellow students
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  type="search"
                  placeholder="What are you looking for?"
                  className="pl-10 h-12 bg-white border-0 text-gray-900 shadow-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link to="/sell">
                <Button className="h-12 px-6 bg-white text-marketplace-primary hover:bg-gray-100 shadow-lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Sell an Item
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Browse Categories</h2>
          <Link to="/categories" className="text-marketplace-primary hover:underline">
            View All
          </Link>
        </div>
        <CategoryList />
      </section>

      {/* Featured Products Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Items</h2>
          <Link to="/categories" className="text-marketplace-primary hover:underline">
            View All
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-full">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-12 w-full rounded-b-lg" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No featured items available at the moment.</p>
          </div>
        )}
      </section>

      {/* Recent Products Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recently Added</h2>
          <Link to="/categories" className="text-marketplace-primary hover:underline">
            View All
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-full">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-12 w-full rounded-b-lg" />
              </div>
            ))}
          </div>
        ) : recentProducts.length > 0 ? (
          <ProductGrid products={recentProducts} />
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No recent items available at the moment.</p>
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="py-10 bg-gray-100 rounded-xl mb-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Have something to sell?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            List your items quickly and connect with buyers from your campus
          </p>
          {user ? (
            <Link to="/sell">
              <Button className="bg-marketplace-primary hover:bg-indigo-600">
                <Plus className="h-5 w-5 mr-2" />
                Sell an Item
              </Button>
            </Link>
          ) : (
            <div className="space-y-2">
              <Link to="/auth">
                <Button className="bg-marketplace-primary hover:bg-indigo-600">
                  Sign In to Sell
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                You need to be signed in to list items for sale
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
