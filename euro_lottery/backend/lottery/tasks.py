from celery import shared_task
from django.utils import timezone
from django.core.management import call_command
import logging
import traceback

logger = logging.getLogger(__name__)

@shared_task
def conduct_pending_draws():
    """
    Celery task to run all pending lottery draws
    """
    try:
        logger.info("Starting scheduled draw task")
        call_command('conduct_draw')
        logger.info("Completed scheduled draw task")
        return True
    except Exception as e:
        logger.error(f"Error in conduct_pending_draws task: {str(e)}")
        logger.error(traceback.format_exc())
        return False

@shared_task
def schedule_next_draws():
    """
    Celery task to create the next set of scheduled draws for active lotteries
    """
    from .models import LotteryGame, Draw
    
    try:
        logger.info("Scheduling next draws")
        
        # Get all active lottery games
        active_games = LotteryGame.objects.filter(is_active=True)
        now = timezone.now()
        
        for game in active_games:
            # Find the latest draw for this game
            latest_draw = Draw.objects.filter(lottery_game=game).order_by('-draw_number').first()
            
            if not latest_draw:
                # If no draws exist, create the first one
                next_draw_number = 1
                next_draw_date = _calculate_next_draw_date(game, now)
            else:
                # Schedule next draw after the latest one
                next_draw_number = latest_draw.draw_number + 1
                next_draw_date = _calculate_next_draw_date(game, latest_draw.draw_date)
            
            # Create new draw if it doesn't already exist and if it's in the future
            if not Draw.objects.filter(lottery_game=game, draw_number=next_draw_number).exists() and next_draw_date > now:
                Draw.objects.create(
                    lottery_game=game,
                    draw_number=next_draw_number,
                    draw_date=next_draw_date,
                    status='scheduled',
                    jackpot_amount=_calculate_jackpot(game, latest_draw),
                    ticket_count=0
                )
                logger.info(f"Scheduled draw #{next_draw_number} for {game.name} on {next_draw_date}")
        
        logger.info("Completed scheduling next draws")
        return True
    except Exception as e:
        logger.error(f"Error in schedule_next_draws task: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def _calculate_next_draw_date(game, reference_date):
    """
    Calculate the next draw date based on game rules and a reference date
    """
    import datetime
    from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU
    
    # Parse draw days from the game settings
    day_mapping = {
        'monday': MO, 'tuesday': TU, 'wednesday': WE, 
        'thursday': TH, 'friday': FR, 'saturday': SA, 'sunday': SU
    }
    
    draw_days = [day.strip().lower() for day in game.draw_days.split(',')]
    weekdays = [day_mapping[day] for day in draw_days if day in day_mapping]
    
    if not weekdays:
        # If no valid days, default to next week
        return reference_date + datetime.timedelta(days=7)
    
    # Find the next occurrence of any draw day after the reference date
    next_dates = []
    for weekday in weekdays:
        # Get next occurrence of this weekday
        next_date = reference_date + relativedelta(weekday=weekday(+1))
        next_dates.append(next_date)
    
    # Return the earliest date
    next_draw_date = min(next_dates)
    
    # If less than 24 hours away, move to the following week to give time for ticket sales
    if (next_draw_date - reference_date).total_seconds() < 86400:  # 24 hours in seconds
        next_dates = []
        for weekday in weekdays:
            next_date = reference_date + relativedelta(weekday=weekday(+2))
            next_dates.append(next_date)
        next_draw_date = min(next_dates)
    
    # Set the time component (default to 8:00 PM local time)
    return next_draw_date.replace(hour=20, minute=0, second=0, microsecond=0)

def _calculate_jackpot(game, previous_draw=None):
    """
    Calculate the jackpot amount for the next draw based on rules and previous draw
    """
    import decimal
    
    # Default starting jackpot
    base_jackpot = decimal.Decimal('1000000.00')
    
    if not previous_draw:
        return base_jackpot
    
    # If previous jackpot wasn't won, increase it
    jackpot_won = False
    if previous_draw.status == 'completed':
        # Check if the main prize category was won
        from .models import PrizeCategory, WinningTicket
        top_category = PrizeCategory.objects.filter(
            lottery_game=game, 
            main_numbers_matched=game.main_numbers_count,
            extra_numbers_matched=game.extra_numbers_count
        ).first()
        
        if top_category:
            jackpot_won = WinningTicket.objects.filter(
                draw=previous_draw,
                prize_category=top_category
            ).exists()
    
    if not jackpot_won:
        # Increase jackpot by 20% if not won
        return previous_draw.jackpot_amount * decimal.Decimal('1.2')
    else:
        # Reset to base jackpot if won
        return base_jackpot


@shared_task
def verify_completed_draws():
    """
    Celery task to verify completed draws that haven't been verified yet
    Это необходимо для дополнительной проверки розыгрышей и обеспечения прозрачности
    """
    from .models import Draw
    
    try:
        logger.info("Starting verification of completed draws")
        
        # Get all completed draws that haven't been verified yet
        completed_draws = Draw.objects.filter(status='completed', verification_hash__isnull=False)
        
        verified_count = 0
        failed_count = 0
        
        for draw in completed_draws:
            try:
                # Attempt to verify the draw
                if draw.verify_results():
                    verified_count += 1
                    logger.info(f"Successfully verified draw #{draw.draw_number} of {draw.lottery_game.name}")
                else:
                    failed_count += 1
                    logger.warning(f"Verification failed for draw #{draw.draw_number} of {draw.lottery_game.name}")
            except Exception as e:
                failed_count += 1
                logger.error(f"Error verifying draw #{draw.draw_number}: {str(e)}")
        
        logger.info(f"Completed verification: {verified_count} successful, {failed_count} failed")
        return {'verified': verified_count, 'failed': failed_count}
    except Exception as e:
        logger.error(f"Error in verify_completed_draws task: {str(e)}")
        logger.error(traceback.format_exc())
        return False


@shared_task
def check_ticket_winnings():
    """
    Celery task to check for winning tickets and process payouts
    """
    from .models import Draw, Ticket, WinningTicket, PrizeCategory
    from payments.models import Transaction
    from django.db import transaction
    
    try:
        logger.info("Starting check for winning tickets")
        
        # Get all completed draws where winnings haven't been fully processed
        draws = Draw.objects.filter(
            status='verified',
            winning_tickets_processed=False
        )
        
        processed_count = 0
        
        for draw in draws:
            try:
                with transaction.atomic():
                    logger.info(f"Processing winnings for draw #{draw.draw_number} of {draw.lottery_game.name}")
                    
                    # Get all tickets for this draw
                    tickets = Ticket.objects.filter(draw=draw)
                    
                    # Keep track of tickets processed
                    tickets_processed = 0
                    winning_tickets = 0
                    
                    # Get the winning numbers for this draw
                    winning_main_numbers = draw.main_numbers
                    winning_extra_numbers = draw.extra_numbers
                    
                    # Prepare prize categories for this lottery
                    prize_categories = PrizeCategory.objects.filter(
                        lottery_game=draw.lottery_game
                    ).order_by('-main_numbers_matched', '-extra_numbers_matched')
                    
                    # Check each ticket for winning combinations
                    for ticket in tickets:
                        # Skip tickets that have already been processed
                        if WinningTicket.objects.filter(ticket=ticket).exists():
                            tickets_processed += 1
                            continue
                        
                        # Check ticket numbers against winning numbers
                        ticket_main_numbers = ticket.main_numbers
                        ticket_extra_numbers = ticket.extra_numbers
                        
                        # Count matches
                        main_number_matches = len(set(ticket_main_numbers) & set(winning_main_numbers))
                        extra_number_matches = len(set(ticket_extra_numbers) & set(winning_extra_numbers))
                        
                        # Find the highest matching prize category
                        matching_category = None
                        
                        for category in prize_categories:
                            if (main_number_matches >= category.main_numbers_matched and 
                                extra_number_matches >= category.extra_numbers_matched):
                                matching_category = category
                                break
                        
                        if matching_category:
                            # Calculate the payout amount based on the prize structure
                            if matching_category.payout_type == 'fixed':
                                payout_amount = matching_category.fixed_amount
                            elif matching_category.payout_type == 'jackpot':
                                # This is a jackpot win
                                payout_amount = draw.jackpot_amount
                            else:  # percentage
                                payout_amount = draw.jackpot_amount * (matching_category.percentage / 100)
                            
                            # Create winning ticket record
                            winning_ticket = WinningTicket.objects.create(
                                ticket=ticket,
                                draw=draw,
                                prize_category=matching_category,
                                amount=payout_amount,
                                status='pending',
                                main_number_matches=main_number_matches,
                                extra_number_matches=extra_number_matches
                            )
                            
                            # Create transaction record
                            transaction = Transaction.objects.create(
                                user=ticket.user,
                                transaction_type='winning',
                                amount=payout_amount,
                                balance_before=ticket.user.balance,
                                balance_after=ticket.user.balance + payout_amount,
                                status='pending',
                                description=f"Выигрыш по билету #{ticket.ticket_number} в тираже #{draw.draw_number}",
                                related_ticket=ticket,
                                related_winning=winning_ticket
                            )
                            
                            # Mark the winning ticket with the transaction
                            winning_ticket.transaction = transaction
                            winning_ticket.save()
                            
                            winning_tickets += 1
                        
                        tickets_processed += 1
                    
                    # If all tickets processed, mark the draw
                    if tickets_processed == tickets.count():
                        draw.winning_tickets_processed = True
                        draw.save()
                        logger.info(f"All winning tickets processed for draw #{draw.draw_number}: {winning_tickets} winners")
                    
                    processed_count += 1
            
            except Exception as e:
                logger.error(f"Error processing winnings for draw #{draw.draw_number}: {str(e)}")
                logger.error(traceback.format_exc())
        
        logger.info(f"Completed checking for winning tickets: {processed_count} draws processed")
        return {'draws_processed': processed_count}
    except Exception as e:
        logger.error(f"Error in check_ticket_winnings task: {str(e)}")
        logger.error(traceback.format_exc())
        return False