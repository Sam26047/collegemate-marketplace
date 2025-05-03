
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ProductCreate, ProductUpdate, ProductFilter } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get products list with filters
  const useProductsList = (filters: ProductFilter = {}) => {
    return useQuery({
      queryKey: ['products', filters],
      queryFn: () => api.products.list(filters),
    });
  };

  // Get single product by ID
  const useProduct = (id: string) => {
    return useQuery({
      queryKey: ['product', id],
      queryFn: () => api.products.getById(id),
      enabled: !!id,
    });
  };

  // Get user's listings
  const useUserListings = (userId: string) => {
    return useQuery({
      queryKey: ['userListings', userId],
      queryFn: () => api.products.getUserListings(userId),
      enabled: !!userId,
    });
  };

  // Create product mutation
  const useCreateProduct = () => {
    return useMutation({
      mutationFn: (product: ProductCreate) => api.products.create(product),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({
          title: 'Success',
          description: 'Your listing has been created',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create listing',
          variant: 'destructive',
        });
      },
    });
  };

  // Update product mutation
  const useUpdateProduct = () => {
    return useMutation({
      mutationFn: (product: ProductUpdate) => api.products.update(product),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', data.id] });
        toast({
          title: 'Success',
          description: 'Your listing has been updated',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update listing',
          variant: 'destructive',
        });
      },
    });
  };

  // Delete product mutation
  const useDeleteProduct = () => {
    return useMutation({
      mutationFn: (id: string) => api.products.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({
          title: 'Success',
          description: 'Your listing has been deleted',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete listing',
          variant: 'destructive',
        });
      },
    });
  };

  return {
    useProductsList,
    useProduct,
    useUserListings,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
  };
}
