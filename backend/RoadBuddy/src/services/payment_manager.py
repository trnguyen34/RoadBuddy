import stripe
from utils import handle_generic_error

stripe_keys = {
    "secret_key": (
        "sk_test_51MjBbNDiM3EAos9ofwDzdsbJk97A0HgXhnhkSaBUDaISKbxxURNFZtXWIDST7"
        "ZWDWrCb4ZihCO2eLNZWjru4VKx000b02YyMeY"
    ),
    "publishable_key": (
        "pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl5"
        "5l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy"
    ),
}
stripe.api_key = stripe_keys["secret_key"]

class PaymentManager:
    """
    PaymentManager handles Stripe payment operations.
    """

    def __init__(self, user_id):
        """
        Initialize the PaymentManager."
        """
        self.user_id = user_id

    def create_payment_sheet(self, ride_id, amount, stripe_customer_id=None):
        """
        Create a Stripe Payment Sheet for booking a ride.
        """
        try:
            amount_cents = int(float(amount) * 100)
        except ValueError:
            return {"error": "Invalid amount format."}, 400

        try:
            if not stripe_customer_id:
                customer = stripe.Customer.create(
                    description=f"Customer for user {self.user_id} (Ride: {ride_id})",
                    metadata={'user_id': self.user_id}
                )
                stripe_customer_id = customer.id

            ephemeral_key = stripe.EphemeralKey.create(
                customer=stripe_customer_id,
                stripe_version='2020-08-27'
            )

            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                customer=stripe_customer_id,
                payment_method_types=["card"],
                description="Payment for ride request"
            )

            return {
                "paymentIntent": payment_intent.client_secret,
                "ephemeralKey": ephemeral_key.secret,
                "customer": stripe_customer_id,
            }, 200

        except stripe.error.StripeError as e:
            return {
                "error": "Stripe payment processing failed.",
                "details": str(e)
            }, 500

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")
