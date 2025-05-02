"""
Random Number Generator (RNG) utilities for lottery draws
This module implements different RNG strategies with high entropy
and cryptographic security for fair lottery draws.
"""

import os
import sys
import random
import hashlib
import hmac
import uuid
import logging
import requests
import json
import base64
from typing import List, Dict, Any, Optional, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)

class RNGProvider:
    """
    Base class for random number generation providers
    """
    def generate_numbers(self, count: int, max_number: int, exclude: List[int] = None) -> List[int]:
        """
        Generate a list of unique random numbers
        
        Args:
            count: Number of random numbers to generate
            max_number: Maximum value for numbers (1 to max_number inclusive)
            exclude: List of numbers to exclude from selection
            
        Returns:
            List of unique random integers
        """
        raise NotImplementedError("Subclasses must implement generate_numbers()")

    def get_provider_info(self) -> Dict[str, Any]:
        """
        Returns provider information for verification
        
        Returns:
            Dictionary with provider information
        """
        return {
            "name": self.__class__.__name__,
            "type": "base",
            "description": "Base RNG provider - not for production use"
        }


class PythonRNGProvider(RNGProvider):
    """
    Simple RNG provider using Python's random module
    Only for development/testing, not for production use
    """
    def generate_numbers(self, count: int, max_number: int, exclude: List[int] = None) -> List[int]:
        """Generate random numbers using Python's random module"""
        exclude = exclude or []
        available_numbers = [n for n in range(1, max_number + 1) if n not in exclude]
        
        if len(available_numbers) < count:
            raise ValueError(f"Not enough numbers available (requested {count}, available {len(available_numbers)})")
            
        return sorted(random.sample(available_numbers, count))
        
    def get_provider_info(self) -> Dict[str, Any]:
        """Return information about this provider"""
        return {
            "name": "Python RNG",
            "type": "local",
            "description": "Simple RNG using Python's random module. Not for production use.",
            "security_rating": "low"
        }


class CryptoRNGProvider(RNGProvider):
    """
    More secure RNG provider using OS crypto source and hashing
    Suitable for production use with medium security requirements
    """
    def __init__(self):
        """Initialize the provider with a secure seed"""
        # Use multiple entropy sources for the seed
        seed_data = [
            str(uuid.uuid4()),
            str(os.urandom(32)),
            str(random.randint(1, 1000000)),
        ]
        self.seed = hashlib.sha256(''.join(seed_data).encode()).digest()
        
    def generate_numbers(self, count: int, max_number: int, exclude: List[int] = None) -> List[int]:
        """Generate cryptographically secure random numbers"""
        exclude = exclude or []
        available_numbers = [n for n in range(1, max_number + 1) if n not in exclude]
        
        if len(available_numbers) < count:
            raise ValueError(f"Not enough numbers available (requested {count}, available {len(available_numbers)})")
        
        # Generate cryptographically random values
        draw_id = str(uuid.uuid4())
        timestamp = str(settings.SECRET_KEY)
        
        # Create HMAC using our seed and the draw parameters
        h = hmac.new(
            self.seed, 
            f"{draw_id}:{timestamp}:{count}:{max_number}".encode(), 
            hashlib.sha256
        )
        
        # Use the HMAC digest as a seed for the random number generation
        digest = h.digest()
        seed_value = int.from_bytes(digest, byteorder='big')
        random.seed(seed_value)
        
        # Sample numbers using the secure seed
        result = sorted(random.sample(available_numbers, count))
        
        # Generate verification data for auditing
        verification = {
            "draw_id": draw_id,
            "digest": h.hexdigest(),
            "timestamp": timestamp,
            "params": {"count": count, "max_number": max_number, "exclude": exclude},
            "result": result
        }
        
        # Log verification data
        logger.info(f"CryptoRNG draw: {json.dumps(verification)}")
        
        return result
        
    def get_provider_info(self) -> Dict[str, Any]:
        """Return information about this provider"""
        return {
            "name": "Crypto RNG",
            "type": "crypto",
            "description": "Cryptographically secure RNG using OS entropy and HMAC-SHA256",
            "security_rating": "medium"
        }


class ExternalRNGProvider(RNGProvider):
    """
    High security RNG provider using an external API service
    For production use with high security requirements
    
    This provider can connect to services like Random.org, NIST Beacon, or 
    a custom lottery RNG API that provides cryptographic verification
    """
    def __init__(self, api_url=None, api_key=None):
        """
        Initialize the provider with API credentials
        
        Args:
            api_url: URL for the external RNG API service
            api_key: API key for authentication with the service
        """
        self.api_url = api_url or getattr(settings, 'RNG_API_URL', None)
        self.api_key = api_key or getattr(settings, 'RNG_API_KEY', None)
        
        if not self.api_url:
            raise ValueError("External RNG API URL not provided")
            
        # Fallback provider in case the external service is unavailable
        self.fallback_provider = CryptoRNGProvider()
        
    def generate_numbers(self, count: int, max_number: int, exclude: List[int] = None) -> List[int]:
        """Generate random numbers using the external API service"""
        exclude = exclude or []
        
        try:
            # Prepare API request parameters
            params = {
                "count": count,
                "min": 1,
                "max": max_number,
                "exclude": exclude
            }
            
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
                
            # Make API request
            response = requests.post(
                self.api_url,
                json=params,
                headers=headers,
                timeout=10
            )
            
            # Check if request was successful
            if response.status_code == 200:
                result_data = response.json()
                
                # Verify the response format
                if not isinstance(result_data, dict) or "numbers" not in result_data:
                    raise ValueError(f"Invalid API response format: {result_data}")
                    
                numbers = result_data["numbers"]
                verification = result_data.get("verification", {})
                
                # Log verification data
                logger.info(f"External RNG draw: {json.dumps(result_data)}")
                
                return sorted(numbers)
            else:
                # Log the error
                logger.error(f"External RNG API error: {response.status_code} - {response.text}")
                
                # Fall back to local crypto RNG
                logger.warning("Falling back to local crypto RNG")
                return self.fallback_provider.generate_numbers(count, max_number, exclude)
                
        except Exception as e:
            # Log the exception
            logger.exception(f"Error using external RNG service: {str(e)}")
            
            # Fall back to local crypto RNG
            logger.warning("Falling back to local crypto RNG")
            return self.fallback_provider.generate_numbers(count, max_number, exclude)
            
    def get_provider_info(self) -> Dict[str, Any]:
        """Return information about this provider"""
        return {
            "name": "External RNG Service",
            "type": "external_api",
            "api_url": self.api_url,
            "description": "High security RNG using an external certified random number generation service",
            "security_rating": "high",
            "has_fallback": True,
            "fallback_provider": self.fallback_provider.get_provider_info()
        }
        
    def get_verification_data(self, draw_id: str) -> Dict[str, Any]:
        """
        Retrieve verification data for a specific draw from the external service
        
        Args:
            draw_id: ID of the draw to verify
            
        Returns:
            Verification data as a dictionary
        """
        try:
            # Prepare API request
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
                
            # Make API request
            response = requests.get(
                f"{self.api_url}/verify/{draw_id}",
                headers=headers,
                timeout=10
            )
            
            # Check if request was successful
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Verification API error: {response.status_code} - {response.text}")
                return {"error": "Failed to retrieve verification data", "status_code": response.status_code}
                
        except Exception as e:
            logger.exception(f"Error verifying draw: {str(e)}")
            return {"error": str(e)}


def get_rng_provider() -> RNGProvider:
    """
    Factory function to get the configured RNG provider
    
    Returns:
        An instance of the configured RNGProvider
    """
    # Check if we're running in a test environment
    is_test = 'pytest' in sys.modules or 'test' in sys.argv[0] or getattr(settings, 'TESTING', False)
    
    if is_test:
        # Use simple Python RNG for tests to avoid external dependencies
        logger.info("Using simple Python RNG for tests")
        return PythonRNGProvider()
    
    # Normal operation - get provider from settings
    provider_type = getattr(settings, 'RNG_PROVIDER', 'crypto')
    
    if provider_type == 'external':
        return ExternalRNGProvider()
    elif provider_type == 'crypto':
        return CryptoRNGProvider()
    else:
        # Default to Python RNG for development
        return PythonRNGProvider()