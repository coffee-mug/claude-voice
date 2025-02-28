import { json } from '@sveltejs/kit';

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Handler for email subscription requests
 */
export async function POST({ request, platform }) {
  try {
    const { email } = await request.json();
    
    // Validate email
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return json({
        success: false,
        message: 'Please enter a valid email address'
      }, { status: 400 });
    }
    
    // Insert email into database
    try {
      // Check if email already exists
      const existingUser = await platform.env.DB.prepare(
        'SELECT email FROM users WHERE email = ?'
      ).bind(email.toLowerCase()).first();
      
      if (existingUser) {
        return json({
          success: true,
          message: 'You are already subscribed to the waiting list'
        });
      }
      
      // Insert new email
      await platform.env.DB.prepare(
        'INSERT INTO users (email) VALUES (?)'
      ).bind(email.toLowerCase()).run();
      
      return json({
        success: true,
        message: 'Thank you for subscribing! We will notify you when individual subscriptions launch.'
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return json({
        success: false,
        message: 'Failed to save your subscription. Please try again later.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Subscription error:', error);
    return json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    }, { status: 500 });
  }
}