
import React from 'react';
import { Link } from 'react-router-dom';
import { categories, Category } from '@/data/mockData';
import { 
  Book, Beaker, Cpu, PenTool, Wrench, FileText 
} from 'lucide-react';

interface CategoryItemProps {
  category: Category;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category }) => {
  const getIcon = () => {
    switch (category.icon) {
      case 'book':
        return <Book className="h-6 w-6" />;
      case 'flask':
        return <Beaker className="h-6 w-6" />;
      case 'cpu':
        return <Cpu className="h-6 w-6" />;
      case 'pen-tool':
        return <PenTool className="h-6 w-6" />;
      case 'tool':
        return <Wrench className="h-6 w-6" />;
      case 'file-text':
        return <FileText className="h-6 w-6" />;
      default:
        return <Book className="h-6 w-6" />;
    }
  };

  return (
    <Link 
      to={`/categories/${category.id}`} 
      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-marketplace-primary bg-opacity-10 text-marketplace-primary mb-3">
        {getIcon()}
      </div>
      <h3 className="font-medium text-center">{category.name}</h3>
    </Link>
  );
};

const CategoryList: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </div>
  );
};

export default CategoryList;
