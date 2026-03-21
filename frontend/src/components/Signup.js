import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaIdCard, FaUserTag, FaSpinner, FaMapMarkerAlt } from 'react-icons/fa';
import { Milk } from 'lucide-react';
import { motion } from 'framer-motion';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    aadhar: '',
    role: 'user',
    otp: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const { signup, sendOtp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }

    setOtpLoading(true);
    setError('');
    setSuccess('');

    const result = await sendOtp(formData.email);
    setOtpSent(true); // Show field regardless so user can enter code if they see it in console/email
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
    setOtpLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.username || !formData.email || !formData.password ||
      !formData.firstName || !formData.lastName || !formData.phone || !formData.address) {
      setError('Please fill in all required fields including address');
      setLoading(false);
      return;
    }

    if (!formData.otp) {
      setError('Please enter the OTP sent to your email');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.role === 'farmer' && !formData.aadhar) {
      setError('Aadhar number is required for farmers');
      setLoading(false);
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
      otp: formData.otp,
      ...(formData.role === 'farmer' && { aadhar: formData.aadhar })
    };

    try {
      const result = await signup(userData);

      if (result.success) {
        navigate('/dashboard');
      } else {
        const errorMsg = result.message || 'Registration failed. Please try again.';
        setError(errorMsg);
        console.error('Registration failed:', errorMsg, result);
      }
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setError('An unexpected error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <motion.div 
        className="signup-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="signup-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div 
            className="logo"
            whileHover={{ rotate: 10, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Milk className="logo-icon" size={38} color="white" />
          </motion.div>
          <h1>Create Account</h1>
          <p className="subtitle">Join Dairy Society Management System</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && (
            <motion.div 
              className="error-message"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              className="success-message"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              {success}
            </motion.div>
          )}

          <motion.div 
            className="role-selector"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <label>
              <FaUserTag className="input-icon" />
              I want to:
            </label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${formData.role === 'user' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'user', aadhar: '' })}
              >
                Buy Milk
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'farmer' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'farmer' })}
              >
                Sell Milk
              </button>
            </div>
          </motion.div>

          <div className="form-row">
            <motion.div 
              className="form-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="firstName">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
              />
            </motion.div>

            <motion.div 
              className="form-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <label htmlFor="lastName">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
              />
            </motion.div>
          </div>

          <motion.div 
            className="form-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="username">
              <FaUser className="input-icon" />
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </motion.div>

          <motion.div 
            className="form-group email-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              Email *
            </label>
            <div className="input-with-button">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={otpSent && success}
              />
              <button
                type="button"
                className="send-otp-btn"
                onClick={handleSendOtp}
                disabled={otpLoading || !formData.email}
              >
                {otpLoading ? <FaSpinner className="spinner" /> : (otpSent ? 'Resend' : 'Send OTP')}
              </button>
            </div>
          </motion.div>

          {(otpSent || formData.otp) && (
            <motion.div 
              className="form-group animate-fade-in"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <label htmlFor="otp">
                <FaLock className="input-icon" />
                Enter OTP *
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="6-digit code"
                required
                maxLength="6"
              />
            </motion.div>
          )}

          <motion.div 
            className="form-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label htmlFor="phone">
              <FaPhone className="input-icon" />
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              required
            />
          </motion.div>

          <motion.div 
            className="form-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <label htmlFor="address">
              <FaMapMarkerAlt className="input-icon" />
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your detailed address"
              required
            />
          </motion.div>

          {formData.role === 'farmer' && (
            <motion.div 
              className="form-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="aadhar">
                <FaIdCard className="input-icon" />
                Aadhar Number *
              </label>
              <input
                type="text"
                id="aadhar"
                name="aadhar"
                value={formData.aadhar}
                onChange={handleChange}
                placeholder="12-digit Aadhar number"
                required
                maxLength="12"
              />
            </motion.div>
          )}

          <motion.div 
            className="form-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <label htmlFor="password">
              <FaLock className="input-icon" />
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              minLength="6"
            />
          </motion.div>

          <motion.div 
            className="form-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <label htmlFor="confirmPassword">
              <FaLock className="input-icon" />
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
            />
          </motion.div>

          <motion.button 
            type="submit" 
            className="signup-button" 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75 }}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </motion.button>

          <motion.div 
            className="signup-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link">
                Login here
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
