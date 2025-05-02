from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging
import traceback

from .models import User, Notification

logger = logging.getLogger(__name__)


@shared_task
def send_pending_notifications():
    """
    Celery task to send pending notifications via email, SMS, and push
    """
    try:
        logger.info("Starting to send pending notifications")
        
        # Get notifications that haven't been sent yet
        now = timezone.now()
        one_minute_ago = now - timezone.timedelta(minutes=1)
        
        # Find notifications created at least a minute ago and not yet sent
        pending_notifications = Notification.objects.filter(
            created_at__lte=one_minute_ago,
        ).exclude(
            is_email_sent=True,
            is_sms_sent=True,
            is_push_sent=True
        ).select_related('user')
        
        sent_count = 0
        
        for notification in pending_notifications:
            try:
                user = notification.user
                
                # Send via email if user has email notifications enabled
                if user.email_notifications and not notification.is_email_sent:
                    send_email_notification(notification)
                    notification.is_email_sent = True
                    notification.save(update_fields=['is_email_sent'])
                
                # Send via SMS if user has SMS notifications enabled
                if user.sms_notifications and user.phone_number and not notification.is_sms_sent:
                    send_sms_notification(notification)
                    notification.is_sms_sent = True
                    notification.save(update_fields=['is_sms_sent'])
                
                # Send via push if user has push notifications enabled
                if user.push_notifications and not notification.is_push_sent:
                    send_push_notification(notification)
                    notification.is_push_sent = True
                    notification.save(update_fields=['is_push_sent'])
                
                sent_count += 1
            except Exception as e:
                logger.error(f"Error sending notification {notification.id}: {str(e)}")
        
        logger.info(f"Sent {sent_count} pending notifications")
        return {'sent': sent_count}
    except Exception as e:
        logger.error(f"Error in send_pending_notifications task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def send_email_notification(notification):
    """Send notification via email"""
    user = notification.user
    
    try:
        # Current year for copyright in the footer
        current_year = timezone.now().year
        
        # Prepare email content
        context = {
            'user': user,
            'notification': notification,
            'site_name': settings.SITE_NAME,
            'site_url': settings.SITE_URL,
            'current_year': current_year,
            'support_email': settings.SUPPORT_EMAIL,
        }
        
        # Add custom data from notification
        if notification.data:
            context.update(notification.data)
        
        # Choose template based on notification type
        template_name = f"emails/{notification.notification_type}.html"
        
        try:
            # Render HTML email
            html_content = render_to_string(template_name, context)
            
            # Create email message
            msg = EmailMultiAlternatives(
                subject=notification.title,
                body=notification.message,  # Plain text version
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            # Attach HTML version
            msg.attach_alternative(html_content, "text/html")
            
            # Send email
            msg.send()
            
            logger.info(f"HTML email notification sent to {user.email}: {notification.title}")
            
        except Exception as template_error:
            # Fallback to basic email if template not found
            logger.warning(f"Email template {template_name} not found: {str(template_error)}")
            logger.warning(traceback.format_exc())
            
            # Send basic email
            send_mail(
                subject=notification.title,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Plain text email notification sent to {user.email}: {notification.title}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification to {user.email}: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def send_sms_notification(notification):
    """Send notification via SMS"""
    user = notification.user
    
    try:
        # In real implementation, this would use an SMS service API like Twilio
        logger.info(f"Would send SMS to {user.phone_number}: {notification.title}")
        
        # Simulate successful sending
        return True
        
    except Exception as e:
        logger.error(f"Failed to send SMS notification to {user.phone_number}: {str(e)}")
        return False


def send_push_notification(notification):
    """Send notification via push notification service"""
    user = notification.user
    
    try:
        # In real implementation, this would use a push notification service like Firebase
        logger.info(f"Would send push notification to user {user.id}: {notification.title}")
        
        # Simulate successful sending
        return True
        
    except Exception as e:
        logger.error(f"Failed to send push notification to user {user.id}: {str(e)}")
        return False


@shared_task
def send_upcoming_draw_reminders():
    """
    Celery task to send reminders about upcoming draws
    """
    from lottery.models import Draw, Ticket
    
    try:
        logger.info("Starting to send upcoming draw reminders")
        
        now = timezone.now()
        
        # Find draws happening in the next 24 hours
        upcoming_draws = Draw.objects.filter(
            status='scheduled',
            draw_date__gt=now,
            draw_date__lt=now + timezone.timedelta(hours=24)
        ).select_related('lottery')
        
        notification_count = 0
        
        for draw in upcoming_draws:
            try:
                # Get users who have purchased tickets for this draw
                ticket_users = User.objects.filter(
                    tickets__draw=draw,
                    email_notifications=True
                ).distinct()
                
                for user in ticket_users:
                    # Check if reminder already sent
                    reminder_exists = Notification.objects.filter(
                        user=user,
                        notification_type='draw_upcoming',
                        related_object_id=draw.id,
                        related_object_type='draw',
                        created_at__gte=now - timezone.timedelta(hours=24)
                    ).exists()
                    
                    if not reminder_exists:
                        # Create reminder notification
                        notification = Notification.objects.create(
                            user=user,
                            notification_type='draw_upcoming',
                            title=f"Draw reminder for {draw.lottery.name}",
                            message=f"The draw #{draw.draw_number} for {draw.lottery.name} is happening soon at {draw.draw_date.strftime('%Y-%m-%d %H:%M')}. Check your tickets and good luck!",
                            priority='medium',
                            related_object_id=draw.id,
                            related_object_type='draw',
                            data={
                                'draw_id': draw.id,
                                'draw_number': draw.draw_number,
                                'lottery_name': draw.lottery.name,
                                'draw_date': draw.draw_date.isoformat(),
                                'jackpot_amount': str(draw.jackpot_amount),
                                'ticket_count': Ticket.objects.filter(user=user, draw=draw).count()
                            }
                        )
                        
                        notification_count += 1
                
                logger.info(f"Created {notification_count} draw reminders for draw #{draw.draw_number}")
                
            except Exception as e:
                logger.error(f"Error creating reminders for draw {draw.id}: {str(e)}")
        
        logger.info(f"Completed sending upcoming draw reminders: {notification_count} notifications created")
        return {'created': notification_count}
    except Exception as e:
        logger.error(f"Error in send_upcoming_draw_reminders task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


@shared_task
def clean_old_notifications():
    """
    Celery task to clean up old read notifications to keep the database size manageable
    """
    try:
        logger.info("Starting to clean old notifications")
        
        # Delete notifications that are read and older than 90 days
        ninety_days_ago = timezone.now() - timezone.timedelta(days=90)
        
        # Count notifications to delete
        old_count = Notification.objects.filter(
            is_read=True,
            read_at__lt=ninety_days_ago
        ).count()
        
        # Delete them
        deleted_count = Notification.objects.filter(
            is_read=True,
            read_at__lt=ninety_days_ago
        ).delete()[0]
        
        # Delete unread notifications older than 180 days
        one_eighty_days_ago = timezone.now() - timezone.timedelta(days=180)
        deleted_unread_count = Notification.objects.filter(
            is_read=False,
            created_at__lt=one_eighty_days_ago
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} read and {deleted_unread_count} unread old notifications")
        return {'deleted_read': deleted_count, 'deleted_unread': deleted_unread_count}
    except Exception as e:
        logger.error(f"Error in clean_old_notifications task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


@shared_task
def create_win_notifications():
    """
    Celery task to create notifications for winning tickets
    """
    from lottery.models import WinningTicket
    
    try:
        logger.info("Starting to create winning notifications")
        
        # Find winning tickets that don't have notifications yet
        winning_tickets = WinningTicket.objects.filter(
            status='paid'
        ).select_related('ticket', 'draw', 'prize_category', 'transaction')
        
        notification_count = 0
        
        for winning in winning_tickets:
            try:
                # Check if notification already exists
                notification_exists = Notification.objects.filter(
                    user=winning.ticket.user,
                    notification_type='winning',
                    related_object_id=winning.id,
                    related_object_type='winning_ticket'
                ).exists()
                
                if not notification_exists:
                    # Create win notification
                    notification = Notification.objects.create(
                        user=winning.ticket.user,
                        notification_type='winning',
                        title=f"Congratulations! You won {winning.amount}",
                        message=f"Your ticket #{winning.ticket.ticket_number} for {winning.draw.lottery.name} draw #{winning.draw.draw_number} has won {winning.amount}. Your winnings have been credited to your account.",
                        priority='high',
                        related_object_id=winning.id,
                        related_object_type='winning_ticket',
                        data={
                            'winning_id': winning.id,
                            'ticket_number': winning.ticket.ticket_number,
                            'draw_number': winning.draw.draw_number,
                            'lottery_name': winning.draw.lottery.name,
                            'amount': str(winning.amount),
                            'prize_category': winning.prize_category.name if winning.prize_category else 'Prize',
                            'transaction_id': str(winning.transaction.transaction_id) if winning.transaction else None
                        }
                    )
                    
                    notification_count += 1
            
            except Exception as e:
                logger.error(f"Error creating notification for winning {winning.id}: {str(e)}")
        
        logger.info(f"Created {notification_count} winning notifications")
        return {'created': notification_count}
    except Exception as e:
        logger.error(f"Error in create_win_notifications task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


@shared_task
def create_payment_notifications():
    """
    Celery task to create notifications for payment events
    """
    from payments.models import Transaction, DepositTransaction, WithdrawalRequest
    from django.db.models import Q
    
    try:
        logger.info("Starting to create payment notifications")
        
        # Find recent deposits that completed or failed
        recent_time = timezone.now() - timezone.timedelta(hours=24)
        deposits = DepositTransaction.objects.filter(
            Q(transaction__status='completed') | Q(transaction__status='failed'),
            updated_at__gte=recent_time
        ).select_related('transaction', 'user')
        
        # Find recent withdrawals that were processed or failed
        withdrawals = WithdrawalRequest.objects.filter(
            Q(status='completed') | Q(status='failed'),
            updated_at__gte=recent_time
        ).select_related('transaction', 'user')
        
        notification_count = 0
        
        # Process deposit notifications
        for deposit in deposits:
            try:
                # Check if notification already exists
                notification_exists = Notification.objects.filter(
                    user=deposit.user,
                    notification_type=f"deposit_{'success' if deposit.transaction.status == 'completed' else 'failed'}",
                    related_object_id=deposit.id,
                    related_object_type='deposit'
                ).exists()
                
                if not notification_exists:
                    # Determine notification type
                    notification_type = 'deposit_success' if deposit.transaction.status == 'completed' else 'deposit_failed'
                    
                    # Create notification
                    notification = Notification.objects.create(
                        user=deposit.user,
                        notification_type=notification_type,
                        title=f"Deposit {'Successful' if deposit.transaction.status == 'completed' else 'Failed'}",
                        message=f"Your deposit of {deposit.amount} has been {'successfully completed' if deposit.transaction.status == 'completed' else 'failed'}.",
                        priority='medium',
                        related_object_id=deposit.id,
                        related_object_type='deposit',
                        data={
                            'deposit_id': deposit.id,
                            'amount': str(deposit.amount),
                            'status': deposit.transaction.status,
                            'transaction_id': str(deposit.transaction.transaction_id),
                            'provider': deposit.payment_provider.name if deposit.payment_provider else 'Unknown'
                        }
                    )
                    
                    notification_count += 1
            
            except Exception as e:
                logger.error(f"Error creating notification for deposit {deposit.id}: {str(e)}")
        
        # Process withdrawal notifications
        for withdrawal in withdrawals:
            try:
                # Check if notification already exists
                notification_exists = Notification.objects.filter(
                    user=withdrawal.user,
                    notification_type=f"withdrawal_{'processed' if withdrawal.status == 'completed' else 'failed'}",
                    related_object_id=withdrawal.id,
                    related_object_type='withdrawal'
                ).exists()
                
                if not notification_exists:
                    # Determine notification type
                    notification_type = 'withdrawal_processed' if withdrawal.status == 'completed' else 'withdrawal_failed'
                    
                    # Create notification
                    notification = Notification.objects.create(
                        user=withdrawal.user,
                        notification_type=notification_type,
                        title=f"Withdrawal {'Processed' if withdrawal.status == 'completed' else 'Failed'}",
                        message=f"Your withdrawal request of {withdrawal.amount} has been {'successfully processed' if withdrawal.status == 'completed' else 'failed'}.",
                        priority='medium',
                        related_object_id=withdrawal.id,
                        related_object_type='withdrawal',
                        data={
                            'withdrawal_id': withdrawal.id,
                            'amount': str(withdrawal.amount),
                            'status': withdrawal.status,
                            'transaction_id': str(withdrawal.transaction.transaction_id) if withdrawal.transaction else None,
                            'payment_method': withdrawal.payment_method.method_type if withdrawal.payment_method else 'Unknown',
                            'rejection_reason': withdrawal.rejection_reason if withdrawal.rejection_reason else None
                        }
                    )
                    
                    notification_count += 1
            
            except Exception as e:
                logger.error(f"Error creating notification for withdrawal {withdrawal.id}: {str(e)}")
        
        logger.info(f"Created {notification_count} payment notifications")
        return {'created': notification_count}
    except Exception as e:
        logger.error(f"Error in create_payment_notifications task: {str(e)}")
        logger.error(traceback.format_exc())
        return False