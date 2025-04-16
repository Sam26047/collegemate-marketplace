
import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversation {
  otherUserId: string;
  productId: string | null;
  lastMessage: any;
  otherUser: any;
  product: any;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to view messages',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    fetchConversations();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}:receiver_id=eq.${user.id}`,
        },
        (payload) => {
          handleNewMessage(payload.new);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, toast]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all messages where user is sender or receiver
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      if (!messagesData || messagesData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Group messages by conversation (other user + product)
      const conversationsMap: Record<string, any[]> = {};
      
      messagesData.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const key = `${otherUserId}-${message.product_id || 'null'}`;
        
        if (!conversationsMap[key]) {
          conversationsMap[key] = [];
        }
        
        conversationsMap[key].push(message);
      });
      
      // Fetch profiles and products for each conversation
      const conversationPromises = Object.entries(conversationsMap).map(async ([key, messages]) => {
        const [otherUserId, productIdStr] = key.split('-');
        const productId = productIdStr === 'null' ? null : productIdStr;
        const lastMessage = messages[0];
        
        // Fetch other user's profile
        const { data: otherUserData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
        
        // Fetch product details if exists
        let product = null;
        if (productId) {
          const { data: productData } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          
          product = productData;
        }
        
        return {
          otherUserId,
          productId,
          lastMessage,
          otherUser: otherUserData,
          product,
        };
      });
      
      const conversationsData = await Promise.all(conversationPromises);
      
      // Sort conversations by latest message date
      const sortedConversations = conversationsData.sort((a, b) => {
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });
      
      setConversations(sortedConversations);
      
      // Set active conversation if none is selected
      if (sortedConversations.length > 0 && !activeConversation) {
        setActiveConversation(sortedConversations[0]);
        fetchConversationMessages(sortedConversations[0]);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
      toast({
        title: 'Error',
        description: 'Could not load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversation: Conversation) => {
    if (!user) return;
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${conversation.otherUserId}),` +
          `and(sender_id.eq.${conversation.otherUserId},receiver_id.eq.${user.id})`
        )
        .eq('product_id', conversation.productId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      setConversationMessages(messagesData || []);
      
      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessageIds = messagesData
          .filter(msg => msg.receiver_id === user.id && !msg.read)
          .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessageIds);
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversation messages:', error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;
    
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: activeConversation.otherUserId,
        content: newMessage,
        product_id: activeConversation.productId,
      });
      
      if (error) throw error;
      
      setNewMessage('');
      
      // Refresh messages
      await fetchConversationMessages(activeConversation);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not send message',
        variant: 'destructive',
      });
    }
  };

  const handleNewMessage = async (message: any) => {
    // Check if message belongs to active conversation
    if (
      activeConversation && 
      (
        (message.sender_id === user?.id && message.receiver_id === activeConversation.otherUserId) ||
        (message.sender_id === activeConversation.otherUserId && message.receiver_id === user?.id)
      ) &&
      message.product_id === activeConversation.productId
    ) {
      // Update conversation messages
      setConversationMessages(prev => [...prev, message]);
    }
    
    // Refresh conversations list
    await fetchConversations();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please sign in to view your messages.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MainLayout>
    );
  }

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="p-4">
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-80 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Messages</h1>
      
      {loading ? (
        renderSkeleton()
      ) : conversations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversation list */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-4">Conversations</h2>
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div 
                      key={`${conversation.otherUserId}-${conversation.productId || 'null'}`}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        activeConversation && 
                        activeConversation.otherUserId === conversation.otherUserId && 
                        activeConversation.productId === conversation.productId
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'hover:bg-gray-50 border-gray-100'
                      }`}
                      onClick={() => {
                        setActiveConversation(conversation);
                        fetchConversationMessages(conversation);
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <Avatar className="h-10 w-10 mr-3">
                          {conversation.otherUser?.avatar_url ? (
                            <AvatarImage src={conversation.otherUser.avatar_url} alt={conversation.otherUser.username} />
                          ) : (
                            <AvatarFallback>{getInitials(conversation.otherUser?.username || 'User')}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{conversation.otherUser?.username || 'Unknown User'}</h3>
                          {conversation.product && (
                            <p className="text-sm text-gray-500">{conversation.product.title}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{conversation.lastMessage.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Message detail */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardContent className="p-4 flex-grow flex flex-col">
                {activeConversation ? (
                  <>
                    {/* Conversation header */}
                    <div className="mb-4">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          {activeConversation.otherUser?.avatar_url ? (
                            <AvatarImage src={activeConversation.otherUser.avatar_url} alt={activeConversation.otherUser.username} />
                          ) : (
                            <AvatarFallback>{getInitials(activeConversation.otherUser?.username || 'User')}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{activeConversation.otherUser?.username || 'Unknown User'}</h3>
                          {activeConversation.product && (
                            <div className="flex items-center">
                              <p className="text-sm text-gray-500">
                                {activeConversation.product.title}
                              </p>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-xs text-marketplace-primary ml-1"
                                onClick={() => navigate(`/product/${activeConversation.productId}`)}
                              >
                                View Item
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </div>
                    
                    {/* Message list */}
                    <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-96">
                      {conversationMessages.map(message => {
                        const isCurrentUser = message.sender_id === user.id;
                        
                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isCurrentUser ? 'bg-marketplace-primary text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                              <p>{message.content}</p>
                              <p className={`text-xs ${isCurrentUser ? 'text-indigo-100' : 'text-gray-500'} mt-1`}>
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Message input */}
                    <div className="flex items-center">
                      <Input 
                        placeholder="Type your message..."
                        className="flex-grow mr-2"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                    <p className="text-gray-500">
                      Select a conversation from the list to view messages.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">No messages yet</h3>
          <p className="text-gray-600 mb-6">
            When you contact sellers or receive inquiries, they'll appear here.
          </p>
          <Button onClick={() => navigate('/')}>Browse Items</Button>
        </div>
      )}
    </MainLayout>
  );
};

export default Messages;
