
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getConditionBadgeColor = (condition: string) => {
    switch(condition) {
      case 'new': return 'bg-green-500';
      case 'like-new': return 'bg-green-400';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
        <div className="relative h-48 bg-gray-100">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          {product.condition && (
            <Badge className={`${getConditionBadgeColor(product.condition)} absolute top-2 right-2`}>
              {product.condition.replace('-', ' ')}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 flex-grow">
          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
          <p className="font-bold text-marketplace-primary text-lg mt-1">
            ${parseFloat(product.price).toFixed(2)}
          </p>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
        </CardContent>
        
        <CardFooter className="px-4 py-3 bg-gray-50 text-sm text-gray-500 flex justify-between">
          <span>{product.location}</span>
          <span>{formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}</span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
