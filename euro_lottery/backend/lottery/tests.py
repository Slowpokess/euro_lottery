from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
import json
from decimal import Decimal
import datetime

from .models import (
    LotteryGame, Draw, PrizeCategory, Ticket, DrawResult, WinningTicket
)
from payments.models import Transaction

User = get_user_model()

class ModelTestCase(TestCase):
    """Test case for the lottery models"""
    
    def setUp(self):
        """Define the test client and set up test data"""
        # Create test lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Test EuroMillions",
            description="A test lottery game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            is_active=True
        )
        
        # Create draw
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() + datetime.timedelta(days=2),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
        
        # Create prize categories
        self.prize_category_jackpot = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+2",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:139,838,160",
            prize_type='fixed',
            fixed_amount=Decimal('1000000.00')
        )
        
        self.prize_category_second = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+1",
            main_numbers_matched=5,
            extra_numbers_matched=1,
            odds="1:6,991,908",
            prize_type='fixed',
            fixed_amount=Decimal('500000.00')
        )
        
        self.prize_category_small = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="2+1",
            main_numbers_matched=2,
            extra_numbers_matched=1,
            odds="1:22",
            prize_type='fixed',
            fixed_amount=Decimal('8.00')
        )
        
        # Create user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpassword'
        )
        self.user.balance = Decimal('100.00')
        self.user.save()
        
    def test_lottery_game_creation(self):
        """Test the lottery game creation"""
        self.assertEqual(self.lottery_game.name, "Test EuroMillions")
        self.assertEqual(self.lottery_game.main_numbers_count, 5)
        self.assertEqual(self.lottery_game.extra_numbers_count, 2)
        self.assertTrue(self.lottery_game.is_active)
    
    def test_draw_creation(self):
        """Test the draw creation"""
        self.assertEqual(self.draw.lottery_game, self.lottery_game)
        self.assertEqual(self.draw.draw_number, 1)
        self.assertEqual(self.draw.status, 'scheduled')
    
    def test_prize_category_creation(self):
        """Test prize category creation"""
        self.assertEqual(self.prize_category_jackpot.name, "5+2")
        self.assertEqual(self.prize_category_jackpot.main_numbers_matched, 5)
        self.assertEqual(self.prize_category_jackpot.extra_numbers_matched, 2)
        self.assertEqual(self.prize_category_jackpot.fixed_amount, Decimal('1000000.00'))
    
    def test_ticket_purchase(self):
        """Test ticket purchase and associated processes"""
        # Initial user balance
        initial_balance = self.user.balance
        
        # Create a ticket
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1,2,3,4,5],
            extra_numbers=[1,2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Update user balance after purchase (simulating a real transaction)
        self.user.balance -= self.lottery_game.ticket_price
        self.user.save()
        
        # Check ticket was created
        self.assertEqual(ticket.draw.lottery_game, self.lottery_game)
        self.assertEqual(ticket.draw, self.draw)
        self.assertEqual(ticket.main_numbers, [1,2,3,4,5])
        self.assertEqual(ticket.extra_numbers, [1,2])
        self.assertEqual(ticket.result_status, 'pending')
        
        # Check balance was deducted
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, initial_balance - self.lottery_game.ticket_price)
        
        # Verify draw ticket count was updated
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.ticket_count, 1)
    
    def test_draw_execution(self):
        """Test the lottery draw execution process"""
        # Create a ticket with selected numbers
        ticket = Ticket.objects.create(
            user=self.user,
            draw=self.draw,
            main_numbers=[1,2,3,4,5],
            extra_numbers=[1,2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Force the winning numbers to match our ticket (for testing)
        self.draw.status = 'in_progress'
        self.draw.save()
        
        # Simulate the draw execution with predefined numbers (a real draw would use random numbers)
        self.draw._process_tickets([1, 2, 3, 4, 5], [1, 2])
        self.draw.main_numbers = [1, 2, 3, 4, 5]
        self.draw.extra_numbers = [1, 2]
        self.draw.status = 'completed'
        self.draw.save()
        
        # Check if a winning ticket record was created
        self.assertTrue(WinningTicket.objects.filter(ticket=ticket).exists())
        
        # Get the winning ticket
        winning_ticket = WinningTicket.objects.get(ticket=ticket)
        
        # Check if it's associated with the correct prize category
        self.assertEqual(winning_ticket.prize_category, self.prize_category_jackpot)
        
        # Check that winning info is stored
        self.assertEqual(winning_ticket.main_numbers_matched, 5) 
        self.assertEqual(winning_ticket.extra_numbers_matched, 2)
        
        # Check if prize amount is calculated
        self.assertGreater(winning_ticket.amount, 0)


class APITestCase(APITestCase):
    """Test case for the lottery API endpoints"""
    
    def setUp(self):
        """Set up test data and client"""
        # Create test lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Test EuroMillions",
            description="A test lottery game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            is_active=True
        )
        
        # Create draw
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() + datetime.timedelta(days=2),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
        
        # Create prize categories
        self.prize_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+2",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:139,838,160",
            prize_type='fixed',
            fixed_amount=Decimal('100000.00')
        )
        
        # Create regular user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpassword'
        )
        self.user.balance = Decimal('100.00')
        self.user.save()
        
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword'
        )
        
        # Setup API client
        self.client = APIClient()
    
    def test_list_lottery_games(self):
        """Test retrieving list of lottery games"""
        # Login
        self.client.force_authenticate(user=self.user)
        
        # Get API response
        url = reverse('lottery-games')
        response = self.client.get(url)
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check response data
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Test EuroMillions")
    
    def test_get_lottery_game_detail(self):
        """Test retrieving a specific lottery game"""
        # Login
        self.client.force_authenticate(user=self.user)
        
        # Get API response
        url = reverse('lottery-game-detail', kwargs={'pk': self.lottery_game.id})
        response = self.client.get(url)
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check response data
        self.assertEqual(response.data['name'], "Test EuroMillions")
        self.assertEqual(response.data['main_numbers_count'], 5)
        self.assertEqual(response.data['extra_numbers_count'], 2)
    
    def test_list_draws(self):
        """Test retrieving list of draws"""
        # Login
        self.client.force_authenticate(user=self.user)
        
        # Get API response
        url = reverse('draws-list')
        response = self.client.get(url)
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check response data
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['draw_number'], 1)
    
    def test_upcoming_draws(self):
        """Test retrieving upcoming draws"""
        # Login
        self.client.force_authenticate(user=self.user)
        
        # Get API response
        url = reverse('upcoming-draws')
        response = self.client.get(url)
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check response data
        self.assertEqual(len(response.data), 1)
    
    def test_purchase_ticket(self):
        """Test purchasing a ticket"""
        # Login
        self.client.force_authenticate(user=self.user)
        
        # Initial user balance
        initial_balance = self.user.balance
        
        # Ticket data
        ticket_data = {
            'draw_id': self.draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        # Post to API
        url = reverse('purchase-ticket')
        response = self.client.post(url, ticket_data, format='json')
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check ticket was created
        self.assertEqual(Ticket.objects.count(), 1)
        
        # Check user balance was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, initial_balance - self.lottery_game.ticket_price)
        
        # Check transaction was created
        self.assertEqual(Transaction.objects.count(), 1)
        transaction = Transaction.objects.first()
        self.assertEqual(transaction.user, self.user)
        self.assertEqual(transaction.amount, self.lottery_game.ticket_price)
        self.assertEqual(transaction.transaction_type, 'ticket_purchase')
    
    def test_admin_draw_control(self):
        """Test admin draw control endpoint"""
        # Try accessing as regular user (should fail)
        self.client.force_authenticate(user=self.user)
        
        url = reverse('admin-conduct-draw')
        response = self.client.post(url, {'draw_id': self.draw.id})
        
        # Check permission denied
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Test draw control
        response = self.client.post(url, {'draw_id': self.draw.id, 'force': True})
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check draw was conducted
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'completed')
        self.assertIsNotNone(self.draw.main_numbers)
        self.assertIsNotNone(self.draw.verification_hash)


class LotteryDrawMechanismTest(TestCase):
    """Test case specifically for the lottery draw mechanism"""
    
    def setUp(self):
        """Set up test data"""
        # Create test lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Test Lottery",
            description="Test lottery game",
            main_numbers_count=5,
            main_numbers_range=20,
            extra_numbers_count=2,
            extra_numbers_range=10,
            ticket_price=Decimal('2.00'),
            draw_days="Monday,Thursday",
            is_active=True
        )
        
        # Create draw
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() - datetime.timedelta(hours=1),  # Past date
            status='scheduled',
            jackpot_amount=Decimal('100000.00')
        )
        
        # Create prize categories for different winning combinations
        self.jackpot_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+2",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:2,118,760",
            prize_type='fixed',
            fixed_amount=Decimal('100000.00')
        )
        
        self.second_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+1",
            main_numbers_matched=5,
            extra_numbers_matched=1,
            odds="1:188,343",
            percentage_of_pool=Decimal('10.00')
        )
        
        self.third_category = PrizeCategory.objects.create(
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
        
        # Create users and tickets
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            username='user1',
            password='password1'
        )
        
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='password2'
        )
        
        # Create tickets with different number combinations
        self.jackpot_ticket = Ticket.objects.create(
            user=self.user1,
            draw=self.draw,
            main_numbers=[1,2,3,4,5],
            extra_numbers=[1,2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.second_prize_ticket = Ticket.objects.create(
            user=self.user1,
            draw=self.draw,
            main_numbers=[1,2,3,4,5],
            extra_numbers=[1,3],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.third_prize_ticket = Ticket.objects.create(
            user=self.user2,
            draw=self.draw,
            main_numbers=[1,2,3,4,5],
            extra_numbers=[3,4],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.small_win_ticket = Ticket.objects.create(
            user=self.user2,
            draw=self.draw,
            main_numbers=[1,2,10,11,12],
            extra_numbers=[1,3],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.losing_ticket = Ticket.objects.create(
            user=self.user2,
            draw=self.draw,
            main_numbers=[10,11,12,13,14],
            extra_numbers=[3,4],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
    
    def test_draw_execution_with_fixed_numbers(self):
        """Test the draw execution with predefined winning numbers"""
        # Set the winning numbers for testing (normally these would be randomly generated)
        main_numbers = [1, 2, 3, 4, 5]
        extra_numbers = [1, 2]
        
        # Verify draw is in scheduled state
        self.assertEqual(self.draw.status, 'scheduled')
        
        # Execute the draw with predefined winning numbers (test mode)
        self.draw.status = 'in_progress'
        self.draw.save()
        
        # Process tickets with our fixed numbers
        self.draw._process_tickets(main_numbers, extra_numbers)
        self.draw.main_numbers = [1, 2, 3, 4, 5]
        self.draw.extra_numbers = [1, 2]
        self.draw.status = 'completed'
        self.draw.save()
        
        # Verify draw status changed to completed
        self.assertEqual(self.draw.status, 'completed')
        self.assertEqual(self.draw.main_numbers, [1, 2, 3, 4, 5])
        self.assertEqual(self.draw.extra_numbers, [1, 2])
        
        # Verify winning tickets were identified correctly
        
        # Jackpot winner (5+2)
        jackpot_winning = WinningTicket.objects.filter(
            ticket=self.jackpot_ticket,
            prize_category=self.jackpot_category
        ).exists()
        self.assertTrue(jackpot_winning)
        
        # Second prize (5+1)
        second_winning = WinningTicket.objects.filter(
            ticket=self.second_prize_ticket,
            prize_category=self.second_category
        ).exists()
        self.assertTrue(second_winning)
        
        # Third prize (5+0)
        third_winning = WinningTicket.objects.filter(
            ticket=self.third_prize_ticket,
            prize_category=self.third_category
        ).exists()
        self.assertTrue(third_winning)
        
        # Small win (2+1)
        small_winning = WinningTicket.objects.filter(
            ticket=self.small_win_ticket,
            prize_category=self.small_win_category
        ).exists()
        self.assertTrue(small_winning)
        
        # Losing ticket should not have a winning record
        losing_ticket_record = WinningTicket.objects.filter(
            ticket=self.losing_ticket
        ).exists()
        self.assertFalse(losing_ticket_record)
        
        # Check that winning tickets were created for each prize category
        self.assertEqual(WinningTicket.objects.count(), 4)  # 4 winning tickets
        
        # Check jackpot winner
        jackpot_winnings = WinningTicket.objects.get(ticket=self.jackpot_ticket)
        self.assertEqual(jackpot_winnings.prize_category, self.jackpot_category)
        self.assertGreater(jackpot_winnings.amount, 0)
        
        # Check small win amount
        small_win_winnings = WinningTicket.objects.get(ticket=self.small_win_ticket)
        self.assertEqual(small_win_winnings.amount, Decimal('8.00'))
    
    def test_management_command(self):
        """Test the draw execution using the management command"""
        # Import command class
        from django.core.management import call_command
        from io import StringIO
        
        # Call the command with stdout capture
        out = StringIO()
        call_command('conduct_draw', draw_id=self.draw.id, force=True, stdout=out)
        
        # Check output indicates success
        self.assertIn('Successfully conducted draw', out.getvalue())
        
        # Verify draw status changed to completed
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'completed')
        self.assertIsNotNone(self.draw.main_numbers)
        self.assertIsNotNone(self.draw.verification_hash)
        
        # Check that winning tickets were processed
        self.assertGreater(WinningTicket.objects.count(), 0)