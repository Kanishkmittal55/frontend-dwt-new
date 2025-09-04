import PropTypes from 'prop-types';
// material-ui
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import MUIFormControl from '@mui/material/FormControl';
import type { FormControlProps } from 'types/utilities';

export default function FormControl({ 
  captionLabel, 
  formState, 
  iconPrimary, 
  iconSecondary, 
  placeholder, 
  textPrimary, 
  textSecondary 
}: FormControlProps) {
  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary ? <IconPrimary fontSize="small" sx={{ color: 'grey.700' }} /> : null;

  const IconSecondary = iconSecondary;
  const secondaryIcon = iconSecondary ? <IconSecondary fontSize="small" sx={{ color: 'grey.700' }} /> : null;

  return (
    <MUIFormControl fullWidth>
      <InputLabel htmlFor="outlined-adornment-email-login">{captionLabel}</InputLabel>
      <OutlinedInput
        id="outlined-adornment-email-login"
        type="text"
        value=""
        name="email"
        placeholder={placeholder}
        startAdornment={
          primaryIcon && (
            <InputAdornment position="start">
              {primaryIcon}
            </InputAdornment>
          )
        }
        endAdornment={
          secondaryIcon && (
            <InputAdornment position="end">
              {secondaryIcon}
            </InputAdornment>
          )
        }
        label={captionLabel}
        inputProps={{}}
      />
      {textPrimary && (
        <>
          <Divider sx={{ mt: 2 }} />
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: '0.875rem', color: 'grey.700' }}>{textPrimary}</span>
            {textSecondary && (
              <span style={{ fontSize: '0.875rem', color: 'grey.500', marginLeft: 4 }}>{textSecondary}</span>
            )}
          </div>
        </>
      )}
    </MUIFormControl>
  );
}

FormControl.propTypes = {
  captionLabel: PropTypes.string,
  formState: PropTypes.string,
  iconPrimary: PropTypes.any,
  iconSecondary: PropTypes.any,
  placeholder: PropTypes.string,
  textPrimary: PropTypes.string,
  textSecondary: PropTypes.string
};