
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, User, Plus, LogIn, Menu, X } from 'lucide-react';
import { useJwtAuth } from '@/context/JwtAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, logout, setRedirectPath } = useJwtAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (user) {
      logout();
    }
    navigate('/');
  };

  const handleSellClick = () => {
    if (!user) {
      setRedirectPath('/sell');
      navigate('/auth?redirect=/sell');
    } else {
      navigate('/sell');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Use JWT auth
  const isAuthenticated = !!user;
  const displayName = user?.name || user?.email || 'User';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-marketplace-primary">Campus Marketplace</h1>
          </Link>

          {/* Search - hide on mobile */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search for items..."
              className="pl-10"
            />
          </div>

          {/* Nav Links - hide on mobile */}
          <nav className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleSellClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Sell
                </Button>
                <Link to="/messages">
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 mb-2 relative md:hidden">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search for items..."
            className="pl-10"
          />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 py-3 border-t border-gray-100">
            <nav className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/profile" 
                    className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  <button 
                    className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 text-left"
                    onClick={() => {
                      handleSellClick();
                      setIsMenuOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Sell
                  </button>
                  <Link 
                    to="/messages" 
                    className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 text-left"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
