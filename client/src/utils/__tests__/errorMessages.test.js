import { ErrorMessages, getErrorMessage } from '../errorMessages';

describe('Error Messages Utility', () => {
  // Тест для проверки наличия всех необходимых сообщений
  it('provides all required error messages', () => {
    // Проверяем наличие ключевых сообщений
    expect(ErrorMessages.SERVER_ERROR).toBeDefined();
    expect(ErrorMessages.NETWORK_ERROR).toBeDefined();
    expect(ErrorMessages.UNAUTHORIZED).toBeDefined();
    expect(ErrorMessages.FORBIDDEN).toBeDefined();
    expect(ErrorMessages.NOT_FOUND).toBeDefined();
    
    // Проверяем сообщения для аутентификации
    expect(ErrorMessages.AUTH_FAILED).toBeDefined();
    expect(ErrorMessages.AUTH_EXPIRED).toBeDefined();
    expect(ErrorMessages.AUTH_REQUIRED).toBeDefined();
    
    // Проверяем сообщения для форм
    expect(ErrorMessages.FORM_INVALID).toBeDefined();
    expect(ErrorMessages.FORM_SUBMISSION_FAILED).toBeDefined();
  });

  describe('getErrorMessage function', () => {
    // Тест для пустых входных данных
    it('returns default server error message for null or undefined input', () => {
      expect(getErrorMessage(null)).toBe(ErrorMessages.SERVER_ERROR);
      expect(getErrorMessage(undefined)).toBe(ErrorMessages.SERVER_ERROR);
    });

    // Тест для строковых сообщений
    it('returns the string itself if error is a string', () => {
      const errorMsg = 'Something went wrong';
      expect(getErrorMessage(errorMsg)).toBe(errorMsg);
    });

    // Тест для объектов ошибок от сервера
    it('extracts error message from server response', () => {
      const errorObj = {
        response: {
          data: {
            error: 'Server validation failed'
          }
        }
      };
      expect(getErrorMessage(errorObj)).toBe('Server validation failed');
    });

    // Тест для объектов стандартных JS ошибок
    it('extracts message from standard Error objects', () => {
      const error = new Error('Standard error message');
      expect(getErrorMessage(error)).toBe('Standard error message');
    });

    // Тест для объектов ошибок с вложенной причиной
    it('handles errors with cause property', () => {
      const nestedError = {
        message: 'Outer error',
        cause: new Error('Inner error')
      };
      expect(getErrorMessage(nestedError)).toBe('Outer error');
    });

    // Тест для объектов без явного сообщения об ошибке
    it('handles plain objects without error messages', () => {
      const plainObject = { foo: 'bar' };
      expect(getErrorMessage(plainObject)).toBe('Ошибка приложения');
    });

    // Тест на обработку исключений внутри функции
    it('handles exceptions in getErrorMessage itself', () => {
      // Создаем объект, который вызовет ошибку при попытке получить его свойства
      const badObject = Object.create(null);
      Object.defineProperty(badObject, 'response', {
        get: () => { throw new Error('Cannot read property'); }
      });
      
      // getErrorMessage должен обработать исключение и вернуть дефолтное сообщение
      expect(getErrorMessage(badObject)).toBe(ErrorMessages.SERVER_ERROR);
    });
  });
});