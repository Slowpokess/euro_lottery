"""
Tests for the verification system of the lottery.
"""
import uuid
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import datetime

from lottery.models import (
    LotteryGame, Draw, Ticket, PrizeCategory, 
    DrawResult, WinningTicket
)
from lottery.utils.verification import DrawVerification
from users.models import User

class LotteryVerificationTests(TestCase):
    """Tests for the lottery verification system"""
    
    def setUp(self):
        """Set up test data"""
        # Create a test secret key
        self.test_secret = "test_verification_secret_key"
        
        # Create sample draw data
        self.draw_data = {
            "draw_number": 123,
            "lottery_id": 1,
            "lottery_name": "Test Lottery",
            "draw_date": timezone.now().isoformat(),
            "main_numbers": [1, 2, 3, 4, 5],
            "extra_numbers": [1, 2],
            "ticket_count": 100,
            "rng_provider": "test_provider",
        }
        
        # Create a test lottery game
        self.lottery_game = LotteryGame.objects.create(
            name="Test Verification Lottery",
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
    
    def test_hash_generation_and_verification(self):
        """Test generating and verifying a hash from draw data"""
        hash_value = DrawVerification.generate_hash(self.draw_data, self.test_secret)
        
        # Check hash format and type
        self.assertIsInstance(hash_value, str)
        self.assertEqual(len(hash_value), 64)  # SHA-256 produces 64 character hex digest
        
        # Test direct hash verification with original data
        is_valid = DrawVerification.verify_hash(self.draw_data, hash_value, self.test_secret)
        self.assertTrue(is_valid, "Hash verification should pass with correct data and hash")
        
        # Test verification with modified data (should fail)
        modified_data = self.draw_data.copy()
        modified_data["main_numbers"] = [10, 11, 12, 13, 14]
        is_valid = DrawVerification.verify_hash(modified_data, hash_value, self.test_secret)
        self.assertFalse(is_valid, "Hash verification should fail with modified data")
    
    def test_verification_record_creation(self):
        """Test creating a complete verification record"""
        verification_record = DrawVerification.generate_verification_record(self.draw_data)
        
        # Check record structure
        self.assertIn("verification_id", verification_record)
        self.assertIn("timestamp", verification_record)
        self.assertIn("draw_data", verification_record)
        self.assertIn("hash", verification_record)
        
        # Verify that the hash is correct
        verification_data = verification_record.copy()
        verification_hash = verification_data.pop("hash")
        is_valid = DrawVerification.verify_hash(verification_data, verification_hash)
        self.assertTrue(is_valid, "Generated verification record should have a valid hash")
    
    def test_public_proof_generation(self):
        """Test generating public proof for draw results"""
        with self.settings(BASE_URL='https://test.example.com'):
            # Generate a public proof
            draw_id = str(uuid.uuid4())
            winning_numbers = [1, 2, 3, 4, 5, 1, 2]
            draw_time = timezone.now().isoformat()
            
            proof = DrawVerification.generate_public_proof(draw_id, winning_numbers, draw_time)
            
            # Check proof structure
            self.assertIn("draw_id", proof)
            self.assertIn("winning_numbers", proof)
            self.assertIn("draw_time", proof)
            self.assertIn("verification_token", proof)
            self.assertIn("verification_url", proof)
            
            # Check URL formation
            self.assertTrue(proof["verification_url"].startswith("https://test.example.com"))
    
    def test_draw_verification_integration(self):
        """Test the complete draw verification lifecycle with Draw model"""
        # Create a draw for testing
        test_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=500,
            draw_date=timezone.now() - datetime.timedelta(hours=1),
            status='scheduled',
            jackpot_amount=Decimal('10000.00')
        )
        
        # Patch the RNG provider to return fixed numbers
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            # Conduct the draw
            test_draw.conduct_draw()
        
        # Refresh from database
        test_draw.refresh_from_db()
        
        # Verify that the draw has verification data
        self.assertEqual(test_draw.status, 'completed')
        self.assertIsNotNone(test_draw.verification_hash)
        self.assertIsNotNone(test_draw.verification_data)
        
        # Test verification
        self.assertTrue(test_draw.verify_results(), "Draw verification should pass with original data")
        
        # Test verification after modifying numbers
        original_main_numbers = test_draw.main_numbers.copy()
        original_extra_numbers = test_draw.extra_numbers.copy()
        original_verification_hash = test_draw.verification_hash
        original_verification_data = test_draw.verification_data.copy()
        
        # Modify the draw numbers
        test_draw.main_numbers = [10, 11, 12, 13, 14]
        test_draw.save()
        
        # Verify that verification fails
        self.assertFalse(test_draw.verify_results(), "Verification should fail with modified numbers")
        
        # Restore original data
        test_draw.main_numbers = original_main_numbers
        test_draw.extra_numbers = original_extra_numbers
        test_draw.verification_hash = original_verification_hash
        test_draw.verification_data = original_verification_data
        test_draw.save()
        
        # Verify that verification now passes again
        self.assertTrue(test_draw.verify_results(), "Verification should pass with restored data")
    
    def test_verification_hash_integrity_with_model(self):
        """Test integrity of the verification hash with the Draw model"""
        # Create a draw for hash integrity testing
        integrity_draw = Draw.objects.create(
            lottery_game=self.lottery_game,
            draw_number=600,
            draw_date=timezone.now() - datetime.timedelta(hours=2),
            status='scheduled',
            jackpot_amount=Decimal('20000.00')
        )
        
        # Conduct the draw with fixed numbers
        with patch('lottery.utils.rng.get_rng_provider') as mock_get_rng_provider:
            mock_provider = MagicMock()
            mock_provider.generate_numbers.side_effect = lambda count, max_number, exclude=None: (
                [1, 2, 3, 4, 5] if count == 5 else [1, 2]
            )
            mock_provider.get_provider_info.return_value = {'name': 'mock_provider'}
            mock_get_rng_provider.return_value = mock_provider
            
            integrity_draw.conduct_draw()
        
        # Refresh from database
        integrity_draw.refresh_from_db()
        
        # Store original data
        original_main_numbers = integrity_draw.main_numbers.copy()
        original_extra_numbers = integrity_draw.extra_numbers.copy()
        original_hash = integrity_draw.verification_hash
        original_verification_data = integrity_draw.verification_data.copy()
        
        # 1. Test: Modifying the main numbers should cause verification to fail
        integrity_draw.main_numbers = [10, 11, 12, 13, 14]
        integrity_draw.save()
        
        # Verification should fail
        self.assertFalse(integrity_draw.verify_results(), "Verification should fail with modified main numbers")
        
        # Restore original data
        integrity_draw.main_numbers = original_main_numbers
        integrity_draw.save()
        
        # Verification should pass again
        self.assertTrue(integrity_draw.verify_results(), "Verification should pass with restored main numbers")
        
        # 2. Test: Modifying the verification hash should cause verification to fail
        integrity_draw.verification_hash = "fake_hash_value"
        integrity_draw.save()
        
        # Verification should fail
        self.assertFalse(integrity_draw.verify_results(), "Verification should fail with modified hash")
        
        # Restore original hash
        integrity_draw.verification_hash = original_hash
        integrity_draw.save()
        
        # Verification should pass again
        self.assertTrue(integrity_draw.verify_results(), "Verification should pass with restored hash")
        
        # 3. Test: Modifying the verification data should cause verification to fail
        modified_data = integrity_draw.verification_data.copy()
        modified_data["draw_data"]["main_numbers"] = [10, 11, 12, 13, 14]
        integrity_draw.verification_data = modified_data
        integrity_draw.save()
        
        # Verification should fail
        self.assertFalse(integrity_draw.verify_results(), "Verification should fail with modified verification data")
        
        # Restore original verification data
        integrity_draw.verification_data = original_verification_data
        integrity_draw.save()
        
        # Verification should pass again
        self.assertTrue(integrity_draw.verify_results(), "Verification should pass with restored verification data")
        
        # 4. Test: Complete data restoration
        # First, modify everything
        integrity_draw.main_numbers = [10, 11, 12, 13, 14]
        integrity_draw.extra_numbers = [10, 11]
        integrity_draw.verification_hash = "fake_hash_value"
        modified_data = integrity_draw.verification_data.copy()
        modified_data["draw_data"]["main_numbers"] = [10, 11, 12, 13, 14]
        integrity_draw.verification_data = modified_data
        integrity_draw.save()
        
        # Verification should fail
        self.assertFalse(integrity_draw.verify_results(), "Verification should fail with all data modified")
        
        # Now restore everything
        integrity_draw.main_numbers = original_main_numbers
        integrity_draw.extra_numbers = original_extra_numbers
        integrity_draw.verification_hash = original_hash
        integrity_draw.verification_data = original_verification_data
        integrity_draw.save()
        
        # Set status back to completed to avoid auto-verification state change
        integrity_draw.status = 'completed'
        integrity_draw.save()
        
        # Final verification should pass
        self.assertTrue(integrity_draw.verify_results(), "Verification should pass with all data restored")

class DrawVerificationUnitTests(TestCase):
    """Unit tests for the DrawVerification class"""
    
    def setUp(self):
        """Set up test data"""
        self.test_data = {
            "key1": "value1",
            "key2": [1, 2, 3],
            "key3": {"nested": "value"}
        }
        self.test_secret = "unit_test_secret"
    
    def test_generate_hash(self):
        """Test hash generation"""
        hash1 = DrawVerification.generate_hash(self.test_data, self.test_secret)
        
        # Same data and secret should produce same hash
        hash2 = DrawVerification.generate_hash(self.test_data, self.test_secret)
        self.assertEqual(hash1, hash2, "Same data should produce the same hash")
        
        # Different data should produce different hash
        modified_data = self.test_data.copy()
        modified_data["key1"] = "different_value"
        hash3 = DrawVerification.generate_hash(modified_data, self.test_secret)
        self.assertNotEqual(hash1, hash3, "Different data should produce different hash")
        
        # Different secret should produce different hash
        hash4 = DrawVerification.generate_hash(self.test_data, "different_secret")
        self.assertNotEqual(hash1, hash4, "Different secret should produce different hash")
    
    def test_verify_hash(self):
        """Test hash verification"""
        # Generate a hash
        hash_value = DrawVerification.generate_hash(self.test_data, self.test_secret)
        
        # Verify the hash with the same data and secret
        result = DrawVerification.verify_hash(self.test_data, hash_value, self.test_secret)
        self.assertTrue(result, "Verification should pass with correct data and hash")
        
        # Verify with modified data
        modified_data = self.test_data.copy()
        modified_data["key1"] = "different_value"
        result = DrawVerification.verify_hash(modified_data, hash_value, self.test_secret)
        self.assertFalse(result, "Verification should fail with modified data")
        
        # Verify with different secret
        result = DrawVerification.verify_hash(self.test_data, hash_value, "different_secret")
        self.assertFalse(result, "Verification should fail with different secret")
    
    def test_hash_consistency(self):
        """Test that hash generation is consistent"""
        # Key order should not matter
        data1 = {"a": 1, "b": 2, "c": 3}
        data2 = {"c": 3, "a": 1, "b": 2}
        
        hash1 = DrawVerification.generate_hash(data1, self.test_secret)
        hash2 = DrawVerification.generate_hash(data2, self.test_secret)
        
        self.assertEqual(hash1, hash2, "Hash should be consistent regardless of key order")
        
        # Test with nested data
        nested1 = {"outer": {"inner1": 1, "inner2": 2}}
        nested2 = {"outer": {"inner2": 2, "inner1": 1}}
        
        hash3 = DrawVerification.generate_hash(nested1, self.test_secret)
        hash4 = DrawVerification.generate_hash(nested2, self.test_secret)
        
        self.assertEqual(hash3, hash4, "Hash should be consistent with nested dictionaries")