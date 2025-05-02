from django.urls import path
from . import views

urlpatterns = [
    # Информация о лотереях
    path('games/', views.LotteryGameListView.as_view(), name='lottery-games'),
    path('games/<int:pk>/', views.LotteryGameDetailView.as_view(), name='lottery-game-detail'),
    
    # Розыгрыши
    path('draws/', views.DrawListView.as_view(), name='draws-list'),
    path('draws/<int:pk>/', views.DrawDetailView.as_view(), name='draw-detail'),
    path('draws/upcoming/', views.UpcomingDrawsView.as_view(), name='upcoming-draws'),
    path('draws/results/', views.DrawResultsView.as_view(), name='draw-results'),
    
    # Билеты
    path('tickets/', views.TicketListView.as_view(), name='tickets-list'),
    path('tickets/purchase/', views.PurchaseTicketView.as_view(), name='purchase-ticket'),
    path('tickets/<uuid:ticket_id>/', views.TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/check/<uuid:ticket_id>/', views.CheckTicketView.as_view(), name='check-ticket'),
    
    # Сохраненные комбинации
    path('saved-combinations/', views.SavedCombinationListView.as_view(), name='saved-combinations'),
    path('saved-combinations/create/', views.CreateSavedCombinationView.as_view(), name='create-saved-combination'),
    path('saved-combinations/<int:pk>/', views.SavedCombinationDetailView.as_view(), name='saved-combination-detail'),
    path('saved-combinations/<int:pk>/delete/', views.DeleteSavedCombinationView.as_view(), name='delete-saved-combination'),
    
    # Выигрыши
    path('winnings/', views.WinningsListView.as_view(), name='winnings-list'),
    path('winnings/<int:pk>/', views.WinningDetailView.as_view(), name='winning-detail'),
    
    # Статистика и информация
    path('statistics/', views.LotteryStatisticsView.as_view(), name='lottery-statistics'),
    path('hot-numbers/', views.HotNumbersView.as_view(), name='hot-numbers'),
    
    # Admin controls
    path('admin/draws/conduct/', views.AdminDrawControlView.as_view(), name='admin-conduct-draw'),
]