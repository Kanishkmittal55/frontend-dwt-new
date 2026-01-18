/**
 * Founder Onboarding Wizard
 * Multi-step form for creating founder profile
 * Research-backed fields based on 50+ peer-reviewed papers
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
import ExperienceStep from './steps/ExperienceStep';
import MindsetStep from './steps/MindsetStep';
import NetworkStep from './steps/NetworkStep';
import AIStep from './steps/AIStep';
import ReviewStep from './steps/ReviewStep';

// Context
import { useFounder } from '@/contexts/FounderContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CreateFounderProfileRequest } from '@/api/founder';

// Config
import { SHOW_DEV_TOOLS } from '@/config';

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

  // Experience (Research-backed)
  prior_startup_count?: number;
  startup_experience_type?: 'none' | 'employee_late' | 'employee_early' | 'cofounder' | 'solo_founder';
  successful_exits?: number;
  management_experience_years?: number;
  largest_team_managed?: number;
  prior_employer_tier?: 'startup' | 'smb' | 'enterprise' | 'faang' | 'unknown';
  functional_areas_experienced?: string[];
  failure_count?: number;
  failure_attribution?: 'internal' | 'external' | 'mixed' | 'unknown';

  // Mindset (Research-backed)
  ese_scores?: Record<string, number>; // Entrepreneurial Self-Efficacy
  action_orientation?: number;
  grit_score?: number;
  learning_agility?: 'low' | 'medium' | 'high';
  openness_to_experience?: number;
  need_for_achievement?: number;
  decision_style?: 'causal' | 'effectual' | 'mixed';

  // Network (Research-backed)
  network_strength?: 'weak' | 'moderate' | 'strong';
  industry_network_depth?: 'none' | 'peripheral' | 'connected' | 'well_connected';
  mentor_access?: boolean;
  investor_network?: boolean;

  // Education (Research-backed)
  education_level?: 'high_school' | 'bachelors' | 'masters' | 'phd' | 'unknown';
  entrepreneurship_education?: boolean;
  technical_education?: boolean;

  // AI Capability (Practical)
  ai_tool_proficiency?: Record<string, number>;
  ai_task_dependence?: string[];
  ai_augmentation_style?: 'minimal' | 'balanced' | 'heavy';
  core_skills_without_ai?: string[];
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
  avoided_industries: [],
  // Research-backed defaults
  prior_startup_count: 0,
  startup_experience_type: 'none',
  successful_exits: 0,
  management_experience_years: 0,
  largest_team_managed: 0,
  prior_employer_tier: 'unknown',
  functional_areas_experienced: [],
  action_orientation: 5,
  grit_score: 5,
  learning_agility: 'medium',
  openness_to_experience: 5,
  need_for_achievement: 5,
  decision_style: 'mixed',
  network_strength: 'weak',
  industry_network_depth: 'none',
  mentor_access: false,
  investor_network: false,
  ai_augmentation_style: 'balanced',
  ai_task_dependence: [],
  core_skills_without_ai: []
};

// ============================================================================
// DEV ONLY: Sample data for quick testing
// ============================================================================
const SAMPLE_DATA: OnboardingData = {
  display_name: 'Test Founder',
  job_title: 'Software Engineer',
  years_experience: 5,
  industry_background: ['tech_software', 'saas', 'fintech'],
  skills: {
    'programming': 8,
    'product': 7,
    'marketing': 5,
    'sales': 4,
    'finance': 6,
    'leadership': 7,
    'design': 5
  },
  hours_per_week: 20,
  has_day_job: true,
  budget_available: 5000,
  primary_goal: 'side_income',
  target_monthly_income: 5000,
  work_style: 'solo',
  risk_tolerance: 'medium',
  preferred_industries: ['tech_software', 'saas', 'ai_ml'],
  avoided_industries: ['crypto_web3'],
  // Research-backed
  prior_startup_count: 1,
  startup_experience_type: 'cofounder',
  successful_exits: 0,
  management_experience_years: 3,
  largest_team_managed: 5,
  prior_employer_tier: 'enterprise',
  functional_areas_experienced: ['Engineering', 'Product'],
  ese_scores: { marketing: 6, innovation: 8, management: 7, risk_taking: 7, financial_control: 5 },
  action_orientation: 7,
  grit_score: 8,
  learning_agility: 'high',
  openness_to_experience: 8,
  need_for_achievement: 9,
  decision_style: 'effectual',
  network_strength: 'moderate',
  industry_network_depth: 'connected',
  mentor_access: true,
  investor_network: false,
  // AI
  ai_tool_proficiency: { chatgpt: 9, copilot: 8, cursor: 9 },
  ai_augmentation_style: 'balanced',
  ai_task_dependence: ['Writing', 'Research'],
  core_skills_without_ai: ['Coding', 'System Design', 'Architecture']
};

const STEPS = [
  { label: 'Basic Info', description: 'Tell us about yourself' },
  { label: 'Skills', description: 'Rate your skills' },
  { label: 'Constraints', description: 'Time & budget' },
  { label: 'Goals', description: 'What are you building for?' },
  { label: 'Experience', description: 'Your startup background' },
  { label: 'Mindset', description: 'Your entrepreneurial traits' },
  { label: 'Network', description: 'Your connections' },
  { label: 'AI Tools', description: 'How you use AI' },
  { label: 'Review', description: 'Confirm your profile' }
];

// ============================================================================
// Component
// ============================================================================

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { saveProfile, finishOnboarding, isProfileLoading, profileError, clearProfileError } = useFounder();

  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setValidationErrors([]);
  };

  const handleAutoPopulate = () => {
    setData(SAMPLE_DATA);
    setValidationErrors([]);
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (activeStep) {
      case 0: // Basic Info
        if (!data.display_name.trim()) errors.push('Display name is required');
        break;
      case 1: // Skills
        if (Object.keys(data.skills).length === 0) errors.push('Please rate at least one skill');
        break;
      case 2: // Constraints
        if (data.hours_per_week < 1) errors.push('Hours per week must be at least 1');
        break;
      // Steps 3-7 have defaults, minimal validation
      case 8: // Review
        if (!data.display_name.trim()) errors.push('Display name is required');
        if (Object.keys(data.skills).length === 0) errors.push('Please rate at least one skill');
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    if (!userId) {
      setSubmitError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    clearProfileError();

    try {
      const profileData: CreateFounderProfileRequest = {
        user_id: userId,
        // Core fields
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
        avoided_industries: data.avoided_industries.length > 0 ? data.avoided_industries : undefined,
        // Experience
        prior_startup_count: data.prior_startup_count,
        startup_experience_type: data.startup_experience_type,
        successful_exits: data.successful_exits,
        management_experience_years: data.management_experience_years,
        largest_team_managed: data.largest_team_managed,
        prior_employer_tier: data.prior_employer_tier,
        functional_areas_experienced: data.functional_areas_experienced,
        // Mindset
        ese_scores: data.ese_scores,
        action_orientation: data.action_orientation,
        grit_score: data.grit_score,
        learning_agility: data.learning_agility,
        openness_to_experience: data.openness_to_experience,
        need_for_achievement: data.need_for_achievement,
        decision_style: data.decision_style,
        // Network
        network_strength: data.network_strength,
        industry_network_depth: data.industry_network_depth,
        mentor_access: data.mentor_access,
        investor_network: data.investor_network,
        // AI
        ai_tool_proficiency: data.ai_tool_proficiency,
        ai_task_dependence: data.ai_task_dependence,
        ai_augmentation_style: data.ai_augmentation_style,
        core_skills_without_ai: data.core_skills_without_ai
      };

      await saveProfile(profileData);
      await finishOnboarding();
      navigate('/founder/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return <BasicInfoStep data={data} updateData={updateData} />;
      case 1: return <SkillsStep data={data} updateData={updateData} />;
      case 2: return <ConstraintsStep data={data} updateData={updateData} />;
      case 3: return <GoalsStep data={data} updateData={updateData} />;
      case 4: return <ExperienceStep data={data} updateData={updateData} />;
      case 5: return <MindsetStep data={data} updateData={updateData} />;
      case 6: return <NetworkStep data={data} updateData={updateData} />;
      case 7: return <AIStep data={data} updateData={updateData} />;
      case 8: return <ReviewStep data={data} onEdit={setActiveStep} />;
      default: return null;
    }
  };

  const isLastStep = activeStep === STEPS.length - 1;
  const error = submitError || profileError;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h3" gutterBottom align="center" color="primary">
        Welcome to Founder OS
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Let's build your research-backed founder profile for personalized ideas
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {SHOW_DEV_TOOLS && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleAutoPopulate} sx={{ fontWeight: 'bold' }}>
              🚀 Auto-Fill (Dev)
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Dev Mode:</strong> Click to auto-populate with sample data
          </Typography>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Please fix the following:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => { setSubmitError(null); clearProfileError(); }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>{STEPS[activeStep].label}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {STEPS[activeStep].description}
          </Typography>
          {renderStepContent()}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || isSubmitting}>
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
          <Button variant="contained" color="primary" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}
