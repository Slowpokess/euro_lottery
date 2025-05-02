import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from decimal import Decimal
import json
import datetime
from unittest.mock import patch, MagicMock

from .models import (
    LotteryGame, Draw, Ticket, PrizeCategory, 
    DrawResult, WinningTicket, SavedNumberCombination
)
from payments.models import Transaction

User = get_user_model()


class APITestCase(APITestCase):
    """Тестирование API-эндпоинтов лотереи"""
    
    def setUp(self):
        """Настройка начальных данных для тестов"""
        # Создание обычного и админ пользователей
        self.user = User.objects.create_user(
            email='user@example.com',
            username='testuser',
            password='testpassword'
        )
        self.user.balance = Decimal('100.00')
        self.user.save()
        
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password='adminpassword'
        )
        
        # Создание клиентов API
        self.client = APIClient()
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)
        
        # Создание лотерейной игры
        self.lottery_game = LotteryGame.objects.create(
            name="Test Lottery",
            description="A test lottery game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            draw_time="20:00:00",
            is_active=True
        )
        
        # Создание категорий призов
        self.jackpot_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+2 (Jackpot)",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:139,838,160",
            prize_type='jackpot',
            fixed_amount=Decimal('1000000.00')
        )
        
        self.second_prize = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+1",
            main_numbers_matched=5,
            extra_numbers_matched=1,
            odds="1:6,991,908",
            prize_type='fixed',
            fixed_amount=Decimal('500000.00')
        )
        
        # Создание розыгрыша
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() + timezone.timedelta(days=2),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
        
        # Создание завершенного розыгрыша для проверки результатов
        self.completed_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=2,
            draw_date=timezone.now() - timezone.timedelta(days=1),
            status='completed',
            jackpot_amount=Decimal('1500000.00'),
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            verification_hash='test_hash'
        )
        
        # Создание результатов для завершенного розыгрыша
        self.draw_result = DrawResult.objects.create(
            draw=self.completed_draw,
            prize_category=self.jackpot_category,
            winners_count=1,
            prize_amount=Decimal('1500000.00')
        )
    
    def test_authentication_required(self):
        """Тест: API эндпоинты требуют аутентификации"""
        # Список эндпоинтов для проверки
        endpoints = [
            reverse('lottery-games'),
            reverse('draws-list'),
            reverse('upcoming-draws'),
            reverse('tickets-list'),
            # Можно добавить другие эндпоинты
        ]
        
        # Попытка доступа без аутентификации
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Аутентификация пользователя
        self.client.force_authenticate(user=self.user)
        
        # Повторная попытка с аутентификацией
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_lottery_games_list(self):
        """Тест: получение списка лотерейных игр"""
        self.client.force_authenticate(user=self.user)
        url = reverse('lottery-games')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем содержимое ответа
        self.assertIsNotNone(response.data)
        self.assertIn('results', response.data)  # Проверяем, что есть ключ results для пагинации
        
        # Проверяем наличие нашей лотереи в списке
        lottery_id = self.lottery_game.id
        for item in response.data.get('results', []):
            if item.get('id') == lottery_id:
                return  # Тест прошел успешно
        
        self.fail("Лотерея не найдена в списке")
    
    def test_lottery_game_detail(self):
        """Тест: получение детальной информации о лотерее"""
        self.client.force_authenticate(user=self.user)
        url = reverse('lottery-game-detail', kwargs={'pk': self.lottery_game.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.lottery_game.name)
        self.assertEqual(response.data['main_numbers_count'], self.lottery_game.main_numbers_count)
        self.assertEqual(response.data['extra_numbers_count'], self.lottery_game.extra_numbers_count)
    
    def test_upcoming_draws(self):
        """Тест: получение списка предстоящих розыгрышей"""
        self.client.force_authenticate(user=self.user)
        url = reverse('upcoming-draws')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем содержимое ответа
        self.assertIsNotNone(response.data)
        self.assertIn('results', response.data)  # Проверяем, что есть ключ results для пагинации
        
        # Проверяем наличие предстоящего розыгрыша в списке
        draw_id = self.draw.id
        for item in response.data.get('results', []):
            if item.get('id') == draw_id:
                return  # Тест прошел успешно
        
        self.fail("Предстоящий розыгрыш не найден в списке")
    
    def test_draw_results(self):
        """Тест: получение результатов завершенных розыгрышей"""
        self.client.force_authenticate(user=self.user)
        url = reverse('draw-results')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем содержимое ответа
        self.assertIsNotNone(response.data)
        self.assertIn('results', response.data)  # Проверяем, что есть ключ results для пагинации
        
        # Проверяем наличие завершенного розыгрыша в списке
        completed_draw_id = self.completed_draw.id
        for draw in response.data.get('results', []):
            if draw.get('id') == completed_draw_id:
                # У завершенного розыгрыша должны быть результаты
                self.assertIn('results', draw)
                self.assertIsNotNone(draw.get('main_numbers'))
                self.assertEqual(draw.get('status'), 'completed')
                return  # Тест прошел успешно
        
        self.fail("Завершенный розыгрыш не найден в списке")
    
    def test_purchase_ticket(self):
        """Тест: покупка лотерейного билета"""
        self.client.force_authenticate(user=self.user)
        url = reverse('purchase-ticket')
        
        initial_balance = self.user.balance
        
        # Данные для POST-запроса
        data = {
            'draw_id': self.draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tickets', response.data)
        self.assertEqual(len(response.data['tickets']), 1)
        
        # Проверка обновления баланса пользователя
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, initial_balance - self.lottery_game.ticket_price)
        
        # Проверка создания транзакции
        self.assertEqual(Transaction.objects.count(), 1)
        transaction = Transaction.objects.first()
        self.assertEqual(transaction.amount, self.lottery_game.ticket_price)
        self.assertEqual(transaction.transaction_type, 'ticket_purchase')
    
    def test_purchase_ticket_insufficient_funds(self):
        """Тест: попытка покупки билета с недостаточным балансом"""
        self.client.force_authenticate(user=self.user)
        
        # Установка баланса ниже стоимости билета
        self.user.balance = Decimal('0.50')
        self.user.save()
        
        url = reverse('purchase-ticket')
        data = {
            'draw_id': self.draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Insufficient funds')
        
        # Проверка, что баланс не изменился
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, Decimal('0.50'))
        
        # Проверка, что транзакция не создана
        self.assertEqual(Transaction.objects.count(), 0)
    
    def test_purchase_ticket_invalid_numbers(self):
        """Тест: попытка покупки билета с неправильными номерами"""
        self.client.force_authenticate(user=self.user)
        url = reverse('purchase-ticket')
        
        # Неверное количество основных номеров
        data = {
            'draw_id': self.draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4],  # Должно быть 5 номеров
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Номера выходят за пределы диапазона
        data = {
            'draw_id': self.draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 100],  # 100 выходит за диапазон 1-50
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Дубликаты в номерах
        data = {
            'draw_id': self.draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 4],  # Дубликат номера 4
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_ticket_list(self):
        """Тест: получение списка билетов пользователя"""
        self.client.force_authenticate(user=self.user)
        
        # Создание тестового билета
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        url = reverse('tickets-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем содержимое ответа
        self.assertIsNotNone(response.data)
        self.assertIn('results', response.data)  # Проверяем, что есть ключ results для пагинации
        
        # Проверяем наличие билета в списке
        ticket_id_str = str(ticket.ticket_id)
        for ticket_data in response.data.get('results', []):
            if ticket_data.get('ticket_id') == ticket_id_str:
                return  # Тест прошел успешно
        
        self.fail("Билет не найден в списке пользователя")
    
    def test_ticket_detail(self):
        """Тест: получение детальной информации о билете"""
        self.client.force_authenticate(user=self.user)
        
        # Создание тестового билета
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        url = reverse('ticket-detail', kwargs={'ticket_id': ticket.ticket_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['ticket_id'], str(ticket.ticket_id))
        self.assertEqual(response.data['main_numbers'], [1, 2, 3, 4, 5])
        self.assertEqual(response.data['extra_numbers'], [1, 2])
    
    def test_check_ticket(self):
        """Тест: проверка билета на выигрыш"""
        self.client.force_authenticate(user=self.user)
        
        # Создание билета для завершенного розыгрыша (с выигрышными номерами)
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.completed_draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        url = reverse('check-ticket', kwargs={'ticket_id': ticket.ticket_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('ticket', response.data)
        self.assertIn('prize_category', response.data)
        self.assertIn('winning_amount', response.data)
        
        # Проверка, что билет был отмечен как выигрышный
        ticket.refresh_from_db()
        self.assertEqual(ticket.result_status, 'winning')
        self.assertEqual(ticket.matched_main_numbers, 5)
        self.assertEqual(ticket.matched_extra_numbers, 2)
        
        # Проверка, что запись о выигрыше была создана
        winning_ticket = WinningTicket.objects.get(ticket=ticket)
        self.assertEqual(winning_ticket.prize_category, self.jackpot_category)
    
    def test_saved_combinations(self):
        """Тест: создание и получение сохраненных комбинаций"""
        self.client.force_authenticate(user=self.user)
        
        # Создание сохраненной комбинации
        url = reverse('create-saved-combination')
        data = {
            'lottery_game': self.lottery_game.id,
            'name': 'My Lucky Numbers',
            'main_numbers': [7, 14, 21, 28, 35],
            'extra_numbers': [3, 9]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Сохраняем ID созданной комбинации
        self.assertIn('id', response.data)
        combination_id = response.data['id']
        
        # Получение списка сохраненных комбинаций
        url = reverse('saved-combinations')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)  # Проверяем, что есть ключ results для пагинации
        
        # Проверка наличия созданной комбинации
        combination_found = False
        for combination in response.data.get('results', []):
            if combination.get('id') == combination_id:
                combination_found = True
                self.assertEqual(combination.get('name'), 'My Lucky Numbers')
                self.assertEqual(combination.get('main_numbers'), [7, 14, 21, 28, 35])
                self.assertEqual(combination.get('extra_numbers'), [3, 9])
                break
        
        self.assertTrue(combination_found, "Сохраненная комбинация не найдена")
        
        # Удаление сохраненной комбинации
        url = reverse('delete-saved-combination', kwargs={'pk': combination_id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверка, что комбинация была удалена
        url = reverse('saved-combinations')
        response = self.client.get(url)
        
        combination_still_exists = False
        for combination in response.data.get('results', []):
            if combination.get('id') == combination_id:
                combination_still_exists = True
                break
        
        self.assertFalse(combination_still_exists, "Комбинация не была удалена")
    
    def test_admin_draw_control_permissions(self):
        """Тест: проверка прав доступа к административному эндпоинту"""
        url = reverse('admin-conduct-draw')
        data = {'draw_id': self.draw.id}
        
        # Попытка доступа без аутентификации
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Попытка доступа обычным пользователем
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Проверка наличия валидации входных данных для администратора
        # Запрос без валидных данных может вернуть HTTP 400
        self.admin_client.force_authenticate(user=self.admin_user)
        response = self.admin_client.post(url, {'draw_id': 99999})  # Несуществующий draw_id
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('lottery.utils.rng.get_rng_provider')
    def test_admin_draw_control(self, mock_get_rng_provider):
        """Тест: административный эндпоинт для проведения розыгрыша"""
        # Мокаем RNG провайдер
        mock_provider = MagicMock()
        mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
            [1, 2, 3, 4, 5] if count == 5 else [1, 2]
        )
        mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
        mock_get_rng_provider.return_value = mock_provider
        
        url = reverse('admin-conduct-draw')
        data = {
            'draw_id': self.draw.id,
            'force': True  # Принудительное проведение розыгрыша
        }
        
        response = self.admin_client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('winning_numbers', response.data)
        
        # Проверка, что розыгрыш был проведен
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'completed')
        self.assertEqual(self.draw.main_numbers, [1, 2, 3, 4, 5])
        self.assertEqual(self.draw.extra_numbers, [1, 2])
        self.assertIsNotNone(self.draw.verification_hash)