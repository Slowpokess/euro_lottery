from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from lottery.models import Draw
import logging
import traceback
import sys

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Conducts scheduled lottery draws'

    def add_arguments(self, parser):
        parser.add_argument('--draw-id', type=int, help='ID of specific draw to conduct')
        parser.add_argument('--force', action='store_true', help='Force draw execution, even if not scheduled time')
        parser.add_argument('--dry-run', action='store_true', help='Simulate draw without saving results')

    def handle(self, *args, **options):
        draw_id = options.get('draw_id')
        force = options.get('force')
        dry_run = options.get('dry_run')
        
        try:
            if draw_id:
                # Conduct specific draw
                self.stdout.write(f"Conducting draw ID: {draw_id}")
                self._conduct_specific_draw(draw_id, force, dry_run)
            else:
                # Conduct all pending draws
                self.stdout.write("Conducting all pending draws")
                self._conduct_pending_draws(force, dry_run)
                
            self.stdout.write(self.style.SUCCESS('Draw process completed successfully'))
            
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error conducting draw: {str(e)}'))
            logger.error(f"Draw process failed: {str(e)}")
            logger.error(traceback.format_exc())
            sys.exit(1)
    
    def _conduct_specific_draw(self, draw_id, force, dry_run):
        """Conduct a specific draw by ID"""
        try:
            draw = Draw.objects.get(id=draw_id)
            
            # Check if it's time for the draw
            if not force and draw.draw_date > timezone.now():
                self.stdout.write(self.style.WARNING(
                    f"Draw #{draw.draw_number} is scheduled for {draw.draw_date}, not conducting yet"
                ))
                return
            
            # Check status
            if draw.status != 'scheduled' and not force:
                self.stdout.write(self.style.WARNING(
                    f"Draw #{draw.draw_number} has status '{draw.status}', not 'scheduled'"
                ))
                return
            
            if dry_run:
                self.stdout.write(self.style.SUCCESS(
                    f"DRY RUN: Would conduct draw #{draw.draw_number} for {draw.lottery_game.name}"
                ))
            else:
                # Conduct the draw
                draw.conduct_draw()
                self.stdout.write(self.style.SUCCESS(
                    f"Successfully conducted draw #{draw.draw_number} for {draw.lottery_game.name}"
                ))
                self.stdout.write(f"Winning numbers: {draw.winning_numbers_display}")
                self.stdout.write(f"Verification hash: {draw.verification_hash}")
        
        except Draw.DoesNotExist:
            raise CommandError(f"Draw with ID {draw_id} does not exist")
    
    def _conduct_pending_draws(self, force, dry_run):
        """Conduct all pending draws that are scheduled for now or in the past"""
        now = timezone.now()
        
        # Get draws that are scheduled and due
        pending_draws = Draw.objects.filter(
            status='scheduled',
            draw_date__lte=now
        ).order_by('draw_date')
        
        if not pending_draws.exists():
            self.stdout.write("No pending draws to conduct")
            return
        
        for draw in pending_draws:
            if dry_run:
                self.stdout.write(self.style.SUCCESS(
                    f"DRY RUN: Would conduct draw #{draw.draw_number} for {draw.lottery_game.name}"
                ))
            else:
                try:
                    # Conduct the draw
                    draw.conduct_draw()
                    self.stdout.write(self.style.SUCCESS(
                        f"Successfully conducted draw #{draw.draw_number} for {draw.lottery_game.name}"
                    ))
                    self.stdout.write(f"Winning numbers: {draw.winning_numbers_display}")
                except Exception as e:
                    self.stderr.write(self.style.ERROR(
                        f"Error conducting draw #{draw.draw_number}: {str(e)}"
                    ))
                    logger.error(f"Draw #{draw.draw_number} failed: {str(e)}")
                    logger.error(traceback.format_exc())