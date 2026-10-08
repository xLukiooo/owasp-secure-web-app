import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, Stack } from '@mui/material';

function Home() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Fin Track
        </Typography>
        <Typography variant="h6" component="p">
          Zarządzaj swoim budżetem w sposób nowoczesny i intuicyjny.
        </Typography>
      </Box>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="contained" component={RouterLink} to="/login">
          Zaloguj
        </Button>
        <Button variant="outlined" component={RouterLink} to="/register">
          Rejestruj
        </Button>
      </Stack>
    </Container>
  );
}

export default Home;
