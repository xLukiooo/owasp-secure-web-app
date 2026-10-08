import React, { useState } from 'react';
import * as yup from 'yup';
import { resetPassword } from '../api/auth';
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
import { Link as RouterLink } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const schema = yup.object().shape({
  email: yup
    .string()
    .email('Wprowadź prawidłowy adres email.')
    .required('Email jest wymagany.')
});

function ResetPassword() {
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await schema.validate({ email: resetEmail }, { abortEarly: false });
    } catch (validationError) {
      const errors = validationError.inner.map(err => err.message).join('\n');
      setMessage(errors);
      setOpenDialog(true);
      return;
    }

    try {
      await resetPassword(resetEmail);
      setMessage(`Instrukcje resetu hasła wysłane na: ${resetEmail}`);
      setOpenDialog(true);
    } catch (error) {
      setMessage(error.message || "Wystąpił błąd podczas wysyłania instrukcji resetu hasła.");
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDialogExited = () => {
    setMessage('');
  };

  const isSuccess = message.startsWith('Instrukcje resetu hasła');

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
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Reset Hasła
          </Typography>
          <Box component="form" onSubmit={handleResetPassword} noValidate>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" type="submit" fullWidth>
              Resetuj hasło
            </Button>
          </Box>
        </Paper>
        
        <Dialog open={openDialog} onClose={handleCloseDialog} onExited={handleDialogExited}>
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
    </>
  );
}

export default ResetPassword;
