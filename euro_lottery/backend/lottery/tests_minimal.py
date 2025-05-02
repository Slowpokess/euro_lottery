"""
Minimal verification test to validate core verification functionality.
"""
from django.test import TestCase
from unittest.mock import patch
from lottery.utils.verification import DrawVerification

class DirectVerificationTest(TestCase):
    """Test the DrawVerification class directly without model dependencies"""
    
    def test_verification_hash_generation_and_checking(self):
        """Test that hash generation and verification works correctly"""
        # Test data
        data = {
            "test_key": "test_value",
            "numbers": [1, 2, 3, 4, 5]
        }
        
        # Generate a hash
        hash_value = DrawVerification.generate_hash(data, "test_secret")
        
        # Verify the hash works with the same data
        is_valid = DrawVerification.verify_hash(data, hash_value, "test_secret")
        self.assertTrue(is_valid, "Hash verification should pass with correct data")
        
        # Modify the data and verify the hash fails
        modified_data = data.copy()
        modified_data["numbers"] = [10, 11, 12, 13, 14]
        is_valid = DrawVerification.verify_hash(modified_data, hash_value, "test_secret")
        self.assertFalse(is_valid, "Hash verification should fail with modified data")
        
        # Use different secret and verify the hash fails
        is_valid = DrawVerification.verify_hash(data, hash_value, "different_secret")
        self.assertFalse(is_valid, "Hash verification should fail with different secret")
        
        # Use fake hash and verify it fails
        is_valid = DrawVerification.verify_hash(data, "fake_hash", "test_secret")
        self.assertFalse(is_valid, "Hash verification should fail with fake hash")
    
    def test_verification_hash_with_test_mode(self):
        """Test that test mode for verification works"""
        try:
            # Enable test mode
            DrawVerification.enable_test_mode()
            
            # Test data
            data = {
                "test_key": "test_value",
                "numbers": [1, 2, 3, 4, 5]
            }
            
            # In test mode, hash generation should return a fixed value
            hash_value = DrawVerification.generate_hash(data)
            self.assertEqual(hash_value, "test_verification_hash")
            
            # In test mode, verification should pass with test_verification_hash
            is_valid = DrawVerification.verify_hash(data, "test_verification_hash")
            self.assertTrue(is_valid)
            
            # In test mode, verification should fail with fake_hash_value
            is_valid = DrawVerification.verify_hash(data, "fake_hash_value")
            self.assertFalse(is_valid)
        finally:
            # Always disable test mode at the end
            DrawVerification.disable_test_mode()
    
    def test_verification_record_creation(self):
        """Test creating a verification record"""
        # Test data
        draw_data = {
            "draw_number": 123,
            "main_numbers": [1, 2, 3, 4, 5],
            "extra_numbers": [1, 2]
        }
        
        # Generate a verification record
        record = DrawVerification.generate_verification_record(draw_data)
        
        # Check record structure
        self.assertIn("verification_id", record)
        self.assertIn("timestamp", record)
        self.assertIn("draw_data", record)
        self.assertIn("hash", record)
        
        # Check the draw data is included correctly
        self.assertEqual(record["draw_data"], draw_data)
        
        # Extract verification data and hash
        verification_data = record.copy()
        hash_value = verification_data.pop("hash")
        
        # Verify the hash is valid for the data
        is_valid = DrawVerification.verify_hash(verification_data, hash_value)
        self.assertTrue(is_valid, "Generated verification record should have a valid hash")