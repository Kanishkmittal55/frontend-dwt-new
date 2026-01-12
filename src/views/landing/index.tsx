import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/system';

// Animations
const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3)); }
  50% { filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.6)); }
`;

const rotate = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
`;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0d0d2b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(120, 119, 198, 0.2) 0%, transparent 60%)',
        }}
      />

      {/* Orbital rings */}
      <Box
        sx={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          top: '50%',
          left: '50%',
          border: '1px solid rgba(120, 200, 255, 0.08)',
          borderRadius: '50%',
          animation: `${rotate} 80s linear infinite`,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: 'rgba(120, 200, 255, 0.9)',
            borderRadius: '50%',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 20px rgba(120, 200, 255, 0.8)',
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          top: '50%',
          left: '50%',
          border: '1px solid rgba(120, 200, 255, 0.06)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `${pulse} 4s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          top: '50%',
          left: '50%',
          border: '1px solid rgba(120, 200, 255, 0.04)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `${pulse} 4s ease-in-out infinite 1s`,
        }}
      />

      {/* Glass Card */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 10 }}>
        <Box
          sx={{
            textAlign: 'center',
            padding: { xs: 4, md: 8 },
            borderRadius: '32px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: `${glow} 4s ease-in-out infinite`,
          }}
        >
          {/* Brand Name */}
          <Typography
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              fontWeight: 700,
              letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, #fff 0%, #a8d8ff 50%, #fff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textTransform: 'uppercase',
              mb: 3,
            }}
          >
            Brainmatch
          </Typography>

          {/* Slogan */}
          <Typography
            sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'rgba(255, 255, 255, 0.85)',
              letterSpacing: '0.04em',
              lineHeight: 1.5,
              mb: 5,
            }}
          >
            What is the world talking about?
          </Typography>

          {/* Decorative line */}
          <Box
            sx={{
              width: '120px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(168, 216, 255, 0.7), transparent)',
              margin: '0 auto 40px',
            }}
          />

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard/default')}
            sx={{
              px: { xs: 4, md: 6 },
              py: 2,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35), 0 0 40px rgba(168, 216, 255, 0.2)',
              },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Explore Insights
          </Button>
        </Box>
      </Container>

      {/* Subtle grid overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default LandingPage;
