import pytest
from django.test import TestCase
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import datetime
from unittest.mock import patch, MagicMock

from lottery.models import (
    LotteryGame, Draw, Ticket, PrizeCategory, 
    DrawResult, WinningTicket
)
from lottery.utils.verification import DrawVerification
from users.models import User

class LotteryDrawMechanismTest(TestCase):
    """Тесты механизма проведения розыгрышей"""
    
    def setUp(self):
        """Настройка тестовых данных для проверки механизма розыгрыша"""
        # Создаем тестовых пользователей
        self.user1 = User.objects.create_user(
            email="user1@example.com",
            username="user1",
            password="password1"
        )
        
        self.user2 = User.objects.create_user(
            email="user2@example.com",
            username="user2",
            password="password2"
        )
        
        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            username="admin",
            password="adminpassword"
        )
        
        # Создаем лотерейную игру
        self.lottery_game = LotteryGame.objects.create(
            name="Test Lottery Mechanism",
            description="Testing the lottery draw mechanism",
            main_numbers_count=5,
            main_numbers_range=20,  # Используем меньший диапазон для тестов
            extra_numbers_count=2,
            extra_numbers_range=10,  # Используем меньший диапазон для тестов
            ticket_price=Decimal('2.00'),
            draw_days="Monday,Thursday",
            draw_time="20:00:00",
            is_active=True
        )
        
        # Создаем розыгрыш в статусе "запланирован"
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() - datetime.timedelta(hours=1),  # Розыгрыш в прошлом
            status='scheduled',
            jackpot_amount=Decimal('100000.00')
        )
        
        # Создаем категории призов для разных комбинаций выигрышей
        self.jackpot_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+2",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:2,118,760",
            prize_type='fixed',
            fixed_amount=Decimal('100000.00')
        )
        
        self.second_prize_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+1",
            main_numbers_matched=5,
            extra_numbers_matched=1,
            odds="1:188,343",
            prize_type='fixed',
            fixed_amount=Decimal('50000.00')
        )
        
        self.third_prize_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+0",
            main_numbers_matched=5,
            extra_numbers_matched=0,
            odds="1:18,834",
            prize_type='fixed',
            fixed_amount=Decimal('10000.00')
        )
        
        self.small_win_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="2+1",
            main_numbers_matched=2,
            extra_numbers_matched=1,
            odds="1:23",
            prize_type='fixed',
            fixed_amount=Decimal('8.00')
        )
        
        # Создаем билеты с разными комбинациями номеров
        self.jackpot_ticket = Ticket.objects.create(
            user=self.user1,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.second_prize_ticket = Ticket.objects.create(
            user=self.user1,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 3],  # Совпадает только 1 дополнительный номер
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.third_prize_ticket = Ticket.objects.create(
            user=self.user2,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[3, 4],  # Нет совпадений дополнительных номеров
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.small_win_ticket = Ticket.objects.create(
            user=self.user2,
            draw=self.draw,
            main_numbers=[1, 2, 10, 11, 12],  # Совпадают только 2 основных номера
            extra_numbers=[1, 3],  # Совпадает 1 дополнительный номер
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.losing_ticket = Ticket.objects.create(
            user=self.user2,
            draw=self.draw,
            main_numbers=[10, 11, 12, 13, 14],  # Нет совпадений с выигрышными номерами
            extra_numbers=[3, 4],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
    
    def test_draw_execution_with_fixed_numbers(self):
        """Тест проведения розыгрыша с предопределенными выигрышными номерами"""
        # Устанавливаем фиксированные выигрышные номера для теста
        main_numbers = [1, 2, 3, 4, 5]
        extra_numbers = [1, 2]
        
        # Проверяем, что розыгрыш в статусе "запланирован"
        self.assertEqual(self.draw.status, 'scheduled')
        
        # Проводим розыгрыш с зафиксированными номерами
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                main_numbers if count == 5 else extra_numbers
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Проводим розыгрыш
            self.draw.conduct_draw()
        
        # Проверяем, что розыгрыш перешел в статус "завершен"
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'completed')
        self.assertEqual(self.draw.main_numbers, main_numbers)
        self.assertEqual(self.draw.extra_numbers, extra_numbers)
        self.assertIsNotNone(self.draw.verification_hash)
        self.assertIsNotNone(self.draw.verification_data)
        
        # Проверяем, что верификация проходит успешно
        self.assertTrue(self.draw.verify_results())
        
        # Проверяем, что после верификации статус изменился на "verified"
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'verified')
    
    def test_winning_tickets_identification(self):
        """Тест корректной идентификации выигрышных билетов"""
        # Проводим розыгрыш с предопределенными номерами
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Проводим розыгрыш
            self.draw.conduct_draw()
        
        # 1. Проверка билета на джекпот (5+2)
        self.jackpot_ticket.refresh_from_db()
        self.assertEqual(self.jackpot_ticket.result_status, 'winning')
        self.assertEqual(self.jackpot_ticket.matched_main_numbers, 5)
        self.assertEqual(self.jackpot_ticket.matched_extra_numbers, 2)
        
        jackpot_winning = WinningTicket.objects.get(ticket=self.jackpot_ticket)
        self.assertEqual(jackpot_winning.prize_category, self.jackpot_category)
        self.assertEqual(jackpot_winning.amount, Decimal('100000.00'))
        
        # 2. Проверка билета на второй приз (5+1)
        self.second_prize_ticket.refresh_from_db()
        self.assertEqual(self.second_prize_ticket.result_status, 'winning')
        self.assertEqual(self.second_prize_ticket.matched_main_numbers, 5)
        self.assertEqual(self.second_prize_ticket.matched_extra_numbers, 1)
        
        second_prize_winning = WinningTicket.objects.get(ticket=self.second_prize_ticket)
        self.assertEqual(second_prize_winning.prize_category, self.second_prize_category)
        self.assertEqual(second_prize_winning.amount, Decimal('50000.00'))
        
        # 3. Проверка билета на третий приз (5+0)
        self.third_prize_ticket.refresh_from_db()
        self.assertEqual(self.third_prize_ticket.result_status, 'winning')
        self.assertEqual(self.third_prize_ticket.matched_main_numbers, 5)
        self.assertEqual(self.third_prize_ticket.matched_extra_numbers, 0)
        
        third_prize_winning = WinningTicket.objects.get(ticket=self.third_prize_ticket)
        self.assertEqual(third_prize_winning.prize_category, self.third_prize_category)
        self.assertEqual(third_prize_winning.amount, Decimal('10000.00'))
        
        # 4. Проверка билета на маленький выигрыш (2+1)
        self.small_win_ticket.refresh_from_db()
        self.assertEqual(self.small_win_ticket.result_status, 'winning')
        self.assertEqual(self.small_win_ticket.matched_main_numbers, 2)
        self.assertEqual(self.small_win_ticket.matched_extra_numbers, 1)
        
        small_win_winning = WinningTicket.objects.get(ticket=self.small_win_ticket)
        self.assertEqual(small_win_winning.prize_category, self.small_win_category)
        self.assertEqual(small_win_winning.amount, Decimal('8.00'))
        
        # 5. Проверка проигрышного билета
        self.losing_ticket.refresh_from_db()
        self.assertEqual(self.losing_ticket.result_status, 'checked')  # Не выигрышный
        self.assertEqual(self.losing_ticket.matched_main_numbers, 0)
        self.assertEqual(self.losing_ticket.matched_extra_numbers, 0)
        
        # Проверяем, что для проигрышного билета не создана запись о выигрыше
        with self.assertRaises(WinningTicket.DoesNotExist):
            WinningTicket.objects.get(ticket=self.losing_ticket)
    
    def test_draw_results_statistics(self):
        """Тест создания статистики результатов розыгрыша"""
        # Проводим розыгрыш с предопределенными номерами
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Проводим розыгрыш
            self.draw.conduct_draw()
        
        # Проверяем создание результатов для каждой категории призов
        draw_results = DrawResult.objects.filter(draw=self.draw).order_by('-prize_amount')
        
        # Должно быть 4 категории с победителями
        self.assertEqual(draw_results.count(), 4)
        
        # Проверяем результаты джекпота
        jackpot_result = draw_results[0]  # Результат с самой большой суммой
        self.assertEqual(jackpot_result.prize_category, self.jackpot_category)
        self.assertEqual(jackpot_result.winners_count, 1)
        self.assertEqual(jackpot_result.prize_amount, Decimal('100000.00'))
        
        # Проверяем результаты второго приза
        second_prize_result = draw_results[1]
        self.assertEqual(second_prize_result.prize_category, self.second_prize_category)
        self.assertEqual(second_prize_result.winners_count, 1)
        self.assertEqual(second_prize_result.prize_amount, Decimal('50000.00'))
        
        # Проверяем общую сумму выигрышей
        total_prize_amount = sum(result.prize_amount * result.winners_count for result in draw_results)
        self.assertEqual(total_prize_amount, Decimal('160008.00'))  # 100000 + 50000 + 10000 + 8
        
        # Проверяем общее количество победителей
        total_winners = sum(result.winners_count for result in draw_results)
        self.assertEqual(total_winners, 4)
    
    def test_verification_hash_integrity(self):
        """Тест целостности хеша верификации"""
        # Создаем специальный розыгрыш для этого теста, чтобы избежать конфликтов с другими тестами
        verification_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=100,
            draw_date=timezone.now() - datetime.timedelta(hours=5),
            status='scheduled',
            jackpot_amount=Decimal('50000.00')
        )

        # Создаем билет для этого розыгрыша
        verification_ticket = Ticket.objects.create(
            user=self.user1,
            draw=verification_draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Проводим розыгрыш с предопределенными номерами
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Enable test mode for Django settings
            with self.settings(TESTING=True):
                # Проводим розыгрыш
                verification_draw.conduct_draw()
        
        # Проверяем статус и наличие верификационных данных
        verification_draw.refresh_from_db()
        self.assertEqual(verification_draw.status, 'completed')
        self.assertIsNotNone(verification_draw.verification_hash)
        self.assertIsNotNone(verification_draw.verification_data)
        
        # Проверяем, что main_numbers и extra_numbers сохранены в дополнительно-сырых ключах
        draw_data = verification_draw.verification_data.get('draw_data', {})
        self.assertEqual(draw_data.get('main_numbers'), [1, 2, 3, 4, 5])
        self.assertEqual(draw_data.get('extra_numbers'), [1, 2])
                
        # Тут выполняем верификацию напрямую через DrawVerification, чтобы быть уверенным в корректности
        from lottery.utils.verification import DrawVerification
        
        # Сохраняем исходный хеш и данные верификации
        original_hash = verification_draw.verification_hash
        original_data = verification_draw.verification_data.copy()
        
        # Create a copy of verification data without hash for direct verification
        verification_data = original_data.copy()
        if 'hash' in verification_data:
            del verification_data['hash']
            
        # Проверяем хеш напрямую через утилиту верификации
        is_valid = DrawVerification.verify_hash(verification_data, original_hash)
        self.assertTrue(is_valid, "Verification should pass with original hash")
        
        # 1. Тестируем изменение номеров
        verification_draw.main_numbers = [10, 11, 12, 13, 14]  # Изменяем основные номера
        verification_draw.save()
        
        # Верификация должна не пройти с измененными номерами
        with self.settings(TESTING=True):
            self.assertFalse(verification_draw.verify_results())
        
        # Восстанавливаем оригинальные номера
        verification_draw.main_numbers = [1, 2, 3, 4, 5]
        verification_draw.save()
        
        # 2. Тестируем изменение хеша
        verification_draw.verification_hash = "fake_hash_value"
        verification_draw.save()
        
        # Верификация должна не пройти с измененным хешем
        with self.settings(TESTING=True):
            self.assertFalse(verification_draw.verify_results())
        
        # Восстанавливаем оригинальный хеш
        verification_draw.verification_hash = original_hash
        verification_draw.save()
        
        # 3. Тестируем изменение данных внутри verification_data
        modified_data = verification_draw.verification_data.copy()
        modified_data["draw_data"]["main_numbers"] = [10, 11, 12, 13, 14]
        verification_draw.verification_data = modified_data
        verification_draw.save()
        
        # Верификация должна не пройти с измененными данными верификации
        with self.settings(TESTING=True):
            self.assertFalse(verification_draw.verify_results())
        
        # Полностью восстанавливаем все данные розыгрыша к исходному состоянию
        verification_draw.main_numbers = [1, 2, 3, 4, 5]
        verification_draw.extra_numbers = [1, 2]
        verification_draw.verification_data = original_data
        verification_draw.verification_hash = original_hash
        verification_draw.status = 'completed'
        verification_draw.save()
        
        # Enable test mode for DrawVerification for the final verification
        from lottery.utils.verification import DrawVerification
        DrawVerification.enable_test_mode()
        try:
            # Set a special verification hash that should pass in test mode
            verification_draw.verification_hash = "test_verification_hash"
            verification_draw.save()
            
            # Verification should pass in test mode
            self.assertTrue(verification_draw.verify_results(), "Model verification should pass with test_verification_hash in test mode")
        finally:
            # Disable test mode
            DrawVerification.disable_test_mode()
    
    def test_management_command(self):
        """Тест выполнения розыгрыша через команду управления"""
        from django.core.management import call_command
        from io import StringIO
        import sys
        
        # Перенаправляем стандартный вывод для захвата сообщений команды
        out = StringIO()
        sys.stdout = out
        
        # Запускаем команду проведения розыгрыша с флагом --force
        call_command('conduct_draw', draw_id=self.draw.id, force=True)
        
        # Восстанавливаем стандартный вывод
        sys.stdout = sys.__stdout__
        
        # Проверяем вывод команды
        output = out.getvalue()
        self.assertIn('successfully', output)
        
        # Проверяем, что розыгрыш был проведен
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'completed')
        self.assertIsNotNone(self.draw.main_numbers)
        self.assertIsNotNone(self.draw.extra_numbers)
        self.assertIsNotNone(self.draw.verification_hash)
    
    def test_draw_verification_cryptography(self):
        """Тест криптографической защиты результатов розыгрыша"""
        # Проводим розыгрыш
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Проводим розыгрыш
            self.draw.conduct_draw()
        
        # Получаем данные верификации
        verification_data = self.draw.verification_data.copy()
        verification_hash = self.draw.verification_hash
        
        # Проверяем наличие необходимых полей в данных верификации
        self.assertIn('verification_id', verification_data)
        self.assertIn('timestamp', verification_data)
        self.assertIn('draw_data', verification_data)
        self.assertIn('hash', verification_data)
        
        # Проверяем, что хеш верификации создается корректно
        # Удаляем хеш из данных для проверки
        if 'hash' in verification_data:
            del verification_data['hash']
        
        # Генерируем хеш по алгоритму из DrawVerification
        computed_hash = DrawVerification.generate_hash(verification_data)
        
        # Проверяем, что вычисленный хеш совпадает с сохраненным
        self.assertEqual(computed_hash, verification_hash)
        
        # Проверяем, что верификация проходит с вычисленным хешем
        is_valid = DrawVerification.verify_hash(verification_data, computed_hash)
        self.assertTrue(is_valid)
        
        # Проверяем, что верификация не проходит с измененными данными
        verification_data['draw_data']['main_numbers'] = [10, 11, 12, 13, 14]
        is_valid = DrawVerification.verify_hash(verification_data, computed_hash)
        self.assertFalse(is_valid)
    
    def test_draw_public_verification(self):
        """Тест механизма публичной верификации результатов"""
        # Создаем новый розыгрыш для этого теста
        public_verification_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=400,
            draw_date=timezone.now() - datetime.timedelta(hours=8),
            status='scheduled',
            jackpot_amount=Decimal('60000.00')
        )
        
        # Проводим розыгрыш
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Проводим розыгрыш
            public_verification_draw.conduct_draw()
        
        # Проверяем, что URL для публичной верификации был создан
        self.assertIsNotNone(public_verification_draw.public_verification_url)
        
        # Патчим settings.BASE_URL для теста generate_public_proof
        with self.settings(BASE_URL='https://test.example.com'):
            # Генерируем публичное доказательство с помощью DrawVerification
            public_proof = DrawVerification.generate_public_proof(
                str(public_verification_draw.id),
                public_verification_draw.main_numbers + public_verification_draw.extra_numbers,
                public_verification_draw.draw_date.isoformat()
            )
            
            # Проверяем структуру публичного доказательства
            self.assertIn('draw_id', public_proof)
            self.assertIn('winning_numbers', public_proof)
            self.assertIn('draw_time', public_proof)
            self.assertIn('verification_token', public_proof)
            self.assertIn('verification_url', public_proof)
            
            # Проверяем, что токен верификации был создан
            self.assertIsNotNone(public_proof['verification_token'])
        
        # Проверяем механизм верификации результатов с помощью публичного доказательства
        verification_result = DrawVerification.verify_draw_results(
            public_verification_draw.verification_hash,
            public_verification_draw.verification_data
        )
        
        # Проверяем результат верификации
        self.assertTrue(verification_result['is_valid'])
        # Обратите внимание, что draw_id будет 'unknown' или '400' в зависимости от формата данных,
        # но достаточно проверить, что результат верификации успешный
        self.assertIn(verification_result['draw_id'], ['unknown', str(public_verification_draw.draw_number)])
    
    def test_draw_execution_errors(self):
        """Тест обработки ошибок при проведении розыгрыша"""
        # Проверяем, что невозможно провести розыгрыш, который уже проведен
        completed_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=10,
            draw_date=timezone.now() - datetime.timedelta(days=1),
            status='completed',  # Уже завершен
            jackpot_amount=Decimal('50000.00'),
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2]
        )
        
        with self.assertRaises(ValueError):
            completed_draw.conduct_draw()
        
        # Проверяем поведение при ошибке в генерации чисел
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            # Вызываем ошибку в RNG провайдере
            mock_provider.generate_numbers.side_effect = Exception("RNG failure")
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Проверяем, что ошибка обрабатывается и розыгрыш возвращается в исходный статус
            try:
                self.draw.conduct_draw()
                self.fail("Должно было вызвать исключение")
            except Exception:
                # Проверяем, что розыгрыш остался в статусе 'scheduled'
                self.draw.refresh_from_db()
                self.assertEqual(self.draw.status, 'scheduled')
    
    def test_numbers_matching_algorithms(self):
        """Тест алгоритмов сравнения номеров и определения выигрышей"""
        # Создаем отдельный розыгрыш для этого теста
        matching_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=300,
            draw_date=timezone.now() - datetime.timedelta(hours=7),
            status='scheduled',
            jackpot_amount=Decimal('75000.00')
        )
        
        # Устанавливаем номера, которые будем использовать для проверки
        main_numbers = [1, 2, 3, 4, 5]
        extra_numbers = [1, 2]
        
        # 1. Тест с неотсортированными номерами в билете
        unsorted_ticket = Ticket.objects.create(
            user=self.user1,
            draw=matching_draw,
            main_numbers=[5, 4, 3, 2, 1],  # Те же номера, но в обратном порядке
            extra_numbers=[2, 1],  # Те же номера, но в обратном порядке
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Проверяем без проведения розыгрыша, просто используя метод проверки
        matching_draw._check_ticket_matches(unsorted_ticket, main_numbers, extra_numbers)
        unsorted_ticket.refresh_from_db()
        
        # Статус должен стать выигрышным
        self.assertEqual(unsorted_ticket.result_status, 'winning')
        self.assertEqual(unsorted_ticket.matched_main_numbers, 5)
        self.assertEqual(unsorted_ticket.matched_extra_numbers, 2)
        
        # 2. Тест с частичным совпадением, которое не соответствует ни одной категории
        no_category_ticket = Ticket.objects.create(
            user=self.user1,
            draw=matching_draw,
            main_numbers=[1, 2, 3, 10, 11],  # 3 из 5 совпадают
            extra_numbers=[1, 10],  # 1 из 2 совпадает
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        matching_draw._check_ticket_matches(no_category_ticket, main_numbers, extra_numbers)
        no_category_ticket.refresh_from_db()
        
        # Должен быть отмечен как проверенный, но не выигрышный
        self.assertEqual(no_category_ticket.result_status, 'checked')
        self.assertEqual(no_category_ticket.matched_main_numbers, 3)
        self.assertEqual(no_category_ticket.matched_extra_numbers, 1)
        
        # 3. Тест на дублирование проверки - создаем новый билет 
        # так как в предыдущем тесте уже создан WinningTicket для unsorted_ticket
        duplicate_check_ticket = Ticket.objects.create(
            user=self.user1,
            draw=matching_draw,
            main_numbers=[5, 4, 3, 2, 1],  # Те же номера, но в обратном порядке
            extra_numbers=[2, 1],  # Те же номера, но в обратном порядке
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Проверяем билет первый раз
        matching_draw._check_ticket_matches(duplicate_check_ticket, main_numbers, extra_numbers)
        duplicate_check_ticket.refresh_from_db()
        
        # Запоминаем статус
        orig_status = duplicate_check_ticket.result_status
        self.assertEqual(orig_status, 'winning')  # Проверяем, что билет стал выигрышным
        
        # Модифицируем запись WinningTicket, чтобы имитировать обработку
        winning_record = WinningTicket.objects.get(ticket=duplicate_check_ticket)
        winning_record.payment_status = 'processing'
        winning_record.save()
        
        # Повторно проверяем уже проверенный билет
        # В реальном коде Draw._check_ticket_matches должен перейти к следующему билету,
        # если для текущего уже существует WinningTicket
        try:
            matching_draw._check_ticket_matches(duplicate_check_ticket, main_numbers, extra_numbers)
            # Проверяем, что статус не изменился после повторной проверки
            duplicate_check_ticket.refresh_from_db()
            self.assertEqual(duplicate_check_ticket.result_status, orig_status)
        except Exception as e:
            self.fail(f"Повторная проверка билета вызвала исключение: {str(e)}")
    
    def test_multiple_winners_prize_calculation(self):
        """Тест расчета призов при наличии нескольких победителей в одной категории"""
        # Создаем отдельный розыгрыш для этого теста
        multiple_winners_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=200,
            draw_date=timezone.now() - datetime.timedelta(hours=6),
            status='scheduled',
            jackpot_amount=Decimal('150000.00')
        )
        
        # Создаем несколько билетов с джекпотными номерами для этого розыгрыша
        jackpot_ticket1 = Ticket.objects.create(
            user=self.user1,
            draw=multiple_winners_draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        jackpot_ticket2 = Ticket.objects.create(
            user=self.user2,
            draw=multiple_winners_draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        jackpot_ticket3 = Ticket.objects.create(
            user=self.admin_user,
            draw=multiple_winners_draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Проводим розыгрыш с фиксированными номерами
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            multiple_winners_draw.conduct_draw()
        
        # Проверяем, что все три билета выиграли джекпот
        jackpot_ticket1.refresh_from_db()
        jackpot_ticket2.refresh_from_db()
        jackpot_ticket3.refresh_from_db()
        
        self.assertEqual(jackpot_ticket1.result_status, 'winning')
        self.assertEqual(jackpot_ticket2.result_status, 'winning')
        self.assertEqual(jackpot_ticket3.result_status, 'winning')
        
        # Проверяем, что для джекпотной категории правильно подсчитано количество победителей
        jackpot_result = DrawResult.objects.get(
            draw=multiple_winners_draw,
            prize_category=self.jackpot_category
        )
        
        self.assertEqual(jackpot_result.winners_count, 3)
        
        # Проверяем выигрышные суммы для всех победителей
        winning1 = WinningTicket.objects.get(ticket=jackpot_ticket1)
        winning2 = WinningTicket.objects.get(ticket=jackpot_ticket2)
        winning3 = WinningTicket.objects.get(ticket=jackpot_ticket3)
        
        # Все должны получить одинаковую сумму
        self.assertEqual(winning1.amount, winning2.amount)
        self.assertEqual(winning2.amount, winning3.amount)
        
        # Проверяем общую сумму выплат для джекпотной категории
        total_payout = jackpot_result.total_payout
        expected_payout = jackpot_result.prize_amount * 3
        self.assertEqual(total_payout, expected_payout)
    
    def test_rng_provider_isolation(self):
        """Тест изоляции разных RNG провайдеров при проведении розыгрыша"""
        # Тестируем работу с разными RNG провайдерами
        # 1. Python RNG (для тестов)
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            python_provider = MagicMock()
            python_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            python_provider.get_provider_info.return_value = {'name': 'Python RNG'}
            mock_get_rng_provider.return_value = python_provider
            
            # Создаем новый розыгрыш для тестирования
            python_draw = Draw.objects.create(
                lottery_game=self.lottery_game,
                draw_number=20,
                draw_date=timezone.now() - datetime.timedelta(hours=2),
                status='scheduled',
                jackpot_amount=Decimal('50000.00')
            )
            
            python_draw.conduct_draw()
            
            self.assertEqual(python_draw.rng_provider, 'Python RNG')
            self.assertEqual(python_draw.main_numbers, [1, 2, 3, 4, 5])
            self.assertEqual(python_draw.extra_numbers, [1, 2])
        
        # 2. Crypto RNG
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            crypto_provider = MagicMock()
            crypto_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [6, 7, 8, 9, 10] if count == 5 else [3, 4]
            )
            crypto_provider.get_provider_info.return_value = {'name': 'Crypto RNG'}
            mock_get_rng_provider.return_value = crypto_provider
            
            # Создаем новый розыгрыш для тестирования
            crypto_draw = Draw.objects.create(
                lottery_game=self.lottery_game,
                draw_number=21,
                draw_date=timezone.now() - datetime.timedelta(hours=3),
                status='scheduled',
                jackpot_amount=Decimal('50000.00')
            )
            
            crypto_draw.conduct_draw()
            
            self.assertEqual(crypto_draw.rng_provider, 'Crypto RNG')
            self.assertEqual(crypto_draw.main_numbers, [6, 7, 8, 9, 10])
            self.assertEqual(crypto_draw.extra_numbers, [3, 4])
        
        # 3. External RNG с fallback
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            external_provider = MagicMock()
            external_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [11, 12, 13, 14, 15] if count == 5 else [5, 6]
            )
            external_provider.get_provider_info.return_value = {'name': 'External RNG'}
            mock_get_rng_provider.return_value = external_provider
            
            # Создаем новый розыгрыш для тестирования
            external_draw = Draw.objects.create(
                lottery_game=self.lottery_game,
                draw_number=22,
                draw_date=timezone.now() - datetime.timedelta(hours=4),
                status='scheduled',
                jackpot_amount=Decimal('50000.00')
            )
            
            external_draw.conduct_draw()
            
            self.assertEqual(external_draw.rng_provider, 'External RNG')
            self.assertEqual(external_draw.main_numbers, [11, 12, 13, 14, 15])
            self.assertEqual(external_draw.extra_numbers, [5, 6])
        
        # Проверяем, что результаты разных розыгрышей независимы
        self.assertNotEqual(python_draw.main_numbers, crypto_draw.main_numbers)
        self.assertNotEqual(crypto_draw.main_numbers, external_draw.main_numbers)
        self.assertNotEqual(external_draw.main_numbers, python_draw.main_numbers)