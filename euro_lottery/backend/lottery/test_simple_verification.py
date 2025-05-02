"""
Simple, focused test for draw verification logic
"""
from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
import datetime
from unittest.mock import patch, MagicMock

from lottery.models import (
    LotteryGame, Draw, Ticket
)
from lottery.utils.verification import DrawVerification


class SimpleVerificationTest(TestCase):
    """A simplified test for draw verification that focuses only on the verification logic"""
    
    def setUp(self):
        """Set up test data"""
        # Enable test mode for verification
        DrawVerification.enable_test_mode()
        
        # Create a lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Simple Test Lottery",
            description="Testing the lottery verification",
            main_numbers_count=5,
            main_numbers_range=20,
            extra_numbers_count=2,
            extra_numbers_range=10,
            ticket_price=Decimal('2.00'),
            draw_days="Monday,Thursday",
            draw_time="20:00:00",
            is_active=True
        )
        
        # Create a draw
        self.draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=999,
            draw_date=timezone.now() - datetime.timedelta(hours=1),
            status='scheduled',
            jackpot_amount=Decimal('50000.00')
        )
    
    def tearDown(self):
        """Clean up after tests"""
        # Disable test mode
        DrawVerification.disable_test_mode()
    
    def test_simple_verification(self):
        """Test a simple verification scenario without complex restorations"""
        # Conduct a draw with fixed numbers
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Conduct the draw
            self.draw.conduct_draw()
        
        # Refresh the draw from the database
        self.draw.refresh_from_db()
        
        # Verify the draw was completed
        self.assertEqual(self.draw.status, 'completed')
        self.assertEqual(self.draw.main_numbers, [1, 2, 3, 4, 5])
        self.assertEqual(self.draw.extra_numbers, [1, 2])
        
        # Save original verification data
        original_hash = self.draw.verification_hash
        original_data = self.draw.verification_data.copy()
        
        # 1. Test basic verification works with original data
        self.assertTrue(self.draw.verify_results(), "Verification should pass with original data")
        
        # 2. Modify numbers and test verification fails
        self.draw.main_numbers = [10, 11, 12, 13, 14]
        self.draw.save()
        self.assertFalse(self.draw.verify_results(), "Verification should fail with modified numbers")
        
        # 3. Restore original numbers and test verification works again
        self.draw.main_numbers = [1, 2, 3, 4, 5]
        self.draw.save()
        self.assertTrue(self.draw.verify_results(), "Verification should pass after restoring original numbers")
        
        # 4. Modify verification hash and test verification fails
        self.draw.verification_hash = "fake_hash"
        self.draw.save()
        self.assertFalse(self.draw.verify_results(), "Verification should fail with modified hash")
        
        # 5. Restore original hash and test verification works again
        self.draw.verification_hash = original_hash
        self.draw.save()
        self.assertTrue(self.draw.verify_results(), "Verification should pass after restoring original hash")
        
        # 6. Modify verification data and test verification fails
        modified_data = original_data.copy()
        modified_data['draw_data']['main_numbers'] = [10, 11, 12, 13, 14]
        self.draw.verification_data = modified_data
        self.draw.save()
        self.assertFalse(self.draw.verify_results(), "Verification should fail with modified verification data")
        
        # 7. Restore original verification data and test verification works again
        self.draw.verification_data = original_data
        self.draw.save()
        self.assertTrue(self.draw.verify_results(), "Verification should pass after restoring original verification data")
        
        # 8. Test verification hash computation directly
        verification_data = original_data.copy()
        if 'hash' in verification_data:
            verification_data.pop('hash')
            
        computed_hash = DrawVerification.generate_hash(verification_data)
        self.assertEqual(computed_hash, original_hash, "Generated hash should match the original hash")
        
        is_valid = DrawVerification.verify_hash(verification_data, original_hash)
        self.assertTrue(is_valid, "Direct hash verification should pass with original data and hash")