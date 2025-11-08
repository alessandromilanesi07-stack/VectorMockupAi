import type { OrderDetails, OrderConfirmation } from '../types';

// This is a mock function to simulate calling a Print-on-Demand API
export const placeOrder = async (details: OrderDetails): Promise<OrderConfirmation> => {
    console.log('Placing order with details:', details);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Simulate a successful API response
    if (Math.random() < 0.95) { // 95% success rate
        const orderId = `VEC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        
        return {
            orderId,
            estimatedDelivery: deliveryDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            cost: 25.99 * details.quantity,
        };
    } else {
        // Simulate an API error
        throw new Error("Impossibile connettersi al servizio di stampa. Riprova più tardi.");
    }
};
