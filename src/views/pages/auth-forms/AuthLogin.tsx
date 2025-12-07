import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import { useAuth } from 'contexts/AuthContext';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// ===============================|| JWT - LOGIN ||=============================== //

export default function AuthLogin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginFounder, isLoading, error, clearError } = useAuth();

  // Get the page user was trying to access (saved by ProtectedRoute)
  // Default to founder dashboard which will redirect to onboarding if needed
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/founder/dashboard';

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    clearError();

    // Validate email/username
    if (!email.trim()) {
      setEmailError('Email or username is required');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await loginFounder(email, password);
    
    if (success) {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('founder_remember', 'true');
      } else {
        localStorage.removeItem('founder_remember');
      }

      // Redirect to the page user was trying to access, or default dashboard
      navigate(from, { replace: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Email/Username Field */}
      <FormControl 
        fullWidth 
        error={!!emailError}
        sx={{ ...theme.typography.customInput }}
      >
        <InputLabel htmlFor="outlined-adornment-email-login">
          Email Address / Username
        </InputLabel>
        <OutlinedInput
          id="outlined-adornment-email-login"
          type="text"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError('');
          }}
          name="email"
          disabled={isLoading}
          autoComplete="email"
          autoFocus
        />
        {emailError && (
          <FormHelperText error>{emailError}</FormHelperText>
        )}
      </FormControl>

      {/* Password Field */}
      <FormControl 
        fullWidth 
        error={!!passwordError}
        sx={{ ...theme.typography.customInput }}
      >
        <InputLabel htmlFor="outlined-adornment-password-login">
          Password
        </InputLabel>
        <OutlinedInput
          id="outlined-adornment-password-login"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError('');
          }}
          name="password"
          disabled={isLoading}
          autoComplete="current-password"
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="large"
                disabled={isLoading}
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          }
          label="Password"
        />
        {passwordError && (
          <FormHelperText error>{passwordError}</FormHelperText>
        )}
      </FormControl>

      {/* Remember Me & Forgot Password */}
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe} 
                onChange={(event) => setRememberMe(event.target.checked)} 
                name="rememberMe" 
                color="primary"
                disabled={isLoading}
              />
            }
            label="Keep me logged in"
          />
        </Grid>
        <Grid>
          <Typography 
            variant="subtitle1" 
            component={Link} 
            to="/forgot-password" 
            color="secondary" 
            sx={{ textDecoration: 'none' }}
          >
            Forgot Password?
          </Typography>
        </Grid>
      </Grid>

      {/* Submit Button */}
      <Box sx={{ mt: 2 }}>
        <AnimateButton>
          <Button 
            color="secondary" 
            fullWidth 
            size="large" 
            type="submit" 
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </AnimateButton>
      </Box>
    </form>
  );
}
