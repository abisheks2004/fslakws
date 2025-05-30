const express = require('express');
const passport = require('passport');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const authRouter = express.Router();

// Google OAuth Config
passport.use(new GoogleStrategy({
 clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  // You can store user info here
  return done(null, profile);
}));

// Serialize user (for session)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes
authRouter.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: '/dashboard'  // Redirect after login
  })
);

module.exports = authRouter;
