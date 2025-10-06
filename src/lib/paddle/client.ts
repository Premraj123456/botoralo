import { Paddle } from 'paddle';

// This file is NOT a server action file. It is a server-side utility.
// Initialize Paddle with the correct environment setting
export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production',
});