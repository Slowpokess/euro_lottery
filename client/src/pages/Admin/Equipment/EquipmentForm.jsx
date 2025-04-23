import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEquipment } from '../../../contexts';
import './Equipment.css';

const EquipmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { currentEquipment, loading: contextLoading, error: contextError, fetchEquipmentById, addEquipment, editEquipment } = useEquipment();

  const [formData, setFormData] = useState({
    name: '',
    category: 'sound',
    description: '',
    price: '',
    priceUnit: 'day',
    status: 'available',
    specifications: {}
  });
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [specifications, setSpecifications] = useState([
    { key: '', value: '' }
  ]);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      await fetchEquipmentById(id);
    } catch (error) {
      setError('Ошибка при получении данных оборудования');
    } finally {
      setLoading(false);
    }
  }, [fetchEquipmentById, id]);

  useEffect(() => {
    if (isEditMode) {
      fetchEquipment();
    }
  }, [isEditMode, fetchEquipment]);
  
  // Update form when currentEquipment changes
  useEffect(() => {
    if (currentEquipment && isEditMode) {
      // Заполняем форму данными полученного оборудования
      setFormData({
        name: currentEquipment.name,
        category: currentEquipment.category,
        description: currentEquipment.description,
        price: currentEquipment.price,
        priceUnit: currentEquipment.priceUnit,
        status: currentEquipment.status,
        specifications: currentEquipment.specifications || {}
      });
      
      // Преобразуем объект specifications в массив для отображения в форме
      const specsArray = Object.entries(currentEquipment.specifications || {}).map(
        ([key, value]) => ({ key, value })
      );
      
      if (specsArray.length > 0) {
        setSpecifications(specsArray);
      }
      
      // Устанавливаем предварительное отображение изображений
      if (currentEquipment.images && currentEquipment.images.length > 0) {
        setPreviewImages(currentEquipment.images);
      }
    }
  }, [currentEquipment, isEditMode]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку поля при изменении
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    // Создаем предварительное отображение
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index][field] = value;
    setSpecifications(updatedSpecs);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    if (specifications.length > 1) {
      const updatedSpecs = specifications.filter((_, i) => i !== index);
      setSpecifications(updatedSpecs);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Укажите название оборудования';
    }
    if (!formData.description.trim()) {
      errors.description = 'Укажите описание оборудования';
    }
    if (!formData.price || formData.price <= 0) {
      errors.price = 'Укажите корректную цену';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    if (!validateForm()) {
      setError('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Преобразуем массив спецификаций в объект для сохранения
      const specsObject = specifications.reduce((obj, spec) => {
        if (spec.key && spec.value) {
          obj[spec.key] = spec.value;
        }
        return obj;
      }, {});

      const equipmentData = {
        ...formData,
        specifications: specsObject
      };

      // Добавляем изображения, если они есть
      if (images.length > 0) {
        equipmentData.images = images;
      }

      if (isEditMode) {
        await editEquipment(id, equipmentData);
      } else {
        await addEquipment(equipmentData);
      }

      navigate('/admin/equipment');
    } catch (error) {
      let errorMessage = 'Ошибка при сохранении оборудования';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.error) {
        errorMessage = error.error;
      }
      console.error('Подробная ошибка:', error);
      setError(errorMessage);
      setLoading(false);
    }
  };

  if ((loading || contextLoading) && isEditMode) {
    return <div className="admin-loading">Загрузка данных оборудования...</div>;
  }

  return (
    <div className="admin-equipment-form-container">
      <h2>{isEditMode ? 'Редактирование оборудования' : 'Добавление нового оборудования'}</h2>

      {(error || contextError) && <div className="admin-error-message">{error || contextError}</div>}

      <form className="admin-equipment-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Название оборудования *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={formErrors.name ? 'input-error' : ''}
            required
          />
          {formErrors.name && <div className="error-message">{formErrors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Категория *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="sound">Звук</option>
            <option value="light">Свет</option>
            <option value="stage">Сцена</option>
            <option value="other">Прочее</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Описание оборудования *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            className={formErrors.description ? 'input-error' : ''}
            required
          ></textarea>
          {formErrors.description && <div className="error-message">{formErrors.description}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="price">Цена аренды *</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            className={formErrors.price ? 'input-error' : ''}
          />
          {formErrors.price && <div className="error-message">{formErrors.price}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="priceUnit">Единица аренды *</label>
          <select
            id="priceUnit"
            name="priceUnit"
            value={formData.priceUnit}
            onChange={handleChange}
            required
          >
            <option value="hour">За час</option>
            <option value="day">За день</option>
            <option value="event">За мероприятие</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Статус оборудования *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="available">Доступно</option>
            <option value="unavailable">Недоступно</option>
            <option value="maintenance">На обслуживании</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Изображения оборудования</label>
          <input
            type="file"
            name="images"
            onChange={handleImageChange}
            multiple
            accept="image/*"
          />
          {previewImages.length > 0 && (
            <div className="image-previews">
              {previewImages.map((src, index) => (
                <div key={index} className="image-preview-item">
                  <img src={src} alt={`Preview ${index}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group full-width specifications-container">
          <label>Спецификации оборудования</label>
          
          {specifications.map((spec, index) => (
            <div key={index} className="specification-row">
              <input
                type="text"
                placeholder="Характеристика"
                value={spec.key}
                onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
              />
              <input
                type="text"
                placeholder="Значение"
                value={spec.value}
                onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
              />
              <button
                type="button"
                className="admin-btn admin-btn-small admin-btn-danger"
                onClick={() => removeSpecification(index)}
              >
                Удалить
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="admin-btn admin-btn-secondary add-spec-btn"
            onClick={addSpecification}
          >
            Добавить спецификацию
          </button>
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/equipment')}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={loading || contextLoading}
          >
            {(loading || contextLoading) ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;