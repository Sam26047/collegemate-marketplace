
import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const Messages = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userProducts, setUserProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view messages",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Fetch user's conversations
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        
        // Get unique conversations by combining sent and received messages
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select(`
            id,
            receiver_id,
            product_id,
            created_at
          `)
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            product_id,
            created_at
          `)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });

        if (sentError || receivedError) throw sentError || receivedError;

        // Process conversations
        const conversationMap = new Map();

        // Process sent messages
        if (sentMessages) {
          for (const msg of sentMessages) {
            const otherUserId = msg.receiver_id;
            if (!conversationMap.has(otherUserId)) {
              // Fetch user profile
              const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherUserId)
                .single();

              // Fetch product if available
              let product = null;
              if (msg.product_id) {
                const { data: productData } = await supabase
                  .from('products')
                  .select('*')
                  .eq('id', msg.product_id)
                  .single();
                product = productData;
              }

              conversationMap.set(otherUserId, {
                id: otherUserId,
                user: userData,
                lastMessageTime: msg.created_at,
                product: product
              });
            }
          }
        }

        // Process received messages
        if (receivedMessages) {
          for (const msg of receivedMessages) {
            const otherUserId = msg.sender_id;
            if (!conversationMap.has(otherUserId)) {
              // Fetch user profile
              const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherUserId)
                .single();

              // Fetch product if available
              let product = null;
              if (msg.product_id) {
                const { data: productData } = await supabase
                  .from('products')
                  .select('*')
                  .eq('id', msg.product_id)
                  .single();
                product = productData;
              }

              conversationMap.set(otherUserId, {
                id: otherUserId,
                user: userData,
                lastMessageTime: msg.created_at,
                product: product
              });
            } else if (new Date(msg.created_at) > new Date(conversationMap.get(otherUserId).lastMessageTime)) {
              conversationMap.get(otherUserId).lastMessageTime = msg.created_at;
            }
          }
        }

        // Convert map to array and sort by last message time
        const conversationArray = Array.from(conversationMap.values()).sort((a, b) => {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        setConversations(conversationArray);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch user's products for sending messages
    const fetchUserProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id)
          .eq('status', 'active');

        if (error) throw error;
        setUserProducts(data || []);
      } catch (error) {
        console.error('Error fetching user products:', error);
      }
    };

    fetchConversations();
    fetchUserProducts();

    // Set up realtime subscription for new messages
    const messagesSubscription = supabase
      .channel('messages_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        // Only update if the message is part of the current user's conversations
        if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
          fetchConversations();
          
          // If this message belongs to the active conversation, update the messages
          if (activeConversation && 
              ((newMsg.sender_id === activeConversation.id && newMsg.receiver_id === user.id) || 
               (newMsg.receiver_id === activeConversation.id && newMsg.sender_id === user.id))) {
            fetchMessages(activeConversation.id);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.channel('messages_channel').unsubscribe();
    };
  }, [user, navigate, toast]);

  // Fetch messages for a conversation
  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          product:product_id(*)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark received messages as read
      if (data && data.length > 0) {
        const unreadMessageIds = data
          .filter(msg => msg.receiver_id === user?.id && !msg.read)
          .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessageIds);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const messageData = {
        sender_id: user?.id,
        receiver_id: activeConversation.id,
        content: newMessage.trim(),
        product_id: selectedProduct?.id || activeConversation.product?.id || null
      };

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;

      setNewMessage('');
      setSelectedProduct(null);
      
      // Fetch updated messages
      fetchMessages(activeConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        {!user ? (
          <div className="text-center py-10">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view your messages</h2>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 h-[70vh]">
                {/* Conversations List */}
                <div className="border-r border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold">Conversations</h2>
                  </div>
                  <ScrollArea className="h-[calc(70vh-57px)]">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Loading conversations...</p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No conversations yet</p>
                        <p className="text-sm mt-2">When you message other users about their listings, they'll appear here.</p>
                      </div>
                    ) : (
                      <div>
                        {conversations.map((conversation) => (
                          <div 
                            key={conversation.id}
                            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${activeConversation?.id === conversation.id ? 'bg-gray-100' : ''}`}
                            onClick={() => handleSelectConversation(conversation)}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                {conversation.user?.avatar_url ? (
                                  <AvatarImage src={conversation.user.avatar_url} alt={conversation.user?.username || 'User'} />
                                ) : (
                                  <AvatarFallback>{getInitials(conversation.user?.username || 'User')}</AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{conversation.user?.username || 'Unknown User'}</p>
                                {conversation.product && (
                                  <p className="text-xs text-gray-500 truncate">
                                    Re: {conversation.product.title}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                
                {/* Messages Area */}
                <div className="col-span-2 flex flex-col h-full">
                  {!activeConversation ? (
                    <div className="flex items-center justify-center h-full text-center p-6">
                      <div>
                        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">Select a conversation</h3>
                        <p className="text-gray-500 mt-2">Choose a conversation to view messages</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="p-4 border-b border-gray-200 flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          {activeConversation.user?.avatar_url ? (
                            <AvatarImage src={activeConversation.user.avatar_url} alt={activeConversation.user?.username || 'User'} />
                          ) : (
                            <AvatarFallback>{getInitials(activeConversation.user?.username || 'User')}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {activeConversation.user?.username || 'Unknown User'}
                          </h3>
                          {activeConversation.product && (
                            <p className="text-xs text-gray-500">
                              Discussing: {activeConversation.product.title}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        {messages.length === 0 ? (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">No messages yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div 
                                key={message.id} 
                                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[70%] rounded-lg p-3 ${
                                    message.sender_id === user?.id 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {message.product && message.product.id && (
                                    <div className="text-xs mb-2 p-2 bg-white bg-opacity-20 rounded">
                                      Re: {message.product.title}
                                    </div>
                                  )}
                                  <p>{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.sender_id === user?.id 
                                      ? 'text-blue-100' 
                                      : 'text-gray-500'
                                  }`}>
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>
                      
                      {/* Product selection for message context */}
                      {userProducts.length > 0 && (
                        <div className="p-2 border-t border-gray-200">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">Product context:</span>
                            <select 
                              className="text-xs border-gray-300 rounded-md"
                              value={selectedProduct?.id || ''}
                              onChange={(e) => {
                                const product = userProducts.find(p => p.id === e.target.value);
                                setSelectedProduct(product || null);
                              }}
                            >
                              <option value="">None</option>
                              {userProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {/* Message Input */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <Textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="resize-none"
                              rows={2}
                              required
                            />
                          </div>
                          <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Messages;
