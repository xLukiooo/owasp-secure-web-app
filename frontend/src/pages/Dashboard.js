import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Button,
  IconButton,
  Fab
} from '@mui/material';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getCategories
} from '../api/expenses';
import { getExpenseSummary } from '../api/summary';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

// Schemat walidacji wydatku za pomocą Yup
const expenseSchema = yup.object().shape({
  category: yup
    .number()
    .required('Wybierz kategorię'),
  amount: yup
    .number()
    .typeError('Kwota musi być liczbą')
    .positive('Niepoprawna kwota')
    .required('Kwota jest wymagana')
    .test(
      'two-decimal-places',
      'Kwota może mieć maksymalnie dwie cyfry po przecinku',
      value => {
        if (value === undefined || value === null) return true;
        // Sprawdź, czy liczba ma maksymalnie dwie cyfry po przecinku
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }
    ),
  date: yup
    .date()
    .typeError('Nieprawidłowa data')
    .required('Wybierz datę')
    .test(
      'year-length',
      'Rok w dacie nie może być dłuższy niż 4 cyfry',
      value => {
        if (value === undefined || value === null) return true;
        // Sprawdź długość roku bezpośrednio z obiektu Date
        const year = value.getFullYear();
        return year.toString().length <= 4;
      }
    )
});

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState({ id: null, category: '', amount: '', date: '' });
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [cats, exp, sum] = await Promise.all([
        getCategories(),
        getExpenses(),
        getExpenseSummary()
      ]);
      setCategories(cats);
      setExpenses(exp);
      setSummary(sum);
    } catch {
      showError('Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg) => { setErrorMessage(msg); setErrorDialogOpen(true); };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      // Pozwól na wprowadzenie tylko liczb i maksymalnie dwóch miejsc po przecinku
      const regex = /^\d*\.?\d{0,2}$/;
      if (value === '' || regex.test(value)) {
        setCurrentExpense(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'date') {
      // Walidacja roku podczas wpisywania
      // Sprawdź, czy wartość jest w formacie daty (np. RRRR-MM-DD)
      // i czy rok nie przekracza 4 cyfr.
      // Dopuszczaj puste pole i częściowe wprowadzanie daty (np. '202')
      if (value === '') {
        setCurrentExpense(prev => ({ ...prev, [name]: value }));
      } else {
        const parts = value.split('-');
        if (parts.length > 0 && parts[0].length > 4) {
          // Nie aktualizuj stanu, jeśli rok jest dłuższy niż 4 cyfry
          return;
        }
        setCurrentExpense(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setCurrentExpense(prev => ({ ...prev, [name]: value }));
    }
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Ujednolicona walidacja z użyciem Yup
  const validateExpense = async () => {
    try {
      await expenseSchema.validate(currentExpense, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (validationError) {
      const errs = {};
      validationError.inner.forEach(err => {
        errs[err.path] = err.message;
      });
      setFormErrors(errs);
      return false;
    }
  };

  const saveExpense = async () => {
    if (!await validateExpense()) return;
    try {
      if (isEditMode) await updateExpense(currentExpense.id, currentExpense);
      else await createExpense(currentExpense);
      setDialogOpen(false);
      fetchAll();
    } catch { showError('Błąd zapisu'); }
  };

  const deleteExpenseConfirmed = async () => {
    setConfirmDialogOpen(false);
    try { await deleteExpense(deleteId); fetchAll(); }
    catch { showError('Błąd usuwania'); }
  };

  // Zmodyfikowana funkcja openNewDialog
  const openNewDialog = () => {
    setIsEditMode(false);
    setCurrentExpense({
      id: null,
      // Ustaw category na ID pierwszej dostępnej kategorii, jeśli lista kategorii nie jest pusta
      category: categories.length > 0 ? categories[0].id : '',
      amount: '',
      date: ''
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (exp, date) => {
    setIsEditMode(true);
    setCurrentExpense({ id: exp.id, category: exp.category, amount: exp.amount, date });
    setFormErrors({});
    setDialogOpen(true);
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : id;
  };

  const pieData = summary.map(s => ({
    id: s.category,
    label: getCategoryName(s.category),
    value: Number(s.total)
  }));

  if (loading) return <Typography align="center">Ładowanie...</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4, py: 4 }}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" onClick={async () => { await logout(); navigate('/login'); }}>
          Wyloguj
        </Button>
      </Grid>
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ flexBasis: '70%' }}>
          <Paper sx={{ p: 3 }} elevation={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Wydatki</Typography>
            </Box>
            <List>
              {expenses.map(group => (
                <Box key={group.date} sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1 }}>{group.date}</Typography>
                  <Divider sx={{ mb: 1 }} />
                  {group.expenses.map(exp => (
                    <ListItem
                      key={exp.id}
                      secondaryAction={
                        <>
                          <IconButton onClick={() => openEditDialog(exp, group.date)}><EditIcon /></IconButton>
                          <IconButton onClick={() => { setDeleteId(exp.id); setConfirmDialogOpen(true); }}><DeleteIcon /></IconButton>
                        </>
                      }
                    >
                      <ListItemText primary={`${getCategoryName(exp.category)} – ${exp.amount} zł`} />
                    </ListItem>
                  ))}
                </Box>
              ))}
            </List>
          </Paper>
        </Box>
        <Box sx={{ flexBasis: '30%' }}>
          <Paper sx={{ p: 3 }} elevation={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>Podsumowanie miesiąca</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {pieData.length === 0 ? (
                <Typography>Brak wydatków.</Typography>
              ) : (
                <PieChart
                  height={260}
                  series={[{
                    data: pieData,
                    innerRadius: 30,
                    outerRadius: 100,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    arcLabel: ({ value }) => `${value} zł`
                  }]}
                  sx={{ [`& .${pieArcLabelClasses.root}`]: { fontSize: 12 } }}
                />
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        onClick={openNewDialog}
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1400 }}
      >
        <AddIcon />
      </Fab>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Edytuj wydatek' : 'Dodaj wydatek'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl error={!!formErrors.category} sx={{ minWidth: '7rem' }} >
                <InputLabel id="cat">Kategoria</InputLabel>
                <Select
                  labelId="cat"
                  name="category"
                  value={currentExpense.category}
                  onChange={handleFieldChange}
                  label="Kategoria"
                  MenuProps={{ PaperProps: { style: { zIndex: 1500 } } }}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
                {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kwota"
                name="amount"
                type="number"
                value={currentExpense.amount}
                onChange={handleFieldChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data"
                name="date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={currentExpense.date}
                onChange={handleFieldChange}
                error={!!formErrors.date}
                helperText={formErrors.date}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Anuluj</Button>
          <Button variant="contained" onClick={saveExpense}>{isEditMode ? 'Zapisz' : 'Dodaj'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent><DialogContentText>Czy na pewno usunąć wydatek?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Anuluj</Button>
          <Button color="error" variant="contained" onClick={deleteExpenseConfirmed}>Usuń</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" /> Błąd
        </DialogTitle>
        <DialogContent><DialogContentText>{errorMessage}</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setErrorDialogOpen(false)}>OK</Button></DialogActions>
      </Dialog>
    </Container>
  );
}