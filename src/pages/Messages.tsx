
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { messages, users, products } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

const Messages = () => {
  // In a real app, this would come from authentication state
  const currentUserId = '1'; // Using the first user as the current user
  
  // Get messages for current user (sent or received)
  const userMessages = messages.filter(
    message => message.senderId === currentUserId || message.receiverId === currentUserId
  );
  
  // Group messages by conversation (other user + product)
  const conversations: Record<string, typeof messages> = {};
  
  userMessages.forEach(message => {
    const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    const conversationKey = `${otherUserId}-${message.productId}`;
    
    if (!conversations[conversationKey]) {
      conversations[conversationKey] = [];
    }
    
    conversations[conversationKey].push(message);
  });
  
  // Sort conversations by latest message date
  const sortedConversations = Object.entries(conversations)
    .sort(([, messagesA], [, messagesB]) => {
      const latestA = new Date(messagesA[messagesA.length - 1].sentAt).getTime();
      const latestB = new Date(messagesB[messagesB.length - 1].sentAt).getTime();
      return latestB - latestA;
    });
  
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8">Messages</h1>
      
      {sortedConversations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversation list */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-4">Conversations</h2>
                <div className="space-y-2">
                  {sortedConversations.map(([key, messages]) => {
                    const [otherUserId, productId] = key.split('-');
                    const otherUser = users.find(u => u.id === otherUserId);
                    const product = products.find(p => p.id === productId);
                    const latestMessage = messages[messages.length - 1];
                    
                    if (!otherUser || !product) return null;
                    
                    return (
                      <div 
                        key={key}
                        className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                      >
                        <div className="flex items-center mb-2">
                          <img 
                            src={otherUser.avatar} 
                            alt={otherUser.name}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <h3 className="font-medium">{otherUser.name}</h3>
                            <p className="text-sm text-gray-500">{product.title}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 truncate">{latestMessage.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(latestMessage.sentAt), { addSuffix: true })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Message detail */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardContent className="p-4 flex-grow flex flex-col">
                {/* Using the first conversation for demonstration */}
                {sortedConversations.length > 0 && (
                  <>
                    {/* Conversation header */}
                    {(() => {
                      const [key, _] = sortedConversations[0];
                      const [otherUserId, productId] = key.split('-');
                      const otherUser = users.find(u => u.id === otherUserId);
                      const product = products.find(p => p.id === productId);
                      
                      if (!otherUser || !product) return null;
                      
                      return (
                        <div className="mb-4">
                          <div className="flex items-center">
                            <img 
                              src={otherUser.avatar} 
                              alt={otherUser.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <div>
                              <h3 className="font-medium">{otherUser.name}</h3>
                              <p className="text-sm text-gray-500">
                                {product.title} - ${product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <Separator className="my-4" />
                        </div>
                      );
                    })()}
                    
                    {/* Message list */}
                    <div className="flex-grow overflow-y-auto mb-4 space-y-4">
                      {(() => {
                        const [key, messagesInConversation] = sortedConversations[0];
                        
                        return messagesInConversation.map(message => {
                          const isCurrentUser = message.senderId === currentUserId;
                          const sender = users.find(u => u.id === message.senderId);
                          
                          if (!sender) return null;
                          
                          return (
                            <div 
                              key={message.id}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[70%] ${isCurrentUser ? 'bg-marketplace-primary text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                                <p>{message.text}</p>
                                <p className={`text-xs ${isCurrentUser ? 'text-indigo-100' : 'text-gray-500'} mt-1`}>
                                  {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    
                    {/* Message input */}
                    <div className="flex items-center">
                      <Input 
                        placeholder="Type your message..."
                        className="flex-grow mr-2"
                      />
                      <Button>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-medium mb-2">No messages yet</h3>
          <p className="text-gray-600 mb-6">
            When you contact sellers or receive inquiries, they'll appear here.
          </p>
          <Button>Browse Items</Button>
        </div>
      )}
    </MainLayout>
  );
};

export default Messages;
