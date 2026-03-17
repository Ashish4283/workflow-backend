export class MarketSimulator {
    constructor(startPrice = 72450) {
        this.price = startPrice;
        this.volatility = 0.0005; // Base drift
        this.trend = 0;
        this.burstMode = false;
        this.burstCounter = 0;
    }

    nextTick() {
        // Random Brownian motion
        let change = this.price * (Math.random() - 0.5 + this.trend) * this.volatility;
        
        // Randomly trigger a momentum burst (The Breakout)
        if (!this.burstMode && Math.random() < 0.01) {
            this.burstMode = true;
            this.burstCounter = 20 + Math.floor(Math.random() * 30);
            this.trend = (Math.random() > 0.5 ? 0.02 : -0.02); // Strong bias
        }

        if (this.burstMode) {
            change *= 5; // Accelerate move
            this.burstCounter--;
            if (this.burstCounter <= 0) {
                this.burstMode = false;
                this.trend = 0;
            }
        }

        this.price += change;
        return {
            price: this.price,
            time: new Date().toISOString(),
            isBurst: this.burstMode
        };
    }
}
