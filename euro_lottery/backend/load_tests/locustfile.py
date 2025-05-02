"""
Locust load testing script for Euro Lottery application.

To run:
1. Install locust: pip install locust
2. Run: locust -f locustfile.py
3. Open web interface at http://localhost:8089
"""

import random
import json
import uuid
from locust import HttpUser, task, between

class EuroLotteryUser(HttpUser):
    wait_time = between(1, 5)  # Wait between 1-5 seconds between tasks
    
    def on_start(self):
        """Setup before tests start - log in"""
        # Login to get JWT token
        response = self.client.post(
            "/api/users/token/",
            json={
                "email": "loadtest@example.com",
                "password": "testpassword123"
            }
        )
        
        if response.status_code == 200:
            # Set the JWT token in the headers for future requests
            token = response.json().get("access")
            self.client.headers.update({"Authorization": f"Bearer {token}"})
        else:
            # If the user doesn't exist, register and then login
            self.client.post(
                "/api/users/register/",
                json={
                    "email": "loadtest@example.com",
                    "username": f"loadtest_{uuid.uuid4().hex[:8]}",
                    "password": "testpassword123",
                    "confirm_password": "testpassword123"
                }
            )
            
            # Try login again
            response = self.client.post(
                "/api/users/token/",
                json={
                    "email": "loadtest@example.com",
                    "password": "testpassword123"
                }
            )
            
            if response.status_code == 200:
                token = response.json().get("access")
                self.client.headers.update({"Authorization": f"Bearer {token}"})
    
    @task(10)
    def view_lottery_games(self):
        """View available lottery games"""
        self.client.get("/api/lottery/games/")
    
    @task(5)
    def view_upcoming_draws(self):
        """View upcoming lottery draws"""
        self.client.get("/api/lottery/draws/upcoming/")
    
    @task(5)
    def view_draw_results(self):
        """View lottery draw results"""
        self.client.get("/api/lottery/draws/results/")
    
    @task(2)
    def view_user_tickets(self):
        """View user's tickets"""
        self.client.get("/api/lottery/tickets/")
    
    @task(1)
    def purchase_ticket(self):
        """Purchase a lottery ticket"""
        # First, get upcoming draws
        response = self.client.get("/api/lottery/draws/upcoming/")
        
        if response.status_code == 200 and response.json():
            # Get the first available draw
            draw = response.json()[0]
            draw_id = draw.get("id")
            
            # Get lottery game details to know number ranges
            lottery_game_id = draw.get("lottery_game", {}).get("id")
            lottery_response = self.client.get(f"/api/lottery/games/{lottery_game_id}/")
            
            if lottery_response.status_code == 200:
                lottery_game = lottery_response.json()
                main_count = lottery_game.get("main_numbers_count", 5)
                main_range = lottery_game.get("main_numbers_range", 50)
                extra_count = lottery_game.get("extra_numbers_count", 2)
                extra_range = lottery_game.get("extra_numbers_range", 12)
                
                # Generate random numbers for ticket
                main_numbers = sorted(random.sample(range(1, main_range + 1), main_count))
                extra_numbers = sorted(random.sample(range(1, extra_range + 1), extra_count))
                
                # Purchase ticket
                self.client.post(
                    "/api/lottery/tickets/purchase/",
                    json={
                        "draw_id": draw_id,
                        "tickets": [
                            {
                                "main_numbers": main_numbers,
                                "extra_numbers": extra_numbers
                            }
                        ]
                    }
                )
    
    @task(1)
    def check_winning_tickets(self):
        """Check if tickets have won"""
        self.client.get("/api/lottery/winnings/")
    
    @task(3)
    def view_lottery_statistics(self):
        """View lottery statistics"""
        self.client.get("/api/lottery/statistics/")
    
    @task(2)
    def view_hot_numbers(self):
        """View hot numbers"""
        # Get lottery games first
        response = self.client.get("/api/lottery/games/")
        
        if response.status_code == 200 and response.json():
            # Get hot numbers for first lottery
            lottery_id = response.json()[0].get("id")
            self.client.get(f"/api/lottery/hot-numbers/?lottery_id={lottery_id}")


class EuroLotteryAdminUser(HttpUser):
    """Admin user for testing admin-only operations"""
    wait_time = between(5, 10)  # Admin operations are less frequent
    
    def on_start(self):
        """Setup before tests start - log in as admin"""
        # Login to get JWT token
        response = self.client.post(
            "/api/users/token/",
            json={
                "email": "admin@example.com",
                "password": "adminpassword"
            }
        )
        
        if response.status_code == 200:
            # Set the JWT token in the headers for future requests
            token = response.json().get("access")
            self.client.headers.update({"Authorization": f"Bearer {token}"})
    
    @task
    def conduct_draw(self):
        """Admin task to conduct a draw"""
        # Find draws that are scheduled and ready
        response = self.client.get("/api/lottery/draws/?status=scheduled")
        
        if response.status_code == 200 and response.json():
            ready_draws = [
                draw for draw in response.json() 
                if draw.get("status") == "scheduled"
            ]
            
            if ready_draws:
                # Pick a random draw to conduct
                draw = random.choice(ready_draws)
                
                self.client.post(
                    "/api/lottery/admin/draws/conduct/",
                    json={
                        "draw_id": draw.get("id"),
                        "force": True  # We force in load testing
                    }
                )