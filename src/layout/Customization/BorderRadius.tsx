// material-ui
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import type { FC } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project import
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - BORDER RADIUS ||============================== //

function valueText(value: number) {
  return `${value}px`;
}

const BorderRadius: FC = () => {
  const { borderRadius, onChangeBorderRadius } = useConfig();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h5">Border Radius</Typography>
      <Grid container spacing={2.5} alignItems="center">
        <Grid item>
          <Typography variant="h6" color="secondary">
            4px
          </Typography>
        </Grid>
        <Grid item xs>
          <Slider
            size="small"
            value={borderRadius}
            onChange={onChangeBorderRadius}
            getAriaValueText={valueText}
            valueLabelDisplay="on"
            aria-labelledby="discrete-slider-small-steps"
            marks
            step={2}
            min={4}
            max={24}
            color="secondary"
            sx={{
              '& .MuiSlider-valueLabel': {
                fontSize: 14,
                fontWeight: 'normal',
                top: -6,
                backgroundColor: 'unset',
                color: 'text.primary',
                '&:before': {
                  display: 'none'
                },
                '& *': {
                  background: 'transparent',
                  color: 'text.primary'
                }
              }
            }}
          />
        </Grid>
        <Grid item>
          <Typography variant="h6" color="secondary">
            24px
          </Typography>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default BorderRadius;