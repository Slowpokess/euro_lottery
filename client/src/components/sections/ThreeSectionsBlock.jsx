import React from 'react';
import InfoSection from './InfoSection';
import './ThreeSectionsBlock.css';

const ThreeSectionsBlock = () => {
  const sections = [
    {
      title: 'Про Нас',
      description: 'Творчий кластер, що складається з різних багатофункціональних просторів, майстерень, студій та музичних шкіл.',
      bgImage: 'https://i.gifer.com/embedded/download/6ZDc.gif',
      linkTo: '/about'
    },
    {
      title: 'Простір',
      description: '2000 кв.м приміщення, 100000 кв звуку, нескінченність світла, лазери.',
      bgImage: 'https://i.makeagif.com/media/10-14-2015/nlq4F6.gif',
      linkTo: '/spaces'
    },
    {
      title: 'Резиденти',
      description: 'Світло-художники, продюсери, артисти аудіо-візуального напрямку, музиканти, дизайнери, арт-резиденції.',
      bgImage: 'https://miro.medium.com/v2/resize:fit:1400/1*CqtKSeLhUEUfiXsnYMqfbQ.gif',
      linkTo: '/residents'
    }
  ];

  return (
    <section className="three-sections-block">
      <div className="container">
        <div className="sections-grid">
          {sections.map((section, index) => (
            <InfoSection
              key={index}
              title={section.title}
              description={section.description}
              bgImage={section.bgImage}
              linkTo={section.linkTo}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreeSectionsBlock;