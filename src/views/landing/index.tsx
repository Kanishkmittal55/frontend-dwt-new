import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
              mb: 4,
              opacity: 0.9,
            }}
          >
            Welcome to Apiopener
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard/default')}
            sx={{
              mt: 3,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              backgroundColor: 'white',
              color: '#667eea',
              '&:hover': {
                backgroundColor: '#f0f0f0',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Knowledge Graphs
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;

