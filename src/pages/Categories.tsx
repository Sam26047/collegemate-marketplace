
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Link } from 'react-router-dom';
import { categories, products } from '@/data/mockData';
import { 
  Book, Flask, Cpu, PenTool, Tool, FileText, ChevronRight 
} from 'lucide-react';

const Categories = () => {
  // Function to get icon component based on icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'book':
        return <Book className="h-6 w-6" />;
      case 'flask':
        return <Flask className="h-6 w-6" />;
      case 'cpu':
        return <Cpu className="h-6 w-6" />;
      case 'pen-tool':
        return <PenTool className="h-6 w-6" />;
      case 'tool':
        return <Tool className="h-6 w-6" />;
      case 'file-text':
        return <FileText className="h-6 w-6" />;
      default:
        return <Book className="h-6 w-6" />;
    }
  };

  // Function to count products in a category
  const getProductCount = (categoryId: string) => {
    return products.filter(product => product.category === categoryId).length;
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Browse Categories</h1>
        
        <div className="space-y-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}`}
              className="flex items-center justify-between p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-marketplace-primary bg-opacity-10 text-marketplace-primary mr-4">
                  {getIcon(category.icon)}
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{category.name}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-500">
                <span className="mr-2">{getProductCount(category.id)} items</span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Categories;
