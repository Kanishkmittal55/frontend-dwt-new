import { useState } from 'react';
import type { FormControlSelectProps } from 'types/utilities';

// material-ui
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

export default function FormControlSelect({
  captionLabel,
  currencies,
  formState,
  iconPrimary,
  iconSecondary,
  selected,
  textPrimary,
  textSecondary
}: FormControlSelectProps) {
  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary ? <IconPrimary fontSize="small" sx={{ color: 'grey.700' }} /> : null;

  const IconSecondary = iconSecondary;
  const secondaryIcon = iconSecondary ? <IconSecondary fontSize="small" sx={{ color: 'grey.700' }} /> : null;

  const errorState = formState === 'error';
  const val = selected || '';

  const [currency, setCurrency] = useState<string>(val);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event?.target.value && setCurrency(event?.target.value);
  };

  return (
    <FormControl fullWidth>
      <TextField
        id="outlined-select-currency"
        select
        fullWidth
        value={currency}
        onChange={handleChange}
        InputProps={{
          startAdornment: (
            <>
              {primaryIcon && <InputAdornment position="start">{primaryIcon}</InputAdornment>}
              {secondaryIcon && <InputAdornment position="start">{secondaryIcon}</InputAdornment>}
            </>
          )
        }}
        error={errorState}
        helperText={captionLabel}
      >
        {currencies &&
          Object.keys(currencies).map((option) => (
            <MenuItem key={option} value={option}>
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography variant="subtitle1" color="inherit">
                    {textPrimary ? textPrimary : currencies[option].label}
                  </Typography>
                </Grid>
                {currencies[option].description && (
                  <>
                    <Grid item>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {textSecondary ? textSecondary : currencies[option].description}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </MenuItem>
          ))}
      </TextField>
    </FormControl>
  );
}