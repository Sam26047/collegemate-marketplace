
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  product_id?: string;
  sender?: {
    username: string;
    avatar_url: string;
  };
  product?: {
    title: string;
    image_url: string;
  };
}

interface Conversation {
  user_id: string;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const Messages = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeUsername, setActiveUsername] = useState<string>('');
  const [activeAvatar, setActiveAvatar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [activeProducts, setActiveProducts] = useState<any[]>([]);
  
  // Check auth status
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to view messages',
        variant: 'destructive',
      });
      navigate('/auth');
    } else {
      fetchConversations();
    }
  }, [user, navigate, toast]);
  
  // Subscribe to real-time updates for new messages
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Handle new message
          const newMsg = payload.new as Message;
          
          // If the message belongs to the active conversation, add it to messages
          if (activeConversation === newMsg.sender_id) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark it as read
            markAsRead(newMsg.id);
          }
          
          // Update conversations list
          fetchConversations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversation]);
  
  // Fetch all conversations for the current user
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get sent messages (grouped by receiver)
      const { data: sentData, error: sentError } = await supabase
        .from('messages')
        .select(`
          receiver_id,
          content,
          created_at,
          profiles!messages_receiver_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sentError) throw sentError;
      
      // Get received messages (grouped by sender)
      const { data: receivedData, error: receivedError } = await supabase
        .from('messages')
        .select(`
          sender_id,
          content,
          created_at,
          read,
          profiles!messages_sender_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      // Merge and format conversations
      const conversationMap = new Map<string, Conversation>();
      
      // Process sent messages
      sentData.forEach((message) => {
        const userId = message.receiver_id;
        const username = message.profiles?.username || 'Unknown User';
        const avatarUrl = message.profiles?.avatar_url;
        
        if (!conversationMap.has(userId)) {
          conversationMap.set(userId, {
            user_id: userId,
            username,
            avatar_url: avatarUrl,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
          });
        }
      });
      
      // Process received messages
      receivedData.forEach((message) => {
        const userId = message.sender_id;
        const username = message.profiles?.username || 'Unknown User';
        const avatarUrl = message.profiles?.avatar_url;
        
        if (!conversationMap.has(userId)) {
          conversationMap.set(userId, {
            user_id: userId,
            username,
            avatar_url: avatarUrl,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.read ? 0 : 1,
          });
        } else if (new Date(message.created_at) > new Date(conversationMap.get(userId)!.last_message_time)) {
          // Update if this is a more recent message
          const conversation = conversationMap.get(userId)!;
          conversation.last_message = message.content;
          conversation.last_message_time = message.created_at;
          if (!message.read) {
            conversation.unread_count += 1;
          }
        } else if (!message.read) {
          // Add to unread count
          conversationMap.get(userId)!.unread_count += 1;
        }
      });
      
      // Convert map to array and sort by most recent message
      const sortedConversations = Array.from(conversationMap.values())
        .sort((a, b) => {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
      
      setConversations(sortedConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
      toast({
        title: 'Failed to load conversations',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load messages for a specific conversation
  const loadConversation = async (userId: string, username: string, avatar: string | null) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setActiveConversation(userId);
      setActiveUsername(username);
      setActiveAvatar(avatar);
      
      // Fetch all messages between current user and selected user
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          products (
            id,
            title,
            image_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark unread messages as read
      const unreadMessages = data?.filter(
        (msg) => msg.read === false && msg.receiver_id === user.id
      ) || [];
      
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg) => markAsRead(msg.id))
        );
        
        // Update conversation list to reflect read messages
        fetchConversations();
      }
      
      // Load available products to discuss
      fetchUserProducts();
    } catch (error: any) {
      console.error('Error loading conversation:', error.message);
      toast({
        title: 'Failed to load conversation',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark a message as read
  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error: any) {
      console.error('Error marking message as read:', error.message);
    }
  };
  
  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !activeConversation || !newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      const messageData = {
        sender_id: user.id,
        receiver_id: activeConversation,
        content: newMessage.trim(),
        product_id: selectedProduct?.id || null,
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local messages list
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      setSelectedProduct(null);
      
      // Update conversations list
      fetchConversations();
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Fetch user's products to share in conversation
  const fetchUserProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setActiveProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // Within the last week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return format(date, 'E, h:mm a'); // Day of week
    }
    
    // Older than a week
    return format(date, 'MMM d, yyyy');
  };
  
  // Render avatar with fallback
  const renderAvatar = (username: string, avatarUrl: string | null) => {
    const initials = username?.charAt(0).toUpperCase() || '?';
    return (
      <Avatar>
        <AvatarImage src={avatarUrl || undefined} alt={username} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  };
  
  // Determine if the current user is the sender of a message
  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };
  
  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations list */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </h2>
              </div>
              
              <div className="flex-grow overflow-y-auto p-2">
                {isLoading && conversations.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">You don't have any conversations yet.</p>
                    <p className="text-gray-500 text-sm mt-1">Browse products and message a seller to get started.</p>
                    <Button asChild className="mt-4">
                      <Link to="/">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {conversations.map((convo) => (
                      <li key={convo.user_id}>
                        <button
                          className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                            activeConversation === convo.user_id ? "bg-gray-100" : ""
                          }`}
                          onClick={() => loadConversation(convo.user_id, convo.username, convo.avatar_url)}
                        >
                          <div className="flex items-center gap-3">
                            {renderAvatar(convo.username, convo.avatar_url)}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="font-medium truncate">{convo.username}</span>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(convo.last_message_time)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">{convo.last_message}</p>
                            </div>
                            {convo.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                                {convo.unread_count}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
          
          {/* Chat area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              {!activeConversation ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Your Messages</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a conversation from the list to view messages or browse products to start
                    a new conversation with a seller.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {renderAvatar(activeUsername, activeAvatar)}
                      <div>
                        <h2 className="font-semibold">{activeUsername}</h2>
                      </div>
                    </div>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>User Profile</SheetTitle>
                        </SheetHeader>
                        <div className="py-6">
                          <div className="flex items-center gap-4 mb-6">
                            {renderAvatar(activeUsername, activeAvatar)}
                            <div>
                              <h3 className="text-lg font-medium">{activeUsername}</h3>
                            </div>
                          </div>
                          
                          <Tabs defaultValue="listings">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="listings">Listings</TabsTrigger>
                              <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            </TabsList>
                            <TabsContent value="listings" className="mt-4">
                              <p className="text-sm text-gray-500 text-center py-8">
                                This feature is coming soon
                              </p>
                            </TabsContent>
                            <TabsContent value="reviews" className="mt-4">
                              <p className="text-sm text-gray-500 text-center py-8">
                                This feature is coming soon
                              </p>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-gray-500">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser(message.sender_id) ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] ${
                              isCurrentUser(message.sender_id)
                                ? "bg-blue-600 text-white rounded-tl-lg rounded-bl-lg rounded-tr-lg"
                                : "bg-gray-100 text-gray-800 rounded-tr-lg rounded-br-lg rounded-tl-lg"
                            } p-3 shadow-sm`}
                          >
                            {message.product_id && message.product && (
                              <div className="border-b pb-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {message.product.image_url && (
                                    <img
                                      src={message.product.image_url}
                                      alt={message.product.title}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium ${
                                      isCurrentUser(message.sender_id) ? "text-blue-100" : "text-gray-600"
                                    }`}>
                                      Product:
                                    </p>
                                    <p className="text-sm truncate">
                                      {message.product.title}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <p>{message.content}</p>
                            <p
                              className={`text-xs mt-1 text-right ${
                                isCurrentUser(message.sender_id) ? "text-blue-200" : "text-gray-500"
                              }`}
                            >
                              {formatTimestamp(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Share product dropdown */}
                  {selectedProduct && (
                    <div className="p-3 bg-gray-50 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden">
                            {selectedProduct.image_url ? (
                              <img 
                                src={selectedProduct.image_url} 
                                alt={selectedProduct.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {selectedProduct.title}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedProduct(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Message input */}
                  <div className="p-3 border-t">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <div className="relative flex-grow">
                        {activeProducts.length > 0 && (
                          <div className="absolute bottom-full mb-2 right-0">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Share a product
                                </Button>
                              </SheetTrigger>
                              <SheetContent side="bottom" className="h-80">
                                <SheetHeader>
                                  <SheetTitle>Share a product</SheetTitle>
                                </SheetHeader>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 overflow-y-auto">
                                  {activeProducts.map((product) => (
                                    <Card
                                      key={product.id}
                                      className={`cursor-pointer transition-all ${
                                        selectedProduct?.id === product.id
                                          ? "ring-2 ring-blue-500"
                                          : "hover:shadow-md"
                                      }`}
                                      onClick={() => {
                                        setSelectedProduct(product);
                                      }}
                                    >
                                      <div className="h-24 bg-gray-100">
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
                                      </div>
                                      <CardContent className="p-3">
                                        <p className="font-medium text-sm truncate">
                                          {product.title}
                                        </p>
                                        <p className="text-sm text-green-600">
                                          ${parseFloat(product.price).toFixed(2)}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </SheetContent>
                            </Sheet>
                          </div>
                        )}
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="resize-none min-h-[60px]"
                        />
                      </div>
                      <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        {isSending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Messages;
