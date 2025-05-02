"""
Base classes and interfaces for payment processing integrations.
Each payment provider should implement these interfaces.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from decimal import Decimal


class PaymentProcessorInterface(ABC):
    """Interface that all payment processor classes must implement"""
    
    @abstractmethod
    def create_payment(self, amount: Decimal, currency: str = 'USD', 
                     description: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Create a payment intent/order with the payment processor
        
        Args:
            amount: Amount to charge (in decimal)
            currency: 3-letter currency code
            description: Optional description for the payment
            metadata: Additional data to store with the payment
            
        Returns:
            Dictionary with payment details including client token/keys
        """
        pass
    
    @abstractmethod
    def confirm_payment(self, payment_id: str, payment_data: Dict = None) -> Dict[str, Any]:
        """
        Confirm a payment after user has completed their part
        
        Args:
            payment_id: The ID of the payment from create_payment
            payment_data: Additional data needed to confirm (e.g. token)
            
        Returns:
            Dictionary with payment confirmation details
        """
        pass
    
    @abstractmethod
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get the current status of a payment
        
        Args:
            payment_id: The ID of the payment to check
            
        Returns:
            Dictionary with payment status and details
        """
        pass
    
    @abstractmethod
    def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Cancel a pending payment
        
        Args:
            payment_id: The ID of the payment to cancel
            
        Returns:
            Dictionary with cancellation result
        """
        pass
    
    @abstractmethod
    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Process a refund for a payment
        
        Args:
            payment_id: The ID of the payment to refund
            amount: Amount to refund (None for full refund)
            
        Returns:
            Dictionary with refund details
        """
        pass


class PaymentMethodInterface(ABC):
    """Interface for managing customer payment methods"""
    
    @abstractmethod
    def create_customer(self, email: str, name: str = None, metadata: Dict = None) -> str:
        """
        Create a customer in the payment processor's system
        
        Args:
            email: Customer email address
            name: Optional customer name
            metadata: Additional customer data
            
        Returns:
            Customer ID in the payment system
        """
        pass
    
    @abstractmethod
    def add_payment_method(self, customer_id: str, token: str) -> Dict[str, Any]:
        """
        Add a payment method to a customer
        
        Args:
            customer_id: ID of the customer in the payment system
            token: Payment method token from the frontend
            
        Returns:
            Dictionary with payment method details
        """
        pass
    
    @abstractmethod
    def list_payment_methods(self, customer_id: str) -> List[Dict[str, Any]]:
        """
        List all payment methods for a customer
        
        Args:
            customer_id: ID of the customer in the payment system
            
        Returns:
            List of payment methods
        """
        pass
    
    @abstractmethod
    def delete_payment_method(self, payment_method_id: str) -> bool:
        """
        Delete a payment method
        
        Args:
            payment_method_id: ID of the payment method to delete
            
        Returns:
            True if successful, False otherwise
        """
        pass


class WebhookHandlerInterface(ABC):
    """Interface for handling webhooks from payment processors"""
    
    @abstractmethod
    def parse_webhook(self, payload: Dict, headers: Dict = None) -> Dict[str, Any]:
        """
        Parse a webhook payload from the payment processor
        
        Args:
            payload: The webhook payload
            headers: HTTP headers from the webhook request
            
        Returns:
            Parsed webhook data
        """
        pass
    
    @abstractmethod
    def handle_webhook_event(self, event_type: str, event_data: Dict) -> bool:
        """
        Process a webhook event
        
        Args:
            event_type: Type of event (e.g., payment.succeeded)
            event_data: Data associated with the event
            
        Returns:
            True if handled successfully, False otherwise
        """
        pass