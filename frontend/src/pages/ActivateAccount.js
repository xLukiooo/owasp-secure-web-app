import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activateAccount } from '../api/auth';
import { Container, Paper, Typography, Box } from '@mui/material';

function ActivateAccount() {
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uid = params.get('uid');
    const token = params.get('token');

    if (uid && token) {
      activateAccount(uid, token)
        .then(data => {
          setMessage(data.message || 'Konto zostało aktywowane!');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        })
        .catch(error => {
          setMessage(error.message);
        });
    } else {
      setMessage('Brak wymaganych parametrów aktywacyjnych.');
    }
  }, [location.search, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Aktywacja konta
        </Typography>
        <Box>
          <Typography variant="body1">
            {message}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default ActivateAccount;
