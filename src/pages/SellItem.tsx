import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categories } from '@/data/mockData';
import { UploadCloud, X } from 'lucide-react';
import { useJwtAuth } from '@/context/JwtAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useProducts } from '@/hooks/useProducts';

const SellItem = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useJwtAuth();
  const { useCreateProduct } = useProducts();
  const { mutate: createProduct, isPending } = useCreateProduct();
  
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  useEffect(() => {
    // Check if the user is authenticated
    if (!user || !token) {
      console.log("Auth check failed - redirecting to login", { user, token });
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a listing',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    } else {
      console.log("User authenticated", { userId: user.id });
    }
  }, [user, token, navigate, toast]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setImageFiles(prev => [...prev, ...newFiles]);
      
      // Generate previews for new files
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    try {
      setIsUploading(true);
      const imageUrls: string[] = [];
      
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${user!.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        imageUrls.push(data.publicUrl);
      }
      
      return imageUrls;
    } catch (error: any) {
      console.error('Error uploading images:', error.message);
      return [];
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check authentication
    if (!user || !token) {
      console.log("Submit check failed - redirecting to login", { user, token });
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a listing',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload images
      const imageUrls = await uploadImages();
      console.log('Uploaded image URLs:', imageUrls);
      
      // Use our API to create the product
      await createProduct({
        title,
        description,
        price: parseFloat(price),
        condition: condition as 'new' | 'like-new' | 'good' | 'fair' | 'poor',
        category,
        location,
        image_url: imageUrls.length > 0 ? imageUrls[0] : undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined
      });
      
      toast({
        title: 'Success',
        description: 'Your listing has been created',
      });
      
      // Navigate to home page after success
      navigate('/');
      
    } catch (error: any) {
      console.error('Error creating listing:', error);
      
      toast({
        title: 'Error creating listing',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sell an Item</h1>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Item Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Item Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="What are you selling?"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          required
                          value={category}
                          onValueChange={setCategory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="condition">Condition</Label>
                        <Select 
                          required
                          value={condition}
                          onValueChange={setCondition}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="like-new">Like New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="Where can buyers meet you?"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your item (condition, features, etc.)"
                        className="min-h-32"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Item Images */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Item Images</h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {imagePreviews.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={preview} 
                                alt={`Item preview ${index + 1}`} 
                                className="h-24 w-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          
                          {/* Add more images button */}
                          <label className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                            <span className="text-gray-500">+ Add</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                              disabled={isUploading || isPending}
                              multiple
                            />
                          </label>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                          First image will be used as the cover image for your listing.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-4">Drag and drop or click to upload</p>
                        
                        <label className="relative">
                          <Button type="button" variant="outline" disabled={isUploading || isPending}>
                            {isUploading ? 'Uploading...' : 'Select Images'}
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageChange}
                            disabled={isUploading || isPending}
                            multiple
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Clear images help your item sell faster. Add multiple angles for best results.
                  </p>
                </div>
                
                <Separator />
                
                {/* Submit */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading || isPending}>
                    {isUploading || isPending ? 'Processing...' : 'List Item'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SellItem;
