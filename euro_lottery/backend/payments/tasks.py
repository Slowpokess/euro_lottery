from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.conf import settings
import logging
import traceback

from .models import (
    Transaction, DepositTransaction, WithdrawalRequest, 
    PaymentMethod, PaymentProvider
)

logger = logging.getLogger(__name__)


@shared_task
def process_pending_payouts():
    """
    Celery task to process pending payouts to users
    This includes lottery winnings and withdrawal requests
    """
    from lottery.models import WinningTicket
    
    try:
        logger.info("Starting processing of pending payouts")
        
        # Process lottery winnings
        process_lottery_winnings()
        
        # Process withdrawal requests
        process_withdrawal_requests()
        
        logger.info("Completed processing of pending payouts")
        return True
    except Exception as e:
        logger.error(f"Error in process_pending_payouts task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def process_lottery_winnings():
    """Process pending lottery winnings"""
    from lottery.models import WinningTicket
    
    try:
        # Get all pending winning tickets
        pending_winnings = WinningTicket.objects.filter(
            status='pending',
            transaction__status='pending'
        ).select_related('ticket', 'transaction', 'draw')
        
        processed_count = 0
        
        for winning in pending_winnings:
            try:
                with transaction.atomic():
                    # Get the user and transaction associated with the winning
                    user = winning.ticket.user
                    trans = winning.transaction
                    
                    # Check if the transaction is still pending
                    if trans.status != 'pending':
                        continue
                    
                    # Update the user's balance
                    old_balance = user.balance
                    user.balance += winning.amount
                    user.save()
                    
                    # Update the transaction
                    trans.status = 'completed'
                    trans.balance_before = old_balance
                    trans.balance_after = user.balance
                    trans.updated_at = timezone.now()
                    trans.save()
                    
                    # Update the winning ticket
                    winning.status = 'paid'
                    winning.payout_date = timezone.now()
                    winning.save()
                    
                    logger.info(f"Processed winning payout of {winning.amount} for ticket #{winning.ticket.ticket_number}")
                    processed_count += 1
            except Exception as e:
                logger.error(f"Error processing winning {winning.id}: {str(e)}")
        
        logger.info(f"Processed {processed_count} winning payouts")
        return processed_count
    except Exception as e:
        logger.error(f"Error in process_lottery_winnings: {str(e)}")
        return 0


def process_withdrawal_requests():
    """Process pending withdrawal requests"""
    try:
        # Get approved withdrawal requests that haven't been processed
        pending_withdrawals = WithdrawalRequest.objects.filter(
            status='approved',
            transaction__status='pending'
        ).select_related('transaction', 'payment_method', 'user')
        
        processed_count = 0
        
        for withdrawal in pending_withdrawals:
            try:
                with transaction.atomic():
                    # Update withdrawal status
                    withdrawal.status = 'processing'
                    withdrawal.save()
                    
                    # Process the withdrawal based on payment method
                    result = process_withdrawal_by_method(withdrawal)
                    
                    if result.get('success', False):
                        # Update withdrawal status
                        withdrawal.status = 'completed'
                        withdrawal.processed_at = timezone.now()
                        withdrawal.save()
                        
                        # Update transaction status
                        withdrawal.transaction.status = 'completed'
                        withdrawal.transaction.updated_at = timezone.now()
                        withdrawal.transaction.save()
                        
                        logger.info(f"Processed withdrawal {withdrawal.id} for {withdrawal.amount}")
                        processed_count += 1
                    else:
                        # Mark as failed
                        withdrawal.status = 'failed'
                        withdrawal.rejection_reason = result.get('error', 'Unknown error')
                        withdrawal.save()
                        
                        # Update transaction status
                        withdrawal.transaction.status = 'failed'
                        withdrawal.transaction.description += f" - Failed: {result.get('error', 'Unknown error')}"
                        withdrawal.transaction.updated_at = timezone.now()
                        withdrawal.transaction.save()
                        
                        logger.error(f"Failed to process withdrawal {withdrawal.id}: {result.get('error')}")
            except Exception as e:
                logger.error(f"Error processing withdrawal {withdrawal.id}: {str(e)}")
        
        logger.info(f"Processed {processed_count} withdrawals")
        return processed_count
    except Exception as e:
        logger.error(f"Error in process_withdrawal_requests: {str(e)}")
        return 0


def process_withdrawal_by_method(withdrawal):
    """Process withdrawal based on payment method type"""
    method_type = withdrawal.payment_method.method_type
    
    # Based on method type, call appropriate processor
    if method_type in ['credit_card', 'debit_card']:
        return process_card_withdrawal(withdrawal)
    elif method_type == 'bank_account':
        return process_bank_withdrawal(withdrawal)
    elif method_type == 'e_wallet':
        return process_ewallet_withdrawal(withdrawal)
    elif method_type == 'crypto_wallet':
        return process_crypto_withdrawal(withdrawal)
    else:
        return {'success': False, 'error': f'Unsupported payment method type: {method_type}'}


def process_card_withdrawal(withdrawal):
    """Process withdrawal to credit/debit card"""
    # In real implementation, this would use a payment gateway API
    logger.info(f"Processing card withdrawal for {withdrawal.user.email}: {withdrawal.amount}")
    
    # Simulate successful withdrawal
    return {
        'success': True,
        'reference': f"CARD-{withdrawal.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        'details': f"Withdrawal to card {withdrawal.payment_method.card_brand} ****{withdrawal.payment_method.card_last_four}"
    }


def process_bank_withdrawal(withdrawal):
    """Process withdrawal to bank account"""
    # In real implementation, this would use a banking API
    logger.info(f"Processing bank withdrawal for {withdrawal.user.email}: {withdrawal.amount}")
    
    # Simulate successful withdrawal
    return {
        'success': True,
        'reference': f"BANK-{withdrawal.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        'details': f"Withdrawal to {withdrawal.payment_method.bank_name} account ****{withdrawal.payment_method.account_last_four}"
    }


def process_ewallet_withdrawal(withdrawal):
    """Process withdrawal to e-wallet"""
    # In real implementation, this would use e-wallet API (PayPal, etc.)
    logger.info(f"Processing e-wallet withdrawal for {withdrawal.user.email}: {withdrawal.amount}")
    
    # Simulate successful withdrawal
    return {
        'success': True,
        'reference': f"EWALLET-{withdrawal.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        'details': f"Withdrawal to {withdrawal.payment_method.e_wallet_provider} account {withdrawal.payment_method.e_wallet_email}"
    }


def process_crypto_withdrawal(withdrawal):
    """Process withdrawal to crypto wallet"""
    # In real implementation, this would use crypto wallet API
    logger.info(f"Processing crypto withdrawal for {withdrawal.user.email}: {withdrawal.amount}")
    
    # Simulate successful withdrawal
    return {
        'success': True,
        'reference': f"CRYPTO-{withdrawal.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        'details': f"Withdrawal of {withdrawal.amount} to {withdrawal.payment_method.crypto_currency} address {withdrawal.payment_method.crypto_address}"
    }


@shared_task
def check_pending_deposits():
    """
    Celery task to check status of pending deposits
    """
    try:
        logger.info("Starting check for pending deposits")
        
        # Get all pending deposits
        pending_deposits = DepositTransaction.objects.filter(
            transaction__status='pending'
        ).select_related('transaction', 'payment_provider', 'user')
        
        updated_count = 0
        
        for deposit in pending_deposits:
            try:
                # Skip if no provider transaction ID
                if not deposit.provider_transaction_id:
                    continue
                
                # Get the appropriate payment processor
                from .integrations.factory import get_payment_processor
                processor = get_payment_processor(deposit.payment_provider.provider_type)
                
                # Check payment status
                payment_status = processor.get_payment_status(deposit.provider_transaction_id)
                
                if not payment_status.get('success', False):
                    logger.warning(f"Failed to get status for deposit {deposit.id}: {payment_status.get('error')}")
                    continue
                
                # Update deposit status based on provider status
                status = payment_status.get('status', '').lower()
                
                # Update deposit provider info
                deposit.provider_status = status
                deposit.provider_response = payment_status
                deposit.save()
                
                # Process based on status
                if status in ['succeeded', 'completed']:
                    # Payment is complete, update transaction and balance
                    with transaction.atomic():
                        # Update deposit
                        deposit.completed_at = timezone.now()
                        deposit.save()
                        
                        # Update transaction
                        trans = deposit.transaction
                        trans.status = 'completed'
                        
                        # Update user balance
                        old_balance = deposit.user.balance
                        deposit.user.balance += deposit.amount
                        deposit.user.save()
                        
                        # Set final transaction details
                        trans.balance_before = old_balance
                        trans.balance_after = deposit.user.balance
                        trans.updated_at = timezone.now()
                        trans.save()
                        
                        logger.info(f"Completed deposit {deposit.id} for {deposit.amount}")
                        updated_count += 1
                
                elif status in ['failed', 'canceled', 'cancelled']:
                    # Payment failed or was cancelled
                    with transaction.atomic():
                        # Update transaction
                        trans = deposit.transaction
                        trans.status = 'failed' if status == 'failed' else 'cancelled'
                        trans.updated_at = timezone.now()
                        trans.save()
                        
                        logger.info(f"Marked deposit {deposit.id} as {trans.status}")
                        updated_count += 1
            
            except Exception as e:
                logger.error(f"Error checking deposit {deposit.id}: {str(e)}")
        
        logger.info(f"Completed checking for pending deposits: {updated_count} updated")
        return {'updated': updated_count}
    except Exception as e:
        logger.error(f"Error in check_pending_deposits task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


@shared_task
def retry_failed_deposits():
    """
    Celery task to retry failed deposits that might have been temporary failures
    """
    try:
        logger.info("Starting retry of failed deposits")
        
        # Get recent failed deposits (last 24 hours)
        recent_time = timezone.now() - timezone.timedelta(hours=24)
        failed_deposits = DepositTransaction.objects.filter(
            transaction__status='failed',
            transaction__created_at__gte=recent_time,
            provider_transaction_id__isnull=False
        ).select_related('transaction', 'payment_provider', 'user')
        
        retry_count = 0
        success_count = 0
        
        for deposit in failed_deposits:
            try:
                # Get the appropriate payment processor
                from .integrations.factory import get_payment_processor
                processor = get_payment_processor(deposit.payment_provider.provider_type)
                
                # Check payment status again
                payment_status = processor.get_payment_status(deposit.provider_transaction_id)
                
                if not payment_status.get('success', False):
                    continue
                
                # Get status
                status = payment_status.get('status', '').lower()
                
                # If payment actually succeeded, update the deposit
                if status in ['succeeded', 'completed']:
                    with transaction.atomic():
                        # Update deposit
                        deposit.provider_status = status
                        deposit.provider_response = payment_status
                        deposit.completed_at = timezone.now()
                        deposit.save()
                        
                        # Update transaction
                        trans = deposit.transaction
                        trans.status = 'completed'
                        
                        # Update user balance
                        old_balance = deposit.user.balance
                        deposit.user.balance += deposit.amount
                        deposit.user.save()
                        
                        # Set final transaction details
                        trans.balance_before = old_balance
                        trans.balance_after = deposit.user.balance
                        trans.description = f"Deposit of {deposit.amount} via {deposit.payment_provider.name} (retried)"
                        trans.updated_at = timezone.now()
                        trans.save()
                        
                        logger.info(f"Successfully retried deposit {deposit.id} for {deposit.amount}")
                        success_count += 1
                
                retry_count += 1
            except Exception as e:
                logger.error(f"Error retrying deposit {deposit.id}: {str(e)}")
        
        logger.info(f"Completed retrying failed deposits: {retry_count} retried, {success_count} succeeded")
        return {'retried': retry_count, 'succeeded': success_count}
    except Exception as e:
        logger.error(f"Error in retry_failed_deposits task: {str(e)}")
        logger.error(traceback.format_exc())
        return False