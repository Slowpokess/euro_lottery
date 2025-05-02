"""
Stripe payment integration for Euro Lottery
"""

import stripe
from decimal import Decimal
from typing import Dict, Any, Optional, List
import logging
import json
from django.conf import settings
from .base import PaymentProcessorInterface, PaymentMethodInterface, WebhookHandlerInterface

logger = logging.getLogger(__name__)

# Configure Stripe keys
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripePaymentProcessor(PaymentProcessorInterface, PaymentMethodInterface, WebhookHandlerInterface):
    """Implementation of payment interfaces for Stripe"""
    
    def __init__(self):
        """Initialize the Stripe processor"""
        self.public_key = settings.STRIPE_PUBLIC_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        self.currency = getattr(settings, 'DEFAULT_CURRENCY', 'USD')

    # Payment Processing Methods
    
    def create_payment(self, amount: Decimal, currency: str = None, 
                     description: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Create a payment intent with Stripe
        
        Args:
            amount: Amount to charge
            currency: Currency code (default from settings)
            description: Payment description
            metadata: Additional data to store with payment
            
        Returns:
            Dictionary with payment intent details and client secret
        """
        try:
            currency = currency or self.currency
            
            # Convert to cents (Stripe uses smallest currency unit)
            amount_in_cents = int(amount * 100)
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=currency.lower(),
                description=description,
                metadata=metadata or {},
                automatic_payment_methods={'enabled': True},
            )
            
            # Return response with client secret
            return {
                'id': intent.id,
                'client_secret': intent.client_secret,
                'amount': amount,
                'currency': currency,
                'status': intent.status,
                'provider': 'stripe'
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def confirm_payment(self, payment_id: str, payment_data: Dict = None) -> Dict[str, Any]:
        """
        Confirm a payment intent
        
        Args:
            payment_id: Stripe payment intent ID
            payment_data: Additional confirmation data
            
        Returns:
            Dictionary with confirmation details
        """
        try:
            # Stripe usually confirms payments directly in the frontend,
            # but this allows for server-side confirmation if needed
            intent = stripe.PaymentIntent.retrieve(payment_id)
            
            # If payment data includes a payment method, we can confirm it server-side
            if payment_data and 'payment_method' in payment_data:
                intent = stripe.PaymentIntent.confirm(
                    payment_id,
                    payment_method=payment_data['payment_method'],
                )
            
            return {
                'id': intent.id,
                'status': intent.status,
                'success': intent.status in ['succeeded', 'processing'],
                'details': {
                    'amount': Decimal(intent.amount) / 100,
                    'currency': intent.currency,
                    'payment_method': intent.payment_method
                }
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get the current status of a payment intent
        
        Args:
            payment_id: Stripe payment intent ID
            
        Returns:
            Dictionary with payment status
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_id)
            
            return {
                'id': intent.id,
                'status': intent.status,
                'amount': Decimal(intent.amount) / 100,
                'currency': intent.currency,
                'payment_method': intent.payment_method,
                'success': intent.status in ['succeeded', 'processing'],
                'metadata': intent.metadata
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting payment status: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Cancel a pending payment intent
        
        Args:
            payment_id: Stripe payment intent ID
            
        Returns:
            Dictionary with cancellation result
        """
        try:
            # Retrieve the payment intent
            intent = stripe.PaymentIntent.retrieve(payment_id)
            
            # Check if it can be canceled
            cancelable_statuses = ['requires_payment_method', 'requires_capture', 
                                  'requires_confirmation', 'requires_action']
            
            if intent.status not in cancelable_statuses:
                return {
                    'id': intent.id,
                    'status': intent.status,
                    'success': False,
                    'error': f"Payment intent with status '{intent.status}' cannot be canceled"
                }
            
            # Cancel the payment intent
            canceled_intent = stripe.PaymentIntent.cancel(payment_id)
            
            return {
                'id': canceled_intent.id,
                'status': canceled_intent.status,
                'success': canceled_intent.status == 'canceled',
                'amount': Decimal(canceled_intent.amount) / 100,
                'currency': canceled_intent.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Process a refund for a payment
        
        Args:
            payment_id: Stripe payment intent ID
            amount: Amount to refund (None for full refund)
            
        Returns:
            Dictionary with refund details
        """
        try:
            refund_params = {'payment_intent': payment_id}
            
            # If amount specified, add it to params
            if amount is not None:
                refund_params['amount'] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_params)
            
            return {
                'id': refund.id,
                'status': refund.status,
                'amount': Decimal(refund.amount) / 100,
                'currency': refund.currency,
                'success': refund.status in ['succeeded', 'processing'],
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error processing refund: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    # Payment Method Methods
    
    def create_customer(self, email: str, name: str = None, metadata: Dict = None) -> str:
        """
        Create a customer in Stripe
        
        Args:
            email: Customer email
            name: Optional customer name
            metadata: Additional data
            
        Returns:
            Stripe customer ID
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            raise ValueError(f"Failed to create customer: {str(e)}")
    
    def add_payment_method(self, customer_id: str, token: str) -> Dict[str, Any]:
        """
        Add a payment method to a customer
        
        Args:
            customer_id: Stripe customer ID
            token: Payment method token from frontend
            
        Returns:
            Dictionary with payment method details
        """
        try:
            # Attach payment method to customer
            payment_method = stripe.PaymentMethod.attach(
                token,
                customer=customer_id
            )
            
            # Parse card details
            card_details = {}
            if hasattr(payment_method, 'card') and payment_method.card:
                card_details = {
                    'last4': payment_method.card.last4,
                    'brand': payment_method.card.brand,
                    'exp_month': payment_method.card.exp_month,
                    'exp_year': payment_method.card.exp_year,
                }
            
            return {
                'id': payment_method.id,
                'type': payment_method.type,
                'card': card_details,
                'customer': customer_id,
                'success': True
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error adding payment method: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def list_payment_methods(self, customer_id: str) -> List[Dict[str, Any]]:
        """
        List all payment methods for a customer
        
        Args:
            customer_id: Stripe customer ID
            
        Returns:
            List of payment methods
        """
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type='card'
            )
            
            result = []
            for method in payment_methods.data:
                card_details = {}
                if hasattr(method, 'card') and method.card:
                    card_details = {
                        'last4': method.card.last4,
                        'brand': method.card.brand,
                        'exp_month': method.card.exp_month,
                        'exp_year': method.card.exp_year,
                    }
                
                result.append({
                    'id': method.id,
                    'type': method.type,
                    'card': card_details,
                    'created': method.created
                })
            
            return result
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error listing payment methods: {str(e)}")
            return []
    
    def delete_payment_method(self, payment_method_id: str) -> bool:
        """
        Delete a payment method
        
        Args:
            payment_method_id: ID of payment method to delete
            
        Returns:
            True if successful
        """
        try:
            stripe.PaymentMethod.detach(payment_method_id)
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error deleting payment method: {str(e)}")
            return False
    
    # Webhook Methods
    
    def parse_webhook(self, payload: Dict, headers: Dict = None) -> Dict[str, Any]:
        """
        Parse and validate a webhook from Stripe
        
        Args:
            payload: The webhook payload
            headers: HTTP headers with signature
            
        Returns:
            Parsed webhook data
        """
        try:
            if not headers or 'stripe-signature' not in headers:
                raise ValueError("Missing Stripe signature in headers")
                
            signature = headers['stripe-signature']
            payload_str = json.dumps(payload)
            
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload_str,
                signature,
                self.webhook_secret
            )
            
            return {
                'id': event.id,
                'type': event.type,
                'data': event.data.object,
                'created': event.created,
                'success': True
            }
            
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Stripe webhook signature verification failed: {str(e)}")
            return {
                'error': 'Invalid signature',
                'success': False
            }
            
        except Exception as e:
            logger.error(f"Error parsing Stripe webhook: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def handle_webhook_event(self, event_type: str, event_data: Dict) -> bool:
        """
        Process a webhook event
        
        Args:
            event_type: Type of Stripe event
            event_data: Data from the event
            
        Returns:
            True if handled successfully
        """
        try:
            # Handle different event types
            if event_type == 'payment_intent.succeeded':
                # Payment succeeded - update transaction status
                self._handle_payment_success(event_data)
                return True
                
            elif event_type == 'payment_intent.payment_failed':
                # Payment failed - update transaction status
                self._handle_payment_failure(event_data)
                return True
                
            elif event_type == 'charge.refunded':
                # Refund processed - update transaction status
                self._handle_refund_processed(event_data)
                return True
                
            # Log unhandled event types
            logger.info(f"Unhandled Stripe webhook event: {event_type}")
            return False
            
        except Exception as e:
            logger.error(f"Error handling Stripe webhook event: {str(e)}")
            return False
    
    # Helper methods for webhook handling
    
    def _handle_payment_success(self, event_data: Dict):
        """Handle successful payment webhook"""
        # In real implementation, this would update transaction records
        payment_intent_id = event_data.get('id')
        amount = Decimal(event_data.get('amount', 0)) / 100
        metadata = event_data.get('metadata', {})
        
        logger.info(f"Payment succeeded: {payment_intent_id} for {amount}")

    def _handle_payment_failure(self, event_data: Dict):
        """Handle failed payment webhook"""
        payment_intent_id = event_data.get('id')
        last_error = event_data.get('last_payment_error', {})
        error_message = last_error.get('message', 'Unknown error')
        
        logger.warning(f"Payment failed: {payment_intent_id} - {error_message}")

    def _handle_refund_processed(self, event_data: Dict):
        """Handle refund processed webhook"""
        refund_id = event_data.get('id')
        amount = Decimal(event_data.get('amount_refunded', 0)) / 100
        
        logger.info(f"Refund processed: {refund_id} for {amount}")
        
    # Client helper methods
    
    def get_client_config(self) -> Dict[str, Any]:
        """
        Get configuration for frontend Stripe integration
        
        Returns:
            Dictionary with public configuration
        """
        return {
            'provider': 'stripe',
            'public_key': self.public_key,
            'currency': self.currency,
        }