
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Product } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link to={`/product/${product.id}`}>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
        <div className="relative h-48 bg-gray-100">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <CardContent className="p-4 flex-grow">
          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
          <p className="font-bold text-marketplace-primary text-lg mt-1">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
        </CardContent>
        
        <CardFooter className="px-4 py-3 bg-gray-50 text-sm text-gray-500 flex justify-between">
          <span>{product.location}</span>
          <span>{formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}</span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
