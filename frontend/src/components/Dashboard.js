import React from 'react';
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
  Table, TableBody, TableCell, TableHead, TableRow, Rating, Switch
} from '@mui/material';
import { 
  User, LogOut, ShoppingCart, History, Droplets, Leaf, 
  ChartBar, Calendar, MapPin, Users, Star, TrendingUp, 
  Award, Package, BarChart3, ChevronRight, Menu as MenuIcon,
  CircleCheck, CircleX, Sprout, ShoppingBag, Info, UserCheck,
  Search, DownloadCloud, Plus, Minus, Milk, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DRAWER_WIDTH = 260;

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('profile');
  const [milkRecords, setMilkRecords] = React.useState([]);
  const [purchases, setPurchases] = React.useState([]);
  const [availability, setAvailability] = React.useState({ available: 0, rate: 50, deliveryCharge: 10 });
  const [loadingRecords, setLoadingRecords] = React.useState(false);
  const [loadingAvailability, setLoadingAvailability] = React.useState(false);
  const [purchaseQty, setPurchaseQty] = React.useState('');
  const [deliveryType, setDeliveryType] = React.useState('COD');
  const [distance, setDistance] = React.useState('');
  const [shift, setShift] = React.useState('Morning');
  const [farmerShift, setFarmerShift] = React.useState('Morning');
  const [purchaseMessage, setPurchaseMessage] = React.useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = React.useState('');
  const [workshops, setWorkshops] = React.useState([]);
  const [loadingWorkshops, setLoadingWorkshops] = React.useState(false);
  const [bookingMessage, setBookingMessage] = React.useState({ id: null, text: '', type: '' });
  const [supplements, setSupplements] = React.useState([]);
  const [cart, setCart] = React.useState({}); // { supplementId: quantity }
  const [supplementCategory, setSupplementCategory] = React.useState('All');
  const [orderMessage, setOrderMessage] = React.useState({ text: '', type: '' });
  const [directAvailabilities, setDirectAvailabilities] = React.useState([]);
  const [myDirectRequests, setMyDirectRequests] = React.useState([]);
  const [farmerDirectRequests, setFarmerDirectRequests] = React.useState([]);
  const [farmerAvailQty, setFarmerAvailQty] = React.useState('');
  const [farmerPrice, setFarmerPrice] = React.useState(50);
  const [directSaleMessage, setDirectSaleMessage] = React.useState({ text: '', type: '' });
  const [offersSubscription, setOffersSubscription] = React.useState(false);
  const [subscriptionMilkRate, setSubscriptionMilkRate] = React.useState(50);
  const [subscriptionDeliveryRange, setSubscriptionDeliveryRange] = React.useState(5);
  const [subscriptionFarmers, setSubscriptionFarmers] = React.useState([]);
  const [deliveryChargeMessage, setDeliveryChargeMessage] = React.useState({ text: '', type: '' });
  const [offersPreBooking, setOffersPreBooking] = React.useState(false);
  const [preBookingMilkRate, setPreBookingMilkRate] = React.useState(50);
  const [preBookingDeliveryRange, setPreBookingDeliveryRange] = React.useState(5);
  const [preBookingFarmers, setPreBookingFarmers] = React.useState([]);
  const [preBookingMessage, setPreBookingMessage] = React.useState({ text: '', type: '' });
  const [subscriptionModal, setSubscriptionModal] = React.useState({
    open: false,
    farmerId: null,
    farmerName: '',
    pricePerLiter: 0,
    deliveryCharge: 0,
    shift: 'Morning',
    qty: 1
  });
  const [subscriptionData, setSubscriptionData] = React.useState({
    startDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 31)).toISOString().split('T')[0],
    distance: '',
    deliveryLocation: ''
  });
  const [subscriptionMessage, setSubscriptionMessage] = React.useState({ text: '', type: '' });
  const [mySubscriptions, setMySubscriptions] = React.useState([]);
  const [farmerDeliveriesToday, setFarmerDeliveriesToday] = React.useState([]);
  const [farmerPendingSubscriptions, setFarmerPendingSubscriptions] = React.useState([]);
  const [feedbackData, setFeedbackData] = React.useState({ id: null, rating: 5, feedback: '' });
  const [farmerReviews, setFarmerReviews] = React.useState({ farmerId: null, reviews: [] });
  const [showReviewsModal, setShowReviewsModal] = React.useState(false);
  const [analyticsData, setAnalyticsData] = React.useState({
    income: [],
    benchmark: { farmerAvg: 0, societyAvg: 0, isAboveAverage: false },
    rating: { average: 0, count: 0 }
  });
  const [sortConfig, setSortConfig] = React.useState({ key: 'date', direction: 'desc' });
  const [directBuyQtys, setDirectBuyQtys] = React.useState({});
  const [supplementOrders, setSupplementOrders] = React.useState([]);
  const [browseDate, setBrowseDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [farmerDate, setFarmerDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [myInvoices, setMyInvoices] = React.useState([]);

  const fetchMyInvoices = async () => {
    if (user?.role === 'user') {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/invoices/user', config);
            if (res.data.success) {
                setMyInvoices(res.data.invoices || []);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    }
  };

  const generateInvoiceAndUpload = async (invoiceDetails, paymentId) => {
    try {
      const { title, items, totalAmount, date } = invoiceDetails;
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(26, 93, 26);
      doc.text("Dairy Society Management System", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("INVOICE", 14, 30);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice Date: ${new Date(date).toLocaleDateString()}`, 14, 40);
      doc.text(`Payment ID: ${paymentId}`, 14, 45);
      doc.text(`Billed To: ${user?.firstName} ${user?.lastName} (${user?.email})`, 14, 50);

      doc.setFont("helvetica", "bold");
      doc.text(`Order Type: ${title}`, 14, 60);

      doc.autoTable({
        startY: 65,
        head: [['Description', 'Amount (INR)']],
        body: items,
        theme: 'grid',
        headStyles: { fillColor: [26, 93, 26] },
        styles: { fontSize: 10 }
      });

      const finalY = doc.lastAutoTable.finalY || 65;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Amount: INR ${totalAmount.toFixed(2)}`, 14, finalY + 10);

      const filename = `Invoice_${paymentId}.pdf`;
      doc.save(filename);

      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('invoicePdf', pdfBlob, filename);
      formData.append('paymentId', paymentId);
      formData.append('amount', totalAmount.toString());
      formData.append('description', title);

      await axios.post('http://localhost:5000/api/invoices/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchMyInvoices();
    } catch (err) {
      console.error("Invoice generation error", err);
    }
  };

  const getDirectBuyQty = (id) => directBuyQtys[id] || 1;
  const setDirectBuyQty = (id, val) => setDirectBuyQtys(prev => ({ ...prev, [id]: val }));

  const [preBookingDates, setPreBookingDates] = React.useState({});
  const [preBookingQtys, setPreBookingQtys] = React.useState({});
  const [preBookingShifts, setPreBookingShifts] = React.useState({});

  const getPreBookingDate = (id) => {
    if (preBookingDates[id]) return preBookingDates[id];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const setPreBookingDate = (id, val) => setPreBookingDates(prev => ({ ...prev, [id]: val }));
  
  const getPreBookingQty = (id) => preBookingQtys[id] || 1;
  const setPreBookingQty = (id, val) => setPreBookingQtys(prev => ({ ...prev, [id]: val }));

  const getPreBookingShift = (id) => preBookingShifts[id] || 'Morning';
  const setPreBookingShift = (id, val) => setPreBookingShifts(prev => ({ ...prev, [id]: val }));

  const morningAvail = availability?.morningAvailable || 0;
  const eveningAvail = availability?.eveningAvailable || 0;
  const totalAvailable = morningAvail + eveningAvail;
  const currentShiftAvailable = shift === 'Morning' ? morningAvail : eveningAvail;

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

  const filteredRecords = milkRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const dateStr = new Date(record.date).toLocaleDateString();
    return (
      dateStr.includes(searchLower) ||
      record.status.toLowerCase().includes(searchLower) ||
      record.quantity.toString().includes(searchLower) ||
      record.totalAmount.toString().includes(searchLower)
    );
  });

  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchQuery.toLowerCase();
    const dateStr = new Date(purchase.date).toLocaleDateString();
    return (
      dateStr.includes(searchLower) ||
      purchase.status.toLowerCase().includes(searchLower) ||
      purchase.quantity.toString().includes(searchLower) ||
      purchase.totalAmount.toString().includes(searchLower)
    );
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRecords(true);
        setLoadingAvailability(true);
        setLoadingWorkshops(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [milkRes, purchaseRes, availRes, workshopRes, supplementRes, directAvailRes, myDirectRes, farmerDirectRes, analyticsRes, suppOrderRes, mySubsRes, farmerDeliveriesRes, farmerPendingSubsRes, subscriptionFarmersRes, prebookingFarmersRes] = await Promise.all([
          user?.role === 'farmer' ? axios.get('http://localhost:5000/api/milk/farmer', config) : Promise.resolve({ data: { records: [] } }),
          user?.role === 'user' ? axios.get('http://localhost:5000/api/purchase/user', config) : Promise.resolve({ data: { purchases: [] } }),
          axios.get('http://localhost:5000/api/purchase/available'),
          axios.get('http://localhost:5000/api/workshops', config),
          axios.get('http://localhost:5000/api/supplements', config),
          user?.role === 'user' ? axios.get('http://localhost:5000/api/direct-milk/farmers', config) : Promise.resolve({ data: { availabilities: [] } }),
          user?.role === 'user' ? axios.get('http://localhost:5000/api/direct-milk/user/requests', config) : Promise.resolve({ data: { requests: [] } }),
          user?.role === 'farmer' ? axios.get('http://localhost:5000/api/direct-milk/farmer/requests', config) : Promise.resolve({ data: { requests: [] } }),
          user?.role === 'farmer' ? axios.get('http://localhost:5000/api/analytics/farmer', config) : Promise.resolve({ data: null }),
          user?.role === 'farmer' ? axios.get('http://localhost:5000/api/supplements/orders', config) : Promise.resolve({ data: { orders: [] } }),
          user?.role === 'user' ? axios.get('http://localhost:5000/api/subscriptions/user', config) : Promise.resolve({ data: { subscriptions: [] } }),
          user?.role === 'farmer' ? axios.get('http://localhost:5000/api/subscriptions/farmer/today', config) : Promise.resolve({ data: { schedule: [] } }),
          user?.role === 'farmer' ? axios.get('http://localhost:5000/api/subscriptions/farmer/requests', config) : Promise.resolve({ data: { requests: [] } }),
          user?.role === 'user' ? axios.get('http://localhost:5000/api/direct-milk/subscription-farmers', config) : Promise.resolve({ data: { farmers: [] } }),
          user?.role === 'user' ? axios.get('http://localhost:5000/api/direct-milk/prebooking-farmers', config) : Promise.resolve({ data: { farmers: [] } })
        ]);

        setMilkRecords(milkRes.data.records || []);
        setPurchases(purchaseRes.data.purchases || []);
        setAvailability(availRes.data || { morningAvailable: 0, eveningAvailable: 0, rate: 50, deliveryCharge: 10 });
        if (user?.role === 'farmer') {
            setOffersSubscription(user.offersSubscription || false);
            setSubscriptionMilkRate(user.subscriptionMilkRate || 50);
            setSubscriptionDeliveryRange(user.subscriptionDeliveryRange || 5);
            setOffersPreBooking(user.offersPreBooking || false);
            setPreBookingMilkRate(user.preBookingMilkRate || 50);
            setPreBookingDeliveryRange(user.preBookingDeliveryRange || 5);
        }
        setWorkshops(workshopRes.data.workshops || []);
        setSupplements(supplementRes.data.supplements || []);
        setDirectAvailabilities(directAvailRes.data.availabilities || []);
        setMyDirectRequests(myDirectRes.data.requests || []);
        setFarmerDirectRequests(farmerDirectRes.data.requests || []);
        setSupplementOrders(suppOrderRes?.data?.orders || []);
        setMySubscriptions(mySubsRes.data.subscriptions || []);
        setFarmerDeliveriesToday(farmerDeliveriesRes.data.schedule || []);
        setFarmerPendingSubscriptions(farmerPendingSubsRes.data.requests || []);
        setSubscriptionFarmers(subscriptionFarmersRes.data.farmers || []);
        setPreBookingFarmers(prebookingFarmersRes.data.farmers || []);

        if (analyticsRes && analyticsRes.data) {
          setAnalyticsData({
            income: analyticsRes.data.income || [],
            benchmark: analyticsRes.data.benchmark || { farmerAvg: 0, societyAvg: 0, isAboveAverage: false },
            rating: analyticsRes.data.rating || { average: 0, count: 0 }
          });
        }

        fetchMyInvoices();

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingRecords(false);
        setLoadingAvailability(false);
        setLoadingWorkshops(false);
      }
    };

    fetchData();
  }, [user, token]);


  // These individual fetch functions are now largely redundant if useEffect fetches all data
  // but keeping them for potential specific re-fetches if needed.
  const fetchMilkHistory = async () => {
    try {
      setLoadingRecords(true);
      const response = await axios.get('http://localhost:5000/api/milk/farmer', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMilkRecords(response.data.records);
    } catch (error) {
      console.error('Error fetching milk records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const response = await axios.get('http://localhost:5000/api/purchase/available');
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchMyPurchases = async () => {
    try {
      setLoadingRecords(true);
      const response = await axios.get('http://localhost:5000/api/purchase/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchases(response.data.purchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchDirectAvailabilities = async (selectedDate) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const dateToFetch = selectedDate || browseDate;
      const res = await axios.get(`http://localhost:5000/api/direct-milk/farmers?date=${dateToFetch}`, config);
      setDirectAvailabilities(res.data.availabilities || []);
    } catch (error) {
      console.error('Error fetching direct availabilities:', error);
    }
  };

  const fetchWorkshops = async () => {
    try {
      setLoadingWorkshops(true);
      const response = await axios.get('http://localhost:5000/api/workshops', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkshops(response.data.workshops);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setLoadingWorkshops(false);
    }
  };

  const handleBooking = async (workshopId) => {
    try {
      setBookingMessage({ id: workshopId, text: 'Booking...', type: 'info' });
      await axios.post(`http://localhost:5000/api/workshops/book/${workshopId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingMessage({ id: workshopId, text: 'Booked Successfully!', type: 'success' });
      fetchWorkshops();
    } catch (error) {
      setBookingMessage({
        id: workshopId,
        text: error.response?.data?.message || 'Booking failed',
        type: 'error'
      });
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseQty || purchaseQty <= 0) {
      setPurchaseMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const deliveryCharge = deliveryType === 'Takeaway' ? 0 : (distance ? parseFloat(distance) * 10 : 10);
      const amount = (parseFloat(purchaseQty) * availability.rate) + deliveryCharge;

      // 1. Create Razorpay Order
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount,
        receipt: `receipt_milk_${Date.now()}`
      }, config);

      if (!orderRes.data.success) throw new Error('Payment initialization failed');

      const { order } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_SQZX6y25mriFCf',
        amount: order.amount,
        currency: order.currency,
        name: 'Dairy Society Management',
        description: `Society Milk Purchase - ${purchaseQty}L`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3. Verify Payment and Place Order
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, config);

            if (verifyRes.data.success) {
              const res = await axios.post('http://localhost:5000/api/purchase',
                {
                  quantity: parseFloat(purchaseQty),
                  deliveryType: deliveryType,
                  distance: deliveryType === 'COD' ? parseFloat(distance || 0) : 0,
                  paymentId: response.razorpay_payment_id,
                  shift
                },
                config
              );

              if (res.data.success) {
                setPurchaseMessage({ type: 'success', text: `Success! Payment processed and order placed.` });
                setPurchaseQty('');
                setDistance('');
                fetchAvailability();
                fetchMyPurchases();
                generateInvoiceAndUpload({
                  title: 'Society Milk Purchase',
                  items: [[`${purchaseQty}L Milk (${deliveryType})`, amount.toFixed(2)]],
                  totalAmount: amount,
                  date: new Date()
                }, response.razorpay_payment_id);
              }
            }
          } catch (err) {
            setPurchaseMessage({ type: 'error', text: 'Payment verification failed' });
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone || ''
        },
        theme: { color: '#1a5d1a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Order failed';
      setPurchaseMessage({ type: 'error', text: errorMsg });
    }
  };

  const addToCart = (id) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const removeFromCart = (id) => {
    if (!cart[id]) return;
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const handleSupplementOrder = async () => {
    let amount = 0;
    const items = Object.entries(cart).map(([id, quantity]) => {
      const supplement = supplements.find(s => s._id === id);
      if (!supplement) return null;
      amount += (supplement.pricePerUnit * quantity);
      return {
        supplementId: id,
        quantity,
        priceAtTime: supplement.pricePerUnit
      };
    }).filter(item => item !== null);

    if (items.length === 0) {
      setOrderMessage({ text: 'Please add items to cart first!', type: 'error' });
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Create Razorpay Order
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount,
        receipt: `receipt_supp_${Date.now()}`
      }, config);

      if (!orderRes.data.success) throw new Error('Payment initialization failed');

      const { order } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_SQZX6y25mriFCf',
        amount: order.amount,
        currency: order.currency,
        name: 'Dairy Society Shop',
        description: `Cattle Feed & Supplements Order`,
        order_id: order.id,
        handler: async (paymentResponse) => {
          try {
            // 3. Verify Payment and Place Order
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            }, config);

            if (verifyRes.data?.success) {
              const purchaseRes = await axios.post('http://localhost:5000/api/supplements/purchase', { 
                items,
                paymentId: paymentResponse.razorpay_payment_id
              }, config);

              if (purchaseRes.data?.success) {
                setOrderMessage({ text: 'Success! Payment processed and order placed.', type: 'success' });
                setCart({});
                generateInvoiceAndUpload({
                  title: 'Cattle Feed & Supplements Order',
                  items: items.map(item => [`${item.quantity} units of ${supplements.find(s=>s._id===item.supplementId)?.name || 'Supplement'}`, (item.quantity * item.priceAtTime).toFixed(2)]),
                  totalAmount: amount,
                  date: new Date()
                }, paymentResponse.razorpay_payment_id);
              }
            }
          } catch (err) {
            console.error('Payment Verification Error:', err);
            const errMsg = err.response?.data?.message || err.message || 'Payment verification failed';
            setOrderMessage({ text: errMsg, type: 'error' });
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone || ''
        },
        theme: { color: '#1a5d1a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Supplement Purchase Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Order failed';
      setOrderMessage({ text: errorMsg, type: 'error' });
    }
  };

  const handleFarmerAvailability = async (e) => {
    e.preventDefault();
    const qty = parseFloat(farmerAvailQty);
    const price = parseFloat(farmerPrice);

    if (isNaN(qty) || isNaN(price)) {
      setDirectSaleMessage({ text: 'Please enter valid numbers for quantity and price', type: 'error' });
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/direct-milk/availability', {
        availableQuantity: qty,
        pricePerLiter: price,
        shift: farmerShift,
        date: farmerDate
      }, config);
      setDirectSaleMessage({ text: 'Availability updated successfully!', type: 'success' });
      // Refresh direct availabilities after update
      fetchDirectAvailabilities();
    } catch (error) {
      console.error('Direct milk availability update error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update availability';
      setDirectSaleMessage({ text: errorMsg, type: 'error' });
    }
  };

  const handleDirectPurchaseRequest = async (farmerId, qty, price, shiftVal, requestDate) => {
    try {
      const amount = parseFloat(qty) * parseFloat(price);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Create Razorpay Order
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount,
        receipt: `receipt_direct_${Date.now()}`
      }, config);

      if (!orderRes.data.success) throw new Error('Payment initialization failed');

      const { order } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_SQZX6y25mriFCf',
        amount: order.amount,
        currency: order.currency,
        name: 'Farmer Direct Sale',
        description: `Direct Milk Purchase - ${qty}L`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3. Verify Payment and Place Order
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, config);

            if (verifyRes.data.success) {
              const submissionRes = await axios.post('http://localhost:5000/api/direct-milk/request', {
                farmerId,
                quantity: parseFloat(qty),
                paymentId: response.razorpay_payment_id,
                shift: shiftVal,
                date: requestDate || browseDate
              }, config);

              if (submissionRes.data.success) {
                setDirectSaleMessage({ text: 'Success! Payment done and request sent.', type: 'success' });
                // Refresh requests AND availabilities (stock)
                const res = await axios.get('http://localhost:5000/api/direct-milk/user/requests', config);
                setMyDirectRequests(res.data.requests);
                fetchDirectAvailabilities();
                generateInvoiceAndUpload({
                  title: 'Direct Milk Purchase',
                  items: [[`${parseFloat(qty)}L Milk from Farmer`, amount.toFixed(2)]],
                  totalAmount: amount,
                  date: requestDate || browseDate
                }, response.razorpay_payment_id);
              }
            }
          } catch (err) {
            setDirectSaleMessage({ text: 'Payment verification failed', type: 'error' });
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone || ''
        },
        theme: { color: '#1a5d1a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Payment failed';
      alert('Error: ' + errorMsg);
      setDirectSaleMessage({ text: errorMsg, type: 'error' });
    }
  };

  const handlePayDirectRequest = async (reqId, amount) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount
      }, config);

      if (!orderRes.data.success) {
        throw new Error('Could not create payment order');
      }

      const options = {
        key: 'rzp_test_SQZX6y25mriFCf',
        amount: orderRes.data.order.amount,
        currency: "INR",
        name: "DSMS Pre-Booking",
        description: "Payment for Approved Pre-booking",
        order_id: orderRes.data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, config);

            if (verifyRes.data.success) {
              const payRes = await axios.put(`http://localhost:5000/api/direct-milk/pay/${reqId}`, {
                paymentId: response.razorpay_payment_id
              }, config);
              
              if (payRes.data.success) {
                alert('Success: Payment completed successfully!');
                const requestsRes = await axios.get('http://localhost:5000/api/direct-milk/user/requests', config);
                setMyDirectRequests(requestsRes.data.requests);
                generateInvoiceAndUpload({
                  title: 'Direct Milk Pre-booking Payment',
                  items: [['Pre-booked Milk Order Payment', amount.toFixed(2)]],
                  totalAmount: amount,
                  date: new Date()
                }, response.razorpay_payment_id);
              }
            } else {
              alert('Error: Payment verification failed.');
            }
          } catch (err) {
            alert('Error: Payment failed.');
          }
        },
        theme: { color: "#16a34a" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert('Error: Could not initiate payment.');
    }
  };

  const handlePreBookingRequest = async (farmerId, qty, price, shiftVal, requestDate) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const submissionRes = await axios.post('http://localhost:5000/api/direct-milk/request', {
        farmerId,
        quantity: parseFloat(qty),
        shift: shiftVal,
        date: requestDate
      }, config);

      if (submissionRes.data.success) {
        alert('Success: Pre-booking request sent to farmer for approval.');
        setDirectSaleMessage({ text: 'Pre-booking request sent to farmer for approval.', type: 'success' });
        const res = await axios.get('http://localhost:5000/api/direct-milk/user/requests', config);
        setMyDirectRequests(res.data.requests);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Pre-booking failed';
      alert('Error: ' + errorMsg);
      setDirectSaleMessage({ text: errorMsg, type: 'error' });
    }
  };

  const handleFarmerAction = async (requestId, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/direct-milk/farmer/action/${requestId}`, { action }, config);
      // Refresh requests
      const res = await axios.get('http://localhost:5000/api/direct-milk/farmer/requests', config);
      setFarmerDirectRequests(res.data.requests);
    } catch (error) {
      console.error('Action failed', error);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/direct-milk/user/feedback/${feedbackData.id}`, {
        rating: feedbackData.rating,
        feedback: feedbackData.feedback
      }, config);
      setFeedbackData({ id: null, rating: 5, feedback: '' });
      // Refresh requests and availabilities (to get new avg rating)
      const [reqs, avails] = await Promise.all([
        axios.get('http://localhost:5000/api/direct-milk/user/requests', config),
        axios.get('http://localhost:5000/api/direct-milk/farmers', config)
      ]);
      setMyDirectRequests(reqs.data.requests);
      setDirectAvailabilities(avails.data.availabilities);
    } catch (error) {
      console.error('Feedback failed', error);
    }
  };

  const fetchFarmerReviews = async (farmerId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`http://localhost:5000/api/direct-milk/farmer/${farmerId}/reviews`, config);
      setFarmerReviews({ farmerId, reviews: res.data.reviews });
      setShowReviewsModal(true);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    }
  };

  React.useEffect(() => {
    const fetchMyAvailability = async () => {
      if (user?.role !== 'farmer') return;
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`http://localhost:5000/api/direct-milk/availability?date=${farmerDate}`, config);
        const myAvail = res.data.availabilities?.find(a => a.shift === farmerShift);
        if (myAvail) {
          setFarmerAvailQty(myAvail.availableQuantity);
          setFarmerPrice(myAvail.pricePerLiter);
        } else {
          setFarmerAvailQty('');
          setFarmerPrice(50);
        }
      } catch (error) {
        console.error('Error fetching my availability:', error);
      }
    };
    fetchMyAvailability();
  }, [farmerDate, farmerShift, user, token]);

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin': return <Award size={20} />;
      case 'farmer': return <Droplets size={20} />;
      case 'user': return <ShoppingCart size={20} />;
      default: return <User size={20} />;
    }
  };

  const calculateSubscriptionTotal = () => {
    if (!subscriptionData.startDate || !subscriptionData.endDate || !subscriptionModal.qty || !subscriptionModal.pricePerLiter) return { milkTotal: 0, delivery: 0, total: 0 };
    const start = new Date(subscriptionData.startDate);
    const end = new Date(subscriptionData.endDate);
    const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) return { milkTotal: 0, delivery: 0, total: 0 };
    const distanceVal = subscriptionData.distance ? Number(subscriptionData.distance) : 0;
    const milkTotal = subscriptionModal.pricePerLiter * subscriptionModal.qty * days;
    const delivery = distanceVal * 15 * days;
    return { milkTotal, delivery, total: milkTotal + delivery };
  };

  const handleSubscriptionSubmit = async () => {
    if (!subscriptionData.distance || !subscriptionData.deliveryLocation) {
      setSubscriptionMessage({ text: 'Distance and delivery location are required.', type: 'error' });
      return;
    }
    
    setSubscriptionMessage({ text: '', type: '' });
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { total } = calculateSubscriptionTotal();
      
      if (total <= 0) {
          setSubscriptionMessage({ text: 'Invalid subscription total.', type: 'error' });
          return;
      }

      // 1. Create Razorpay Order
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount: total,
        receipt: `receipt_sub_${Date.now()}`
      }, config);

      if (!orderRes.data.success) throw new Error('Payment initialization failed');

      const { order } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_SQZX6y25mriFCf',
        amount: order.amount,
        currency: order.currency,
        name: 'Milk Subscription',
        description: `Pre-booking for ${subscriptionModal.qty}L/day`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3. Verify Payment and Create Subscription
            await axios.post('http://localhost:5000/api/subscriptions', {
              farmerId: subscriptionModal.farmerId,
              quantityPerDay: subscriptionModal.qty,
              startDate: subscriptionData.startDate,
              endDate: subscriptionData.endDate,
              shift: subscriptionModal.shift,
              distance: Number(subscriptionData.distance),
              deliveryLocation: subscriptionData.deliveryLocation,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }, config);

            setSubscriptionMessage({ text: 'Subscription created and paid successfully!', type: 'success' });
            
            generateInvoiceAndUpload({
              title: 'Milk Subscription',
              items: [[`${subscriptionModal.qty}L/day from ${new Date(subscriptionData.startDate).toLocaleDateString()} to ${new Date(subscriptionData.endDate).toLocaleDateString()}`, total.toFixed(2)]],
              totalAmount: total,
              date: new Date()
            }, response.razorpay_payment_id);
            
            // Refresh subscriptions
            const mySubsRes = await axios.get('http://localhost:5000/api/subscriptions/user', config);
            setMySubscriptions(mySubsRes.data.subscriptions || []);

            setTimeout(() => {
              setSubscriptionModal({ ...subscriptionModal, open: false });
              setSubscriptionMessage({ text: '', type: '' });
            }, 2000);
          } catch (err) {
            setSubscriptionMessage({ text: err.response?.data?.message || 'Verification failed', type: 'error' });
          }
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.email,
          contact: user?.phone
        },
        theme: { color: '#1a5d1a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setSubscriptionMessage({ text: err.response?.data?.message || err.message || 'Error initializing payment', type: 'error' });
    }
  };

  const handleFarmerMarkDelivery = async (subscriptionId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/subscriptions/delivery', { subscriptionId }, config);
      // Quickly refresh today's lineup
      const res = await axios.get('http://localhost:5000/api/subscriptions/farmer/today', config);
      setFarmerDeliveriesToday(res.data.schedule || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking delivery');
    }
  };

  const handleFarmerSubscriptionAction = async (subscriptionId, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/subscriptions/farmer/action', { subscriptionId, action }, config);
      // Refresh pending queue
      const res = await axios.get('http://localhost:5000/api/subscriptions/farmer/requests', config);
      setFarmerPendingSubscriptions(res.data.requests || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing request');
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'admin': return 'Administrator';
      case 'farmer': return 'Farmer (Milk Seller)';
      case 'user': return 'Customer (Milk Buyer)';
      default: return 'User';
    }
  };

  const menuItems = user?.role === 'farmer' ? [
    { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    { id: 'history', label: 'Transaction Ledger', icon: <History size={20} /> },
    { id: 'feed', label: 'Cattle Feed Shop', icon: <Leaf size={20} /> },
    { id: 'direct-manage', label: 'Direct Sales', icon: <Droplets size={20} /> },
    { id: 'analytics', label: 'Performance', icon: <ChartBar size={20} /> },
  ] : [
    { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    { id: 'purchase', label: 'Society Milk', icon: <ShoppingCart size={20} /> },
    { id: 'my-purchases', label: 'History & Invoices', icon: <History size={20} /> },
    { id: 'direct-buy', label: 'Local Farmers', icon: <Droplets size={20} /> },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a5d1a', color: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex' }}>
          <Milk size={28} color="#1a5d1a" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
          DSMS <br /> 
          <Typography component="span" variant="caption" sx={{ opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            {user?.role} Portal
          </Typography>
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              selected={activeTab === item.id}
              sx={{
                borderRadius: 2,
                py: 1.5,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                },
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: activeTab === item.id ? 700 : 500 }} 
              />
              {activeTab === item.id && <ChevronRight size={16} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button
          fullWidth
          variant="text"
          color="inherit"
          startIcon={<LogOut size={18} />}
          onClick={handleLogout}
          sx={{ py: 1.5, borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
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

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            bgcolor: 'background.paper', 
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role === 'farmer' ? 'Verified Seller' : 'Milk Buyer'}
                </Typography>
              </Box>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main', 
                  fontWeight: 700,
                  boxShadow: '0 0 0 4px rgba(26, 93, 26, 0.1)' 
                }}
              >
                {user?.firstName?.charAt(0)}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'profile' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 4, textAlign: 'center', p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Avatar 
                        sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: '2rem' }}
                      >
                        {user?.firstName?.charAt(0)}
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{user?.firstName} {user?.lastName}</Typography>
                      <Typography color="text.secondary" gutterBottom>@{user?.username}</Typography>
                      <Chip 
                        label={getRoleName()} 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 1, fontWeight: 700, textTransform: 'uppercase' }} 
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Account Information</Typography>
                      <Grid container spacing={3}>
                        {[
                          { label: 'Full Name', value: `${user?.firstName} ${user?.lastName}`, icon: <User size={20} /> },
                          { label: 'Username', value: `@${user?.username}`, icon: <UserCheck size={20} /> },
                          { label: 'Email Address', value: user?.email, icon: <Info size={20} /> },
                          { label: 'Role', value: getRoleName(), icon: <Award size={20} /> },
                        ].map((info, idx) => (
                          <Grid item xs={12} sm={6} key={idx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ color: 'primary.main', display: 'flex' }}>{info.icon}</Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{info.label}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700 }}>{info.value}</Typography>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>

                  {workshops.length > 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Calendar color={theme.palette.secondary.main} /> Upcoming Events
                        </Typography>
                        <Grid container spacing={3}>
                          {workshops.map(w => {
                            const isBooked = w.bookedBy.some(b => b.userId === user?.id);
                            const isFull = w.bookedBy.length >= w.totalSlots;
                            return (
                              <Grid item xs={12} md={6} lg={4} key={w._id}>
                                <Card sx={{ borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                                  {w.image && (
                                    <Box sx={{ height: 180, overflow: 'hidden' }}>
                                      <img src={`http://localhost:5000${w.image}`} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                  )}
                                  <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{w.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {w.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <Calendar size={16} /> <Typography variant="caption">{new Date(w.date).toLocaleDateString()}</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <MapPin size={16} /> <Typography variant="caption">{w.location}</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <Users size={16} /> <Typography variant="caption">{w.bookedBy.length}/{w.totalSlots} Slots</Typography>
                                      </Box>
                                    </Box>
                                  </CardContent>
                                  <Box sx={{ p: 2, pt: 0 }}>
                                    <Button 
                                      fullWidth 
                                      variant={isBooked ? 'outlined' : 'contained'} 
                                      color={isBooked ? 'success' : 'primary'}
                                      disabled={isBooked || (isFull && !isBooked)}
                                      onClick={() => handleBooking(w._id)}
                                      sx={{ borderRadius: 2, fontWeight: 700 }}
                                    >
                                      {isBooked ? 'Booked' : isFull ? 'Full' : 'Book Now'}
                                    </Button>
                                  </Box>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}

               {/* Direct Sales Manager (Farmer) */}
              {activeTab === 'direct-manage' && (
                <Grid container spacing={3}>
                  {/* Post Availability */}
                  <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 4, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Droplets size={22} color={theme.palette.primary.main} /> Post Availability
                      </Typography>
                      <Box component="form" onSubmit={handleFarmerAvailability}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Availability Date"
                                type="date"
                                value={farmerDate}
                                onChange={(e) => setFarmerDate(e.target.value)}
                                required
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Available Quantity (Liters)"
                              type="number"
                              inputProps={{ step: 0.5, min: 0 }}
                              value={farmerAvailQty}
                              onChange={(e) => setFarmerAvailQty(e.target.value)}
                              required
                              InputProps={{ endAdornment: <InputAdornment position="end">L</InputAdornment> }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Price per Liter (₹)"
                              type="number"
                              inputProps={{ step: 1, min: 1 }}
                              value={farmerPrice}
                              onChange={(e) => setFarmerPrice(e.target.value)}
                              required
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              select
                              label="Shift"
                              value={farmerShift}
                              onChange={(e) => setFarmerShift(e.target.value)}
                              SelectProps={{ native: true }}
                              required
                            >
                              <option value="Morning">Morning</option>
                              <option value="Evening">Evening</option>
                            </TextField>
                          </Grid>
                        </Grid>
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          size="large"
                          sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 800 }}
                        >
                          Update Availability
                        </Button>
                        {directSaleMessage.text && (
                          <Typography
                            variant="body2"
                            color={directSaleMessage.type === 'error' ? 'error' : 'success.main'}
                            sx={{ mt: 2, textAlign: 'center', fontWeight: 600 }}
                          >
                            {directSaleMessage.text}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Subscription Settings */}
                  <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 4, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Settings size={22} color={theme.palette.primary.main} /> Subscription Settings
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Activate subscription offerings, defining your exact Milk Rate and maximum permissible Delivery Range for Customers.
                      </Typography>
                      <Box component="form" onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            await axios.post('http://localhost:5000/api/direct-milk/subscription-settings', { 
                                offersSubscription, 
                                subscriptionMilkRate, 
                                subscriptionDeliveryRange 
                            }, config);
                            setDeliveryChargeMessage({ text: 'Subscription settings synced securely', type: 'success' });
                            setTimeout(() => setDeliveryChargeMessage({ text: '', type: '' }), 3000);
                          } catch (err) {
                            setDeliveryChargeMessage({ text: err.response?.data?.message || 'Error updating settings', type: 'error' });
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Enable Subscriptions?</Typography>
                          <Switch 
                            checked={offersSubscription} 
                            onChange={(e) => setOffersSubscription(e.target.checked)} 
                            color="success" 
                          />
                        </Box>
                        {offersSubscription && (
                          <>
                            <TextField
                              fullWidth
                              label="Milk Rate per Liter (₹)"
                              type="number"
                              inputProps={{ step: 1, min: 1 }}
                              value={subscriptionMilkRate}
                              onChange={(e) => setSubscriptionMilkRate(e.target.value)}
                              required
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              label="Maximum Delivery Radius (km)"
                              type="number"
                              inputProps={{ step: 1, min: 1 }}
                              value={subscriptionDeliveryRange}
                              onChange={(e) => setSubscriptionDeliveryRange(e.target.value)}
                              required
                              InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                              sx={{ mb: 2 }}
                            />
                          </>
                        )}
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          size="large"
                          sx={{ py: 1.5, borderRadius: 3, fontWeight: 800 }}
                        >
                          Save Settings
                        </Button>
                        {deliveryChargeMessage.text && (
                          <Typography
                            variant="body2"
                            color={deliveryChargeMessage.type === 'error' ? 'error' : 'success.main'}
                            sx={{ mt: 2, textAlign: 'center', fontWeight: 600 }}
                          >
                            {deliveryChargeMessage.text}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Pre-booking Settings */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 4, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Calendar size={22} color={theme.palette.secondary.main} /> Pre-booking Settings
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Activate pre-booking offerings to allow customers to request milk in advance for upcoming dates.
                      </Typography>
                      <Box component="form" onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            await axios.post('http://localhost:5000/api/direct-milk/prebooking-settings', { 
                                offersPreBooking, 
                                preBookingMilkRate, 
                                preBookingDeliveryRange 
                            }, config);
                            setPreBookingMessage({ text: 'Pre-booking settings synced securely', type: 'success' });
                            setTimeout(() => setPreBookingMessage({ text: '', type: '' }), 3000);
                          } catch (err) {
                            setPreBookingMessage({ text: err.response?.data?.message || 'Error updating settings', type: 'error' });
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Enable Pre-bookings?</Typography>
                          <Switch 
                            checked={offersPreBooking} 
                            onChange={(e) => setOffersPreBooking(e.target.checked)} 
                            color="success" 
                          />
                        </Box>
                        {offersPreBooking && (
                          <>
                            <TextField
                              fullWidth
                              label="Milk Rate per Liter (₹)"
                              type="number"
                              inputProps={{ step: 1, min: 1 }}
                              value={preBookingMilkRate}
                              onChange={(e) => setPreBookingMilkRate(e.target.value)}
                              required
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              label="Maximum Delivery Radius (km)"
                              type="number"
                              inputProps={{ step: 1, min: 1 }}
                              value={preBookingDeliveryRange}
                              onChange={(e) => setPreBookingDeliveryRange(e.target.value)}
                              required
                              InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                              sx={{ mb: 2 }}
                            />
                          </>
                        )}
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          size="large"
                          color="secondary"
                          sx={{ py: 1.5, borderRadius: 3, fontWeight: 800 }}
                        >
                          Save Settings
                        </Button>
                        {preBookingMessage.text && (
                          <Typography
                            variant="body2"
                            color={preBookingMessage.type === 'error' ? 'error' : 'success.main'}
                            sx={{ mt: 2, textAlign: 'center', fontWeight: 600 }}
                          >
                            {preBookingMessage.text}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Incoming Requests */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Users size={22} color={theme.palette.primary.main} /> Incoming Requests
                      </Typography>
                      {farmerDirectRequests.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">No incoming requests from buyers yet.</Typography>
                        </Box>
                      ) : (
                        <Box>
                          {farmerDirectRequests.map((req) => (
                            <Card key={req._id} variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 700 }}>{req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Customer'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{req.user?.phone || ''}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <Chip label={`${req.quantity} L requested`} size="small" color="primary" sx={{ mr: 1, fontWeight: 700 }} />
                                      <Chip label={`₹${req.pricePerLiter}/L`} size="small" color="success" sx={{ mr: 1, fontWeight: 700 }} />
                                      <Chip label={new Date(req.date).toLocaleDateString()} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                    </Box>
                                  </Box>
                                  <Box>
                                    {req.status === 'pending' ? (
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton color="success" onClick={() => handleFarmerAction(req._id, 'approved')} sx={{ bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
                                          <CircleCheck size={20} />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleFarmerAction(req._id, 'rejected')} sx={{ bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                          <CircleX size={20} />
                                        </IconButton>
                                      </Box>
                                    ) : (
                                      <Chip
                                        label={req.status === 'approved' && req.paymentStatus === 'Completed' ? 'Paid & Approved' : req.status}
                                        color={req.status === 'approved' ? 'success' : 'error'}
                                        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Pending Subscription Requests */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Calendar size={22} color={theme.palette.secondary.main} /> Pending Subscriptions
                      </Typography>
                      {farmerPendingSubscriptions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">No pending subscription requests from buyers.</Typography>
                        </Box>
                      ) : (
                        <Box>
                          {farmerPendingSubscriptions.map((req) => (
                            <Card key={req._id} variant="outlined" sx={{ mb: 2, borderRadius: 3, borderLeft: '4px solid #f59e0b' }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 700 }}>{req.user?.firstName} {req.user?.lastName}</Typography>
                                    <Typography variant="body2" color="text.secondary">{req.user?.address || ''}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <Chip label={`${req.quantityPerDay} L / Day`} size="small" color="primary" sx={{ mr: 1, fontWeight: 700 }} />
                                      <Chip label={req.shift} size="small" variant="outlined" sx={{ mr: 1, fontWeight: 700 }} />
                                      <Chip label={`₹${req.totalAmount} Total`} size="small" color="success" sx={{ fontWeight: 700 }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                      From {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton color="success" onClick={() => handleFarmerSubscriptionAction(req._id, 'approve')} sx={{ bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
                                      <CircleCheck size={20} />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleFarmerSubscriptionAction(req._id, 'reject')} sx={{ bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                      <CircleX size={20} />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Today's Expected Pre-book Deliveries */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Package size={22} color={theme.palette.secondary.main} /> Today's Subscription Deliveries
                      </Typography>
                      {farmerDeliveriesToday.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">You have no active subscriptions scheduled for delivery today.</Typography>
                        </Box>
                      ) : (
                        <Box>
                          {farmerDeliveriesToday.map(({ subscription, deliveryStatus, deliveryLogId }) => (
                            <Card key={subscription._id} variant="outlined" sx={{ mb: 2, borderRadius: 3, borderLeft: deliveryStatus === 'delivered' ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                              <CardContent sx={{ pb: '16px !important' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 800 }}>{subscription.user?.firstName} {subscription.user?.lastName}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{subscription.user?.address}</Typography>
                                    <Chip label={`${subscription.quantityPerDay} L`} size="small" color="primary" sx={{ mr: 1, fontWeight: 700 }} />
                                    <Chip label={subscription.shift} size="small" variant="outlined" sx={{ mr: 1, fontWeight: 700 }} />
                                    <Chip label={deliveryStatus} color={deliveryStatus === 'delivered' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }} />
                                  </Box>
                                  <Box>
                                    {deliveryStatus === 'pending' ? (
                                      <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={() => handleFarmerMarkDelivery(subscription._id)}
                                        sx={{ borderRadius: 2, fontWeight: 700 }}
                                        startIcon={<CircleCheck size={18} />}
                                      >
                                        Mark Delivered
                                      </Button>
                                    ) : (
                                      <Chip label="Delivery Logged" color="success" icon={<CircleCheck size={16} />} sx={{ fontWeight: 700 }} />
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Local Farmers Browser (Customer) */}
              {activeTab === 'direct-buy' && (
                <Grid container spacing={3}>
                  {/* Farmers Offering Subscriptions */}
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 4, mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(26, 93, 26, 0.02)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Calendar size={22} color={theme.palette.secondary.main} /> Subscription Providers
                      </Typography>
                      {subscriptionFarmers.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">No farmers are currently offering subscriptions.</Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {subscriptionFarmers.map((farmer) => (
                            <Grid item xs={12} lg={6} key={farmer._id}>
                              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', borderLeft: '4px solid #f59e0b' }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, fontSize: '1.4rem' }}>
                                        {farmer.firstName?.[0] || 'F'}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{farmer.firstName} {farmer.lastName}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{farmer.address}</Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography variant="h6" sx={{ fontWeight: 900, color: 'success.main' }}>₹{farmer.subscriptionMilkRate}<Typography component="span" variant="caption">/L</Typography></Typography>
                                      <Chip label={`Max Range: ${farmer.subscriptionDeliveryRange} km`} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.65rem' }} />
                                    </Box>
                                  </Box>
                                  <Divider sx={{ my: 2 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{farmer.avgRating?.toFixed(1) || '0.0'}</Typography>
                                      <Typography variant="caption" color="text.secondary">({farmer.totalReviews} reviews)</Typography>
                                    </Box>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      color="secondary"
                                      onClick={() => setSubscriptionModal({
                                        open: true,
                                        farmerId: farmer._id,
                                        farmerName: `${farmer.firstName} ${farmer.lastName}`,
                                        pricePerLiter: farmer.subscriptionMilkRate,
                                        deliveryCharge: 0,
                                        shift: 'Morning',
                                        qty: 1
                                      })}
                                      sx={{ borderRadius: 2, fontWeight: 700 }}
                                    >
                                      Subscribe
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Paper>

                    {/* Pre-booking Providers */}
                    <Paper sx={{ p: 3, borderRadius: 4, mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(56, 189, 248, 0.02)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Calendar size={22} color={theme.palette.info.main} /> Pre-booking Providers
                      </Typography>
                      {preBookingFarmers.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">No farmers are currently offering pre-bookings directly.</Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {preBookingFarmers.map((farmer) => {
                            const pDate = getPreBookingDate(farmer._id);
                            const pQty = getPreBookingQty(farmer._id);
                            const pShift = getPreBookingShift(farmer._id);
                            return (
                            <Grid item xs={12} lg={6} key={farmer._id}>
                              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', borderLeft: '4px solid #38bdf8' }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56, fontSize: '1.4rem' }}>
                                        {farmer.firstName?.[0] || 'F'}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{farmer.firstName} {farmer.lastName}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{farmer.address}</Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography variant="h6" sx={{ fontWeight: 900, color: 'info.main' }}>₹{farmer.preBookingMilkRate}<Typography component="span" variant="caption">/L</Typography></Typography>
                                      <Chip label={`Max Range: ${farmer.preBookingDeliveryRange} km`} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.65rem' }} />
                                    </Box>
                                  </Box>
                                  <Divider sx={{ my: 2 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{farmer.avgRating?.toFixed(1) || '0.0'}</Typography>
                                      <Typography variant="caption" color="text.secondary">({farmer.totalReviews} reviews)</Typography>
                                    </Box>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <TextField
                                          type="date"
                                          size="small"
                                          value={pDate}
                                          onChange={(e) => setPreBookingDate(farmer._id, e.target.value)}
                                          InputLabelProps={{ shrink: true }}
                                          sx={{ flexGrow: 1 }}
                                      />
                                      <TextField
                                          select
                                          size="small"
                                          value={pShift}
                                          onChange={(e) => setPreBookingShift(farmer._id, e.target.value)}
                                          SelectProps={{ native: true }}
                                          sx={{ minWidth: 100 }}
                                      >
                                          <option value="Morning">Morning</option>
                                          <option value="Evening">Evening</option>
                                      </TextField>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.02)', py: 0.5, px: 1, borderRadius: 2 }}>
                                        <IconButton size="small" onClick={() => setPreBookingQty(farmer._id, Math.max(1, pQty - 1))} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                                          <Minus size={14} />
                                        </IconButton>
                                        <Typography sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{pQty}</Typography>
                                        <IconButton size="small" onClick={() => setPreBookingQty(farmer._id, pQty + 1)} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                                          <Plus size={14} />
                                        </IconButton>
                                      </Box>
                                      <Button
                                        variant="contained"
                                        color="info"
                                        onClick={() => handlePreBookingRequest(farmer._id, pQty, farmer.preBookingMilkRate, pShift, pDate)}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                                      >
                                        Request (₹{(pQty * farmer.preBookingMilkRate).toFixed(0)})
                                      </Button>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );})}
                        </Grid>
                      )}
                    </Paper>

                    {/* Available Farmers */}
                    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Sprout size={22} color={theme.palette.primary.main} /> Local Farmers
                        </Typography>
                        <TextField
                          id="browse-date-picker"
                          label="Select Date"
                          type="date"
                          size="small"
                          value={browseDate}
                          onChange={(e) => {
                            setBrowseDate(e.target.value);
                            fetchDirectAvailabilities(e.target.value);
                          }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ minWidth: 200 }}
                        />
                      </Box>
                      {directAvailabilities.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">No farmers are currently accepting direct sale requests.</Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={3} alignItems="stretch">
                          {directAvailabilities.map((avail) => {
                            const qty = getDirectBuyQty(avail._id);
                            const setQty = (v) => setDirectBuyQty(avail._id, typeof v === 'function' ? v(qty) : v);
                            return (
                              <Grid item xs={12} md={6} lg={6} xl={4} key={avail._id} sx={{ display: 'flex' }}>
                                <Card 
                                  variant="outlined" 
                                  sx={{ 
                                    borderRadius: 4, 
                                    width: '100%',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease',
                                    '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.1)', borderColor: 'primary.light' }
                                  }}
                                >
                                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, fontSize: '1.5rem', fontWeight: 800 }}>
                                          {avail.farmer?.firstName?.[0] || 'F'}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{avail.farmer?.firstName} {avail.farmer?.lastName}</Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            <Star size={16} fill="#fbbf24" color="#fbbf24" />
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{avail.farmer?.avgRating?.toFixed(1) || '0.0'}</Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                      <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>₹{avail.pricePerLiter}<Typography component="span" variant="caption" sx={{ ml: 0.5 }}>/L</Typography></Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>{avail.availableQuantity} L available</Typography>
                                        <Chip label={avail.shift} size="small" color="secondary" sx={{ mt: 1, fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                                      </Box>
                                    </Box>

                                    <Divider sx={{ my: 2.5, opacity: 0.6 }} />

                                    <Box sx={{ mt: 'auto' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3, bgcolor: 'rgba(0,0,0,0.02)', py: 1, borderRadius: 3 }}>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => setQty(q => Math.max(1, q - 1))}
                                          sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
                                        >
                                          <Minus size={16} />
                                        </IconButton>
                                        <TextField
                                          type="number"
                                          size="small"
                                          variant="standard"
                                          value={qty}
                                          onChange={(e) => setQty(Math.max(1, Math.min(avail.availableQuantity, parseInt(e.target.value) || 1)))}
                                          inputProps={{ min: 1, max: avail.availableQuantity, style: { textAlign: 'center', width: 40, fontWeight: 800, fontSize: '1.1rem' } }}
                                          InputProps={{ disableUnderline: true }}
                                        />
                                        <IconButton 
                                          size="small" 
                                          onClick={() => setQty(q => Math.min(avail.availableQuantity, q + 1))}
                                          sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
                                        >
                                          <Plus size={16} />
                                        </IconButton>
                                      </Box>

                                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                        <Button
                                          variant="outlined"
                                          onClick={() => avail.farmer?._id && fetchFarmerReviews(avail.farmer._id)}
                                          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', py: 1 }}
                                        >
                                          Reviews
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          color="secondary"
                                          onClick={() => avail.farmer?._id && setSubscriptionModal({
                                            open: true,
                                            farmerId: avail.farmer._id,
                                            farmerName: `${avail.farmer.firstName} ${avail.farmer.lastName}`,
                                            pricePerLiter: avail.pricePerLiter,
                                            deliveryCharge: avail.farmer.subscriptionDeliveryCharge || 0,
                                            shift: avail.shift,
                                            qty
                                          })}
                                          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', py: 1 }}
                                        >
                                          Subscribe
                                        </Button>
                                        <Button
                                          variant="contained"
                                          fullWidth
                                          sx={{ gridColumn: 'span 2', borderRadius: 2.5, fontWeight: 800, py: 1.2, textTransform: 'none', boxShadow: 'none' }}
                                          onClick={() => avail.farmer?._id && handleDirectPurchaseRequest(avail.farmer._id, qty, avail.pricePerLiter, avail.shift)}
                                        >
                                          Request Milk (₹{(qty * avail.pricePerLiter).toFixed(0)})
                                        </Button>
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Paper>
                  </Grid>

                  {/* My Direct Requests */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <UserCheck size={22} color={theme.palette.primary.main} /> My Requests
                      </Typography>
                      {myDirectRequests.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">You haven't made any direct purchase requests yet.</Typography>
                        </Box>
                      ) : (
                        <Box>
                          {myDirectRequests.map((req) => (
                            <Card key={req._id} variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
                              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography sx={{ fontWeight: 700 }}>{req.farmer?.firstName} {req.farmer?.lastName}</Typography>
                                  <Chip
                                    label={req.status}
                                    size="small"
                                    color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'}
                                    sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary">{req.quantity} L · ₹{req.pricePerLiter}/L · {new Date(req.date).toLocaleDateString()}</Typography>
                                {(req.status === 'approved' || req.status === 'delivered') && !req.rating && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700 }}
                                    onClick={() => setFeedbackData({ id: req._id, rating: 5, feedback: '' })}
                                    startIcon={<Star size={14} />}
                                  >
                                    Leave Review
                                  </Button>
                                )}
                                {req.status === 'approved' && req.paymentStatus === 'pending' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    sx={{ mt: 1.5, ml: req.rating ? 0 : 1, borderRadius: 2, fontWeight: 700, boxShadow: 'none' }}
                                    onClick={() => handlePayDirectRequest(req._id, req.totalAmount)}
                                  >
                                    Pay Now (₹{req.totalAmount})
                                  </Button>
                                )}
                                {req.rating && (
                                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} size={14} fill={s <= req.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                                    ))}
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>Reviewed</Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                      {directSaleMessage.text && (
                        <Typography
                          variant="body2"
                          color={directSaleMessage.type === 'error' ? 'error' : 'success.main'}
                          sx={{ mt: 2, textAlign: 'center', fontWeight: 600 }}
                        >
                          {directSaleMessage.text}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* My Subscriptions */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Calendar size={22} color={theme.palette.primary.main} /> My Active Subscriptions
                      </Typography>
                      {mySubscriptions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">No active milk subscriptions pre-booked with local farmers.</Typography>
                        </Box>
                      ) : (
                        <Box>
                          {mySubscriptions.map((sub) => (
                            <Card key={sub._id} variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
                              <CardContent sx={{ pb: '16px !important' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Farmer: {sub.farmer?.firstName} {sub.farmer?.lastName}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                      {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Chip label={`${sub.quantityPerDay} L`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                      <Chip label={sub.shift} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                      <Chip label={sub.status} size="small" color={sub.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>₹{sub.totalAmount}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">Total Paid Limit</Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Transaction Ledger (Farmer) */}
              {activeTab === 'history' && (
                <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Transaction Ledger</Typography>
                    <TextField 
                      size="small"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                      }}
                      sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <TableHead sx={{ bgcolor: 'rgba(26, 93, 26, 0.05)' }}>
                        <TableRow>
                          {['Date & Time', 'Qty (L)', 'Price/L', 'Total', 'Status'].map((head) => (
                            <TableCell key={head} sx={{ fontWeight: 700, color: 'text.secondary', border: 'none' }}>{head}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRecords.map((record) => (
                          <TableRow key={record._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>{formatDateTime(record.date)}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{record.quantity} L</TableCell>
                            <TableCell>₹{record.pricePerLiter.toFixed(2)}</TableCell>
                            <TableCell sx={{ color: 'primary.main', fontWeight: 800 }}>₹{record.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={record.status} 
                                size="small"
                                color={record.status === 'paid' ? 'success' : 'warning'}
                                sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                    {filteredRecords.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography color="text.secondary">No transactions found matching your search.</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

               {/* Performance Analytics (Farmer) */}
              {activeTab === 'analytics' && (
                <Grid container spacing={3} alignItems="stretch">
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      borderRadius: 4, 
                      height: '100%', 
                      bgcolor: 'rgba(251, 191, 36, 0.05)', 
                      border: '1px solid rgba(251, 191, 36, 0.2)', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                      display: 'flex', 
                      flexDirection: 'column' 
                    }}>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}><Star /></Avatar>
                          <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Farmer Rating</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1 }}>{analyticsData.rating?.average || 0}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>/ 5.0</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>Based on {analyticsData.rating?.count || 0} reviews</Typography>
                        </Box>
                        <Box sx={{ mt: 3, display: 'flex', gap: 0.5 }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={20} fill={s <= Math.round(analyticsData.rating?.average || 0) ? '#fbbf24' : 'none'} color="#fbbf24" style={{ opacity: s <= Math.round(analyticsData.rating?.average || 0) ? 1 : 0.2 }} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      borderRadius: 4, 
                      height: '100%', 
                      bgcolor: 'rgba(245, 158, 11, 0.05)', 
                      border: '1px solid rgba(245, 158, 11, 0.2)', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                      display: 'flex', 
                      flexDirection: 'column' 
                    }}>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}><TrendingUp /></Avatar>
                          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Delivery</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1 }}>
                              {analyticsData.income.length > 0 ? analyticsData.income[analyticsData.income.length - 1].quantity.toFixed(1) : 0}
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 800 }}>L</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                            Last delivery recorded in {analyticsData.income.length > 0 ? analyticsData.income[analyticsData.income.length - 1]._id : 'this period'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider', minHeight: 450, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center' }}>Monthly Income Tracker</Typography>
                        <Box sx={{ position: 'absolute', right: 0 }}>
                          <BarChart3 size={28} color={theme.palette.secondary.main} />
                        </Box>
                      </Box>
                      <Box sx={{ width: '100%', flexGrow: 1, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {analyticsData.income && analyticsData.income.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={analyticsData.income} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="_id" 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }}
                                dy={10}
                                tickFormatter={(str) => {
                                  try {
                                    if (!str) return '';
                                    const parts = str.split('-');
                                    if (parts.length === 2) {
                                      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                                      return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                                    }
                                    return str;
                                  } catch (e) {
                                    return str;
                                  }
                                }}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }}
                                dx={-5}
                                tickFormatter={(val) => `₹${val}`}
                              />
                              <ChartTooltip 
                                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                itemStyle={{ fontWeight: 700 }}
                                labelStyle={{ color: '#64748b', marginBottom: 4 }}
                              />
                              <Bar 
                                dataKey="earnings" 
                                fill={theme.palette.primary.main} 
                                radius={[8, 8, 0, 0]}
                                barSize={isMobile ? 30 : 50}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 10 }}>
                            <Box sx={{ color: 'text.secondary', mb: 2, opacity: 0.3 }}><BarChart3 size={80} /></Box>
                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>No Income Data Found</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Start delivering milk to see your income tracker in action.</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Cattle Feed Shop (Farmer) */}
              {activeTab === 'feed' && (
                <Grid container spacing={3}>
                  {/* Product Area */}
                  <Grid item xs={12} md={8.5} lg={9}>
                    <Box sx={{ 
                      mb: 4, 
                      display: 'flex', 
                      gap: 2, 
                      overflowX: 'auto', 
                      pb: 1,
                      '&::-webkit-scrollbar': { height: 6 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3 }
                    }}>
                      {[
                        { id: 'All', label: 'All', icon: <Package size={18} /> },
                        { id: 'Green Fodder', label: 'Green', icon: <Sprout size={18} /> },
                        { id: 'Dry Fodder', label: 'Dry', icon: <Leaf size={18} /> },
                        { id: 'Concentrate Feed', label: 'Concentrate', icon: <TrendingUp size={18} /> },
                        { id: 'Cattle Supplements', label: 'Supplements', icon: <Plus size={18} /> }
                      ].map(cat => (
                        <Button
                          key={cat.id}
                          onClick={() => setSupplementCategory(cat.id)}
                          variant={supplementCategory === cat.id ? 'contained' : 'outlined'}
                          startIcon={cat.icon}
                          sx={{
                            borderRadius: '14px',
                            px: 3,
                            py: 1,
                            whiteSpace: 'nowrap',
                            fontWeight: 700,
                            textTransform: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            bgcolor: supplementCategory === cat.id ? 'primary.main' : 'white',
                            color: supplementCategory === cat.id ? 'white' : 'text.secondary',
                            border: '2px solid',
                            borderColor: supplementCategory === cat.id ? 'primary.main' : 'divider',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: 'primary.main',
                              bgcolor: supplementCategory === cat.id ? 'primary.dark' : 'rgba(26, 93, 26, 0.05)'
                            }
                          }}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </Box>

                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(3, 1fr)',
                        xl: 'repeat(4, 1fr)'
                      },
                      gap: 3
                    }}>
                      {supplements
                        .filter(s => supplementCategory === 'All' || s.category === supplementCategory)
                        .map(item => (
                          <motion.div 
                            key={item._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -10 }}
                          >
                            <Card sx={{ 
                              borderRadius: 4, 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column',
                              position: 'relative',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                borderColor: 'primary.light'
                              }
                            }}>
                              {!item.inStock && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                                  <Chip label="OUT OF STOCK" color="error" sx={{ fontWeight: 900, borderRadius: 2 }} />
                                </Box>
                              )}
                              
                              <Box sx={{ height: 160, position: 'relative', bgcolor: 'rgba(0,0,0,0.02)' }}>
                                {item.image ? (
                                  <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                    <Package size={48} />
                                  </Box>
                                )}
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}>
                                  <Chip 
                                    label={item.category} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: 'rgba(255,255,255,0.9)', 
                                      color: 'primary.main', 
                                      fontWeight: 800, 
                                      fontSize: '0.6rem',
                                      height: 20
                                    }} 
                                  />
                                </Box>
                              </Box>

                              <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 1, height: '2.4em', overflow: 'hidden' }}>
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '3em' }}>
                                  {item.description}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 'auto' }}>
                                  <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
                                      ₹{item.pricePerUnit}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      per {item.unit}
                                    </Typography>
                                  </Box>
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    onClick={() => addToCart(item._id)}
                                    disabled={!item.inStock}
                                    sx={{ 
                                      borderRadius: 2, 
                                      fontWeight: 800,
                                      px: 2,
                                      minWidth: 'unset',
                                      boxShadow: 'none',
                                      '&:hover': { boxShadow: '0 4px 12px rgba(26, 93, 26, 0.2)' }
                                    }}
                                  >
                                    {cart[item._id] ? `+${cart[item._id]}` : 'Add'}
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                    </Box>
                  </Grid>

                  {/* Cart Area */}
                  <Grid item xs={12} md={3.5} lg={3}>
                    <Paper sx={{ p: 3, borderRadius: 5, position: 'sticky', top: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ShoppingBag size={22} color={theme.palette.secondary.main} /> Your Cart
                      </Typography>
                      
                      {Object.keys(cart).length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">Your cart is empty</Typography>
                        </Box>
                      ) : (
                        <Box>
                          <List sx={{ mb: 3 }}>
                            {Object.entries(cart).map(([id, qty]) => {
                              const item = supplements.find(s => s._id === id);
                              return (
                                <ListItem key={id} disablePadding sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}>
                                  <ListItemText 
                                    primary={item?.name} 
                                    secondary={`₹${item?.pricePerUnit} x ${qty}`}
                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                                  />
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton size="small" onClick={() => removeFromCart(id)}><Minus size={14} /></IconButton>
                                    <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</Typography>
                                    <IconButton size="small" onClick={() => addToCart(id)}><Plus size={14} /></IconButton>
                                  </Box>
                                </ListItem>
                              );
                            })}
                          </List>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                            <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ₹{Object.entries(cart).reduce((total, [id, qty]) => {
                                const item = supplements.find(s => s._id === id);
                                return total + (item?.pricePerUnit || 0) * qty;
                              }, 0).toFixed(2)}
                            </Typography>
                          </Box>
                          <Button 
                            fullWidth 
                            variant="contained" 
                            size="large"
                            onClick={handleSupplementOrder}
                            sx={{ borderRadius: 3, fontWeight: 800, py: 1.5 }}
                          >
                            Place Order
                          </Button>
                        </Box>
                      )}
                      
                      {orderMessage.text && (
                        <Typography 
                          variant="caption" 
                          color={orderMessage.type === 'error' ? 'error' : 'success.main'}
                          sx={{ display: 'block', mt: 2, textAlign: 'center', fontWeight: 600 }}
                        >
                          {orderMessage.text}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Shopping History Section */}
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Paper sx={{ p: 4, borderRadius: 5, boxShadow: '0 4px 25px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <History size={24} color={theme.palette.primary.main} /> Shopping History
                        </Typography>
                        <Chip 
                          label={`${supplementOrders.length} Orders`} 
                          color="primary" 
                          variant="outlined" 
                          sx={{ fontWeight: 700, borderRadius: 2 }} 
                        />
                      </Box>

                      {supplementOrders.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'rgba(0,0,0,0.01)', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
                          <Typography color="text.secondary">No shopping history available yet.</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                              <tr>
                                {['Date & Time', 'Items Purchased', 'Total Amount', 'Status'].map((h) => (
                                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {supplementOrders.map((order) => (
                                <tr key={order._id} style={{ backgroundColor: 'white' }}>
                                  <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDateTime(order.createdAt || order.date)}</Typography>
                                  </td>
                                  <td style={{ padding: '16px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {order.items.map((item, idx) => (
                                        <Chip 
                                          key={idx} 
                                          label={`${item.supplement?.name || 'Item'} x ${item.quantity}`} 
                                          size="small" 
                                          sx={{ 
                                            bgcolor: 'rgba(26, 93, 26, 0.05)', 
                                            fontWeight: 600, 
                                            fontSize: '0.75rem',
                                            border: '1px solid rgba(26, 93, 26, 0.1)' 
                                          }} 
                                        />
                                      ))}
                                    </Box>
                                  </td>
                                  <td style={{ padding: '16px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    <Typography sx={{ fontWeight: 900, color: 'primary.main' }}>₹{order.totalAmount.toFixed(2)}</Typography>
                                  </td>
                                  <td style={{ padding: '16px', borderRadius: '12px 0 12px 0', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                                    <Chip 
                                      label={order.paymentStatus === 'Completed' ? 'Paid' : order.status} 
                                      size="small"
                                      color={order.paymentStatus === 'Completed' ? 'success' : 'warning'}
                                      sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Purchase History (Customer) */}
              {activeTab === 'my-purchases' && (
                <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                   <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Purchase History</Typography>
                    <TextField 
                      size="small"
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                      }}
                      sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <TableHead sx={{ bgcolor: 'rgba(26, 93, 26, 0.05)' }}>
                        <TableRow>
                          {['Date', 'Qty (L)', 'Rate', 'Delivery', 'Total', 'Status', 'Invoice'].map((head) => (
                            <TableCell key={head} sx={{ fontWeight: 700, color: 'text.secondary', border: 'none' }}>{head}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPurchases.map((purchase) => (
                          <TableRow key={purchase._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>
                              {formatDateTime(purchase.date)}
                              <Typography variant="caption" display="block" color="text.secondary">Shift: {purchase.shift || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{purchase.quantity} L</TableCell>
                            <TableCell>₹{purchase.rate}</TableCell>
                            <TableCell>₹{purchase.deliveryCharge}</TableCell>
                            <TableCell sx={{ color: 'primary.main', fontWeight: 800 }}>₹{purchase.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={purchase.status} 
                                size="small"
                                color={purchase.status === 'delivered' ? 'success' : purchase.status === 'pending' ? 'warning' : 'default'}
                                sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              {purchase.invoicePath ? (
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  component="a" 
                                  href={`http://localhost:5000${purchase.invoicePath}`} 
                                  target="_blank"
                                >
                                  <DownloadCloud size={18} />
                                </IconButton>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                    {filteredPurchases.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography color="text.secondary">No purchase history found.</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* My Invoices Section */}
                  <Box sx={{ mt: 6, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>My Invoices</Typography>
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <TableHead sx={{ bgcolor: 'rgba(26, 93, 26, 0.05)' }}>
                        <TableRow>
                          {['Date', 'Description', 'Payment ID', 'Amount', 'Action'].map((head) => (
                            <TableCell key={head} sx={{ fontWeight: 700, color: 'text.secondary', border: 'none' }}>{head}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myInvoices.map((inv) => (
                          <TableRow key={inv._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{inv.description}</TableCell>
                            <TableCell>{inv.paymentId}</TableCell>
                            <TableCell sx={{ color: 'primary.main', fontWeight: 800 }}>₹{inv.amount?.toFixed(2)}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                component="a" 
                                href={`http://localhost:5000${inv.fileUrl}`} 
                                target="_blank"
                                download
                              >
                                <DownloadCloud size={18} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                    {myInvoices.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No invoices available.</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Society Milk (Customer Purchase) */}
              {activeTab === 'purchase' && (
                <Grid container spacing={3} justifyContent="center">
                  <Grid item xs={12} lg={10}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ShoppingCart size={22} color={theme.palette.primary.main} /> Buy Fresh Milk
                          </Typography>
                          
                          {totalAvailable > 0 ? (
                            <Box component="form" onSubmit={handlePurchase}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    label="Quantity (Liters)"
                                    type="number"
                                    inputProps={{ step: 0.1, max: currentShiftAvailable }}
                                    value={purchaseQty}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val > currentShiftAvailable) {
                                        setPurchaseMessage({ type: 'error', text: `Only ${currentShiftAvailable.toFixed(1)}L available` });
                                      } else {
                                        setPurchaseMessage({ type: '', text: '' });
                                      }
                                      setPurchaseQty(val);
                                    }}
                                    required
                                    helperText={`Available: ${currentShiftAvailable.toFixed(1)} L`}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    select
                                    label="Order Type"
                                    value={deliveryType}
                                    onChange={(e) => setDeliveryType(e.target.value)}
                                    SelectProps={{ native: true }}
                                  >
                                    <option value="COD">Home Delivery (COD)</option>
                                    <option value="Takeaway">Takeaway (Zero Delivery)</option>
                                  </TextField>
                                </Grid>
                                <Grid item xs={12} sm={12}>
                                  <TextField
                                    fullWidth
                                    select
                                    label="Shift"
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    SelectProps={{ native: true }}
                                    required
                                  >
                                    <option value="Morning">Morning</option>
                                    <option value="Evening">Evening</option>
                                  </TextField>
                                </Grid>
                                {deliveryType === 'COD' && (
                                  <Grid item xs={12}>
                                    <TextField
                                      fullWidth
                                      label="Delivery Distance (km)"
                                      type="number"
                                      inputProps={{ step: 0.1 }}
                                      value={distance}
                                      onChange={(e) => setDistance(e.target.value)}
                                      placeholder="e.g. 2.5"
                                      required
                                      InputProps={{
                                        endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                      }}
                                    />
                                  </Grid>
                                )}
                              </Grid>

                              <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(26, 93, 26, 0.03)', borderRadius: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Price Breakdown</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Milk Cost ({purchaseQty || 0}L × ₹{availability.rate})</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(purchaseQty ? parseFloat(purchaseQty) * availability.rate : 0).toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                  <Typography variant="body2">Delivery Charge</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{deliveryType === 'Takeaway' ? '0.00' : (distance ? (parseFloat(distance) * 10).toFixed(2) : '10.00')}</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Total Amount</Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    ₹{(
                                      (purchaseQty ? parseFloat(purchaseQty) * availability.rate : 0) +
                                      (deliveryType === 'Takeaway' ? 0 : (distance ? parseFloat(distance) * 10 : 10))
                                    ).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>

                              <Button
                                fullWidth
                                size="large"
                                variant="contained"
                                type="submit"
                                disabled={!purchaseQty || purchaseQty > currentShiftAvailable}
                                sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 800 }}
                              >
                                Place Order
                              </Button>

                              {purchaseMessage.text && (
                                <Fade in>
                                  <Typography 
                                    variant="body2" 
                                    color={purchaseMessage.type === 'error' ? 'error' : 'success.main'} 
                                    sx={{ mt: 2, textAlign: 'center', fontWeight: 600 }}
                                  >
                                    {purchaseMessage.text}
                                  </Typography>
                                </Fade>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="h6" color="text.secondary" gutterBottom>Out of Stock</Typography>
                              <Typography variant="body2" color="text.secondary">We are sorry, but all milk for today has been sold out.</Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <Card sx={{ borderRadius: 4, bgcolor: 'primary.main', color: 'white', p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><Info /></Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>Society Standard</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>Quality Assures Freshness</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.7, mb: 3 }}>
                            Our society milk is collected from local dairy farmers and undergoes rigorous quality testing. We ensure the best price for both farmers and consumers.
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip label="Tested for Fat & SNF" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
                            <Chip label="Zero Adulteration" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
                            <Chip label="Farm Fresh" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Box>

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackData.id} onClose={() => setFeedbackData({ id: null, rating: 5, feedback: '' })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Star size={22} color="#fbbf24" /> Share Your Experience
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={submitFeedback} id="feedback-form">
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 1 }}>Your Rating</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
              {[1,2,3,4,5].map(s => (
                <IconButton key={s} onClick={() => setFeedbackData(prev => ({ ...prev, rating: s }))} sx={{ p: 0.5 }}>
                  <Star size={32} fill={s <= feedbackData.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                </IconButton>
              ))}
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Your Review (Optional)"
              value={feedbackData.feedback}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Tell us about your experience with this farmer..."
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setFeedbackData({ id: null, rating: 5, feedback: '' })} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button form="feedback-form" type="submit" variant="contained" sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>Submit Review</Button>
        </DialogActions>
      </Dialog>

      {/* Subscription Modal */}
      <Dialog open={subscriptionModal.open} onClose={() => setSubscriptionModal({ ...subscriptionModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Calendar size={20} color={theme.palette.secondary.main} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Setup Subscription</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Farmer: {subscriptionModal.farmerName}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`₹${subscriptionModal.pricePerLiter} / L`} size="small" color="success" />
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity (L/Day)"
                  type="number"
                  inputProps={{ step: 0.5, min: 1 }}
                  value={subscriptionModal.qty}
                  onChange={(e) => setSubscriptionModal({ ...subscriptionModal, qty: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Shift"
                  SelectProps={{ native: true }}
                  value={subscriptionModal.shift}
                  onChange={(e) => setSubscriptionModal({ ...subscriptionModal, shift: e.target.value })}
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={subscriptionData.startDate}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={subscriptionData.endDate}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Delivery Location / Address"
                  type="text"
                  value={subscriptionData.deliveryLocation}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, deliveryLocation: e.target.value })}
                  placeholder="E.g., 123 Main St, Springfield"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Distance (km)"
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                  value={subscriptionData.distance}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, distance: e.target.value })}
                />
              </Grid>
            </Grid>

            {subscriptionData.startDate && subscriptionData.endDate && (
              <Paper sx={{ p: 2, bgcolor: 'rgba(26, 93, 26, 0.05)', border: '1px solid rgba(26, 93, 26, 0.2)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Milk Cost:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{calculateSubscriptionTotal().milkTotal}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Duration Delivery Charge (₹15/km/day):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{calculateSubscriptionTotal().delivery}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Amount:</Typography>
                  <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 900 }}>₹{calculateSubscriptionTotal().total}</Typography>
                </Box>
              </Paper>
            )}

            {subscriptionMessage.text && (
              <Typography color={subscriptionMessage.type === 'error' ? 'error' : 'success.main'} sx={{ fontWeight: 600, textAlign: 'center' }}>
                {subscriptionMessage.text}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSubscriptionModal({ ...subscriptionModal, open: false })} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button onClick={handleSubscriptionSubmit} variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Confirm pre-booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Farmer Reviews Modal */}
      <Dialog 
        open={showReviewsModal} 
        onClose={() => setShowReviewsModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
          <Star size={22} color="#fbbf24" fill="#fbbf24" /> Farmer Reviews
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {myDirectRequests.find(r => r.farmer?._id === farmerReviews.farmerId && (r.status === 'approved' || r.status === 'delivered') && !r.rating) && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Share your experience!</Typography>
                <Typography variant="caption">You have a recent completed order with this farmer.</Typography>
              </Box>
              <Button 
                variant="contained" 
                color="secondary" 
                size="small" 
                onClick={() => {
                  const req = myDirectRequests.find(r => r.farmer?._id === farmerReviews.farmerId && (r.status === 'approved' || r.status === 'delivered') && !r.rating);
                  setFeedbackData({ id: req._id, rating: 5, feedback: '' });
                  setShowReviewsModal(false);
                }}
                sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
              >
                Rate & Review
              </Button>
            </Box>
          )}

          {farmerReviews.reviews.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No reviews yet for this farmer.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {farmerReviews.reviews.map((rev, idx) => (
                <Box key={idx} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{rev.user?.firstName} {rev.user?.lastName}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} fill={s <= rev.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    "{rev.feedback || 'No written feedback provided.'}"
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowReviewsModal(false)} variant="contained" sx={{ borderRadius: 2, fontWeight: 800 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
