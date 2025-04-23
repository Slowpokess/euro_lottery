import React from 'react';
import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';
import { NewsProvider } from './NewsContext';
import { EventsProvider } from './EventsContext';
import { EquipmentProvider } from './EquipmentContext';
import { RentRequestsProvider } from './RentRequestsContext';
import { ResidentsProvider } from './ResidentsContext';
import { SpacesProvider } from './SpacesContext';
import { PromotionsProvider } from './PromotionsContext';
import { PromotionContactsProvider } from './PromotionContactsContext';

// Главный провайдер контекстов, объединяющий все провайдеры
export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <UIProvider>
        <NewsProvider>
          <EventsProvider>
            <EquipmentProvider>
              <RentRequestsProvider>
                <ResidentsProvider>
                  <SpacesProvider>
                    <PromotionsProvider>
                      <PromotionContactsProvider>
                        {children}
                      </PromotionContactsProvider>
                    </PromotionsProvider>
                  </SpacesProvider>
                </ResidentsProvider>
              </RentRequestsProvider>
            </EquipmentProvider>
          </EventsProvider>
        </NewsProvider>
      </UIProvider>
    </AuthProvider>
  );
};

// Экспорт хуков для использования во всем приложении
export { useAuth } from './AuthContext';
export { useUI } from './UIContext';
export { useNews } from './NewsContext';
export { useEvents } from './EventsContext';
export { useEquipment } from './EquipmentContext';
export { useRentRequests } from './RentRequestsContext';
export { useResidents } from './ResidentsContext';
export { useSpaces } from './SpacesContext';
export { usePromotions } from './PromotionsContext';
export { usePromotionContacts } from './PromotionContactsContext';