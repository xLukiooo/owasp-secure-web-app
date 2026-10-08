import React, { useState } from 'react';
import * as yup from 'yup';
import { register } from '../api/auth';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const schema = yup.object().shape({
  firstName: yup.string().required('Imię jest wymagane.'),
  lastName: yup.string().required('Nazwisko jest wymagane.'),
  username: yup.string().required('Username jest wymagany.'),
  email: yup
    .string()
    .email('Wprowadź prawidłowy adres email.')
    .required('Email jest wymagany.'),
  password: yup
    .string()
    .required('Hasło jest wymagane.')
    .min(8, 'Hasło jest za krótkie. Musi zawierać przynajmniej 8 znaków.')
    .matches(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę.')
    .matches(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę.')
    .matches(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę.')
    .matches(/[!@#$%^&*()_+]/, 'Hasło musi zawierać przynajmniej jeden znak specjalny: !@#$%^&*()_+'),
  password2: yup.string()
    .oneOf([yup.ref('password'), null], 'Hasła muszą się zgadzać.')
    .required('Potwierdzenie hasła jest wymagane.')
});

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');

  const handleCloseDialog = () => {
    setMessage('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await schema.validate(
        { firstName, lastName, username, email, password, password2 },
        { abortEarly: false }
      );
    } catch (validationError) {
      const errors = validationError.inner
        .map(err => err.message)
        .join('\n'); // oddzielanie nową linią
      setMessage(errors);
      return;
    }

    try {
      const result = await register(username, email, firstName, lastName, password, password2);
      setMessage(`Rejestracja udana!\nWitaj, ${result.username}`); // nowa linia między zdaniami
    } catch (error) {
      setMessage("Błąd rejestracji: " + error.message);
    }
  };

  const isSuccess = message.startsWith("Rejestracja udana");

  return (
    <>
      {/* Napis FinTrack w lewym górnym rogu strony */}
      <Typography
        variant="h6"
        component={RouterLink}
        to="/"
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          textDecoration: 'none',
          color: 'inherit',
          fontWeight: 'bold',
          zIndex: 1300
        }}
      >
        FinTrack
      </Typography>
      
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Rejestracja
          </Typography>
          <Box component="form" onSubmit={handleRegister} noValidate>
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Imię"
                  variant="outlined"
                  fullWidth
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nazwisko"
                  variant="outlined"
                  fullWidth
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  variant="outlined"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Hasło"
                  variant="outlined"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Potwierdź hasło"
                  variant="outlined"
                  type="password"
                  fullWidth
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  required
                />
              </Grid>
            </Grid>
            <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 3 }}>
              Zarejestruj się
            </Button>
          </Box>
          <Typography align="center" sx={{ mt: 2 }}>
            Masz już konto?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Zaloguj się
            </Link>
          </Typography>
        </Paper>
        <Dialog open={Boolean(message)} onClose={handleCloseDialog}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSuccess ? (
              <>
                <CheckCircleIcon sx={{ color: 'green' }} />
                Sukces
              </>
            ) : (
              <>
                <ErrorIcon sx={{ color: 'red' }} />
                Błąd
              </>
            )}
          </DialogTitle>
          <DialogContent>
            <DialogContentText
              sx={{ fontSize: '1rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}
            >
              {message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default Register;
