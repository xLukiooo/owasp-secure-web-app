import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmResetPassword } from '../api/auth';
import * as yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const schema = yup.object().shape({
  newPassword: yup
    .string()
    .required('Hasło jest wymagane.')
    .min(8, 'Hasło jest za krótkie. Musi zawierać przynajmniej 8 znaków.')
    .matches(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę.')
    .matches(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę.')
    .matches(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę.')
    .matches(/[!@#$%^&*()_+]/, 'Hasło musi zawierać przynajmniej jeden znak specjalny: !@#$%^&*()_+'),
  newPassword2: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Hasła muszą się zgadzać.')
    .required('Potwierdzenie hasła jest wymagane.')
});

function ResetPasswordConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    setToken(t || '');
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await schema.validate({ newPassword, newPassword2 }, { abortEarly: false });
    } catch (validationError) {
      const errors = validationError.inner.map(err => err.message).join('\n');
      setMessage(errors);
      setOpenDialog(true);
      return;
    }

    if (!token) {
      setMessage('Brak tokenu w adresie!');
      setOpenDialog(true);
      return;
    }

    try {
      await confirmResetPassword(token, newPassword);
      setMessage('Hasło zostało zmienione. Możesz się teraz zalogować.');
      setOpenDialog(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage(error.message || 'Błąd przy zmianie hasła.');
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMessage('');
  };

  const isSuccess = message.startsWith('Hasło zostało zmienione');

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Ustaw nowe hasło
        </Typography>
        {!token && (
          <Typography variant="body1" sx={{ color: 'red', textAlign: 'center' }}>
            Brak tokenu w adresie!
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <TextField
            label="Nowe hasło"
            variant="outlined"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Powtórz nowe hasło"
            variant="outlined"
            type="password"
            fullWidth
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" type="submit" fullWidth>
            Zapisz nowe hasło
          </Button>
        </Box>
      </Paper>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
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
          <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
            {message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>OK</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ResetPasswordConfirm;
