import React, { useState, useEffect } from 'react';
import { usePromotions, usePromotionContacts } from '../../../contexts';
import './Promotion.css';
import PromotionForm from './PromotionForm';
import PromotionContactDetail from './PromotionContactDetail';

const AdminPromotion = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showContactDetail, setShowContactDetail] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  
  const { 
    promotions, 
    loading: promotionsLoading, 
    error: promotionsError, 
    fetchPromotions,
    removePromotion 
  } = usePromotions();
  
  const { 
    contacts, 
    loading: contactsLoading, 
    error: contactsError, 
    fetchContacts 
  } = usePromotionContacts();
  
  useEffect(() => {
    if (activeTab === 'services') {
      fetchPromotions();
    } else if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, [activeTab, fetchPromotions, fetchContacts]);
  
  const handleAddClick = () => {
    setEditingId(null);
    setShowForm(true);
  };
  
  const handleEditClick = (id) => {
    setEditingId(id);
    setShowForm(true);
  };
  
  const handleDeleteClick = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту услугу?')) {
      try {
        await removePromotion(id);
      } catch (error) {
        console.error('Error deleting promotion:', error);
      }
    }
  };
  
  const handleContactClick = (id) => {
    setSelectedContactId(id);
    setShowContactDetail(true);
  };
  
  const renderServicesTab = () => {
    if (showForm) {
      return <PromotionForm id={editingId} onCancel={() => setShowForm(false)} />;
    }
    
    return (
      <>
        <div className="admin-promotion-header">
          <h2 className="admin-promotion-title">Услуги промоушн</h2>
          <button className="admin-promotion-add-button" onClick={handleAddClick}>
            Добавить услугу
          </button>
        </div>
        
        {promotionsLoading ? (
          <div className="admin-loading">Загрузка услуг...</div>
        ) : promotionsError ? (
          <div className="admin-error">{promotionsError}</div>
        ) : (
          <table className="admin-promotion-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Порядок</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promotion => (
                <tr key={promotion._id}>
                  <td>{promotion.title}</td>
                  <td>{promotion.category}</td>
                  <td>{promotion.pricing}</td>
                  <td>{promotion.status}</td>
                  <td>{promotion.order}</td>
                  <td>
                    <div className="admin-promotion-action-buttons">
                      <button 
                        className="admin-promotion-edit-button"
                        onClick={() => handleEditClick(promotion._id)}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="admin-promotion-delete-button"
                        onClick={() => handleDeleteClick(promotion._id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  };
  
  const renderContactsTab = () => {
    if (showContactDetail) {
      return (
        <PromotionContactDetail 
          id={selectedContactId} 
          onBack={() => setShowContactDetail(false)} 
        />
      );
    }
    
    return (
      <>
        <div className="admin-promotion-header">
          <h2 className="admin-promotion-title">Заявки на услуги промоушн</h2>
        </div>
        
        {contactsLoading ? (
          <div className="admin-loading">Загрузка заявок...</div>
        ) : contactsError ? (
          <div className="admin-error">{contactsError}</div>
        ) : (
          <table className="admin-promotion-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Тип мероприятия</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact._id}>
                  <td>{new Date(contact.createdAt).toLocaleString()}</td>
                  <td>{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>{contact.eventType}</td>
                  <td>
                    <span className={`admin-promotion-contact-status admin-promotion-contact-status-${contact.status}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="admin-promotion-edit-button"
                      onClick={() => handleContactClick(contact._id)}
                    >
                      Просмотреть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  };
  
  return (
    <div className="admin-promotion-container">
      <div className="admin-promotion-tabs">
        <div 
          className={`admin-promotion-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Услуги
        </div>
        <div 
          className={`admin-promotion-tab ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Заявки
        </div>
      </div>
      
      {activeTab === 'services' ? renderServicesTab() : renderContactsTab()}
    </div>
  );
};

export default AdminPromotion;