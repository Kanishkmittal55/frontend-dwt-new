import type { FC } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import MainCard from 'ui-component/cards/MainCard';
import SecondaryAction from 'ui-component/cards/CardSecondaryAction';

// ==============================|| TYPOGRAPHY ||============================== //

const Typography: FC = () => {
  return (
    <MainCard title="Basic Typography" secondary={<SecondaryAction link="https://next.material-ui.com/system/typography/" />}>
      <Grid container spacing={2}>
        {/* Your grid content here */}
      </Grid>
    </MainCard>
  );
};

export default Typography;