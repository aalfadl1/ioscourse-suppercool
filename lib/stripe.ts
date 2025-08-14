import { initStripe, useStripe } from '@stripe/stripe-react-native'

const STRIPE_PUBLISHABLE_KEY = 'pk_test_gwAZdo3QariNYjrpgFJHZymM' // Your actual key!

export const initializeStripe = async () => {
  await initStripe({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    merchantIdentifier: 'merchant.com.trademaster.pro',
  })
}