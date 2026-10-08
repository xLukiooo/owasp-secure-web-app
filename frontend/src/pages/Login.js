import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login, resendActivation, checkIsLoggedIn } from '../api/auth';
import * as yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Container,
  Paper,
  Typography,
  Link
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

const schema = yup.object().shape({
  username: yup
    .string()
    .required('Username jest wymagany.'),
  password: yup
    .string()
    .required('Hasło jest wymagane.')
});

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [openActivationModal, setOpenActivationModal] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Walidacja formularza za pomocą yup
    try {
      await schema.validate({ username, password }, { abortEarly: false });
    } catch (validationError) {
      const errors = validationError.inner.map(err => err.message).join('\n');
      setMessage(errors);
      setOpenErrorModal(true);
      return;
    }

    try {
      await login(username, password);
      const authData = await checkIsLoggedIn();
      onLoginSuccess(authData);
      if (authData.isModerator) {
        navigate('/moderator-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error && error.action === "resend_activation") {
        setOpenActivationModal(true);
        setMessage(error.error);
      } else {
        setMessage(error.error || error.message || "Błąd logowania");
        setOpenErrorModal(true);
      }
    }
  };

  const handleResendActivation = async () => {
    try {
      await resendActivation(username);
      setMessage("Nowy link aktywacyjny został wysłany.");
      setOpenActivationModal(false);
    } catch (error) {
      setMessage(error.error || error.message || "Błąd przy wysyłaniu linku aktywacyjnego");
      setOpenErrorModal(true);
    }
  };

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
            Logowanie
          </Typography>
          <form onSubmit={handleLogin} noValidate>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <TextField
              label="Hasło"
              variant="outlined"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
              Zaloguj się
            </Button>
            <Typography align="center" sx={{ mt: 2 }}>
              <Link component={RouterLink} to="/reset-password" underline="hover">
                Zapomniałeś hasła?
              </Link>
            </Typography>
          </form>
        </Paper>
        
        {/* Popup dla błędów (walidacja i inne błędy logowania) */}
        <Dialog open={openErrorModal} onClose={() => setOpenErrorModal(false)}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon sx={{ color: 'red' }} />
            Błąd
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
              {message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenErrorModal(false)}>OK</Button>
          </DialogActions>
        </Dialog>

        {/* Popup dla nieaktywnego konta */}
        <Dialog open={openActivationModal} onClose={() => setOpenActivationModal(false)}>
          <DialogTitle>Konto nieaktywne</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Twoje konto o nazwie <strong>{username}</strong> nie zostało aktywowane.
              Kliknij poniższy przycisk, aby wysłać ponownie link aktywacyjny.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenActivationModal(false)}>Anuluj</Button>
            <Button onClick={handleResendActivation}>Wyślij link</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default Login;
