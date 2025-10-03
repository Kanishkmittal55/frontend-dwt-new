// material-ui
import { useTheme } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';

// icons
import { IconChartDots3, IconNetwork } from '@tabler/icons-react';

// ==============================|| LOGO ||============================== //

export default function Logo() {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1
      }}
    >
      <IconChartDots3 
        size={24} 
        stroke={2.5}
        style={{ color: '#000000' }}
      />
      <Typography 
        variant="h2" 
        component="div"
        sx={{
          color: '#000000',
          fontWeight: 800,
          fontSize: '1.4rem',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        AUTOGRAPH
      </Typography>
    </Box>
  );
}
