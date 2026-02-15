const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const prisma = require('../models');
const otpService = require('../services/otp');
const emailService = require('../services/email');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { otpLimiter } = require('../middleware/rateLimit');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

/**
 * POST /api/auth/otp/send
 * Send OTP to phone number
 */
router.post('/otp/send', otpLimiter, validate(schemas.sendOtp), async (req, res, next) => {
  try {
    const { phone } = req.body;
    const formattedPhone = otpService.formatPhone(phone);

    // Generate OTP
    const code = otpService.generateCode(6);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: { phone: formattedPhone, used: false },
      data: { used: true },
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: {
        phone: formattedPhone,
        code,
        userId: existingUser?.id,
        purpose: existingUser ? 'login' : 'register',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    // Send OTP via SMS
    await otpService.sendOtp(phone, code);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      isNewUser: !existingUser,
      phone: formattedPhone.slice(0, -4).replace(/\d/g, '*') + formattedPhone.slice(-4),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP and return JWT token
 */
router.post('/otp/verify', validate(schemas.verifyOtp), async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    const formattedPhone = otpService.formatPhone(phone);

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: formattedPhone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
      include: { seller: true },
    });

    if (user) {
      // Existing user - generate token
      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiry,
      });

      return res.json({
        success: true,
        token,
        user: sanitizeUser(user),
        isNewUser: false,
      });
    }

    // New user - return temp token for registration
    const tempToken = jwt.sign(
      { phone: formattedPhone, verified: true },
      config.jwt.secret,
      { expiresIn: '30m' }
    );

    res.json({
      success: true,
      tempToken,
      isNewUser: true,
      message: 'Phone verified. Please complete registration.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Complete registration for new user
 */
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { tempToken, firstName, lastName, email, accountType, state, city } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwt.secret);
    } catch {
      return res.status(400).json({ error: 'Registration session expired. Please verify your phone again.' });
    }

    if (!decoded.verified) {
      return res.status(400).json({ error: 'Phone not verified' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { phone: decoded.phone } });
    if (existing) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: decoded.phone,
        firstName,
        lastName,
        email: email || null,
        accountType: accountType || 'INDIVIDUAL',
        role: 'BUYER',
        state,
        city,
        isVerified: true,
      },
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { seller: true },
  });

  res.json({ user: sanitizeUser(user) });
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, email, state, city, address, avatar } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(state && { state }),
        ...(city && { city }),
        ...(address && { address }),
        ...(avatar && { avatar }),
      },
      include: { seller: true },
    });

    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/fcm-token
 * Update FCM token for push notifications
 */
router.put('/fcm-token', authenticate, async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/email/register
 * Register with email and password (sends verification code)
 */
router.post('/email/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, accountType, state, city } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = otpService.generateCode(6);

    // Invalidate previous email OTPs
    await prisma.otpCode.updateMany({
      where: { phone: email, used: false },
      data: { used: true },
    });

    // Save OTP (using phone field to store email)
    await prisma.otpCode.create({
      data: {
        phone: email,
        code,
        purpose: 'email_verify',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send verification email
    await emailService.sendVerificationCode(email, code);

    // Create temp token with registration data
    const tempToken = jwt.sign(
      { email, passwordHash, firstName, lastName, accountType: accountType || 'INDIVIDUAL', state: state || null, city: city || null, purpose: 'email_register' },
      config.jwt.secret,
      { expiresIn: '30m' }
    );

    res.json({
      success: true,
      tempToken,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/email/verify
 * Verify email OTP and complete registration
 */
router.post('/email/verify', async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Token and verification code are required' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwt.secret);
    } catch {
      return res.status(400).json({ error: 'Verification session expired. Please register again.' });
    }

    if (decoded.purpose !== 'email_register') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: decoded.email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Check if email was taken while verifying
    const existingCheck = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (existingCheck) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: decoded.email,
        passwordHash: decoded.passwordHash,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        accountType: decoded.accountType,
        role: 'BUYER',
        state: decoded.state,
        city: decoded.city,
        isVerified: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/email/resend
 * Resend email verification code
 */
router.post('/email/resend', async (req, res, next) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ error: 'Token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, config.jwt.secret);
    } catch {
      return res.status(400).json({ error: 'Session expired. Please register again.' });
    }

    if (decoded.purpose !== 'email_register') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const code = otpService.generateCode(6);

    // Invalidate previous
    await prisma.otpCode.updateMany({
      where: { phone: decoded.email, used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: {
        phone: decoded.email,
        code,
        purpose: 'email_verify',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await emailService.sendVerificationCode(decoded.email, code);

    res.json({ success: true, message: 'Verification code resent' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/email/login
 * Login with email and password
 */
router.post('/email/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { seller: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/google
 * Login/register with Google OAuth
 * Accepts either { idToken } or { accessToken }
 */
router.post('/google', async (req, res, next) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    let payload;
    try {
      if (idToken) {
        // Verify ID token directly
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        // Verify access token via Google userinfo API
        const fetch = (await import('node-fetch')).default;
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!userInfoRes.ok) throw new Error('Invalid access token');
        const userInfo = await userInfoRes.json();
        payload = {
          sub: userInfo.sub,
          email: userInfo.email,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
        };
      }
    } catch {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Find user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          ...(email ? [{ email }] : []),
        ],
      },
      include: { seller: true },
    });

    if (user) {
      // Link googleId if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          include: { seller: true },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          googleId,
          email: email || null,
          firstName: given_name || 'User',
          lastName: family_name || '',
          avatar: picture || null,
          role: 'BUYER',
          accountType: 'INDIVIDUAL',
          isVerified: true,
        },
        include: { seller: true },
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000,
    });
  } catch (error) {
    next(error);
  }
});


/**
 * POST /api/auth/email/forgot-password
 * Send password reset code to email
 */
router.post('/email/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If an account with this email exists, a reset code has been sent' });
    }

    const code = otpService.generateCode(6);

    // Invalidate previous reset OTPs
    await prisma.otpCode.updateMany({
      where: { phone: email, purpose: 'password_reset', used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: {
        phone: email,
        code,
        purpose: 'password_reset',
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await emailService.sendVerificationCode(email, code);

    res.json({ success: true, message: 'If an account with this email exists, a reset code has been sent' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/email/reset-password
 * Verify reset code and set new password
 */
router.post('/email/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: email,
        code,
        purpose: 'password_reset',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/change-password
 * Change password for logged-in user
 */
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // If user has an existing password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Helper: Remove sensitive fields from user object
function sanitizeUser(user) {
  if (!user) return null;
  const { otpCodes, passwordHash, googleId, ...safeUser } = user;
  return safeUser;
}

module.exports = router;
