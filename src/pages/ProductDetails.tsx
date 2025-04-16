
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ArrowLeft, Heart, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ProductGrid from '@/components/products/ProductGrid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<any | null>(null);
  const [seller, setSeller] = useState<any | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [bids, setBids] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        setProduct(productData);
        
        // Fetch seller profile
        if (productData) {
          const { data: sellerData, error: sellerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', productData.seller_id)
            .single();
          
          if (!sellerError) {
            setSeller(sellerData);
          }
          
          // Fetch similar products
          const { data: similarData } = await supabase
            .from('products')
            .select('*')
            .eq('category', productData.category)
            .neq('id', id)
            .limit(4);
          
          setSimilarProducts(similarData || []);
          
          // Fetch bids
          const { data: bidsData } = await supabase
            .from('bids')
            .select('*, profiles:bidder_id(*)')
            .eq('product_id', id)
            .order('amount', { ascending: false });
          
          setBids(bidsData || []);
          
          // Check if user has favorited this product
          if (user) {
            const { data: favoriteData } = await supabase
              .from('favorites')
              .select('*')
              .eq('user_id', user.id)
              .eq('product_id', id)
              .single();
            
            setIsFavorite(!!favoriteData);
          }
        }
      } catch (error: any) {
        console.error('Error fetching product:', error.message);
        toast({
          title: 'Error',
          description: 'Could not load product details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProductDetails();
    }
  }, [id, user, toast]);

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to send messages',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    if (!messageText.trim()) return;
    
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: product.seller_id,
        content: messageText,
        product_id: id,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Message sent',
        description: 'The seller will be notified of your message',
      });
      
      setMessageText('');
      setMessageOpen(false);
      
      // Navigate to messages
      navigate('/messages');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not send message',
        variant: 'destructive',
      });
    }
  };

  const handlePlaceBid = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to place bids',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid bid amount',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if bid is higher than current price
    if (amount <= product.price) {
      toast({
        title: 'Bid too low',
        description: 'Your bid must be higher than the current price',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if bid is higher than highest bid
    if (bids.length > 0 && amount <= bids[0].amount) {
      toast({
        title: 'Bid too low',
        description: 'Your bid must be higher than the current highest bid',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase.from('bids').insert({
        product_id: id,
        bidder_id: user.id,
        amount,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Bid placed',
        description: 'Your bid has been successfully placed',
      });
      
      setBidAmount('');
      
      // Refresh bids
      const { data: bidsData } = await supabase
        .from('bids')
        .select('*, profiles:bidder_id(*)')
        .eq('product_id', id)
        .order('amount', { ascending: false });
      
      setBids(bidsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not place bid',
        variant: 'destructive',
      });
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save items',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        if (error) throw error;
        
        setIsFavorite(false);
        toast({
          title: 'Removed from saved items',
          description: 'This item has been removed from your saved items',
        });
      } else {
        // Add to favorites
        const { error } = await supabase.from('favorites').insert({
          user_id: user.id,
          product_id: id,
        });
        
        if (error) throw error;
        
        setIsFavorite(true);
        toast({
          title: 'Saved',
          description: 'This item has been saved to your profile',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not update saved items',
        variant: 'destructive',
      });
    }
  };

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

  const renderSkeleton = () => (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-10 w-1/2 mb-4" />
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-1 w-full mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        {renderSkeleton()}
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isOwner = user && product.seller_id === user.id;
  const highestBid = bids.length > 0 ? bids[0] : null;

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
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.title}
                className="w-full h-auto object-cover aspect-video"
              />
            ) : (
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-marketplace-primary mb-4">
                  ${product.price.toFixed(2)}
                </p>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={toggleFavorite}
                  className={isFavorite ? "text-red-500" : ""}
                >
                  <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
                </Button>
              </div>
              
              <div className="flex items-center mb-4">
                <Badge className={`${getConditionBadgeColor(product.condition)} mr-2`}>
                  {product.condition.replace('-', ' ')}
                </Badge>
                <span className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
                </span>
              </div>

              <Separator className="my-4" />
              
              {seller && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Seller</h3>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      {seller.avatar_url ? (
                        <AvatarImage src={seller.avatar_url} alt={seller.username} />
                      ) : (
                        <AvatarFallback>{seller.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{seller.username}</p>
                      <p className="text-sm text-gray-500">
                        {seller.department} {seller.year ? `• Year ${seller.year}` : ''}
                      </p>
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

              {!isOwner && (
                <>
                  <Button 
                    className="w-full mb-3"
                    onClick={() => setMessageOpen(!messageOpen)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                  
                  {messageOpen && (
                    <div className="mt-4">
                      <Textarea
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Description and Bids */}
      <div className="mt-8">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="bids">
              Bids {bids.length > 0 ? `(${bids.length})` : ''}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="description">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <p className="whitespace-pre-line text-gray-700">{product.description}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="bids">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Bids</h2>
              
              {!isOwner && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Place a Bid</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <Input
                        type="number"
                        min={product.price + 0.01}
                        step="0.01"
                        placeholder="Enter amount"
                        className="pl-7"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={handlePlaceBid}>
                      Place Bid
                    </Button>
                  </div>
                  {highestBid && (
                    <p className="text-sm text-gray-500 mt-2">
                      Current highest bid: ${highestBid.amount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              
              {bids.length > 0 ? (
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <div key={bid.id} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            {bid.profiles?.avatar_url ? (
                              <AvatarImage src={bid.profiles.avatar_url} alt={bid.profiles.username} />
                            ) : (
                              <AvatarFallback>{bid.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{bid.profiles?.username || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-marketplace-primary">
                          ${bid.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No bids yet. Be the first to bid on this item!</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
