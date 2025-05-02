from rest_framework import serializers
from .models import (
    LotteryGame, Draw, Ticket, PrizeCategory, 
    DrawResult, WinningTicket, SavedNumberCombination
)


class LotteryGameSerializer(serializers.ModelSerializer):
    """Сериализатор для лотерейных игр"""
    class Meta:
        model = LotteryGame
        fields = ('id', 'name', 'description', 'main_numbers_count', 'main_numbers_range',
                  'extra_numbers_count', 'extra_numbers_range', 'ticket_price', 
                  'is_active', 'image')


class PrizeCategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий призов"""
    class Meta:
        model = PrizeCategory
        fields = ('id', 'name', 'main_numbers_matched', 'extra_numbers_matched',
                  'prize_type', 'fixed_amount', 'percentage_of_pool')


class DrawSerializer(serializers.ModelSerializer):
    """Сериализатор для розыгрышей"""
    lottery_game = LotteryGameSerializer(read_only=True)
    lottery_game_id = serializers.PrimaryKeyRelatedField(
        queryset=LotteryGame.objects.all(),
        write_only=True,
        source='lottery_game'
    )
    
    class Meta:
        model = Draw
        fields = ('id', 'lottery_game', 'lottery_game_id', 'draw_number', 'draw_date',
                  'main_numbers', 'extra_numbers', 'status', 'jackpot_amount',
                  'created_at', 'updated_at', 'verification_hash', 'is_completed',
                  'is_open_for_tickets')
        read_only_fields = ('id', 'created_at', 'updated_at', 'verification_hash',
                           'is_completed', 'is_open_for_tickets')


class TicketSerializer(serializers.ModelSerializer):
    """Сериализатор для лотерейных билетов"""
    draw_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = ('id', 'ticket_id', 'user', 'draw', 'draw_info', 'main_numbers',
                  'extra_numbers', 'is_quick_pick', 'purchase_date', 'price',
                  'result_status', 'matched_main_numbers', 'matched_extra_numbers',
                  'winning_amount')
        read_only_fields = ('id', 'ticket_id', 'user', 'purchase_date', 'price',
                           'result_status', 'matched_main_numbers', 'matched_extra_numbers',
                           'winning_amount')
    
    def get_draw_info(self, obj):
        return {
            'draw_number': obj.draw.draw_number,
            'draw_date': obj.draw.draw_date,
            'lottery_game': obj.draw.lottery_game.name,
            'status': obj.draw.status
        }


class PurchaseTicketSerializer(serializers.Serializer):
    """Сериализатор для покупки билетов"""
    draw_id = serializers.IntegerField(required=True)
    tickets = serializers.ListField(
        child=serializers.DictField(
            child=serializers.ListField(),
            allow_empty=False
        ),
        allow_empty=False
    )
    use_quick_pick = serializers.BooleanField(default=False)
    saved_combination_id = serializers.IntegerField(required=False)
    
    def validate_draw_id(self, value):
        try:
            draw = Draw.objects.get(pk=value)
            if not draw.is_open_for_tickets:
                raise serializers.ValidationError("This draw is no longer open for ticket purchases")
            return value
        except Draw.DoesNotExist:
            raise serializers.ValidationError("Invalid draw ID")
    
    def validate(self, data):
        # Если используется quick pick или сохраненная комбинация, то tickets можно не передавать
        if data.get('use_quick_pick') or data.get('saved_combination_id'):
            return data
        
        # Иначе проверяем корректность формата билетов
        draw = Draw.objects.get(pk=data['draw_id'])
        lottery_game = draw.lottery_game
        
        for ticket in data['tickets']:
            if 'main_numbers' not in ticket or 'extra_numbers' not in ticket:
                raise serializers.ValidationError("Each ticket must have main_numbers and extra_numbers")
            
            main_numbers = ticket['main_numbers']
            extra_numbers = ticket['extra_numbers']
            
            # Проверка количества выбранных чисел
            if len(main_numbers) != lottery_game.main_numbers_count:
                raise serializers.ValidationError(f"You must select exactly {lottery_game.main_numbers_count} main numbers")
            
            if len(extra_numbers) != lottery_game.extra_numbers_count:
                raise serializers.ValidationError(f"You must select exactly {lottery_game.extra_numbers_count} extra numbers")
            
            # Проверка диапазона чисел
            for num in main_numbers:
                if not (1 <= num <= lottery_game.main_numbers_range):
                    raise serializers.ValidationError(f"Main numbers must be between 1 and {lottery_game.main_numbers_range}")
            
            for num in extra_numbers:
                if not (1 <= num <= lottery_game.extra_numbers_range):
                    raise serializers.ValidationError(f"Extra numbers must be between 1 and {lottery_game.extra_numbers_range}")
            
            # Проверка на дубликаты
            if len(set(main_numbers)) != len(main_numbers):
                raise serializers.ValidationError("Main numbers must be unique")
            
            if len(set(extra_numbers)) != len(extra_numbers):
                raise serializers.ValidationError("Extra numbers must be unique")
        
        return data


class DrawResultSerializer(serializers.ModelSerializer):
    """Сериализатор для результатов розыгрыша"""
    prize_category = PrizeCategorySerializer(read_only=True)
    
    class Meta:
        model = DrawResult
        fields = ('id', 'draw', 'prize_category', 'winners_count', 'prize_amount')


class WinningTicketSerializer(serializers.ModelSerializer):
    """Сериализатор для выигрышных билетов"""
    ticket = TicketSerializer(read_only=True)
    prize_category = PrizeCategorySerializer(read_only=True)
    
    class Meta:
        model = WinningTicket
        fields = ('id', 'ticket', 'prize_category', 'amount', 'payment_status', 
                  'payment_date', 'created_at', 'updated_at')


class SavedNumberCombinationSerializer(serializers.ModelSerializer):
    """Сериализатор для сохраненных комбинаций чисел"""
    class Meta:
        model = SavedNumberCombination
        fields = ('id', 'user', 'lottery_game', 'name', 'main_numbers', 
                  'extra_numbers', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
    
    def validate(self, data):
        lottery_game = data['lottery_game']
        main_numbers = data['main_numbers']
        extra_numbers = data['extra_numbers']
        
        # Проверка количества чисел
        if len(main_numbers) != lottery_game.main_numbers_count:
            raise serializers.ValidationError(f"You must select exactly {lottery_game.main_numbers_count} main numbers")
        
        if len(extra_numbers) != lottery_game.extra_numbers_count:
            raise serializers.ValidationError(f"You must select exactly {lottery_game.extra_numbers_count} extra numbers")
        
        # Проверка диапазона чисел
        for num in main_numbers:
            if not (1 <= num <= lottery_game.main_numbers_range):
                raise serializers.ValidationError(f"Main numbers must be between 1 and {lottery_game.main_numbers_range}")
        
        for num in extra_numbers:
            if not (1 <= num <= lottery_game.extra_numbers_range):
                raise serializers.ValidationError(f"Extra numbers must be between 1 and {lottery_game.extra_numbers_range}")
        
        # Проверка на дубликаты
        if len(set(main_numbers)) != len(main_numbers):
            raise serializers.ValidationError("Main numbers must be unique")
        
        if len(set(extra_numbers)) != len(extra_numbers):
            raise serializers.ValidationError("Extra numbers must be unique")
        
        return data


class LotteryStatisticsSerializer(serializers.Serializer):
    """Сериализатор для статистики лотереи"""
    most_frequent_main_numbers = serializers.ListField(child=serializers.DictField())
    most_frequent_extra_numbers = serializers.ListField(child=serializers.DictField())
    least_frequent_main_numbers = serializers.ListField(child=serializers.DictField())
    least_frequent_extra_numbers = serializers.ListField(child=serializers.DictField())
    jackpot_history = serializers.ListField(child=serializers.DictField())
    total_winners = serializers.IntegerField()
    total_prize_amount = serializers.DecimalField(max_digits=14, decimal_places=2)