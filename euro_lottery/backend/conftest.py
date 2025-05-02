import pytest
import logging
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from lottery.models import LotteryGame, Draw, PrizeCategory, Ticket
from payments.models import Transaction
from decimal import Decimal
from django.utils import timezone
import datetime

# Configure logging for tests to avoid errors
@pytest.fixture(autouse=True)
def configure_logging():
    """Configure logging for tests to prevent issues"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(name)s - %(levelname)s - %(message)s',
        force=True  # Override existing configurations
    )
    # Disable propagation for specific loggers that might cause issues
    for logger_name in ['lottery', 'django', 'django.request']:
        logger = logging.getLogger(logger_name)
        logger.propagate = False
        # Add a null handler if there are no handlers
        if not logger.handlers:
            logger.addHandler(logging.NullHandler())

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    """Create and return a test user"""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='password123'
    )
    user.balance = Decimal('100.00')
    user.save()
    return user


@pytest.fixture
def admin_user():
    """Create and return an admin user"""
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
    return admin


@pytest.fixture
def authenticated_client(api_client, user):
    """Return an authenticated API client"""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an admin-authenticated API client"""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def lottery_game():
    """Create and return a test lottery game"""
    return LotteryGame.objects.create(
        name="Test EuroMillions",
        description="A test lottery game",
        main_numbers_count=5,
        main_numbers_range=50,
        extra_numbers_count=2,
        extra_numbers_range=12,
        ticket_price=Decimal('2.50'),
        draw_days="Tuesday,Friday",
        is_active=True
    )


@pytest.fixture
def prize_categories(lottery_game):
    """Create and return prize categories for the lottery game"""
    categories = []
    
    # Jackpot category
    categories.append(PrizeCategory.objects.create(
        lottery=lottery_game,
        name="5+2",
        main_numbers=5,
        extra_numbers=2,
        odds="1:139,838,160",
        allocation_percentage=Decimal('50.00')
    ))
    
    # Second prize category
    categories.append(PrizeCategory.objects.create(
        lottery=lottery_game,
        name="5+1",
        main_numbers=5,
        extra_numbers=1,
        odds="1:6,991,908",
        allocation_percentage=Decimal('10.00')
    ))
    
    # Small prize category with fixed amount
    categories.append(PrizeCategory.objects.create(
        lottery=lottery_game,
        name="2+1",
        main_numbers=2,
        extra_numbers=1,
        odds="1:22",
        fixed_prize_amount=Decimal('8.00')
    ))
    
    return categories


@pytest.fixture
def upcoming_draw(lottery_game):
    """Create and return an upcoming draw"""
    return Draw.objects.create(
        lottery=lottery_game,
        draw_number=1,
        draw_date=timezone.now() + datetime.timedelta(days=2),
        status='scheduled',
        jackpot_amount=Decimal('1000000.00')
    )


@pytest.fixture
def tickets(user, lottery_game, upcoming_draw):
    """Create and return test tickets for the user"""
    tickets = []
    
    # Create regular ticket
    tickets.append(Ticket.objects.create(
        user=user,
        lottery=lottery_game,
        draw=upcoming_draw,
        selected_numbers="1,2,3,4,5|1,2",
        price=lottery_game.ticket_price,
        status='active'
    ))
    
    # Create another ticket with different numbers
    tickets.append(Ticket.objects.create(
        user=user,
        lottery=lottery_game,
        draw=upcoming_draw,
        selected_numbers="6,7,8,9,10|3,4",
        price=lottery_game.ticket_price,
        status='active'
    ))
    
    return tickets


@pytest.fixture
def transaction(user, lottery_game):
    """Create and return a test transaction"""
    return Transaction.objects.create(
        user=user,
        amount=lottery_game.ticket_price,
        transaction_type='ticket_purchase',
        status='completed',
        reference='TEST-TRANSACTION-123'
    )