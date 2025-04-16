
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categories } from '@/data/mockData';
import { UploadCloud } from 'lucide-react';

const SellItem = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      // Simulate upload delay
      setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }, 1000);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the listing to the database
    
    // Show success message and redirect
    alert('Your item has been listed successfully!');
    navigate('/profile');
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
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="condition">Condition</Label>
                        <Select required>
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
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Item Image */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Item Image</h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Item preview" 
                          className="mx-auto max-h-64 rounded-lg"
                        />
                        <button
                          type="button"
                          className="mt-4 text-red-500 hover:text-red-700"
                          onClick={() => setImagePreview(null)}
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-4">Drag and drop or click to upload</p>
                        
                        <label className="relative">
                          <Button type="button" variant="outline" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Select Image'}
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageChange}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Clear images help your item sell faster. Include multiple angles if possible.
                  </p>
                </div>
                
                <Separator />
                
                {/* Submit */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                  <Button type="submit">List Item</Button>
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
