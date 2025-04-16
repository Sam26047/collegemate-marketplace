
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { categories, products } from '@/data/mockData';
import { ArrowLeft } from 'lucide-react';

const CategoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  
  // Find the category by id
  const category = categories.find(c => c.id === id);
  
  // Filter products by category
  const categoryProducts = products.filter(product => product.category === id);

  if (!category) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
          <p className="mb-6">The category you're looking for doesn't exist.</p>
          <Link to="/categories">
            <button className="text-marketplace-primary hover:underline">
              View All Categories
            </button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <Link to="/categories" className="inline-flex items-center text-marketplace-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to categories
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      <p className="text-gray-600 mb-8">{category.description}</p>

      {categoryProducts.length > 0 ? (
        <ProductGrid products={categoryProducts} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">There are currently no items in this category.</p>
        </div>
      )}
    </MainLayout>
  );
};

export default CategoryDetails;
