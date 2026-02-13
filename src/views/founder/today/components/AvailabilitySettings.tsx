/**
 * AvailabilitySettings Component
 * Let founder adjust work hours, sleep time, and review preferences
 */
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

// Icons
import WorkIcon from '@mui/icons-material/Work';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';

// ============================================================================
// Types
// ============================================================================

export interface AvailabilityProfile {
  workDays: string[];
  workStart: string;   // "09:00"
  workEnd: string;     // "17:00"
  sleepStart: string;  // "22:00"
  sleepEnd: string;    // "07:00"
  timezone: string;
  preferredReviewDurationMins: number;
  maxReviewsPerDay: number;
}

interface AvailabilitySettingsProps {
  profile?: AvailabilityProfile;
  onSave?: (profile: AvailabilityProfile) => void;
  loading?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DAYS_OF_WEEK = [
  { id: 'sunday', label: 'Sun' },
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' }
];

const COMMON_TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney'
];

const DEFAULT_PROFILE: AvailabilityProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  workStart: '09:00',
  workEnd: '17:00',
  sleepStart: '22:00',
  sleepEnd: '07:00',
  timezone: 'America/Los_Angeles',
  preferredReviewDurationMins: 10,
  maxReviewsPerDay: 20
};

// ============================================================================
// Component
// ============================================================================

export default function AvailabilitySettings({
  profile = DEFAULT_PROFILE,
  onSave,
  loading = false
}: AvailabilitySettingsProps) {
  // Local state
  const [localProfile, setLocalProfile] = useState<AvailabilityProfile>(profile);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update local profile
  const updateProfile = useCallback((updates: Partial<AvailabilityProfile>) => {
    setLocalProfile(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Toggle work day
  const toggleWorkDay = useCallback((day: string) => {
    setLocalProfile(prev => {
      const workDays = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day];
      return { ...prev, workDays };
    });
    setHasChanges(true);
  }, []);

  // Save
  const handleSave = useCallback(() => {
    onSave?.(localProfile);
    setHasChanges(false);
    setShowSuccess(true);
  }, [localProfile, onSave]);

  // Reset
  const handleReset = useCallback(() => {
    setLocalProfile(profile);
    setHasChanges(false);
  }, [profile]);

  return (
    <>
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Availability Settings
            </Typography>
          </Stack>

          <Stack spacing={4}>
            {/* Work Schedule Section */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <WorkIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={500}>
                  Work Schedule
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Reviews won't be scheduled during your work hours on work days.
              </Typography>

              {/* Work days */}
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Work Days</FormLabel>
                <FormGroup row>
                  {DAYS_OF_WEEK.map(day => (
                    <FormControlLabel
                      key={day.id}
                      control={
                        <Checkbox
                          checked={localProfile.workDays.includes(day.id)}
                          onChange={() => toggleWorkDay(day.id)}
                          size="small"
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Work hours */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Work Start"
                  type="time"
                  value={localProfile.workStart}
                  onChange={(e) => updateProfile({ workStart: e.target.value })}
                  size="small"
                  sx={{ width: 150 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Work End"
                  type="time"
                  value={localProfile.workEnd}
                  onChange={(e) => updateProfile({ workEnd: e.target.value })}
                  size="small"
                  sx={{ width: 150 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Sleep Schedule Section */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <NightsStayIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={500}>
                  Sleep Schedule
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Reviews are never scheduled during your sleep hours.
              </Typography>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Sleep Start"
                  type="time"
                  value={localProfile.sleepStart}
                  onChange={(e) => updateProfile({ sleepStart: e.target.value })}
                  size="small"
                  sx={{ width: 150 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Wake Up"
                  type="time"
                  value={localProfile.sleepEnd}
                  onChange={(e) => updateProfile({ sleepEnd: e.target.value })}
                  size="small"
                  sx={{ width: 150 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Review Preferences Section */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={500}>
                  Review Preferences
                </Typography>
              </Stack>

              {/* Timezone */}
              <FormControl size="small" sx={{ mb: 3, minWidth: 250 }}>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={localProfile.timezone}
                  label="Timezone"
                  onChange={(e) => updateProfile({ timezone: e.target.value })}
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <MenuItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Review duration */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Preferred Review Duration: {localProfile.preferredReviewDurationMins} minutes
                </Typography>
                <Slider
                  value={localProfile.preferredReviewDurationMins}
                  onChange={(_, value) => updateProfile({ preferredReviewDurationMins: value as number })}
                  min={5}
                  max={30}
                  step={5}
                  marks={[
                    { value: 5, label: '5m' },
                    { value: 10, label: '10m' },
                    { value: 15, label: '15m' },
                    { value: 20, label: '20m' },
                    { value: 30, label: '30m' }
                  ]}
                  sx={{ maxWidth: 300 }}
                />
              </Box>

              {/* Max reviews per day */}
              <Box>
                <Typography variant="body2" gutterBottom>
                  Max Reviews Per Day: {localProfile.maxReviewsPerDay}
                </Typography>
                <Slider
                  value={localProfile.maxReviewsPerDay}
                  onChange={(_, value) => updateProfile({ maxReviewsPerDay: value as number })}
                  min={5}
                  max={50}
                  step={5}
                  marks={[
                    { value: 5, label: '5' },
                    { value: 20, label: '20' },
                    { value: 35, label: '35' },
                    { value: 50, label: '50' }
                  ]}
                  sx={{ maxWidth: 300 }}
                />
              </Box>
            </Box>

            <Divider />

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={!hasChanges || loading}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges || loading}
              >
                Save Changes
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Success notification */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Availability settings saved!
        </Alert>
      </Snackbar>
    </>
  );
}

















