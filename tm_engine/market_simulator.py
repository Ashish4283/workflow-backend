import random
import datetime

class MarketSimulator:
    def __init__(self, start_price=72450):
        self.price = start_price
        self.volatility = 0.0005  # Base drift
        self.trend = 0
        self.burst_mode = False
        self.burst_counter = 0

    def next_tick(self):
        # Random Brownian motion
        change = self.price * (random.random() - 0.5 + self.trend) * self.volatility
        
        # Randomly trigger a momentum burst (The Breakout)
        if not self.burst_mode and random.random() < 0.01:
            self.burst_mode = True
            self.burst_counter = 20 + int(random.random() * 30)
            self.trend = 0.02 if random.random() > 0.5 else -0.02  # Strong bias

        if self.burst_mode:
            change *= 5  # Accelerate move
            self.burst_counter -= 1
            if self.burst_counter <= 0:
                self.burst_mode = False
                self.trend = 0

        self.price += change
        return {
            "price": self.price,
            "time": datetime.datetime.now().isoformat(),
            "isBurst": self.burst_mode
        }
