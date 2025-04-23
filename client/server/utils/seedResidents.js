const mongoose = require('mongoose');
require('dotenv').config();
const Resident = require('../models/Resident');
const connectDB = require('../config/db');

// Массив с первоначальными данными для резидентов
const residents = [
  {
    name: 'Sound Wave Studio',
    category: 'sound',
    type: 'Звуковая студия',
    image: '/images/residents/resident-1.jpg',
    description: 'Профессиональная студия звукозаписи, занимающаяся производством музыки, звуковым дизайном и саунд-артом. Команда опытных звукорежиссеров и продюсеров.',
    contacts: {
      website: 'http://soundwave.example.com',
      instagram: '@soundwavestudio',
      email: 'info@soundwave.example.com'
    },
    status: 'active',
    featured: true
  },
  {
    name: 'LightForm Collective',
    category: 'light',
    type: 'Световые художники',
    image: '/images/residents/resident-2.jpg',
    description: 'Коллектив художников по свету, создающих уникальные световые инсталляции, проекции и иммерсивные пространства для мероприятий и выставок.',
    contacts: {
      website: 'http://lightform.example.com',
      instagram: '@lightformcollective',
      email: 'info@lightform.example.com'
    },
    status: 'active',
    featured: true
  },
  {
    name: 'Pixel Art Lab',
    category: 'visual',
    type: 'Визуальное искусство',
    image: '/images/residents/resident-3.jpg',
    description: 'Студия цифрового и визуального искусства, работающая с VJ-ингом, генеративной графикой, AR/VR технологиями и интерактивными инсталляциями.',
    contacts: {
      website: 'http://pixelartlab.example.com',
      instagram: '@pixelartlab',
      email: 'hello@pixelartlab.example.com'
    },
    status: 'active',
    featured: false
  },
  {
    name: 'Techno Collective',
    category: 'music',
    type: 'Музыкальный коллектив',
    image: '/images/residents/resident-4.jpg',
    description: 'Объединение электронных музыкантов и диджеев, сосредоточенных на техно-музыке и экспериментальных звуковых исследованиях.',
    contacts: {
      website: 'http://technocollective.example.com',
      instagram: '@technocollective',
      email: 'contact@technocollective.example.com'
    },
    status: 'active',
    featured: true
  },
  {
    name: 'Design Bureau',
    category: 'design',
    type: 'Дизайн-бюро',
    image: '/images/residents/resident-5.jpg',
    description: 'Креативное агентство, специализирующееся на графическом дизайне, брендинге, веб-дизайне и создании визуальной идентичности для мероприятий и пространств.',
    contacts: {
      website: 'http://designbureau.example.com',
      instagram: '@designbureau',
      email: 'info@designbureau.example.com'
    },
    status: 'active',
    featured: false
  },
  {
    name: 'Innovation Lab',
    category: 'tech',
    type: 'Технологическая лаборатория',
    image: '/images/residents/resident-6.jpg',
    description: 'Экспериментальная лаборатория, работающая на стыке искусства и технологий, разрабатывающая интерактивные инсталляции и новые медиа решения.',
    contacts: {
      website: 'http://innovationlab.example.com',
      instagram: '@innovation.lab',
      email: 'lab@innovationlab.example.com'
    },
    status: 'active',
    featured: false
  },
  {
    name: 'Acoustic Orchestra',
    category: 'music',
    type: 'Музыкальный коллектив',
    image: '/images/residents/resident-7.jpg',
    description: 'Современный оркестр, экспериментирующий с акустическими и электронными звучаниями, импровизациями и коллаборациями с другими художниками.',
    contacts: {
      website: 'http://acousticorchestra.example.com',
      instagram: '@acoustic.orchestra',
      email: 'music@acousticorchestra.example.com'
    },
    status: 'active',
    featured: false
  },
  {
    name: 'Digital Architects',
    category: 'tech',
    type: 'Цифровые архитекторы',
    image: '/images/residents/resident-8.jpg',
    description: 'Студия цифровой архитектуры, создающая виртуальные пространства, 3D-моделирование и визуализацию для проектов на стыке архитектуры и цифрового искусства.',
    contacts: {
      website: 'http://digitalarchitects.example.com',
      instagram: '@digital.architects',
      email: 'info@digitalarchitects.example.com'
    },
    status: 'active',
    featured: true
  }
];

// Функция для заполнения базы данных
const seedResidents = async () => {
  try {
    // Подключение к базе данных
    await connectDB();
    console.log('База данных MongoDB подключена');
    
    // Очистка коллекции перед заполнением
    await Resident.deleteMany({});
    console.log('Существующие резиденты удалены');
    
    // Заполнение базы данных начальными данными
    const createdResidents = await Resident.create(residents);
    console.log(`Создано ${createdResidents.length} резидентов`);
    
    // Закрытие соединения с базой данных
    mongoose.connection.close();
    console.log('Соединение с базой данных закрыто');
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
};

// Запуск функции заполнения базы данных
seedResidents();