/**
 * Mock data service for development without MongoDB
 * This provides sample data for testing when the database is unavailable
 */

// Sample promotions
const promotions = [
  {
    _id: '1',
    title: 'Event Promotion',
    description: 'Full cycle event promotion services, from concept to execution',
    image: '/images/event-placeholder.jpg',
    category: 'promotion',
    features: ['Social media promotion', 'Ticket sales', 'Audience targeting'],
    pricing: 'From $1000',
    status: 'active',
    featured: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-10')
  },
  {
    _id: '2',
    title: 'Artist Development',
    description: 'Comprehensive artist development and promotion services',
    image: '/images/residents-placeholder.jpg',
    category: 'artists',
    features: ['Brand development', 'Media relations', 'Booking assistance'],
    pricing: 'Custom pricing',
    status: 'active',
    featured: false,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-02-20')
  },
  {
    _id: '3',
    title: 'Venue Marketing',
    description: 'Marketing solutions for music venues and event spaces',
    image: '/images/space-placeholder.jpg',
    category: 'venues',
    features: ['Local advertising', 'Online visibility', 'Audience growth'],
    pricing: 'Monthly packages',
    status: 'active',
    featured: true,
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-15')
  }
];

// Sample promotion contacts
const promotionContacts = [
  {
    _id: '101',
    name: 'Алексей Петров',
    email: 'alexey@example.com',
    phone: '+380991234567',
    company: 'Night Life Productions',
    eventType: 'Techno Event',
    message: 'Интересует продвижение техно вечеринки в апреле',
    budget: '1000-3000',
    servicesNeeded: ['Promotion', 'Ticket Sales'],
    createdAt: new Date('2023-04-10'),
    updatedAt: new Date('2023-04-10')
  },
  {
    _id: '102',
    name: 'Мария Иванова',
    email: 'maria@example.com',
    phone: '+380992345678',
    company: 'Deep House Collective',
    eventType: 'Album Launch',
    message: 'Нужна помощь с организацией вечеринки запуска альбома',
    budget: '3000-5000',
    servicesNeeded: ['Marketing', 'Event Planning'],
    createdAt: new Date('2023-04-15'),
    updatedAt: new Date('2023-04-15')
  }
];

// Sample events for testing
const events = [
  {
    _id: '201',
    title: 'Night Grooves',
    description: 'A night of deep house and techno',
    date: new Date('2023-05-15'),
    time: '22:00 - 06:00',
    location: 'Main Hall',
    image: '/images/event-placeholder.jpg',
    price: 300,
    ticketLink: 'https://tickets.example.com/night-grooves',
    lineup: ['DJ Alpha', 'DJ Beta', 'DJ Gamma'],
    status: 'upcoming',
    featured: true,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-10')
  },
  {
    _id: '202',
    title: 'Ambient Session',
    description: 'Relaxing ambient music evening',
    date: new Date('2023-05-20'),
    time: '20:00 - 02:00',
    location: 'Chill Room',
    image: '/images/event-placeholder.jpg',
    price: 200,
    ticketLink: 'https://tickets.example.com/ambient',
    lineup: ['Ambient Collective', 'Soundscape'],
    status: 'upcoming',
    featured: false,
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-15')
  }
];

// Sample residents
const residents = [
  {
    _id: '301',
    name: 'DJ Pulse',
    bio: 'Techno producer and DJ with 10 years of experience',
    image: '/images/residents-placeholder.jpg',
    socialLinks: {
      instagram: 'https://instagram.com/djpulse',
      soundcloud: 'https://soundcloud.com/djpulse'
    },
    featured: true,
    createdAt: new Date('2022-10-01'),
    updatedAt: new Date('2022-10-01')
  },
  {
    _id: '302',
    name: 'Synthia',
    bio: 'Electronic music composer and performer',
    image: '/images/residents-placeholder.jpg',
    socialLinks: {
      instagram: 'https://instagram.com/synthia',
      soundcloud: 'https://soundcloud.com/synthia'
    },
    featured: true,
    createdAt: new Date('2022-11-01'),
    updatedAt: new Date('2022-11-01')
  }
];

// Sample spaces
const spaces = [
  {
    _id: '401',
    name: 'Main Hall',
    description: 'Large event space for concerts and dance events',
    capacity: 500,
    images: ['/images/space-placeholder.jpg'],
    features: ['High-quality sound system', 'Professional lighting', 'Bar area'],
    rentalOptions: ['Full day', 'Evening', 'Weekend'],
    createdAt: new Date('2022-05-01'),
    updatedAt: new Date('2022-05-01')
  },
  {
    _id: '402',
    name: 'Studio Room',
    description: 'Intimate space for small gatherings and workshops',
    capacity: 50,
    images: ['/images/space-placeholder.jpg'],
    features: ['Recording equipment', 'Comfortable seating', 'Natural lighting'],
    rentalOptions: ['Hourly', 'Half day', 'Full day'],
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2022-06-01')
  }
];

// Sample equipment
const equipment = [
  {
    _id: '501',
    name: 'Pioneer CDJ-3000 Set',
    description: 'Professional DJ setup with 4 players and mixer',
    category: 'dj',
    image: '/images/equipment-placeholder.jpg',
    rentalPrice: 2000,
    available: true,
    specifications: {
      brand: 'Pioneer DJ',
      model: 'CDJ-3000 + DJM-900NXS2'
    },
    createdAt: new Date('2022-07-01'),
    updatedAt: new Date('2022-07-01')
  },
  {
    _id: '502',
    name: 'JBL PA System',
    description: 'Complete sound system for medium-sized events',
    category: 'sound',
    image: '/images/equipment-placeholder.jpg',
    rentalPrice: 1500,
    available: true,
    specifications: {
      brand: 'JBL Professional',
      power: '5000W'
    },
    createdAt: new Date('2022-08-01'),
    updatedAt: new Date('2022-08-01')
  }
];

// Sample rental requests
const rentRequests = [
  {
    _id: '601',
    name: 'Виктор',
    email: 'victor@example.com',
    phone: '+380993456789',
    eventType: 'Корпоратив',
    eventDate: new Date('2023-06-15'),
    attendees: 100,
    message: 'Интересует аренда большого зала для корпоративного мероприятия',
    status: 'pending',
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2023-04-01')
  },
  {
    _id: '602',
    name: 'Елена',
    email: 'elena@example.com',
    phone: '+380994567890',
    eventType: 'День рождения',
    eventDate: new Date('2023-07-10'),
    attendees: 50,
    message: 'Хочу забронировать Studio Room для празднования дня рождения',
    status: 'approved',
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2023-04-06')
  }
];

// Sample news
const news = [
  {
    _id: '701',
    title: 'Grand Opening Event',
    content: 'We are thrilled to announce our grand opening event on June 1st.',
    image: '/images/news-placeholder.jpg',
    date: new Date('2023-05-01'),
    category: 'announcement',
    featured: true,
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-05-01')
  },
  {
    _id: '702',
    title: 'New Resident DJ',
    content: 'We are excited to welcome DJ Electric as our new resident.',
    image: '/images/news-placeholder.jpg',
    date: new Date('2023-05-10'),
    category: 'residents',
    featured: false,
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-05-10')
  }
];

// Mock helper functions
const createMockController = (collection) => {
  return {
    getAll: (req, res) => {
      res.status(200).json({
        success: true,
        count: collection.length,
        data: collection
      });
    },
    
    getById: (req, res) => {
      const id = req.params.id;
      const item = collection.find(item => item._id === id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: item
      });
    },
    
    create: (req, res) => {
      const newItem = {
        _id: Math.random().toString(36).substring(2, 10),
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      collection.push(newItem);
      
      res.status(201).json({
        success: true,
        data: newItem
      });
    },
    
    update: (req, res) => {
      const id = req.params.id;
      const index = collection.findIndex(item => item._id === id);
      
      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      const updatedItem = {
        ...collection[index],
        ...req.body,
        updatedAt: new Date()
      };
      
      collection[index] = updatedItem;
      
      res.status(200).json({
        success: true,
        data: updatedItem
      });
    },
    
    delete: (req, res) => {
      const id = req.params.id;
      const index = collection.findIndex(item => item._id === id);
      
      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      const deletedItem = collection[index];
      collection.splice(index, 1);
      
      res.status(200).json({
        success: true,
        data: deletedItem
      });
    }
  };
};

module.exports = {
  data: {
    promotions,
    promotionContacts,
    events,
    residents,
    spaces,
    equipment,
    rentRequests,
    news
  },
  controllers: {
    promotions: createMockController(promotions),
    promotionContacts: createMockController(promotionContacts),
    events: createMockController(events),
    residents: createMockController(residents),
    spaces: createMockController(spaces),
    equipment: createMockController(equipment),
    rentRequests: createMockController(rentRequests),
    news: createMockController(news)
  },
  createMockController
};