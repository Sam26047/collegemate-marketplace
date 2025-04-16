
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-8 pb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap">
          {/* Logo and description */}
          <div className="w-full md:w-4/12 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">CampusMarket</h2>
            <p className="text-gray-600 mb-4">
              Buy and sell items within your campus community
            </p>
          </div>
          
          {/* Quick links */}
          <div className="w-full md:w-8/12 mb-8">
            <div className="flex flex-wrap">
              <div className="w-1/2 md:w-1/3 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Marketplace</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/categories" className="text-gray-600 hover:text-marketplace-primary">
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link to="/featured" className="text-gray-600 hover:text-marketplace-primary">
                      Featured Items
                    </Link>
                  </li>
                  <li>
                    <Link to="/recent" className="text-gray-600 hover:text-marketplace-primary">
                      Recently Added
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="w-1/2 md:w-1/3 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Account</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/profile" className="text-gray-600 hover:text-marketplace-primary">
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/messages" className="text-gray-600 hover:text-marketplace-primary">
                      Messages
                    </Link>
                  </li>
                  <li>
                    <Link to="/sell" className="text-gray-600 hover:text-marketplace-primary">
                      Sell an Item
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="w-1/2 md:w-1/3 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/help" className="text-gray-600 hover:text-marketplace-primary">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-gray-600 hover:text-marketplace-primary">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-600 hover:text-marketplace-primary">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-200 mt-4 pt-4">
          <p className="text-sm text-gray-600 text-center">
            © {new Date().getFullYear()} CampusMarket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
