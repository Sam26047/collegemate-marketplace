
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X, ShoppingBag, MessageSquare, User, PlusCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <ShoppingBag className="h-6 w-6 text-marketplace-primary mr-2" />
            <span className="text-xl font-bold text-gray-900">CampusMarket</span>
          </Link>

          {/* Search bar - hide on mobile */}
          {!isMobile && (
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search for items..."
                  className="pl-8 w-full bg-gray-50"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center space-x-4">
              <Link to="/categories" className="text-gray-600 hover:text-marketplace-primary">
                Categories
              </Link>
              <Link to="/sell" className="text-gray-600 hover:text-marketplace-primary">
                <Button variant="outline" className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Sell
                </Button>
              </Link>
              <Link to="/messages" className="text-gray-600 hover:text-marketplace-primary">
                <MessageSquare className="h-6 w-6" />
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-marketplace-primary">
                <User className="h-6 w-6" />
              </Link>
            </nav>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <button
              className="text-gray-600 hover:text-marketplace-primary"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>

        {/* Mobile search bar */}
        {isMobile && (
          <div className="py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search for items..."
                className="pl-8 w-full bg-gray-50"
              />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobile && isMenuOpen && (
          <nav className="py-3 border-t border-gray-200">
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/categories"
                  className="block px-2 py-2 text-gray-600 hover:bg-gray-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link 
                  to="/sell"
                  className="block px-2 py-2 text-gray-600 hover:bg-gray-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link 
                  to="/messages"
                  className="block px-2 py-2 text-gray-600 hover:bg-gray-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Messages
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile"
                  className="block px-2 py-2 text-gray-600 hover:bg-gray-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
