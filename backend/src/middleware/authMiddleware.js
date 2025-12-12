/**
 * Auth Middleware
 * 
 * Extracts the Bearer token from the Authorization header and sets req.user.
 * For development/testing, the token is used as the user's wallet address.
 */

const authMiddleware = (req, res, next) => {
  console.log(`[AUTH MIDDLEWARE] Received ${req.method} ${req.path}`);
  
  try {
    const authHeader = req.get('Authorization');
    console.log(`[AUTH] ${req.method} ${req.path} - Auth header: ${authHeader ? 'present' : 'missing'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token; allow request to continue with anonymous user
      // Controllers can decide whether to require auth
      req.user = { address: 'anonymous' };
      console.log(`[AUTH] No Bearer token, using anonymous`);
      return next();
    }

    // Extract token (for testing, we use the token value directly as the address)
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // In development/testing, the token IS the user's address/key
    req.user = {
      address: token || 'unknown',
      token,
    };
    console.log(`[AUTH] User set to: ${req.user.address}`);

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    req.user = { address: 'anonymous' };
    next();
  }
};

module.exports = authMiddleware;
