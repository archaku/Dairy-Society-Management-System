import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Button, IconButton,
  Container, Paper, Grid, Card, CardContent, Avatar, Chip,
  TextField, InputAdornment, useTheme, useMediaQuery, Fade,
  Menu, MenuItem, Divider, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Users, UserPlus, Milk, ShoppingCart, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Calendar, Sprout, Package, Building2,
  BarChart3, LogOut, Search, Menu as MenuIcon, ChevronRight,
  TrendingUp, Award, Star, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const DRAWER_WIDTH = 260;

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [workshops, setWorkshops] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [supplementOrders, setSupplementOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [milkSearchQuery, setMilkSearchQuery] = useState('');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [modalData, setModalData] = useState({});
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    aadhar: '',
    isActive: true
  });
  const [workshopFormData, setWorkshopFormData] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    totalSlots: '',
    image: null
  });
  const [supplementFormData, setSupplementFormData] = useState({
    name: '',
    category: 'Green Fodder',
    unit: 'kg',
    pricePerUnit: '',
    description: '',
    image: null,
    inStock: true,
    targetBenefit: 'general_health'
  });
  const [milkFormData, setMilkFormData] = useState({
    farmerId: '',
    quantity: '',
    fat: '3.5',
    snf: '8.3',
    lactose: '4.5',
    protein: '3.0',
    ph: '6.6'
  });
  const [pricePreview, setPricePreview] = useState(null);
  const [qualityIndicator, setQualityIndicator] = useState(null);
  const [societyInventory, setSocietyInventory] = useState({ totalStock: 0 });
  const [orgSalesHistory, setOrgSalesHistory] = useState([]);
  const [orgSaleFormData, setOrgSaleFormData] = useState({
    organizationName: '',
    quantity: '',
    pricePerLiter: ''
  });
  const [analyticsData, setAnalyticsData] = useState({
    trends: [],
    leaderboard: [],
    stats: { totalFarmers: 0, societyAvgQuality: 0 }
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const PARAM_RANGES = {
    fat: { min: 3.5, max: 8.0, step: 0.1, label: '3.5 - 8.0' },
    snf: { min: 8.3, max: 10.5, step: 0.1, label: '≥ 8.3' },
    lactose: { min: 4.5, max: 5.0, step: 0.1, label: '4.5 - 5.0' },
    protein: { min: 3.0, max: 3.5, step: 0.1, label: '3.0 - 3.5' },
    ph: { min: 6.6, max: 6.8, step: 0.05, label: '6.6 - 6.8' }
  };

  const generateOptions = (min, max, step) => {
    const options = [];
    for (let i = min; i <= max; i = parseFloat((i + step).toFixed(2))) {
      options.push(i.toFixed(step < 0.1 ? 2 : 1));
    }
    return options;
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const fetchDataSafely = async (url) => {
        try {
          const res = await axios.get(url, config);
          return res.data;
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
          return null;
        }
      };

      const [usersData, farmersData, milkData, purchasesData, workshopsData, supplementsData, ordersData, inventoryData, historyData, analyticsRes] = await Promise.all([
        fetchDataSafely('http://localhost:5000/api/admin/users'),
        fetchDataSafely('http://localhost:5000/api/admin/farmers'),
        fetchDataSafely('http://localhost:5000/api/milk/admin/all'),
        fetchDataSafely('http://localhost:5000/api/purchase/admin/all'),
        fetchDataSafely('http://localhost:5000/api/workshops'),
        fetchDataSafely('http://localhost:5000/api/supplements'),
        fetchDataSafely('http://localhost:5000/api/supplements/orders'),
        fetchDataSafely('http://localhost:5000/api/society/inventory'),
        fetchDataSafely('http://localhost:5000/api/society/history'),
        fetchDataSafely('http://localhost:5000/api/analytics/admin')
      ]);

      if (usersData) setUsers(usersData.users || []);
      if (farmersData) setFarmers(farmersData.farmers || []);
      if (milkData) setMilkRecords(milkData.records || []);
      if (purchasesData) setPurchases(purchasesData.purchases || []);
      if (workshopsData) setWorkshops(workshopsData.workshops || []);
      if (supplementsData) setSupplements(supplementsData.supplements || []);
      if (ordersData) setSupplementOrders(ordersData.orders || []);
      if (inventoryData) setSocietyInventory(inventoryData.inventory || { totalStock: 0 });
      if (historyData) setOrgSalesHistory(historyData.history || []);
      if (analyticsRes) setAnalyticsData({
        trends: analyticsRes.trends || [],
        leaderboard: analyticsRes.leaderboard || [],
        stats: analyticsRes.stats || { totalFarmers: 0, societyAvgQuality: 0 }
      });
    } catch (error) {
      console.error('Critical fetching error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePurchase = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/purchase/admin/approve/${id}`, {}, config);
      fetchData();
    } catch (error) {
      alert('Error approving purchase');
    }
  };

  const handleCancelPurchase = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/purchase/admin/cancel/${id}`, {}, config);
      fetchData();
    } catch (error) {
      alert('Error cancelling purchase');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openAddModal = (type) => {
    setModalType('add');
    setModalData({ type });
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      aadhar: '',
      isActive: true
    });
    setShowModal(true);
  };

  const openEditModal = (item, type) => {
    setModalType('edit');
    setModalData({ ...item, type });
    setFormData({
      username: item.username,
      email: item.email,
      password: '', // Don't pre-fill password
      firstName: item.firstName,
      lastName: item.lastName,
      phone: item.phone,
      address: item.address,
      aadhar: item.aadhar || '',
      isActive: item.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const type = modalData.type;
      const url = type === 'user'
        ? (modalType === 'add' ? 'http://localhost:5000/api/admin/users' : `http://localhost:5000/api/admin/users/${modalData._id}`)
        : (modalType === 'add' ? 'http://localhost:5000/api/admin/farmers' : `http://localhost:5000/api/admin/farmers/${modalData._id}`);

      const payload = { ...formData };
      if (modalType === 'edit' && !payload.password) {
        delete payload.password; // Don't send empty password on edit
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (modalType === 'add') {
        await axios.post(url, payload, config);
      } else {
        await axios.put(url, payload, config);
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving data');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const url = type === 'user'
        ? `http://localhost:5000/api/admin/users/${id}`
        : `http://localhost:5000/api/admin/farmers/${id}`;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.delete(url, config);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting');
    }
  };

  const toggleActive = async (id, type, currentStatus) => {
    try {
      const url = type === 'user'
        ? `http://localhost:5000/api/admin/users/${id}`
        : `http://localhost:5000/api/admin/farmers/${id}`;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.put(url, { isActive: !currentStatus }, config);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const handleOrgSaleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(orgSaleFormData.quantity);
    if (qty > societyInventory.totalStock) {
      alert(`Insufficient stock! You only have ${societyInventory.totalStock.toFixed(2)}L available in society inventory. Please collect more milk first.`);
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/society/sale', orgSaleFormData, config);
      alert('Sale recorded successfully!');
      setOrgSaleFormData({ organizationName: '', quantity: '', pricePerLiter: '' });
      fetchData();
    } catch (error) {
      console.error('Society Sale Error:', error.message);
      alert(error.response?.data?.message || 'Error recording sale. Check if stock is sufficient.');
    }
  };


  const handlePayment = async (id) => {
    try {
      const record = milkRecords.find(r => r._id === id);
      if (!record) return alert('Record not found');

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Create Razorpay Order
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount: record.totalAmount,
        receipt: `receipt_payout_${id}`
      }, config);

      if (!orderRes.data.success) throw new Error('Payment initialization failed');

      const { order } = orderRes.data;

      // 2. Open Razorpay Checkout (Simulated Payout)
      const options = {
        key: 'rzp_test_SQZX6y25mriFCf',
        amount: order.amount,
        currency: order.currency,
        name: 'Dairy Society Admin',
        description: `Payment to ${record.farmer?.firstName} for Milk Delivery`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3. Verify Payment and Update Status
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, config);

            if (verifyRes.data.success) {
              await axios.put(`http://localhost:5000/api/milk/admin/pay/${id}`, {
                paymentId: response.razorpay_payment_id
              }, config);
              alert('Payment successful and status updated!');
              fetchData();
            }
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        theme: { color: '#1a5d1a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Payment failed');
    }
  };

  const handleMilkFormChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...milkFormData, [name]: value };
    setMilkFormData(newData);

    // Live price preview
    const { fat, snf, lactose, protein, ph } = newData;
    if (fat && snf && lactose && protein && ph) {
      const normalize = (val, min, max) => {
        if (val <= min) return 0;
        if (val >= max) return 1;
        return (val - min) / (max - min);
      };
      const fs = normalize(parseFloat(fat), 3.0, 10.0);
      const snfs = normalize(parseFloat(snf), 8.0, 10.5);
      const ls = normalize(parseFloat(lactose), 4.0, 5.0);
      const ps = normalize(parseFloat(protein), 3.0, 4.5);
      const phs = normalize(parseFloat(ph), 6.6, 6.8);
      const Q = (0.30 * fs) + (0.25 * snfs) + (0.15 * ls) + (0.20 * ps) + (0.10 * phs);
      setPricePreview(40 + (Q * 10));

      // Quality Impression Logic
      let impression = "Standard";
      let color = "#64748b";
      const fatVal = parseFloat(fat);
      if (fatVal >= 4.3) { impression = "Very Good Quality"; color = "#10b981"; }
      else if (fatVal >= 4.0) { impression = "Good Quality"; color = "#3b82f6"; }
      setQualityIndicator({ text: impression, color, score: Q });
    } else {
      setPricePreview(null);
      setQualityIndicator(null);
    }
  };

  const handleMilkSubmit = async (e) => {
    e.preventDefault();
    if (!milkFormData.farmerId) return alert('Please select a farmer');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/milk/record', milkFormData, config);
      alert('Milk delivery recorded successfully!');
      setMilkFormData({
        farmerId: '',
        quantity: '',
        fat: '3.5',
        snf: '8.3',
        lactose: '4.5',
        protein: '3.0',
        ph: '6.6'
      });
      setPricePreview(null);
      setActiveTab('milk');
      fetchData();
    } catch (error) {
      console.error('POST /api/milk Error:', error.message);
      alert(error.response?.data?.message || 'Error recording delivery');
    }
  };

  const handleWorkshopSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', workshopFormData.title);
    formData.append('description', workshopFormData.description);
    formData.append('date', workshopFormData.date);
    formData.append('endDate', workshopFormData.endDate);
    formData.append('location', workshopFormData.location);
    formData.append('totalSlots', workshopFormData.totalSlots);
    if (workshopFormData.image) {
      formData.append('image', workshopFormData.image);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      await axios.post('http://localhost:5000/api/workshops', formData, config);
      alert('Workshop/Seminar added successfully!');
      setWorkshopFormData({
        title: '',
        description: '',
        date: '',
        endDate: '',
        location: '',
        totalSlots: '',
        image: null
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding workshop');
    }
  };

  const handleDeleteWorkshop = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workshop?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5000/api/workshops/${id}`, config);
      fetchData();
    } catch (error) {
      alert('Error deleting workshop');
    }
  };

  const handleSupplementSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', supplementFormData.name);
    formData.append('category', supplementFormData.category);
    formData.append('unit', supplementFormData.unit);
    formData.append('pricePerUnit', supplementFormData.pricePerUnit);
    formData.append('description', supplementFormData.description);
    formData.append('targetBenefit', supplementFormData.targetBenefit);
    if (supplementFormData.image) {
      formData.append('image', supplementFormData.image);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      await axios.post('http://localhost:5000/api/supplements', formData, config);
      alert('Supplement/Fodder added successfully!');
      setSupplementFormData({
        name: '',
        category: 'Green Fodder',
        unit: 'kg',
        pricePerUnit: '',
        description: '',
        image: null,
        inStock: true,
        targetBenefit: 'general_health'
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding supplement');
    }
  };

  const handleToggleStock = async (id, currentStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/supplements/${id}/toggle-stock`, { inStock: !currentStatus }, config);
      fetchData();
    } catch (error) {
      alert('Error updating stock status');
    }
  };

  const handleDeleteSupplement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5000/api/supplements/${id}`, config);
      fetchData();
    } catch (error) {
      alert('Error deleting supplement');
    }
  };

  const handleUpdateSupplementOrderStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/supplements/orders/${id}`, { status }, config);
      fetchData();
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const sortData = (data, config) => {
    if (!config.key) return data;
    return [...data].sort((a, b) => {
      let aVal = a[config.key];
      let bVal = b[config.key];

      // Handle nested properties for farmers/users
      if (config.key === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (config.key === 'farmer') {
        aVal = `${a.farmer?.firstName} ${a.farmer?.lastName}`.toLowerCase();
        bVal = `${b.farmer?.firstName} ${b.farmer?.lastName}`.toLowerCase();
      } else if (config.key === 'user') {
        aVal = `${a.user?.firstName} ${a.user?.lastName}`.toLowerCase();
        bVal = `${b.user?.firstName} ${b.user?.lastName}`.toLowerCase();
      }

      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredUsers = sortData(users.filter(u =>
  (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ), sortConfig);

  const filteredFarmers = sortData(farmers.filter(f =>
  (f.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ), sortConfig);

  const filteredMilkRecords = sortData(milkRecords.filter(r => {
    const matchesSearch = r.farmer?.firstName?.toLowerCase().includes(milkSearchQuery.toLowerCase()) ||
      r.farmer?.lastName?.toLowerCase().includes(milkSearchQuery.toLowerCase()) ||
      r.farmer?.username?.toLowerCase().includes(milkSearchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(milkSearchQuery.toLowerCase());

    const matchesDate = !dateFilter || new Date(r.date).toISOString().split('T')[0] === dateFilter;
    return matchesSearch && matchesDate;
  }), sortConfig);

  const filteredPurchases = sortData(purchases.filter(p => {
    const matchesSearch = p.user?.firstName?.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
      p.user?.lastName?.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
      p.user?.username?.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(salesSearchQuery.toLowerCase());

    const matchesDate = !dateFilter || new Date(p.date || p.createdAt).toISOString().split('T')[0] === dateFilter;
    return matchesSearch && matchesDate;
  }), sortConfig);

  const menuItems = [
    { id: 'users', label: 'System Users', icon: <Users size={20} /> },
    { id: 'farmers', label: 'Farmers', icon: <Award size={20} /> },
    { id: 'milk', label: 'Milk Records', icon: <Milk size={20} /> },
    { id: 'sales', label: 'Customer Orders', icon: <ShoppingCart size={20} /> },
    { id: 'collect', label: 'Collect Milk', icon: <Plus size={20} /> },
    { id: 'workshops', label: 'Workshops', icon: <Calendar size={20} /> },
    { id: 'supplements', label: 'Supplements', icon: <Sprout size={20} /> },
    { id: 'society', label: 'Society Stock', icon: <Building2 size={20} /> },
    { id: 'feed-orders', label: 'Feed Orders', icon: <Package size={20} /> },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.main', color: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: 2 }}>
          <Milk color="white" size={24} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
          DSMS ADMIN
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                bgcolor: activeTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: activeTab === item.id ? 700 : 500
                }}
              />
              {activeTab === item.id && <ChevronRight size={16} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<LogOut size={18} />}
          onClick={handleLogout}
          sx={{ py: 1.5, borderRadius: 2 }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f1f5f9'
        }}
      >
        {/* Top Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {menuItems.find(i => i.id === activeTab)?.label}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  System Administrator
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 0 0 4px rgba(26, 93, 26, 0.1)'
                }}
              >
                {user?.firstName?.charAt(0)}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === 'collect' ? (
                <Box sx={{ p: { xs: 1, md: 0 } }}>
                  <Paper sx={{
                    p: { xs: 4, md: 6 },
                    borderRadius: 4,
                    width: '100%',
                    maxWidth: 1100,
                    mx: 'auto',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ mb: 5 }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
                        Record New Delivery
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                        Input milk quality parameters from the farmer's delivery
                      </Typography>
                    </Box>

                    <form onSubmit={handleMilkSubmit}>
                      <Grid container spacing={4}>
                        {/* Row 1: Farmer & Quantity */}
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Select Farmer *</Typography>
                          </Box>
                          <TextField
                            select
                            fullWidth
                            name="farmerId"
                            value={milkFormData.farmerId}
                            onChange={handleMilkFormChange}
                            required
                            SelectProps={{ native: true }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '50px',
                                bgcolor: '#f8fafc',
                                height: 64,
                                fontSize: '1.1rem',
                                px: 2,
                                '& fieldset': { borderColor: '#e2e8f0' }
                              }
                            }}
                          >
                            <option value="">-- Select Farmer --</option>
                            {farmers.filter(f => f.isActive).map(f => (
                              <option key={f._id} value={f._id}>
                                {f.firstName} {f.lastName} (@{f.username})
                              </option>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Quantity (Liters) *</Typography>
                          </Box>
                          <TextField
                            fullWidth
                            type="number"
                            name="quantity"
                            value={milkFormData.quantity}
                            onChange={handleMilkFormChange}
                            required
                            inputProps={{ step: 0.1 }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '50px',
                                bgcolor: '#f8fafc',
                                height: 64,
                                fontSize: '1.1rem',
                                px: 2,
                                '& fieldset': { borderColor: '#e2e8f0' }
                              }
                            }}
                          />
                        </Grid>

                        {/* Parameter Fields (Rows 2 & 3) */}
                        {[
                          { name: 'fat', label: 'Fat (%)' },
                          { name: 'snf', label: 'SNF (%)' },
                          { name: 'lactose', label: 'Lactose (%)' },
                          { name: 'protein', label: 'Protein (%)' },
                        ].map((field) => (
                          <Grid item xs={12} md={6} key={field.name}>
                            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {field.label} *
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', bgcolor: 'primary.light', px: 1, py: 0.2, borderRadius: 1, opacity: 0.8 }}>
                                Range: {PARAM_RANGES[field.name].label}
                              </Typography>
                            </Box>
                            <TextField
                              select
                              fullWidth
                              name={field.name}
                              value={milkFormData[field.name]}
                              onChange={handleMilkFormChange}
                              required
                              SelectProps={{ native: true }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '50px',
                                  bgcolor: '#f8fafc',
                                  height: 64,
                                  fontSize: '1.1rem',
                                  px: 2,
                                  '& fieldset': { borderColor: '#e2e8f0' }
                                }
                              }}
                            >
                              {generateOptions(PARAM_RANGES[field.name].min, PARAM_RANGES[field.name].max, PARAM_RANGES[field.name].step).map(val => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                            </TextField>
                          </Grid>
                        ))}

                        {/* Row 4: pH Level (Centered) */}
                        <Grid item xs={12} md={6} sx={{ mx: 'auto' }}>
                          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              pH Level *
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', bgcolor: 'primary.light', px: 1, py: 0.2, borderRadius: 1, opacity: 0.8 }}>
                              Range: {PARAM_RANGES.ph.label}
                            </Typography>
                          </Box>
                          <TextField
                            select
                            fullWidth
                            name="ph"
                            value={milkFormData.ph}
                            onChange={handleMilkFormChange}
                            required
                            SelectProps={{ native: true }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '50px',
                                bgcolor: '#f8fafc',
                                height: 64,
                                fontSize: '1.1rem',
                                px: 2,
                                '& fieldset': { borderColor: '#e2e8f0' }
                              }
                            }}
                          >
                            {generateOptions(PARAM_RANGES.ph.min, PARAM_RANGES.ph.max, PARAM_RANGES.ph.step).map(val => (
                              <option key={val} value={val}>{val}</option>
                            ))}
                          </TextField>
                        </Grid>

                        {/* Price Preview */}
                        {pricePreview && (
                          <Grid item xs={12}>
                            <Card variant="outlined" sx={{ bgcolor: 'rgba(26, 93, 26, 0.02)', borderColor: 'primary.main', borderStyle: 'dashed', borderRadius: 4 }}>
                              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '20px !important' }}>
                                <Box>
                                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Price Estimation</Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 800 }}>₹{pricePreview.toFixed(2)}<Typography component="span" variant="subtitle1" sx={{ ml: 1, opacity: 0.7 }}>/ liter</Typography></Typography>
                                  <Typography variant="body2" color="text.secondary">Total: Requesting ₹{(pricePreview * (milkFormData.quantity || 0)).toFixed(2)}</Typography>
                                </Box>

                                {qualityIndicator && (
                                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: `${qualityIndicator.color}15`, borderRadius: 4, border: '1px solid', borderColor: qualityIndicator.color }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      {qualityIndicator.icon}
                                      <Typography variant="h6" sx={{ color: qualityIndicator.color, fontWeight: 900 }}>{qualityIndicator.label}</Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: qualityIndicator.color, fontWeight: 700, textTransform: 'uppercase' }}>Quality Grade</Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        )}

                        {/* Row 5: Submit Button (Centered) */}
                        <Grid item xs={12} md={6} sx={{ ml: '360px', mt: '60px' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                              height: 72,
                              borderRadius: '50px',
                              fontSize: '1.4rem',
                              fontWeight: 900,
                              bgcolor: 'primary.main',
                              '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.01)' },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              textTransform: 'none',
                              boxShadow: '0 12px 30px rgba(26, 93, 26, 0.15)'
                            }}
                          >
                            Record Collection
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </Paper>
                </Box>
              ) : activeTab === 'workshops' ? (
                <Box>
                  <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Add New Workshop/Seminar</Typography>
                    <form onSubmit={handleWorkshopSubmit}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Title" value={workshopFormData.title} onChange={(e) => setWorkshopFormData({ ...workshopFormData, title: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Location" value={workshopFormData.location} onChange={(e) => setWorkshopFormData({ ...workshopFormData, location: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={workshopFormData.date} onChange={(e) => setWorkshopFormData({ ...workshopFormData, date: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={workshopFormData.endDate} onChange={(e) => setWorkshopFormData({ ...workshopFormData, endDate: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Total Slots" type="number" value={workshopFormData.totalSlots} onChange={(e) => setWorkshopFormData({ ...workshopFormData, totalSlots: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><Button variant="outlined" component="label" fullWidth sx={{ height: 56 }}>Upload Image<input type="file" hidden accept="image/*" onChange={(e) => setWorkshopFormData({ ...workshopFormData, image: e.target.files[0] })} /></Button></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description" value={workshopFormData.description} onChange={(e) => setWorkshopFormData({ ...workshopFormData, description: e.target.value })} required /></Grid>
                        <Grid item xs={12}><Button type="submit" variant="contained" size="large" sx={{ py: 1.5, px: 4, borderRadius: 2 }}>Create Workshop</Button></Grid>
                      </Grid>
                    </form>
                  </Paper>

                  <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <TableContainer>
                      <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Workshop Details</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Schedule</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Bookings</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {workshops.map(w => (
                            <TableRow key={w._id}>
                              <TableCell>
                                {w.image && <Avatar src={`http://localhost:5000${w.image}`} variant="rounded" sx={{ width: 48, height: 48 }} />}
                              </TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{w.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{w.location}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{new Date(w.date).toLocaleDateString()} - {new Date(w.endDate).toLocaleDateString()}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={`${w.bookedBy.length} / ${w.totalSlots}`} size="small" color={w.bookedBy.length >= w.totalSlots ? 'error' : 'primary'} />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton onClick={() => handleDeleteWorkshop(w._id)} color="error"><Trash2 size={18} /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
              ) : activeTab === 'supplements' ? (
                <Box>
                  <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Add New Supplement/Fodder</Typography>
                    <form onSubmit={handleSupplementSubmit}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Name" value={supplementFormData.name} onChange={(e) => setSupplementFormData({ ...supplementFormData, name: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <TextField select fullWidth label="Category" SelectProps={{ native: true }} value={supplementFormData.category} onChange={(e) => setSupplementFormData({ ...supplementFormData, category: e.target.value })}>
                            <option value="Green Fodder">Green Fodder</option>
                            <option value="Dry Fodder">Dry Fodder</option>
                            <option value="Concentrate Feed">Concentrate Feed</option>
                            <option value="Cattle Supplements">Cattle Supplements</option>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <TextField select fullWidth label="Benefit" SelectProps={{ native: true }} value={supplementFormData.targetBenefit} onChange={(e) => setSupplementFormData({ ...supplementFormData, targetBenefit: e.target.value })}>
                            <option value="general_health">General Health</option>
                            <option value="boosts_fat">Boosts Fat %</option>
                            <option value="boosts_snf">Boosts SNF %</option>
                            <option value="boosts_protein">Boosts Protein %</option>
                            <option value="boosts_lactose">Boosts Lactose %</option>
                            <option value="balances_ph">Balances pH</option>
                            <option value="increases_yield">Increases Yield</option>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Unit" placeholder="kg, bag" value={supplementFormData.unit} onChange={(e) => setSupplementFormData({ ...supplementFormData, unit: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Price / Unit" type="number" value={supplementFormData.pricePerUnit} onChange={(e) => setSupplementFormData({ ...supplementFormData, pricePerUnit: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6} md={6}><Button variant="outlined" component="label" fullWidth sx={{ height: 56 }}>Upload Image<input type="file" hidden accept="image/*" onChange={(e) => setSupplementFormData({ ...supplementFormData, image: e.target.files[0] })} /></Button></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={supplementFormData.description} onChange={(e) => setSupplementFormData({ ...supplementFormData, description: e.target.value })} required /></Grid>
                        <Grid item xs={12}><Button type="submit" variant="contained" size="large" sx={{ py: 1.5, px: 4, borderRadius: 2 }}>Add Item</Button></Grid>
                      </Grid>
                    </form>
                  </Paper>

                  <Grid container spacing={3}>
                    {supplements.map(s => (
                      <Grid item xs={12} sm={6} md={4} key={s._id}>
                        <Card sx={{ borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                          <Box sx={{ height: 160, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            {s.image ? (
                              <img src={`http://localhost:5000${s.image}`} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Sprout size={48} color={theme.palette.grey[400]} />
                            )}
                            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                              <Chip
                                label={s.inStock ? 'In Stock' : 'Out of Stock'}
                                size="small"
                                color={s.inStock ? 'success' : 'error'}
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                          </Box>
                          <CardContent>
                            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>{s.category}</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{s.name}</Typography>
                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>₹{s.pricePerUnit} <Typography component="span" variant="caption" color="text.secondary">/ {s.unit}</Typography></Typography>
                            <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                              <Button fullWidth variant="outlined" size="small" color={s.inStock ? 'error' : 'success'} onClick={() => handleToggleStock(s._id, s.inStock)}>
                                {s.inStock ? 'Stock Out' : 'Stock In'}
                              </Button>
                              <IconButton onClick={() => handleDeleteSupplement(s._id)} color="error"><Trash2 size={18} /></IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : activeTab === 'society' ? (
                <Box>
                  <Paper sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #1a5d1a 0%, #348f34 100%)', color: 'white' }}>
                    <Grid container alignItems="center">
                      <Grid item xs={12} md={7}>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>Live Society Inventory</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="h2" sx={{ fontWeight: 900 }}>{societyInventory.totalStock.toFixed(2)}</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, opacity: 0.8 }}>Liters</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 2, maxWidth: 400 }}>
                          Pool of mixed milk collected from all farmers. This can be sold in bulk to schools, organizations, or Milma.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { md: 'flex-end' }, mt: { xs: 4, md: 0 } }}>
                        <Card sx={{ width: 320, borderRadius: 3, color: 'text.primary' }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Quick Bulk Sale</Typography>
                            <form onSubmit={handleOrgSaleSubmit}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField size="small" placeholder="Organization Name" value={orgSaleFormData.organizationName} onChange={(e) => setOrgSaleFormData({ ...orgSaleFormData, organizationName: e.target.value })} required />
                                <TextField size="small" label="Quantity (L)" type="number" value={orgSaleFormData.quantity} onChange={(e) => setOrgSaleFormData({ ...orgSaleFormData, quantity: e.target.value })} required />
                                <TextField size="small" label="Rate / Liter" type="number" value={orgSaleFormData.pricePerLiter} onChange={(e) => setOrgSaleFormData({ ...orgSaleFormData, pricePerLiter: e.target.value })} required />
                                <Button type="submit" variant="contained" fullWidth>Record Sale</Button>
                              </Box>
                            </form>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Inventory Sale History</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('date')}>Date & Time</TableCell>
                            <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('organizationName')}>Recipient Organization</TableCell>
                            <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('quantity')}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('pricePerLiter')}>Rate</TableCell>
                            <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('totalAmount')}>Total Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortData(orgSalesHistory, sortConfig).map(sale => (
                            <TableRow key={sale._id}>
                              <TableCell>{formatDateTime(sale.date)}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{sale.organizationName}</TableCell>
                              <TableCell>{sale.quantity} L</TableCell>
                              <TableCell>₹{sale.pricePerLiter}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹{sale.totalAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
              ) : activeTab === 'feed-orders' ? (
                <Box>
                  <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <TableContainer>
                      <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Order Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {supplementOrders.map(order => (
                            <TableRow key={order._id}>
                              <TableCell>{formatDateTime(order.date)}</TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{order.farmer?.firstName} {order.farmer?.lastName}</Typography>
                                <Typography variant="caption" color="text.secondary">@{order.farmer?.username}</Typography>
                              </TableCell>
                              <TableCell>
                                {order.items.map((item, idx) => (
                                  <Chip key={idx} label={`${item.supplement?.name} (${item.quantity} ${item.supplement?.unit})`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                                ))}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>₹{order.totalAmount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Chip label={order.status} size="small" color={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'error'} />
                              </TableCell>
                              <TableCell align="right">
                                {order.status === 'pending' && (
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <IconButton color="success" onClick={() => handleUpdateSupplementOrderStatus(order._id, 'delivered')}><CheckCircle size={18} /></IconButton>
                                    <IconButton color="error" onClick={() => handleUpdateSupplementOrderStatus(order._id, 'cancelled')}><XCircle size={18} /></IconButton>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
              ) : (
                /* DEFAULT TABLE VIEW */
                <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {activeTab === 'users' ? 'Registered Users' :
                        activeTab === 'farmers' ? 'Dairy Farmers' :
                          activeTab === 'milk' ? 'Collection History' :
                            activeTab === 'sales' ? 'Customer Orders' :
                              menuItems.find(i => i.id === activeTab)?.label}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        size="small"
                        type="date"
                        label="Filter by Date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 180 }}
                      />
                      <TextField
                        size="small"
                        placeholder="Search records..."
                        value={activeTab === 'milk' ? milkSearchQuery : (activeTab === 'sales' ? salesSearchQuery : searchQuery)}
                        onChange={(e) => {
                          if (activeTab === 'milk') setMilkSearchQuery(e.target.value);
                          else if (activeTab === 'sales') setSalesSearchQuery(e.target.value);
                          else setSearchQuery(e.target.value);
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search size={18} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: 250 }}
                      />
                      {(activeTab === 'users' || activeTab === 'farmers') && (
                        <Button
                          variant="contained"
                          startIcon={<Plus size={18} />}
                          onClick={() => openAddModal(activeTab.slice(0, -1))}
                          sx={{ borderRadius: 2 }}
                        >
                          Add New
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* DATA TABLES */}
                  <Box sx={{ p: 0 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                        <Typography color="text.secondary">Loading records...</Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                          <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                              {activeTab === 'users' || activeTab === 'farmers' ? (
                                <>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('name')}>Name</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('username')}>Username</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                                  {activeTab === 'farmers' && <TableCell sx={{ fontWeight: 700 }}>Aadhar</TableCell>}
                                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </>
                              ) : activeTab === 'milk' ? (
                                <>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('date')}>Date & Time</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('farmer')}>Farmer</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('quantity')}>Quantity (L)</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('qualityScore')}>Quality Score</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('totalAmount')}>Total Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                                </>
                              ) : activeTab === 'sales' ? (
                                <>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('date')}>Date</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('user')}>Customer</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                                  <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => requestSort('totalAmount')}>Amount</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                                </>
                              ) : null}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(activeTab === 'users' ? filteredUsers :
                              activeTab === 'farmers' ? filteredFarmers :
                                activeTab === 'milk' ? filteredMilkRecords :
                                  activeTab === 'sales' ? filteredPurchases : []).map((row) => (
                                    <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                      {activeTab === 'users' || activeTab === 'farmers' ? (
                                        <>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                                                {row.firstName.charAt(0)}
                                              </Avatar>
                                              <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.firstName} {row.lastName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                          <TableCell><Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>@{row.username}</Typography></TableCell>
                                          <TableCell>
                                            <Typography variant="body2">{row.phone}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.address}</Typography>
                                          </TableCell>
                                          {activeTab === 'farmers' && <TableCell><Typography variant="body2">{row.aadhar}</Typography></TableCell>}
                                          <TableCell>
                                            <Chip
                                              label={row.isActive ? 'Active' : 'Inactive'}
                                              size="small"
                                              color={row.isActive ? 'success' : 'error'}
                                              sx={{ fontWeight: 600, borderRadius: 1.5 }}
                                            />
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                              <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEditModal(row, activeTab.slice(0, -1))} sx={{ color: 'primary.main' }}><Edit2 size={18} /></IconButton>
                                              </Tooltip>
                                              <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
                                                <IconButton size="small" onClick={() => toggleActive(row._id, activeTab.slice(0, -1), row.isActive)}>
                                                  {row.isActive ? <XCircle size={18} color={theme.palette.error.main} /> : <CheckCircle size={18} color={theme.palette.success.main} />}
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(row._id, activeTab.slice(0, -1))} sx={{ color: 'error.main' }}><Trash2 size={18} /></IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </>
                                      ) : activeTab === 'milk' ? (
                                        <>
                                          <TableCell><Typography variant="body2">{formatDateTime(row.date)}</Typography></TableCell>
                                          <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.farmer?.firstName} {row.farmer?.lastName}</Typography>
                                            <Typography variant="caption" color="text.secondary">@{row.farmer?.username}</Typography>
                                          </TableCell>
                                          <TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>{row.quantity} L</Typography></TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2">{row.qualityScore.toFixed(3)}</Typography>
                                              <Chip
                                                label={row.qualityScore > 0.8 ? 'Premium' : row.qualityScore > 0.5 ? 'Good' : 'Standard'}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: 20 }}
                                              />
                                            </Box>
                                          </TableCell>
                                          <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>₹{row.totalAmount.toFixed(2)}</Typography></TableCell>
                                          <TableCell>
                                            <Chip
                                              label={row.status}
                                              size="small"
                                              color={row.status === 'paid' ? 'success' : row.status === 'pending' ? 'warning' : 'default'}
                                              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                            />
                                          </TableCell>
                                          <TableCell align="right">
                                            {row.status === 'pending' && (
                                              <Button size="small" variant="outlined" onClick={() => handlePayment(row._id)}>Pay Now</Button>
                                            )}
                                          </TableCell>
                                        </>
                                      ) : activeTab === 'sales' ? (
                                        <>
                                          <TableCell><Typography variant="body2">{formatDateTime(row.date)}</Typography></TableCell>
                                          <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.user?.firstName} {row.user?.lastName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.user?.phone}</Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">{row.quantity} Liters</Typography>
                                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{row.deliveryType}</Typography>
                                          </TableCell>
                                          <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>₹{row.totalAmount.toFixed(2)}</Typography></TableCell>
                                          <TableCell>
                                            <Chip
                                              label={row.status}
                                              size="small"
                                              color={row.status === 'delivered' ? 'success' : row.status === 'pending' ? 'warning' : 'error'}
                                              sx={{ fontWeight: 600 }}
                                            />
                                          </TableCell>
                                          <TableCell align="right">
                                            {row.status === 'pending' && (
                                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <IconButton size="small" color="success" onClick={() => handleApprovePurchase(row._id)}><CheckCircle size={18} /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleCancelPurchase(row._id)}><XCircle size={18} /></IconButton>
                                              </Box>
                                            )}
                                          </TableCell>
                                        </>
                                      ) : null}
                                    </TableRow>
                                  ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    {((activeTab === 'users' ? filteredUsers :
                      activeTab === 'farmers' ? filteredFarmers :
                        activeTab === 'milk' ? filteredMilkRecords :
                          activeTab === 'sales' ? filteredPurchases : []).length === 0 && !loading) && (
                        <Box sx={{ p: 8, textAlign: 'center' }}>
                          <Typography color="text.secondary">No records found matching your criteria</Typography>
                        </Box>
                      )}
                  </Box>
                </Paper>
              )}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Box>

      {/* MUI Dialog Modal */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3 }}>
          {modalType === 'add' ? 'Register New' : 'Update Profile'} {modalData.type === 'user' ? 'Customer' : 'Farmer'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required /></Grid>
              <Grid item xs={12} sm={12}><TextField fullWidth label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required /></Grid>
              <Grid item xs={12} sm={12}><TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></Grid>
              <Grid item xs={12} sm={6}>
                {modalData.type === 'farmer' && <TextField fullWidth label="Aadhar Card" value={formData.aadhar} onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })} required maxLength="12" />}
              </Grid>
              <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required /></Grid>
              {modalType === 'add' && <Grid item xs={12}><TextField fullWidth label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} /></Grid>}
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
                  label="Active Account"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ px: 4, borderRadius: 2 }}>
              {modalType === 'add' ? 'Create Account' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
