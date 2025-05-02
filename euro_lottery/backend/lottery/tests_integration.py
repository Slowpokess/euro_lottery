"""
Comprehensive integration tests for Euro Lottery application.
These tests cover complete workflows from lottery creation to prize payments.
"""

from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from rest_framework.test import APIClient
from rest_framework import status
import json
from decimal import Decimal
import datetime
from unittest.mock import patch, MagicMock
import pytest

from lottery.models import (
    LotteryGame, Draw, PrizeCategory, Ticket, DrawResult, WinningTicket,
    SavedNumberCombination
)
from payments.models import Transaction, PaymentMethod
from users.models import Notification

User = get_user_model()


class LotteryLifecycleIntegrationTest(TransactionTestCase):
    """
    Test the complete lifecycle of lottery operations from
    game creation to draw execution and winner notifications.
    
    Uses TransactionTestCase to properly test database transactions
    """
    
    def setUp(self):
        """Set up test data for the complete lottery lifecycle"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword',
            balance=Decimal('10000.00')
        )
        
        # Create regular users with initial balance
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            username='user1',
            password='password1',
            balance=Decimal('100.00')
        )
        
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='password2',
            balance=Decimal('200.00')
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Create lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="EuroMillions Integration Test",
            description="Integration test lottery game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            is_active=True
        )
        
        # Create draw scheduled for a future date
        self.future_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() + datetime.timedelta(days=2),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
        
        # Create draw for immediate execution
        self.immediate_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=2,
            draw_date=timezone.now() - datetime.timedelta(minutes=10),
            status='scheduled',
            jackpot_amount=Decimal('1500000.00')
        )
        
        # Create prize categories
        self.jackpot_category = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+2",
            main_numbers_matched=5,
            extra_numbers_matched=2,
            odds="1:139,838,160",
            prize_type='fixed',
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
        
        self.third_prize = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="5+0",
            main_numbers_matched=5,
            extra_numbers_matched=0,
            odds="1:3,107,515",
            prize_type='fixed',
            fixed_amount=Decimal('100000.00')
        )
        
        self.small_prize = PrizeCategory.objects.create(
            lottery_game=self.lottery_game,
            name="2+1",
            main_numbers_matched=2,
            extra_numbers_matched=1,
            odds="1:22",
            prize_type='fixed',
            fixed_amount=Decimal('8.00')
        )
    
    def test_complete_lottery_lifecycle(self):
        """
        Test the complete lifecycle from ticket purchase to prize payment,
        covering the main successful flow of the lottery system.
        """
        # Step 1: Users purchase tickets for the upcoming draw
        self.client.force_authenticate(user=self.user1)
        
        # User1 buys a ticket with selected numbers
        purchase_data = {
            'draw_id': self.immediate_draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 2]
                }
            ]
        }
        response = self.client.post(
            reverse('purchase-ticket'), 
            purchase_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user1_ticket_id = response.data['tickets'][0]['ticket_id']
        
        # Check that user1's balance was correctly deducted
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.balance, Decimal('97.50'))  # 100 - 2.50
        
        # User2 buys two tickets
        self.client.force_authenticate(user=self.user2)
        purchase_data = {
            'draw_id': self.immediate_draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 3]
                },
                {
                    'main_numbers': [10, 11, 12, 13, 14],
                    'extra_numbers': [5, 6]
                }
            ]
        }
        response = self.client.post(
            reverse('purchase-ticket'), 
            purchase_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that user2's balance was correctly deducted
        self.user2.refresh_from_db()
        self.assertEqual(self.user2.balance, Decimal('195.00'))  # 200 - (2.50 * 2)
        
        # Check that draw ticket count was updated
        self.immediate_draw.refresh_from_db()
        self.assertEqual(self.immediate_draw.ticket_count, 3)
        
        # Step 2: Admin conducts the lottery draw
        self.client.force_authenticate(user=self.admin_user)
        
        # Mock the RNG to return predetermined numbers matching our tickets
        with patch('lottery.utils.rng.CryptoRNGProvider.generate_numbers') as mock_generate:
            # Set the "random" numbers to match user1's ticket (jackpot win)
            mock_generate.side_effect = [
                [1, 2, 3, 4, 5],  # Main numbers
                [1, 2]            # Extra numbers
            ]
            
            # Admin initiates the draw
            response = self.client.post(
                reverse('admin-conduct-draw'),
                {'draw_id': self.immediate_draw.id, 'force': True},
                format='json'
            )
            
            # Check response
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['status'], 'completed')
            self.assertEqual(response.data['winning_numbers']['main_numbers'], [1, 2, 3, 4, 5])
            self.assertEqual(response.data['winning_numbers']['extra_numbers'], [1, 2])
        
        # Step 3: Verify draw results were properly recorded
        self.immediate_draw.refresh_from_db()
        self.assertEqual(self.immediate_draw.status, 'completed')
        self.assertEqual(self.immediate_draw.main_numbers, [1, 2, 3, 4, 5])
        self.assertEqual(self.immediate_draw.extra_numbers, [1, 2])
        self.assertIsNotNone(self.immediate_draw.verification_hash)
        
        # Step 4: Verify tickets were processed correctly
        # User1's ticket should be a jackpot winner
        user1_ticket = Ticket.objects.get(ticket_id=user1_ticket_id)
        self.assertEqual(user1_ticket.result_status, 'winning')
        self.assertEqual(user1_ticket.matched_main_numbers, 5)
        self.assertEqual(user1_ticket.matched_extra_numbers, 2)
        
        # Check winning record was created
        winning_ticket = WinningTicket.objects.get(ticket=user1_ticket)
        self.assertEqual(winning_ticket.prize_category, self.jackpot_category)
        self.assertEqual(winning_ticket.amount, Decimal('1000000.00'))
        
        # Step 5: User checks their ticket
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            reverse('check-ticket', kwargs={'ticket_id': user1_ticket_id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['ticket']['result_status'], 'winning')
        self.assertEqual(Decimal(response.data['winning_amount']), Decimal('1000000.00'))
        
        # Step 6: Check that draw results are available in the API
        response = self.client.get(reverse('draw-results'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'completed')
        
        # Step 7: Check notifications were sent to winners
        notifications = Notification.objects.filter(
            user=self.user1,
            notification_type='winning'
        )
        self.assertTrue(notifications.exists())
    
    def test_draw_execution_error_handling(self):
        """Test error handling during draw execution"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a ticket for testing
        ticket = Ticket.objects.create(
            user=self.user1,
            draw=self.immediate_draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        # Simulate error during draw execution
        with patch('lottery.models.Draw.conduct_draw', side_effect=Exception('Test error')):
            response = self.client.post(
                reverse('admin-conduct-draw'),
                {'draw_id': self.immediate_draw.id},
                format='json'
            )
            
            # Check error response
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('error', response.data)
            
            # Verify draw status remains unchanged
            self.immediate_draw.refresh_from_db()
            self.assertEqual(self.immediate_draw.status, 'scheduled')
    
    def test_ticket_purchase_validation(self):
        """Test validation rules during ticket purchase"""
        self.client.force_authenticate(user=self.user1)
        
        # Test: Invalid draw ID
        purchase_data = {
            'draw_id': 9999,  # Non-existent ID
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 2]
                }
            ]
        }
        response = self.client.post(
            reverse('purchase-ticket'), 
            purchase_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test: Insufficient funds
        # First set user balance to a low amount
        self.user1.balance = Decimal('1.00')
        self.user1.save()
        
        purchase_data = {
            'draw_id': self.immediate_draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 5],
                    'extra_numbers': [1, 2]
                }
            ]
        }
        response = self.client.post(
            reverse('purchase-ticket'), 
            purchase_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Insufficient funds', response.data['error'])
        
        # Test: Draw closed for ticket purchases
        # First change the draw status
        self.immediate_draw.status = 'completed'
        self.immediate_draw.save()
        
        # Reset user balance
        self.user1.balance = Decimal('100.00')
        self.user1.save()
        
        response = self.client.post(
            reverse('purchase-ticket'), 
            purchase_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('no longer open', response.data['error'])
    

class PaymentWorkflowIntegrationTest(TestCase):
    """Test payment processing workflows"""
    
    def setUp(self):
        """Set up test environment for payment tests"""
        # Create users
        self.user = User.objects.create_user(
            email='user@example.com',
            username='testuser',
            password='password123',
            balance=Decimal('50.00')
        )
        
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword'
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Create a payment method for the user
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            method_type='credit_card',
            is_default=True,
            provider='stripe',
            data={
                'last4': '4242',
                'brand': 'Visa',
                'exp_month': 12,
                'exp_year': 2025
            },
            status='active'
        )
    
    @patch('payments.views.get_payment_processor')
    def test_deposit_workflow(self, mock_get_processor):
        """Test complete deposit workflow"""
        # Mock payment processor
        mock_processor = MagicMock()
        mock_processor.process_deposit.return_value = {
            'transaction_id': 'test_deposit_123',
            'status': 'completed',
            'amount': '100.00'
        }
        mock_get_processor.return_value = mock_processor
        
        # Login user
        self.client.force_authenticate(user=self.user)
        
        # Initial balance
        initial_balance = self.user.balance
        
        # Request deposit
        deposit_data = {
            'amount': '100.00',
            'payment_method_id': self.payment_method.id,
            'currency': 'USD'
        }
        
        response = self.client.post(
            reverse('deposit-funds'), 
            deposit_data, 
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'completed')
        
        # Check user balance was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, initial_balance + Decimal('100.00'))
        
        # Check transaction was created
        transaction = Transaction.objects.filter(
            user=self.user,
            transaction_type='deposit'
        ).latest('created_at')
        
        self.assertEqual(transaction.amount, Decimal('100.00'))
        self.assertEqual(transaction.status, 'completed')
    
    @patch('payments.views.get_payment_processor')
    def test_withdrawal_workflow(self, mock_get_processor):
        """Test complete withdrawal workflow"""
        # Mock payment processor
        mock_processor = MagicMock()
        mock_processor.process_withdrawal.return_value = {
            'transaction_id': 'test_withdrawal_123',
            'status': 'processing',
            'amount': '25.00'
        }
        mock_get_processor.return_value = mock_processor
        
        # Login user
        self.client.force_authenticate(user=self.user)
        
        # Initial balance
        initial_balance = self.user.balance
        
        # Request withdrawal
        withdrawal_data = {
            'amount': '25.00',
            'payment_method_id': self.payment_method.id,
            'currency': 'USD'
        }
        
        response = self.client.post(
            reverse('withdraw-funds'), 
            withdrawal_data, 
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'processing')
        
        # Check user balance was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, initial_balance - Decimal('25.00'))
        
        # Check transaction was created
        transaction = Transaction.objects.filter(
            user=self.user,
            transaction_type='withdrawal'
        ).latest('created_at')
        
        self.assertEqual(transaction.amount, Decimal('25.00'))
        self.assertEqual(transaction.status, 'processing')
    
    def test_payment_failure_handling(self):
        """Test handling of payment failures"""
        self.client.force_authenticate(user=self.user)
        
        # Try to withdraw more than available balance
        withdrawal_data = {
            'amount': '100.00',  # User only has 50.00
            'payment_method_id': self.payment_method.id,
            'currency': 'USD'
        }
        
        response = self.client.post(
            reverse('withdraw-funds'), 
            withdrawal_data, 
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Insufficient funds', response.data['error'])
        
        # Verify balance remained unchanged
        self.user.refresh_from_db()
        self.assertEqual(self.user.balance, Decimal('50.00'))


class LotterySecurityControlTest(TestCase):
    """
    Test security controls and authorization
    requirements for lottery operations
    """
    
    def setUp(self):
        """Set up test environment for security tests"""
        # Create users
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='password123',
            balance=Decimal('100.00')
        )
        
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword'
        )
        
        # Create another user for isolation tests
        self.other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='password456',
            balance=Decimal('100.00')
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Create lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Security Test Game",
            description="Security testing lottery game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            is_active=True
        )
        
        # Create a draw
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() + datetime.timedelta(days=1),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
        
        # Create tickets
        self.user_ticket = Ticket.objects.create(
            user=self.regular_user,
            draw=self.draw,
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
        
        self.other_user_ticket = Ticket.objects.create(
            user=self.other_user,
            draw=self.draw,
            main_numbers=[6, 7, 8, 9, 10],
            extra_numbers=[3, 4],
            price=self.lottery_game.ticket_price,
            result_status='pending'
        )
    
    def test_authentication_requirements(self):
        """Test authentication requirements for API endpoints"""
        # Try accessing endpoints without authentication
        endpoints = [
            reverse('lottery-games'),
            reverse('draws-list'),
            reverse('tickets-list'),
            reverse('upcoming-draws'),
            reverse('draw-results'),
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(
                response.status_code, 
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {endpoint} should require authentication"
            )
    
    def test_admin_only_endpoints(self):
        """Test endpoints that require admin privileges"""
        # Try accessing admin endpoints as regular user
        self.client.force_authenticate(user=self.regular_user)
        
        admin_endpoints = [
            (reverse('admin-conduct-draw'), 'post', {'draw_id': self.draw.id}),
            # Add other admin endpoints as needed
        ]
        
        for endpoint, method, data in admin_endpoints:
            if method == 'get':
                response = self.client.get(endpoint)
            elif method == 'post':
                response = self.client.post(endpoint, data, format='json')
            
            self.assertEqual(
                response.status_code, 
                status.HTTP_403_FORBIDDEN,
                f"Endpoint {endpoint} should require admin privileges"
            )
            
        # Now try with admin user
        self.client.force_authenticate(user=self.admin_user)
        
        for endpoint, method, data in admin_endpoints:
            if method == 'get':
                response = self.client.get(endpoint)
            elif method == 'post':
                response = self.client.post(endpoint, data, format='json')
            
            self.assertNotEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Endpoint {endpoint} should be accessible to admins"
            )
    
    def test_user_data_isolation(self):
        """Test that users can only access their own data"""
        # Login as regular user
        self.client.force_authenticate(user=self.regular_user)
        
        # Try to access own ticket (should succeed)
        response = self.client.get(
            reverse('ticket-detail', kwargs={'ticket_id': self.user_ticket.ticket_id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Try to access another user's ticket (should fail)
        response = self.client.get(
            reverse('ticket-detail', kwargs={'ticket_id': self.other_user_ticket.ticket_id})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Check tickets list only returns own tickets
        response = self.client.get(reverse('tickets-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify only user's own tickets are returned
        ticket_ids = [ticket['ticket_id'] for ticket in response.data]
        self.assertIn(str(self.user_ticket.ticket_id), ticket_ids)
        self.assertNotIn(str(self.other_user_ticket.ticket_id), ticket_ids)
    
    def test_verification_mechanisms(self):
        """Test lottery result verification mechanisms"""
        # First conduct the draw as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Generate winning numbers
        main_numbers = [1, 2, 3, 4, 5]
        extra_numbers = [1, 2]
        
        # Mock RNG to return predetermined numbers
        with patch('lottery.utils.rng.CryptoRNGProvider.generate_numbers') as mock_generate:
            mock_generate.side_effect = [main_numbers, extra_numbers]
            
            response = self.client.post(
                reverse('admin-conduct-draw'),
                {'draw_id': self.draw.id, 'force': True},
                format='json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            verification_hash = response.data['verification_hash']
        
        # Get updated draw
        self.draw.refresh_from_db()
        
        # Verify hash can be validated
        result = self.draw.verify_results()
        self.assertTrue(result, "Draw verification should succeed with valid hash")
        
        # Now tamper with the draw data and verify hash fails
        original_numbers = self.draw.main_numbers
        self.draw.main_numbers = [6, 7, 8, 9, 10]  # Changed numbers
        self.draw.save()
        
        result = self.draw.verify_results()
        self.assertFalse(result, "Draw verification should fail with tampered data")
        
        # Restore original state
        self.draw.main_numbers = original_numbers
        self.draw.save()


class DrawVerificationTest(TestCase):
    """
    Test draw verification and cryptographic security mechanisms
    """
    
    def setUp(self):
        # Create lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Verification Test Game",
            description="Testing verification mechanisms",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            is_active=True
        )
        
        # Create a draw
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() - datetime.timedelta(hours=1),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
    
    def test_draw_verification_mechanism(self):
        """Test the cryptographic verification of draw results"""
        from lottery.utils.verification import DrawVerification
        
        # Create sample draw data
        draw_data = {
            "draw_number": self.draw.draw_number,
            "lottery_id": self.lottery_game.id,
            "lottery_name": self.lottery_game.name,
            "draw_date": self.draw.draw_date.isoformat(),
            "main_numbers": [1, 2, 3, 4, 5],
            "extra_numbers": [1, 2],
            "ticket_count": 0,
            "created_at": timezone.now().isoformat(),
        }
        
        # Generate verification record
        verification_record = DrawVerification.generate_verification_record(draw_data)
        
        # Check verification record structure
        self.assertIn('hash', verification_record)
        self.assertIn('verification_id', verification_record)
        self.assertIn('timestamp', verification_record)
        self.assertIn('draw_data', verification_record)
        
        # Verify the hash is correct
        original_hash = verification_record['hash']
        
        # Create a copy without hash for verification
        verification_data = verification_record.copy()
        del verification_data['hash']
        
        # Verify the hash
        is_valid = DrawVerification.verify_hash(verification_data, original_hash)
        self.assertTrue(is_valid, "Original hash verification should succeed")
        
        # Tamper with the data and verify hash fails
        verification_data['draw_data']['main_numbers'] = [10, 11, 12, 13, 14]
        is_valid = DrawVerification.verify_hash(verification_data, original_hash)
        self.assertFalse(is_valid, "Hash verification should fail with tampered data")
    
    def test_draw_execution_verification(self):
        """Test verification during and after draw execution"""
        # Conduct the draw
        self.draw.conduct_draw()
        
        # Verify draw status
        self.assertEqual(self.draw.status, 'completed')
        self.assertIsNotNone(self.draw.verification_hash)
        self.assertIsNotNone(self.draw.verification_data)
        
        # Verify the draw results
        is_valid = self.draw.verify_results()
        self.assertTrue(is_valid, "Draw verification should succeed after draw execution")
        
        # Check that verification updates status
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'verified')


class ErrorHandlingIntegrationTest(TestCase):
    """
    Test error handling scenarios in the lottery system
    """
    
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            email='user@example.com',
            username='testuser',
            password='password123',
            balance=Decimal('100.00')
        )
        
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword'
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Create lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Error Test Game",
            description="Error handling test game",
            main_numbers_count=5,
            main_numbers_range=50,
            extra_numbers_count=2,
            extra_numbers_range=12,
            ticket_price=Decimal('2.50'),
            draw_days="Tuesday,Friday",
            is_active=True
        )
        
        # Create draws
        self.active_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=1,
            draw_date=timezone.now() + datetime.timedelta(days=1),
            status='scheduled',
            jackpot_amount=Decimal('1000000.00')
        )
        
        self.completed_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=2,
            draw_date=timezone.now() - datetime.timedelta(days=1),
            status='completed',
            jackpot_amount=Decimal('1000000.00'),
            main_numbers=[1, 2, 3, 4, 5],
            extra_numbers=[1, 2]
        )
    
    def test_error_handling_invalid_draw_status(self):
        """Test error handling when trying to conduct a draw with invalid status"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Try to conduct an already completed draw without force flag
        response = self.client.post(
            reverse('admin-conduct-draw'),
            {'draw_id': self.completed_draw.id},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn("status", response.data['error'])
    
    def test_error_handling_future_draw(self):
        """Test error handling when trying to conduct a future draw"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Try to conduct a future draw without force flag
        response = self.client.post(
            reverse('admin-conduct-draw'),
            {'draw_id': self.active_draw.id},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn("future", response.data['error'])
    
    def test_error_handling_invalid_input(self):
        """Test error handling with invalid input data"""
        self.client.force_authenticate(user=self.user)
        
        # Try to purchase a ticket with invalid numbers
        purchase_data = {
            'draw_id': self.active_draw.id,
            'tickets': [
                {
                    'main_numbers': [1, 2, 3, 4, 99],  # 99 is outside range
                    'extra_numbers': [1, 2]
                }
            ]
        }
        
        response = self.client.post(
            reverse('purchase-ticket'), 
            purchase_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_error_handling_draw_not_found(self):
        """Test error handling when draw ID doesn't exist"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Try to conduct a non-existent draw
        response = self.client.post(
            reverse('admin-conduct-draw'),
            {'draw_id': 9999},  # Non-existent ID
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn("does not exist", response.data['error'])
    
    def test_error_handling_ticket_not_found(self):
        """Test error handling when ticket ID doesn't exist"""
        self.client.force_authenticate(user=self.user)
        
        # Try to check a non-existent ticket
        response = self.client.get(
            reverse('check-ticket', kwargs={'ticket_id': uuid.uuid4()})
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertIn("not found", response.data['error'])
    
    def test_error_handling_transaction(self):
        """Test error handling in database transactions"""
        self.client.force_authenticate(user=self.user)
        
        # Try to create a ticket with a transaction error (using a mock patch)
        with patch('django.db.transaction.on_commit', side_effect=Exception("Database error")):
            purchase_data = {
                'draw_id': self.active_draw.id,
                'tickets': [
                    {
                        'main_numbers': [1, 2, 3, 4, 5],
                        'extra_numbers': [1, 2]
                    }
                ]
            }
            
            # This should not throw a 500 error, but gracefully handle the transaction error
            with transaction.atomic():
                response = self.client.post(
                    reverse('purchase-ticket'), 
                    purchase_data, 
                    format='json'
                )
            
            # The transaction should have been rolled back
            self.user.refresh_from_db()
            self.assertEqual(self.user.balance, Decimal('100.00'))  # Balance unchanged