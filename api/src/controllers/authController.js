const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

/**
 * Sign JWT.
 * @param {id} id - user id
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

/**
 * Create and send token via cookie + JSON response.
 */
const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // Calculate expiry (JWT_COOKIE_EXPIRES_IN is expected in hours)
  const expires = new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
  );

  // Cookie options
  const cookieOptions = {
    expires,
    httpOnly: true,
    // For production we must explicitly allow cross-site cookies:
    // - secure: true ensures cookie is only sent over HTTPS
    // - sameSite: 'none' allows cross-site sending
    // We still support dev by checking req.secure / x-forwarded-proto
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'none',
  };

  // Send cookie
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

/**
 * Signup
 */
exports.signup = asyncHandler(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    address: req.body.address,
    birthdate: req.body.birthdate,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  res.status(200).json({
    status: 'success',
    data: newUser,
  });
});

/**
 * Login
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // 1) Check if username and password exist.
  if (!username || !password) {
    return next(new AppError('Please provide a username and a password!', 400));
  }

  // 2) Check if user exists and the credentials are correct.
  const user = await User.findOne({ username: username }).select('+password');

  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError('Incorrect username or password!', 401));
  }

  // 3) Check if the user is active.
  if (!user.isActive) {
    return next(
      new AppError(
        'Your account is not activated yet! Please check your email!',
        401
      )
    );
  }

  // 4) If it is true, send token back to client.
  createAndSendToken(user, 200, req, res);
});

/**
 * Logout
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Make sure logout cookie uses same options so browser will overwrite/remove it.
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'none',
  };

  res.cookie('jwt', 'loggedOut', cookieOptions);

  res.status(200).json({
    status: 'success',
  });
});
