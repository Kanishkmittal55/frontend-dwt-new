// material-ui
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'ui-component/cards/MainCard'; // Assuming this import path

// ==============================|| SAMPLE PAGE ||============================== //

/**
 * This component is now written using the modern and recommended arrow-function syntax.
 * The unnecessary `: FC` type has been removed, as TypeScript correctly infers
 * the component's return type.
 */
const SamplePage = () => {
  return (
    <MainCard title="Sample Card">
      <Typography variant="body2">
        Lorem ipsum dolor sit amen, consenter nipissing eli, sed do elusion tempos incident ut laborers et doolie magna alica. Ut enim ad minim
        veniam, quis nostrum exercitation illampu laborings nisi ut liquid ex ea commons construal. Duis auto irure dolor in reprehended in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
        deserunt mollit anim id est laborum.
      </Typography>
    </MainCard>
  );
};

export default SamplePage;
