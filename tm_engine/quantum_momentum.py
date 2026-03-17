import time
import math

class QuantumMomentum:
    def __init__(self, config=None):
        if config is None:
            config = {}
        
        self.config = {
            "threshold": 120,          # Breakout points
            "confirmationCandles": 2,  # Confirm move over X candles
            "timeWindow": 300,        # 5 minutes
            "trailStop": 0.15,        # 15% trailing stop for winners
        }
        self.config.update(config)

        self.history = []
        self.position = None  # { type: 'STRANGLE', entryPrice: X, legs: { ce: active, pe: active } }
        self.stats = {
            "totalTrades": 0,
            "winRate": 0,
            "asymmetryRatio": 0,
            "volatilityScore": 0
        }

    def calculate_volatility(self):
        if len(self.history) < 10:
            return 0
        prices = [h["price"] for h in self.history]
        avg = sum(prices) / len(prices)
        square_diffs = [math.pow(p - avg, 2) for p in prices]
        variance = sum(square_diffs) / len(square_diffs)
        self.stats["volatilityScore"] = (math.sqrt(variance) / avg) * 10000
        return self.stats["volatilityScore"]

    def process_price(self, price):
        now = time.time()
        self.history.append({"price": price, "time": now})

        # Maintain time window
        cutoff = now - self.config["timeWindow"]
        self.history = [h for h in self.history if h["time"] > cutoff]

        if len(self.history) < 2:
            return None

        if not self.position:
            return self.check_breakout(price)
        else:
            return self.manage_position(price)

    def check_breakout(self, current_price):
        start_price = self.history[0]["price"]
        diff = current_price - start_price

        if abs(diff) >= self.config["threshold"]:
            direction = "BULLISH" if diff > 0 else "BEARISH"
            
            # Execute Asymmetric Strangle Entry
            self.position = {
                "type": "STRANGLE",
                "entryPrice": current_price,
                "entryTime": time.time(),
                "direction": direction,
                "status": "CONFIRMING",
                "confirmedCounter": 0,
                "legs": {
                    "ce": {"status": "ACTIVE", "pnl": 0, "ltp": 100},  # Mock option prices
                    "pe": {"status": "ACTIVE", "pnl": 0, "ltp": 100}
                }
            }

            return {
                "event": "STRATEGY_SIGNAL",
                "type": "BREAKOUT_DETECTED",
                "msg": f"Breakout of {diff:.2f} pts detected! Entering Strangle...",
                "data": self.position
            }
        return None

    def manage_position(self, current_price):
        p = self.position
        move = current_price - p["entryPrice"]

        # confirmation logic (Asymmetric Exit of losing leg)
        if p["status"] == "CONFIRMING":
            p["confirmedCounter"] += 1
            
            if p["confirmedCounter"] >= self.config["confirmationCandles"]:
                p["status"] = "DIRECTIONAL_PLAY"
                
                # Exit losing leg immediately
                if move > 0:
                    p["legs"]["pe"]["status"] = "EXITED"
                    p["legs"]["pe"]["exitPrice"] = 50  # Mock loss
                    return {
                        "event": "POSITION_UPDATE",
                        "type": "ASYMMETRIC_EXIT",
                        "msg": "Bearish move failed. Terminated PE leg. Letting CE winner run!",
                        "data": p
                    }
                else:
                    p["legs"]["ce"]["status"] = "EXITED"
                    p["legs"]["ce"]["exitPrice"] = 50
                    return {
                        "event": "POSITION_UPDATE",
                        "type": "ASYMMETRIC_EXIT",
                        "msg": "Bullish move failed. Terminated CE leg. Letting PE winner run!",
                        "data": p
                    }

        # Winner Trailing Logic (simplified)
        return {
            "event": "POSITION_UPDATE",
            "type": "MARKET_MARK",
            "price": current_price,
            "pnl": self.calculate_pnl(p, current_price)
        }

    def calculate_pnl(self, pos, ltp):
        # Implementation of option pricing/pnl
        return (ltp - pos["entryPrice"]) * 50  # Simplified
