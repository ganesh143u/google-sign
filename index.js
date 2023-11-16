const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const ejs = require('ejs');

const app = express();
const PORT = 3000;

// Add this line to your server code
app.use(express.static('public'));
app.use(express.static('public', { 'extensions': ['html', 'css'] }));
// Use session to track login status
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

// Replace these with your Google and Facebook OAuth credentials
//const GOOGLE_CLIENT_ID = '169550731056-09cmbes0321rtldu4ndkc0pvmb6banm0.apps.googleusercontent.com';
//const GOOGLE_CLIENT_SECRET = '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';
const FACEBOOK_APP_ID = 'your-facebook-app-id';
const FACEBOOK_APP_SECRET = 'your-facebook-app-secret';

// Configure Google OAuth
passport.use(new GoogleStrategy({
  clientID: '169550731056-09cmbes0321rtldu4ndkc0pvmb6banm0.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'https://google.com',
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=accessToken', // Added this line to get user details
  scope: ['profile', 'email'],
},
  (accessToken, refreshToken, profile, done) => {
    console.log('Google Profile:', profile);
    // Use profile information to create or update a user record
    const user = { id: profile.id, username: profile.emails[0].value,email: profile.emails[0].value, displayName: profile.displayName, };
    // Handle errors
    if (profile._json && profile._json.error) {
      console.error('Google Profile Error:', profile._json.error);
      return done(null, false, { message: 'Failed to fetch user profile.' });
    }
    return done(null, user);
  }
));

// Configure Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails'],
},
  (accessToken, refreshToken, profile, done) => {
    // Use profile information to create or update a user record
    const user = { id: profile.id, username: profile.emails[0].value };
    return done(null, user);
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Google OAuth route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Facebook OAuth route
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email'] })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Dashboard route (protected route)
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.send(`Welcome, ${req.user.displayName}!`);
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  // Render the profile.html page with user data
  res.render('profile', {
    userId: req.user.id,
    username: req.user.username,
    email: req.user.email,
    displayName: req.user.displayName,
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
