import pytest
from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
import datetime
from unittest.mock import patch, MagicMock

from lottery.models import LotteryGame, Draw, Ticket, PrizeCategory, WinningTicket, DrawResult
from users.models import User

class ModelTestCase(TestCase):
    """Тесты для моделей лотереи"""
    
    def setUp(self):
        """Создание тестовых данных для всех тестов"""
        # Создаем тестового пользователя
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpassword"
        )
        
        # Создаем лотерейную игру
        self.lottery = LotteryGame.objects.create(
            name="Test Lottery",
            description="Test lottery game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            draw_time="20:00:00",
            is_active=True
        )
        
        # Создаем категории призов
        self.jackpot_category = PrizeCategory.objects.create(
            lottery_game=self.lottery,
            name="5+2 (Jackpot)",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:139,838,160",
            prize_type='jackpot',
            fixed_amount=Decimal('1000000.00')
        )
        
        self.second_prize = PrizeCategory.objects.create(
            lottery_game=self.lottery,
            name="5+1",
            main_numbers_matched=5,
            extra_numbers_matched=1,
            odds="1:6,991,908",
            prize_type='fixed',
            fixed_amount=Decimal('500000.00')
        )
        
        # Создаем розыгрыш
        self.draw = Draw.objects.create(
            lottery_game=self.lottery,
            draw_number=1,
            draw_date=timezone.now() + timezone.timedelta(days=2),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
    
    def test_lottery_game_creation(self):
        """Тест создания модели лотерейной игры"""
        self.assertEqual(self.lottery.name, "Test Lottery")
        self.assertEqual(self.lottery.main_numbers_count, 5)
        self.assertEqual(self.lottery.main_numbers_range, 50)
        self.assertEqual(self.lottery.extra_numbers_count, 2)
        self.assertEqual(self.lottery.extra_numbers_range, 12)
        self.assertEqual(self.lottery.ticket_price, Decimal('2.50'))
        self.assertEqual(self.lottery.draw_days, "Tuesday,Friday")
        self.assertTrue(self.lottery.is_active)
        
        # Проверка вычисляемого свойства
        self.assertEqual(self.lottery.display_name, "Test Lottery (5/50)")
        
        # Проверка процента призового фонда (дефолтное значение)
        self.assertEqual(self.lottery.prize_pool_percentage, Decimal('50.00'))
    
    def test_draw_creation(self):
        """Тест создания розыгрыша"""
        self.assertEqual(self.draw.lottery_game, self.lottery)
        self.assertEqual(self.draw.draw_number, 1)
        self.assertEqual(self.draw.status, 'scheduled')
        self.assertEqual(self.draw.jackpot_amount, Decimal('1000000.00'))
        
        # Проверка свойств
        self.assertTrue(self.draw.is_open_for_tickets)
        self.assertFalse(self.draw.is_completed)
    
    def test_ticket_creation(self):
        """Тест создания билета"""
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery.ticket_price,
            is_quick_pick=False,
            result_status='pending'
        )
        
        # Проверка создания билета
        self.assertEqual(ticket.user, self.user)
        self.assertEqual(ticket.draw, self.draw)
        self.assertEqual(ticket.main_numbers, [1, 2, 3, 4, 5])
        self.assertEqual(ticket.extra_numbers, [1, 2])
        self.assertEqual(ticket.price, self.lottery.ticket_price)
        self.assertFalse(ticket.is_quick_pick)
        self.assertEqual(ticket.result_status, 'pending')
        self.assertIsNotNone(ticket.ticket_id)
        
        # Проверка обновления счетчика билетов в розыгрыше
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.ticket_count, 1)
    
    def test_prize_category_creation(self):
        """Тест создания категории призов"""
        self.assertEqual(self.jackpot_category.lottery_game, self.lottery)
        self.assertEqual(self.jackpot_category.main_numbers_matched, 5)
        self.assertEqual(self.jackpot_category.extra_numbers_matched, 2)
        self.assertEqual(self.jackpot_category.prize_type, 'jackpot')
        self.assertEqual(self.jackpot_category.fixed_amount, Decimal('1000000.00'))
    
    def test_next_draw_date_calculation(self):
        """Тест расчета даты следующего розыгрыша"""
        # Получаем следующую дату розыгрыша
        next_draw_date = self.lottery.get_next_draw_date()
        
        # Проверяем, что дата не None
        self.assertIsNotNone(next_draw_date)
        
        # Проверяем, что это либо вторник (1), либо пятница (4)
        self.assertIn(next_draw_date.weekday(), [1, 4])
        
        # Проверяем, что дата розыгрыша в будущем
        self.assertTrue(next_draw_date > timezone.now())
    
    def test_create_next_draw(self):
        """Тест создания следующего розыгрыша"""
        # Создаем следующий розыгрыш
        next_draw = self.lottery.create_next_draw()
        
        # Проверяем правильность создания
        self.assertEqual(next_draw.lottery_game, self.lottery)
        self.assertEqual(next_draw.draw_number, self.draw.draw_number + 1)
        self.assertEqual(next_draw.status, 'scheduled')
        self.assertEqual(next_draw.jackpot_amount, Decimal('1000000.00'))  # Базовый джекпот
    
    @patch('lottery.utils.rng.get_rng_provider')
    def test_conduct_draw(self, mock_get_rng_provider):
        """Тест проведения розыгрыша"""
        # Создаем билет с выигрышными номерами
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery.ticket_price,
            result_status='pending'
        )
        
        # Мокаем RNG провайдер
        mock_provider = MagicMock()
        mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
            [1, 2, 3, 4, 5] if count == 5 else [1, 2]
        )
        mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
        mock_get_rng_provider.return_value = mock_provider
        
        # Проводим розыгрыш
        self.draw.conduct_draw()
        
        # Проверяем результаты
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'completed')
        self.assertEqual(self.draw.main_numbers, [1, 2, 3, 4, 5])
        self.assertEqual(self.draw.extra_numbers, [1, 2])
        self.assertIsNotNone(self.draw.verification_hash)
        
        # Проверяем обработку билета
        ticket.refresh_from_db()
        self.assertEqual(ticket.result_status, 'winning')
        self.assertEqual(ticket.matched_main_numbers, 5)
        self.assertEqual(ticket.matched_extra_numbers, 2)
        
        # Проверяем создание записи о выигрыше
        winning_ticket = WinningTicket.objects.get(ticket=ticket)
        self.assertEqual(winning_ticket.prize_category, self.jackpot_category)
        self.assertEqual(winning_ticket.main_numbers_matched, 5)
        self.assertEqual(winning_ticket.extra_numbers_matched, 2)
        
        # Проверяем создание результата розыгрыша
        draw_result = DrawResult.objects.get(draw=self.draw, prize_category=self.jackpot_category)
        self.assertEqual(draw_result.winners_count, 1)
    
    def test_verify_results(self):
        """Тест проверки результатов розыгрыша"""
        # Проводим розыгрыш с мокированным RNG
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            self.draw.conduct_draw()
        
        # Верификация должна пройти успешно
        self.assertTrue(self.draw.verify_results())
        
        # Статус должен измениться на 'verified'
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'verified')
        
        # Изменяем результаты и проверяем, что верификация не пройдет
        self.draw.main_numbers = [10, 11, 12, 13, 14]
        self.draw.save()
        
        self.assertFalse(self.draw.verify_results())
    
    def test_winning_ticket_functionality(self):
        """Тест функциональности выигрышного билета"""
        # Создаем билет
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery.ticket_price,
            result_status='pending'
        )
        
        # Создаем выигрышный билет
        winning_ticket = WinningTicket.objects.create(
            ticket=ticket,
            prize_category=self.jackpot_category,
            amount=Decimal('1000000.00'),
            main_numbers_matched=5,
            extra_numbers_matched=2,
            payment_status='pending'
        )
        
        # Проверка требования ручной верификации
        self.assertTrue(winning_ticket.requires_manual_verification)
        
        # Проверка выплаты приза
        with patch.object(winning_ticket, '_create_payment_transaction') as mock_transaction:
            mock_transaction.return_value = {
                'id': 'TEST_TRANSACTION',
                'status': 'completed',
                'amount': float(winning_ticket.amount),
                'user_id': self.user.id,
            }
            
            # Должно попасть на ручную проверку из-за большой суммы
            self.assertFalse(winning_ticket.pay_prize())
            winning_ticket.refresh_from_db()
            self.assertEqual(winning_ticket.payment_status, 'on_hold')
            
            # После верификации администратором
            winning_ticket.verified_by = self.user  # Предполагаем, что self.user - администратор
            winning_ticket.verification_date = timezone.now()
            winning_ticket.save()
            
            # Теперь выплата должна пройти успешно
            self.assertTrue(winning_ticket.pay_prize())
            
            winning_ticket.refresh_from_db()
            ticket.refresh_from_db()
            
            self.assertEqual(winning_ticket.payment_status, 'paid')
            self.assertEqual(ticket.result_status, 'paid')
            self.assertIsNotNone(winning_ticket.payment_date)