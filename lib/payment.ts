export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  try {
    // In a real app, this would call your backend
    // For now, we'll simulate the response
    const response = await fetch('https://your-backend.com/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Stripe uses cents
        currency,
      }),
    })
    
    const { clientSecret } = await response.json()
    return { clientSecret }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// For demo purposes, let's create a mock payment function
export const mockPaymentIntent = (amount: number) => {
  return {
    clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
    amount: amount * 100,
    currency: 'usd'
  }
}
