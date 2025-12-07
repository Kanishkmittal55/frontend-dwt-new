/**
 * Founder Onboarding Wizard
 * Multi-step form for creating founder profile
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// Steps
import BasicInfoStep from './steps/BasicInfoStep';
import SkillsStep from './steps/SkillsStep';
import ConstraintsStep from './steps/ConstraintsStep';
import GoalsStep from './steps/GoalsStep';
import ReviewStep from './steps/ReviewStep';

// Context
import { useFounder } from 'contexts/FounderContext';
import { useAuth } from 'contexts/AuthContext';
import type { CreateFounderProfileRequest } from 'api/founder';

// ============================================================================
// Types
// ============================================================================

export interface OnboardingData {
  // Basic Info
  display_name: string;
  job_title: string;
  years_experience: number;
  industry_background: string[];

  // Skills
  skills: Record<string, number>;

  // Constraints
  hours_per_week: number;
  has_day_job: boolean;
  budget_available: number;

  // Goals
  primary_goal: 'side_income' | 'replace_job' | 'build_empire' | 'learn_and_grow';
  target_monthly_income: number;
  work_style: 'solo' | 'small_team' | 'large_team';
  risk_tolerance: 'low' | 'medium' | 'high';
  preferred_industries: string[];
  avoided_industries: string[];
}

const INITIAL_DATA: OnboardingData = {
  display_name: '',
  job_title: '',
  years_experience: 0,
  industry_background: [],
  skills: {},
  hours_per_week: 10,
  has_day_job: true,
  budget_available: 0,
  primary_goal: 'side_income',
  target_monthly_income: 1000,
  work_style: 'solo',
  risk_tolerance: 'medium',
  preferred_industries: [],
  avoided_industries: []
};

// ============================================================================
// DEV ONLY: Sample data for quick testing (remove in production)
// ============================================================================
const SAMPLE_DATA: OnboardingData = {
  display_name: 'Test Founder',
  job_title: 'Software Engineer',
  years_experience: 5,
  industry_background: ['tech_software', 'saas', 'fintech'],
  skills: {
    'Technical Development': 8,
    'Product Management': 7,
    'Marketing': 5,
    'Sales': 4,
    'Finance': 6,
    'Leadership': 7,
    'Design': 5
  },
  hours_per_week: 20,
  has_day_job: true,
  budget_available: 5000,
  primary_goal: 'side_income',
  target_monthly_income: 5000,
  work_style: 'solo',
  risk_tolerance: 'medium',
  preferred_industries: ['tech_software', 'saas', 'ai_ml'],
  avoided_industries: ['crypto_web3']
};

// Set to false to hide auto-populate button in production
const SHOW_DEV_TOOLS = true;

const STEPS = [
  { label: 'Basic Info', description: 'Tell us about yourself' },
  { label: 'Skills', description: 'Rate your skills' },
  { label: 'Constraints', description: 'Time & budget' },
  { label: 'Goals', description: 'What are you building for?' },
  { label: 'Review', description: 'Confirm your profile' }
];

// ============================================================================
// Component
// ============================================================================

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { saveProfile, finishOnboarding, isProfileLoading, profileError, clearProfileError } = useFounder();

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Update data from a step
   */
  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setValidationErrors([]); // Clear errors when data changes
  };

  /**
   * DEV ONLY: Auto-populate with sample data
   */
  const handleAutoPopulate = () => {
    setData(SAMPLE_DATA);
    setValidationErrors([]);
  };

  /**
   * Validate current step before proceeding
   */
  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (activeStep) {
      case 0: // Basic Info
        if (!data.display_name.trim()) errors.push('Display name is required');
        if (data.years_experience < 0) errors.push('Years of experience must be positive');
        break;
      case 1: // Skills
        if (Object.keys(data.skills).length === 0) errors.push('Please rate at least one skill');
        break;
      case 2: // Constraints
        if (data.hours_per_week < 1) errors.push('Hours per week must be at least 1');
        break;
      case 3: // Goals
        // Goals have defaults, so minimal validation
        break;
      case 4: // Review - validate everything
        if (!data.display_name.trim()) errors.push('Display name is required');
        if (Object.keys(data.skills).length === 0) errors.push('Please rate at least one skill');
        if (data.hours_per_week < 1) errors.push('Hours per week must be at least 1');
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  /**
   * Go to next step (with validation)
   */
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  /**
   * Go to previous step
   */
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  /**
   * Submit the profile
   */
  const handleSubmit = async () => {
    // Validate before submitting
    if (!validateCurrentStep()) {
      return;
    }

    if (!userId) {
      setSubmitError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    clearProfileError();

    try {
      // Convert to API format
      const profileData: CreateFounderProfileRequest = {
        user_id: userId,
        display_name: data.display_name || undefined,
        job_title: data.job_title || undefined,
        years_experience: data.years_experience || undefined,
        industry_background: data.industry_background.length > 0 ? data.industry_background : undefined,
        skills: Object.keys(data.skills).length > 0 ? data.skills : undefined,
        hours_per_week: data.hours_per_week || undefined,
        has_day_job: data.has_day_job,
        budget_available: data.budget_available || undefined,
        primary_goal: data.primary_goal,
        target_monthly_income: data.target_monthly_income || undefined,
        work_style: data.work_style,
        risk_tolerance: data.risk_tolerance,
        preferred_industries: data.preferred_industries.length > 0 ? data.preferred_industries : undefined,
        avoided_industries: data.avoided_industries.length > 0 ? data.avoided_industries : undefined
      };

      // Create the profile
      await saveProfile(profileData);

      // Mark onboarding as complete
      await finishOnboarding();

      // Navigate to founder dashboard
      navigate('/founder/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create profile';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render step content
   */
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <BasicInfoStep data={data} updateData={updateData} />;
      case 1:
        return <SkillsStep data={data} updateData={updateData} />;
      case 2:
        return <ConstraintsStep data={data} updateData={updateData} />;
      case 3:
        return <GoalsStep data={data} updateData={updateData} />;
      case 4:
        return <ReviewStep data={data} onEdit={setActiveStep} />;
      default:
        return null;
    }
  };

  const isLastStep = activeStep === STEPS.length - 1;
  const error = submitError || profileError;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      {/* Header */}
      <Typography variant="h3" gutterBottom align="center" color="primary">
        Welcome to Founder OS
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Let's set up your founder profile to get personalized business ideas
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* DEV ONLY: Auto-populate button */}
      {SHOW_DEV_TOOLS && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleAutoPopulate}
              sx={{ fontWeight: 'bold' }}
            >
              🚀 Auto-Fill (Dev)
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Dev Mode:</strong> Click to auto-populate with sample data for quick testing
          </Typography>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Please fix the following:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Submit Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => {
            setSubmitError(null);
            clearProfileError();
          }}
        >
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            {STEPS[activeStep].label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {STEPS[activeStep].description}
          </Typography>

          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || isSubmitting}
        >
          Back
        </Button>

        {isLastStep ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || isProfileLoading}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}

