// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import type { FC } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project import
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - FONT FAMILY ||============================== //

const FontFamilyPage: FC = () => {
  const { fontFamily, onChangeFontFamily } = useConfig();

  const handleFontChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFontFamily(event.target.value);
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="h5">Font Family</Typography>
      <RadioGroup
        aria-label="font-family"
        value={fontFamily}
        onChange={handleFontChange}
        name="radio-buttons-group"
      >
        <FormControlLabel
          value="'Roboto', sans-serif"
          control={<Radio />}
          label="Roboto"
          sx={{
            '& .MuiSvgIcon-root': { fontSize: 28 },
            '& .MuiFormControlLabel-label': { color: 'grey.900' }
          }}
        />
        <FormControlLabel
          value="'Poppins', sans-serif"
          control={<Radio />}
          label="Poppins"
          sx={{
            '& .MuiSvgIcon-root': { fontSize: 28 },
            '& .MuiFormControlLabel-label': { color: 'grey.900' }
          }}
        />
        <FormControlLabel
          value="'Inter', sans-serif"
          control={<Radio />}
          label="Inter"
          sx={{
            '& .MuiSvgIcon-root': { fontSize: 28 },
            '& .MuiFormControlLabel-label': { color: 'grey.900' }
          }}
        />
      </RadioGroup>
    </Stack>
  );
};

export default FontFamilyPage;