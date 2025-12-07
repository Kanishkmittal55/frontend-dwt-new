import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import { register, type RegisterRequest } from 'api/founder/authAPI';
import { RegisterRequestSchema } from 'api/founder/schemas';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// ===========================|| JWT - REGISTER ||=========================== //

/**
 * Calculate password strength (0-100)
 */
function calculatePasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 6) strength += 20;
  if (password.length >= 8) strength += 10;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
  
  return Math.min(100, strength);
}

/**
 * Get password strength label and color
 */
function getPasswordStrengthInfo(strength: number): { label: string; color: 'error' | 'warning' | 'success' } {
  if (strength < 40) return { label: 'Weak', color: 'error' };
  if (strength < 70) return { label: 'Medium', color: 'warning' };
  return { label: 'Strong', color: 'success' };
}

export default function AuthRegister() {
  const theme = useTheme();
  const navigate = useNavigate();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength
  const passwordStrength = calculatePasswordStrength(password);
  const strengthInfo = getPasswordStrengthInfo(passwordStrength);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  /**
   * Clear a specific error when field changes
   */
  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  /**
   * Validate form using Zod schema
   */
  const validateForm = (): boolean => {
    const result = RegisterRequestSchema.safeParse({
      email,
      username,
      password,
      first_name: firstName,
      last_name: lastName
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    // Additional validation
    if (!agreedToTerms) {
      setErrors({ terms: 'You must agree to the terms and conditions' });
      return false;
    }

    setErrors({});
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData: RegisterRequest = {
        email,
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        consent_date: new Date().toISOString()
      };

      await register(userData);
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Registration Successful!
        </Typography>
        <Typography variant="body2">
          Your account has been created. Redirecting to login...
        </Typography>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Header */}
      <Grid container direction="column" spacing={2} sx={{ justifyContent: 'center' }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'center' }} size={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Sign up with Email address</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Name Fields */}
      <Grid container spacing={{ xs: 0, sm: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="First Name"
            margin="normal"
            name="firstName"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError('first_name');
            }}
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={isLoading}
            sx={{ ...theme.typography.customInput }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Last Name"
            margin="normal"
            name="lastName"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearFieldError('last_name');
            }}
            error={!!errors.last_name}
            helperText={errors.last_name}
            disabled={isLoading}
            sx={{ ...theme.typography.customInput }}
          />
        </Grid>
      </Grid>

      {/* Username Field */}
      <TextField
        fullWidth
        label="Username"
        margin="normal"
        name="username"
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          clearFieldError('username');
        }}
        error={!!errors.username}
        helperText={errors.username || 'Choose a unique username'}
        disabled={isLoading}
        sx={{ ...theme.typography.customInput }}
      />

      {/* Email Field */}
      <FormControl 
        fullWidth 
        error={!!errors.email}
        sx={{ ...theme.typography.customInput }}
      >
        <InputLabel htmlFor="outlined-adornment-email-register">
          Email Address
        </InputLabel>
        <OutlinedInput 
          id="outlined-adornment-email-register" 
          type="email" 
          value={email} 
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          name="email"
          disabled={isLoading}
          autoComplete="email"
        />
        {errors.email && (
          <FormHelperText error>{errors.email}</FormHelperText>
        )}
      </FormControl>

      {/* Password Field */}
      <FormControl 
        fullWidth 
        error={!!errors.password}
        sx={{ ...theme.typography.customInput }}
      >
        <InputLabel htmlFor="outlined-adornment-password-register">
          Password
        </InputLabel>
        <OutlinedInput
          id="outlined-adornment-password-register"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          name="password"
          disabled={isLoading}
          autoComplete="new-password"
          label="Password"
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
        />
        {errors.password && (
          <FormHelperText error>{errors.password}</FormHelperText>
        )}
      </FormControl>

      {/* Password Strength Indicator */}
      {password && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Password Strength
            </Typography>
            <Typography variant="caption" color={`${strengthInfo.color}.main`}>
              {strengthInfo.label}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={passwordStrength} 
            color={strengthInfo.color}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {/* Terms & Conditions */}
      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Grid>
          <FormControlLabel
            control={
              <Checkbox 
                checked={agreedToTerms} 
                onChange={(event) => {
                  setAgreedToTerms(event.target.checked);
                  if (event.target.checked) clearFieldError('terms');
                }} 
                name="agreedToTerms" 
                color="primary"
                disabled={isLoading}
              />
            }
            label={
              <Typography variant="subtitle1">
                Agree with &nbsp;
                <Typography 
                  variant="subtitle1" 
                  component={Link} 
                  to="#"
                  sx={{ textDecoration: 'none' }}
                >
                  Terms & Condition.
                </Typography>
              </Typography>
            }
          />
          {errors.terms && (
            <FormHelperText error sx={{ ml: 2 }}>{errors.terms}</FormHelperText>
          )}
        </Grid>
      </Grid>

      {/* Submit Button */}
      <Box sx={{ mt: 2 }}>
        <AnimateButton>
          <Button 
            disableElevation 
            fullWidth 
            size="large" 
            type="submit" 
            variant="contained" 
            color="secondary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Creating Account...' : 'Sign up'}
          </Button>
        </AnimateButton>
      </Box>
    </form>
  );
}
