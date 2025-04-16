
// Mock data for the campus marketplace

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  imageUrl: string;
  sellerId: string;
  createdAt: string;
  location: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: string;
  department: string;
  year: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  productId: string;
  text: string;
  sentAt: string;
  isRead: boolean;
}

// Mock categories
export const categories: Category[] = [
  {
    id: '1',
    name: 'Textbooks',
    icon: 'book',
    description: 'Academic textbooks for all subjects'
  },
  {
    id: '2',
    name: 'Lab Equipment',
    icon: 'flask',
    description: 'Lab coats, goggles, and other equipment'
  },
  {
    id: '3',
    name: 'Electronics',
    icon: 'cpu',
    description: 'Calculators, laptops, and other electronics'
  },
  {
    id: '4',
    name: 'Stationery',
    icon: 'pen-tool',
    description: 'Pens, notebooks, and other stationery items'
  },
  {
    id: '5',
    name: 'Engineering Tools',
    icon: 'tool',
    description: 'Drafters, drawing boards, and other engineering tools'
  },
  {
    id: '6',
    name: 'Notes & Study Materials',
    icon: 'file-text',
    description: 'Class notes, past papers, and study guides'
  }
];

// Mock users
export const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    avatar: 'https://i.pravatar.cc/150?img=1',
    joinedAt: '2023-01-15',
    department: 'Computer Science',
    year: 3
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    avatar: 'https://i.pravatar.cc/150?img=2',
    joinedAt: '2023-02-20',
    department: 'Mechanical Engineering',
    year: 2
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    avatar: 'https://i.pravatar.cc/150?img=3',
    joinedAt: '2022-09-05',
    department: 'Chemistry',
    year: 4
  }
];

// Mock products
export const products: Product[] = [
  {
    id: '1',
    title: 'Calculus 3 Textbook',
    price: 45,
    description: 'Calculus textbook in great condition, minimal highlighting. James Stewart 8th edition.',
    category: '1', // Textbooks
    condition: 'good',
    imageUrl: 'https://images.pexels.com/photos/5834344/pexels-photo-5834344.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '1',
    createdAt: '2023-04-10',
    location: 'Main Campus Library'
  },
  {
    id: '2',
    title: 'Chemistry Lab Coat',
    price: 15,
    description: 'White lab coat, size M. Used for one semester only.',
    category: '2', // Lab Equipment
    condition: 'like-new',
    imageUrl: 'https://images.pexels.com/photos/6074935/pexels-photo-6074935.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '2',
    createdAt: '2023-04-15',
    location: 'Science Building'
  },
  {
    id: '3',
    title: 'TI-84 Plus Calculator',
    price: 60,
    description: 'TI-84 Plus graphing calculator. Works perfectly.',
    category: '3', // Electronics
    condition: 'good',
    imageUrl: 'https://images.pexels.com/photos/220301/pexels-photo-220301.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '3',
    createdAt: '2023-04-18',
    location: 'Engineering Building'
  },
  {
    id: '4',
    title: 'Engineering Drafter Set',
    price: 25,
    description: 'Complete engineering drafting set. Includes rulers, compass, and protractor.',
    category: '5', // Engineering Tools
    condition: 'good',
    imageUrl: 'https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '2',
    createdAt: '2023-04-20',
    location: 'Engineering Department'
  },
  {
    id: '5',
    title: 'Organic Chemistry Notes',
    price: 10,
    description: 'Comprehensive notes for Organic Chemistry I & II. Includes reaction mechanisms and practice problems.',
    category: '6', // Notes & Study Materials
    condition: 'new',
    imageUrl: 'https://images.pexels.com/photos/3964727/pexels-photo-3964727.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '1',
    createdAt: '2023-04-22',
    location: 'Student Center'
  },
  {
    id: '6',
    title: 'Premium Notebook Set',
    price: 12,
    description: 'Set of 4 premium notebooks with hardcovers. Graph, lined, and blank pages.',
    category: '4', // Stationery
    condition: 'new',
    imageUrl: 'https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '3',
    createdAt: '2023-04-25',
    location: 'Bookstore'
  },
  {
    id: '7',
    title: 'Physics for Scientists and Engineers',
    price: 50,
    description: 'Physics textbook by Serway and Jewett, 10th edition. Excellent condition.',
    category: '1', // Textbooks
    condition: 'like-new',
    imageUrl: 'https://images.pexels.com/photos/51342/books-education-school-literature-51342.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '2',
    createdAt: '2023-04-28',
    location: 'Physics Department'
  },
  {
    id: '8',
    title: 'Safety Goggles',
    price: 8,
    description: 'Chemical splash safety goggles. Used in one lab session only.',
    category: '2', // Lab Equipment
    condition: 'like-new',
    imageUrl: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=600',
    sellerId: '1',
    createdAt: '2023-05-01',
    location: 'Chemistry Building'
  }
];

// Mock messages
export const messages: Message[] = [
  {
    id: '1',
    senderId: '2',
    receiverId: '1',
    productId: '1',
    text: 'Hi, is the Calculus book still available?',
    sentAt: '2023-05-02T10:30:00Z',
    isRead: true
  },
  {
    id: '2',
    senderId: '1',
    receiverId: '2',
    productId: '1',
    text: 'Yes, it is still available. When would you like to meet?',
    sentAt: '2023-05-02T11:15:00Z',
    isRead: true
  },
  {
    id: '3',
    senderId: '3',
    receiverId: '1',
    productId: '5',
    text: 'Are the Organic Chemistry notes comprehensive? Do they cover all the topics?',
    sentAt: '2023-05-03T14:22:00Z',
    isRead: false
  }
];
