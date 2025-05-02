"""
PayPal payment integration for Euro Lottery
"""

import requests
import base64
import json
from decimal import Decimal
from typing import Dict, Any, Optional, List
import logging
from django.conf import settings
from .base import PaymentProcessorInterface, WebhookHandlerInterface

logger = logging.getLogger(__name__)


class PayPalPaymentProcessor(PaymentProcessorInterface, WebhookHandlerInterface):
    """Implementation of payment interfaces for PayPal"""
    
    def __init__(self):
        """Initialize the PayPal processor"""
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_SECRET
        self.mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
        self.webhook_id = getattr(settings, 'PAYPAL_WEBHOOK_ID', None)
        self.currency = getattr(settings, 'DEFAULT_CURRENCY', 'USD')
        
        # Set base URL based on mode
        if self.mode == 'live':
            self.base_url = 'https://api-m.paypal.com'
        else:
            self.base_url = 'https://api-m.sandbox.paypal.com'
        
        # Cache for access token
        self._access_token = None
        self._token_expiry = 0
    
    def _get_access_token(self) -> str:
        """
        Get an OAuth access token from PayPal
        
        Returns:
            Access token string
        """
        import time
        
        # If we have a valid token, return it
        if self._access_token and time.time() < self._token_expiry:
            return self._access_token
        
        # Otherwise get a new token
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        
        headers = {
            'Authorization': f'Basic {auth}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        
        data = {
            'grant_type': 'client_credentials'
        }
        
        response = requests.post(
            f"{self.base_url}/v1/oauth2/token",
            headers=headers,
            data=data
        )
        
        if response.status_code != 200:
            logger.error(f"PayPal authentication error: {response.text}")
            raise ValueError(f"Failed to authenticate with PayPal: {response.text}")
        
        result = response.json()
        self._access_token = result['access_token']
        # Set expiry with a small buffer
        self._token_expiry = time.time() + result['expires_in'] - 60
        
        return self._access_token
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Make an authenticated request to PayPal API
        
        Args:
            method: HTTP method (GET, POST, etc)
            endpoint: API endpoint
            data: Request payload
            params: Query parameters
            
        Returns:
            Response data
        """
        url = f"{self.base_url}{endpoint}"
        
        headers = {
            'Authorization': f'Bearer {self._get_access_token()}',
            'Content-Type': 'application/json',
        }
        
        response = requests.request(
            method,
            url,
            headers=headers,
            json=data,
            params=params
        )
        
        if response.status_code >= 400:
            logger.error(f"PayPal API error: {response.text}")
            
            # Try to parse error response
            try:
                error_data = response.json()
                error_message = error_data.get('message', 'Unknown error')
                return {'error': error_message, 'success': False, 'status_code': response.status_code}
            except:
                return {'error': response.text, 'success': False, 'status_code': response.status_code}
        
        return response.json()
    
    # Payment Processing Methods
    
    def create_payment(self, amount: Decimal, currency: str = None, 
                     description: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Create a PayPal order
        
        Args:
            amount: Amount to charge
            currency: Currency code (default from settings)
            description: Payment description
            metadata: Additional data
            
        Returns:
            Dictionary with order details
        """
        try:
            currency = currency or self.currency
            
            # Create payload
            data = {
                'intent': 'CAPTURE',
                'purchase_units': [
                    {
                        'amount': {
                            'currency_code': currency.upper(),
                            'value': str(amount)
                        },
                        'description': description or 'Euro Lottery Payment'
                    }
                ],
                'application_context': {
                    'return_url': f"{settings.SITE_URL}/payments/paypal/return",
                    'cancel_url': f"{settings.SITE_URL}/payments/paypal/cancel"
                }
            }
            
            # Add custom ID if metadata includes it
            if metadata and 'custom_id' in metadata:
                data['purchase_units'][0]['custom_id'] = metadata['custom_id']
            
            # Create order
            result = self._make_request('POST', '/v2/checkout/orders', data)
            
            # Check for errors
            if 'error' in result:
                return result
            
            # Extract relevant info
            order_id = result.get('id')
            status = result.get('status')
            links = {link['rel']: link['href'] for link in result.get('links', [])}
            
            return {
                'id': order_id,
                'status': status,
                'links': links,
                'approval_url': links.get('approve'),
                'success': True,
                'provider': 'paypal'
            }
            
        except Exception as e:
            logger.error(f"PayPal error creating payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def confirm_payment(self, payment_id: str, payment_data: Dict = None) -> Dict[str, Any]:
        """
        Capture a PayPal order payment
        
        Args:
            payment_id: PayPal order ID
            payment_data: Additional data (not used for PayPal)
            
        Returns:
            Dictionary with payment confirmation details
        """
        try:
            # Capture the payment
            result = self._make_request('POST', f'/v2/checkout/orders/{payment_id}/capture')
            
            # Check for errors
            if 'error' in result:
                return result
            
            status = result.get('status')
            
            # Extract capture details
            capture_id = None
            purchase_units = result.get('purchase_units', [])
            if purchase_units and 'payments' in purchase_units[0]:
                captures = purchase_units[0]['payments'].get('captures', [])
                if captures:
                    capture_id = captures[0].get('id')
            
            return {
                'id': payment_id,
                'capture_id': capture_id,
                'status': status,
                'success': status == 'COMPLETED',
                'details': result
            }
            
        except Exception as e:
            logger.error(f"PayPal error confirming payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get the status of a PayPal order
        
        Args:
            payment_id: PayPal order ID
            
        Returns:
            Dictionary with payment status
        """
        try:
            result = self._make_request('GET', f'/v2/checkout/orders/{payment_id}')
            
            # Check for errors
            if 'error' in result:
                return result
            
            status = result.get('status')
            
            return {
                'id': payment_id,
                'status': status,
                'success': True,
                'details': result
            }
            
        except Exception as e:
            logger.error(f"PayPal error getting payment status: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
            
    def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Cancel a PayPal order that hasn't been completed
        
        Args:
            payment_id: PayPal order ID
            
        Returns:
            Dictionary with cancellation result
        """
        try:
            # First check the status to see if it can be cancelled
            status_result = self.get_payment_status(payment_id)
            
            if not status_result.get('success', False):
                return status_result
                
            status = status_result.get('status', '')
            
            # Only CREATED or APPROVED orders can be cancelled
            if status not in ['CREATED', 'APPROVED']:
                return {
                    'id': payment_id,
                    'status': status,
                    'success': False,
                    'error': f"Order with status '{status}' cannot be canceled"
                }
            
            # Send cancel request
            # According to PayPal docs, to cancel an order we need to PUT with empty body
            result = self._make_request('POST', f'/v2/checkout/orders/{payment_id}/cancel')
            
            # Check for errors
            if 'error' in result:
                return result
            
            # Success case - returns a 204 No Content, so result may be empty
            # We'll return a constructed response
            return {
                'id': payment_id,
                'status': 'CANCELLED',
                'success': True
            }
            
        except Exception as e:
            logger.error(f"PayPal error canceling order: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Process a refund for a PayPal payment
        
        Args:
            payment_id: PayPal capture ID (not order ID)
            amount: Amount to refund (None for full refund)
            
        Returns:
            Dictionary with refund details
        """
        try:
            data = {}
            
            # If amount specified, add it
            if amount is not None:
                data['amount'] = {
                    'value': str(amount),
                    'currency_code': self.currency.upper()
                }
            
            # Submit refund
            result = self._make_request('POST', f'/v2/payments/captures/{payment_id}/refund', data)
            
            # Check for errors
            if 'error' in result:
                return result
            
            refund_id = result.get('id')
            status = result.get('status')
            
            return {
                'id': refund_id,
                'status': status,
                'success': status == 'COMPLETED',
                'details': result
            }
            
        except Exception as e:
            logger.error(f"PayPal error processing refund: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    # These methods are from the PaymentMethodInterface but PayPal handles
    # payment methods differently, so we just implement stubs here
    
    def create_customer(self, email: str, name: str = None, metadata: Dict = None) -> str:
        """PayPal doesn't support customer management in the same way"""
        logger.warning("PayPal doesn't support direct customer management")
        return None
    
    def add_payment_method(self, customer_id: str, token: str) -> Dict[str, Any]:
        """PayPal doesn't support direct payment method management"""
        logger.warning("PayPal doesn't support direct payment method management")
        return {'success': False, 'error': 'Not supported by PayPal'}
    
    def list_payment_methods(self, customer_id: str) -> List[Dict[str, Any]]:
        """PayPal doesn't support direct payment method management"""
        logger.warning("PayPal doesn't support direct payment method management")
        return []
    
    def delete_payment_method(self, payment_method_id: str) -> bool:
        """PayPal doesn't support direct payment method management"""
        logger.warning("PayPal doesn't support direct payment method management")
        return False
    
    # Webhook Methods
    
    def parse_webhook(self, payload: Dict, headers: Dict = None) -> Dict[str, Any]:
        """
        Parse and validate a webhook from PayPal
        
        Args:
            payload: The webhook payload
            headers: HTTP headers with signature
            
        Returns:
            Parsed webhook data
        """
        try:
            if not self.webhook_id:
                logger.warning("PayPal webhook ID not configured, skipping signature verification")
                # Return event data without verification
                return {
                    'id': payload.get('id'),
                    'type': payload.get('event_type'),
                    'data': payload.get('resource', {}),
                    'summary': payload.get('summary', ''),
                    'success': True,
                    'verified': False
                }
            
            if not headers:
                logger.warning("Missing headers for PayPal webhook verification")
                return {
                    'error': 'Missing headers for verification',
                    'success': False
                }
            
            # Extract verification headers
            transmission_id = headers.get('paypal-transmission-id')
            timestamp = headers.get('paypal-transmission-time')
            webhook_signature = headers.get('paypal-transmission-sig')
            cert_url = headers.get('paypal-cert-url')
            
            if not all([transmission_id, timestamp, webhook_signature, cert_url]):
                logger.error("Missing required PayPal webhook headers")
                return {
                    'error': 'Missing required webhook headers',
                    'success': False
                }
            
            # Construct verification data
            verification_data = {
                'auth_algo': headers.get('paypal-auth-algo', 'SHA256withRSA'),
                'cert_url': cert_url,
                'transmission_id': transmission_id,
                'transmission_sig': webhook_signature,
                'transmission_time': timestamp,
                'webhook_id': self.webhook_id,
                'webhook_event': payload
            }
            
            # Verify webhook signature
            result = self._make_request('POST', '/v1/notifications/verify-webhook-signature', verification_data)
            
            verification_status = result.get('verification_status')
            if verification_status != 'SUCCESS':
                logger.warning(f"PayPal webhook signature verification failed: {verification_status}")
                return {
                    'error': f'Webhook verification failed: {verification_status}',
                    'success': False
                }
            
            # Return verified event data
            return {
                'id': payload.get('id'),
                'type': payload.get('event_type'),
                'data': payload.get('resource', {}),
                'summary': payload.get('summary', ''),
                'success': True,
                'verified': True
            }
            
        except Exception as e:
            logger.error(f"Error parsing PayPal webhook: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def handle_webhook_event(self, event_type: str, event_data: Dict) -> bool:
        """
        Process a webhook event from PayPal
        
        Args:
            event_type: PayPal event type
            event_data: Event data
            
        Returns:
            True if handled successfully
        """
        try:
            # Handle different event types
            if event_type == 'PAYMENT.CAPTURE.COMPLETED':
                # Payment capture completed
                self._handle_payment_completed(event_data)
                return True
                
            elif event_type == 'PAYMENT.CAPTURE.DENIED':
                # Payment capture denied
                self._handle_payment_denied(event_data)
                return True
                
            elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
                # Payment refunded
                self._handle_payment_refunded(event_data)
                return True
            
            # Log unhandled event types
            logger.info(f"Unhandled PayPal webhook event: {event_type}")
            return False
            
        except Exception as e:
            logger.error(f"Error handling PayPal webhook event: {str(e)}")
            return False
    
    # Helper methods for webhook handling
    
    def _handle_payment_completed(self, event_data: Dict):
        """Handle completed payment webhook"""
        # In real implementation, this would update transaction records
        capture_id = event_data.get('id')
        amount = event_data.get('amount', {}).get('value')
        currency = event_data.get('amount', {}).get('currency_code')
        
        logger.info(f"PayPal payment completed: {capture_id} for {amount} {currency}")
    
    def _handle_payment_denied(self, event_data: Dict):
        """Handle denied payment webhook"""
        capture_id = event_data.get('id')
        status_details = event_data.get('status_details', {})
        reason = status_details.get('reason', 'Unknown reason')
        
        logger.warning(f"PayPal payment denied: {capture_id} - {reason}")
    
    def _handle_payment_refunded(self, event_data: Dict):
        """Handle refunded payment webhook"""
        refund_id = event_data.get('id')
        amount = event_data.get('amount', {}).get('value')
        currency = event_data.get('amount', {}).get('currency_code')
        
        logger.info(f"PayPal payment refunded: {refund_id} for {amount} {currency}")
    
    # Client helper methods
    
    def get_client_config(self) -> Dict[str, Any]:
        """
        Get configuration for frontend PayPal integration
        
        Returns:
            Dictionary with public configuration
        """
        return {
            'provider': 'paypal',
            'client_id': self.client_id,
            'currency': self.currency,
            'mode': self.mode
        }