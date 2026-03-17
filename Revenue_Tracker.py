class Revenue_Tracker:
    def __init__(self):
        self.total_sales = 0
        self.sales_history = []

    def log_sale(self, product, price):
        self.total_sales += price
        self.sales_history.append({"product": product, "amount": price})
        return self.total_sales

# يتم استدعاؤه فور تأكيد الدفع من Stripe/PayPal
