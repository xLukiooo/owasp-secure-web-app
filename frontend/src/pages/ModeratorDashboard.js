import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  getModeratorUsers,
  getModeratorUser,
  deleteModeratorUser
} from '../api/moderator';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ModeratorDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getModeratorUsers();
      setUsers(data);
    } catch {
      setErrorMsg('Błąd podczas pobierania listy użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (id) => {
    try {
      const data = await getModeratorUser(id);
      setSelectedUser(data);
    } catch {
      setErrorMsg('Błąd podczas pobierania szczegółów użytkownika');
    }
  };

  const handleDelete = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmOpen(false);
    try {
      await deleteModeratorUser(toDeleteId);
      setUsers(prev => prev.filter(u => u.id !== toDeleteId));
      if (selectedUser?.id === toDeleteId) {
        setSelectedUser(null);
      }
    } catch {
      setErrorMsg('Błąd podczas usuwania użytkownika');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      setErrorMsg('Błąd podczas wylogowywania');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 6 }}>
      {/* Nagłówek */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Panel Moderatora</Typography>
        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Wyloguj
        </Button>
      </Box>

      {/* Główna zawartość: flex 60% / 40% */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          gap: 4,
          alignItems: 'stretch'
        }}
      >
        {/* Panel Użytkownicy – 60% */}
        <Box
          sx={{
            flex: '0 0 60%',   // nie rośnie, nie kurczy – zawsze 60%
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 3,
              flex: 1,
              overflowY: 'auto'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>Użytkownicy</Typography>
            <Divider sx={{ mb: 2 }} />

            {users.length === 0 ? (
              <Typography>Brak użytkowników</Typography>
            ) : (
              <List disablePadding>
                {users.map(user => (
                  <ListItem
                    key={user.id}
                    button
                    onClick={() => handleUserClick(user.id)}
                    selected={selectedUser?.id === user.id}
                    sx={{
                      '&.Mui-selected': { bgcolor: 'action.selected' },
                      px: 2,
                      py: 1.5
                    }}
                  >
                    <ListItemText
                      primary={`${user.first_name} ${user.last_name}`}
                      secondary={user.username}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Panel Szczegóły – 40% */}
        <Box
          sx={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Szczegóły użytkownika</Typography>
              <Divider sx={{ mb: 2 }} />

              {selectedUser ? (
                <>
                  <Typography><strong>Imię:</strong> {selectedUser.first_name}</Typography>
                  <Typography><strong>Nazwisko:</strong> {selectedUser.last_name}</Typography>
                  <Typography><strong>Username:</strong> {selectedUser.username}</Typography>
                  <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
                </>
              ) : (
                <Typography>Wybierz użytkownika z listy, aby zobaczyć szczegóły.</Typography>
              )}
            </Box>

            {selectedUser && (
              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(selectedUser.id)}
                >
                  Usuń użytkownika
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Czy na pewno chcesz usunąć tego użytkownika?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Anuluj</Button>
          <Button color="error" onClick={confirmDelete}>Usuń</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar z błędem */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={6000}
        onClose={() => setErrorMsg('')}
      >
        <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
