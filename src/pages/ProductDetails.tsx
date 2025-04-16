
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, ArrowLeft, User, MapPin, Calendar } from 'lucide-react';
import { products, users, Product, User } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import ProductGrid from '@/components/products/ProductGrid';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Find the product by id
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Find the seller
  const seller = users.find(u => u.id === product.sellerId);
  
  // Find similar products (same category, excluding this product)
  const similarProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const getConditionBadgeColor = (condition: Product['condition']) => {
    switch(condition) {
      case 'new': return 'bg-green-500';
      case 'like-new': return 'bg-green-400';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, this would send the message to the backend
      alert(`Message sent: ${messageText}`);
      setMessageText('');
      setMessageOpen(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-marketplace-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to listings
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Image */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            <img 
              src={product.imageUrl} 
              alt={product.title}
              className="w-full h-auto object-cover aspect-video"
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <p className="text-3xl font-bold text-marketplace-primary mb-4">
                ${product.price.toFixed(2)}
              </p>
              
              <div className="flex items-center mb-4">
                <Badge className={`${getConditionBadgeColor(product.condition)} mr-2`}>
                  {product.condition.replace('-', ' ')}
                </Badge>
                <span className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                </span>
              </div>

              <Separator className="my-4" />
              
              {seller && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Seller</h3>
                  <div className="flex items-center">
                    <img 
                      src={seller.avatar} 
                      alt={seller.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-gray-500">{seller.department}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{product.location}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mb-3"
                onClick={() => setMessageOpen(!messageOpen)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
              
              {messageOpen && (
                <div className="mt-4">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full p-3 border border-gray-300 rounded-md mb-3 min-h-24"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="w-full"
                  >
                    Send Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Description</h2>
        <p className="whitespace-pre-line text-gray-700">{product.description}</p>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6">Similar Items</h2>
          <ProductGrid products={similarProducts} />
        </section>
      )}
    </MainLayout>
  );
};

export default ProductDetails;
