// material-ui
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import type { FC } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function valueText(value) {
  return `${value}px`;
}

const BorderRadius: FC = () => {
  const { borderRadius, onChangeBorderRadius } = useConfig();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h5">Border Radius</Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item>
          <Typography variant="h6">4px</Typography>
        </Grid>
        <Grid item xs>
          <Slider
            size="small"
            value={borderRadius}
            onChange={onChangeBorderRadius}
            getAriaValueText={valueText}
            valueLabelDisplay="on"
            valueLabelFormat={valueText}
            min={4}
            max={24}
          />
        </Grid>
        <Grid item>
          <Typography variant="h6">24px</Typography>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default BorderRadius;