class ProfitCycle:
    def __init__(self, reinvestment_rate=0.30):
        self.reinvestment_rate = reinvestment_rate # 30% for marketing/dev
        self.accumulated_reinvestment = 0.0
        self.total_profit = 0.0

    def process_sale(self, amount):
        reinvest = amount * self.reinvestment_rate
        profit = amount - reinvest
        
        self.accumulated_reinvestment += reinvest
        self.total_profit += profit
        
        return {
            "amount": amount,
            "reinvest": reinvest,
            "profit": profit
        }

    def get_stats(self):
        return {
            "total_profit": self.total_profit,
            "accumulated_reinvestment": self.accumulated_reinvestment
        }
