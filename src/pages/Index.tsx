
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import CategoryList from '@/components/categories/CategoryList';
import ProductGrid from '@/components/products/ProductGrid';
import { products } from '@/data/mockData';
import { Link } from 'react-router-dom';

const Index = () => {
  // Get featured products (first 4)
  const featuredProducts = products.slice(0, 4);
  
  // Get recent products (latest 8)
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  type="search"
                  placeholder="What are you looking for?"
                  className="pl-10 h-12 bg-white border-0 text-gray-900 shadow-lg"
                />
              </div>
              <Link to="/sell">
                <Button className="h-12 px-6 bg-white text-marketplace-primary hover:bg-gray-100 shadow-lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Sell an Item
                </Button>
              </Link>
            </div>
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
          <Link to="/featured" className="text-marketplace-primary hover:underline">
            View All
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      {/* Recent Products Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recently Added</h2>
          <Link to="/recent" className="text-marketplace-primary hover:underline">
            View All
          </Link>
        </div>
        <ProductGrid products={recentProducts} />
      </section>

      {/* Call to Action */}
      <section className="py-10 bg-gray-100 rounded-xl mb-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Have something to sell?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            List your items quickly and connect with buyers from your campus
          </p>
          <Link to="/sell">
            <Button className="bg-marketplace-primary hover:bg-indigo-600">
              <Plus className="h-5 w-5 mr-2" />
              Sell an Item
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
