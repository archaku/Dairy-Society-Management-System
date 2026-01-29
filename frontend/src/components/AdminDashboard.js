import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaSignOutAlt, FaUserTie, FaCheese, FaShoppingCart, FaPlus, FaEdit, FaTrash, FaUsers, FaTimes, FaCheck, FaFillDrip } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [milkSearchQuery, setMilkSearchQuery] = useState('');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
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

      const [usersData, farmersData, milkData, purchasesData] = await Promise.all([
        fetchDataSafely('http://localhost:5000/api/admin/users'),
        fetchDataSafely('http://localhost:5000/api/admin/farmers'),
        fetchDataSafely('http://localhost:5000/api/milk/admin/all'),
        fetchDataSafely('http://localhost:5000/api/purchase/admin/all')
      ]);

      if (usersData) setUsers(usersData.users);
      if (farmersData) setFarmers(farmersData.farmers);
      if (milkData) setMilkRecords(milkData.records);
      if (purchasesData) setPurchases(purchasesData.purchases);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handlePayment = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/milk/admin/pay/${id}`, {}, config);
      fetchData();
    } catch (error) {
      alert('Error updating payment status');
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
    } else {
      setPricePreview(null);
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
      alert(error.response?.data?.message || 'Error recording delivery');
    }
  };

  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFarmers = farmers.filter(f =>
    f.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMilkRecords = milkRecords.filter(r =>
    r.farmer?.firstName?.toLowerCase().includes(milkSearchQuery.toLowerCase()) ||
    r.farmer?.lastName?.toLowerCase().includes(milkSearchQuery.toLowerCase()) ||
    r.farmer?.username?.toLowerCase().includes(milkSearchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(milkSearchQuery.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p =>
    p.user?.firstName?.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
    p.user?.lastName?.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
    p.user?.username?.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(salesSearchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div className="admin-welcome">
          <div className="admin-avatar">
            <FaUserTie />
          </div>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user?.firstName}!</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> Users ({users.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'farmers' ? 'active' : ''}`}
          onClick={() => setActiveTab('farmers')}
        >
          <FaCheese /> Farmers ({farmers.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'milk' ? 'active' : ''}`}
          onClick={() => setActiveTab('milk')}
        >
          <FaFillDrip /> Milk Records ({milkRecords.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <FaShoppingCart /> Milk Sales ({purchases.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'collect' ? 'active' : ''}`}
          onClick={() => setActiveTab('collect')}
        >
          <FaPlus /> Collect Milk
        </button>
      </div>

      <div className="admin-content">
        <div className="table-header">
          <h2>
            {activeTab === 'users' ? 'Users' :
              activeTab === 'farmers' ? 'Farmers' :
                activeTab === 'milk' ? 'Daily Milk Collection' :
                  activeTab === 'sales' ? 'Milk Sales Management' : 'Record New Delivery'}
          </h2>
          {activeTab === 'collect' ? null : (
            <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={activeTab === 'milk' ? milkSearchQuery : (activeTab === 'sales' ? salesSearchQuery : searchQuery)}
                  onChange={(e) => {
                    if (activeTab === 'milk') setMilkSearchQuery(e.target.value);
                    else if (activeTab === 'sales') setSalesSearchQuery(e.target.value);
                    else setSearchQuery(e.target.value);
                  }}
                />
              </div>
              {activeTab !== 'milk' && (
                <button className="add-button" onClick={() => openAddModal(activeTab.slice(0, -1))}>
                  <FaPlus /> Add {activeTab === 'users' ? 'User' : 'Farmer'}
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'milk' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Qty (L)</th>
                  <th>Quality (Q)</th>
                  <th>Rate/L</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMilkRecords.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.farmer?.firstName} {record.farmer?.lastName} (@{record.farmer?.username})</td>
                    <td>{record.quantity}</td>
                    <td>{record.qualityScore.toFixed(3)}</td>
                    <td>₹{record.pricePerLiter.toFixed(2)}</td>
                    <td>₹{record.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      {record.status === 'pending' && (
                        <button
                          className="pay-btn"
                          onClick={() => handlePayment(record._id)}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMilkRecords.length === 0 && (
              <div className="empty-state">No milk records matched your search</div>
            )}
          </div>
        ) : activeTab === 'sales' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Qty (L)</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase._id}>
                    <td>{new Date(purchase.date).toLocaleDateString()}</td>
                    <td>{purchase.user?.firstName} {purchase.user?.lastName}</td>
                    <td>{purchase.user?.phone}</td>
                    <td>{purchase.quantity}</td>
                    <td>{purchase.deliveryType}</td>
                    <td>₹{purchase.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${purchase.status}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td>
                      {purchase.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="approve-btn"
                            onClick={() => handleApprovePurchase(purchase._id)}
                            title="Approve & Deliver"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancelPurchase(purchase._id)}
                            title="Cancel Order"
                          >
                            <FaTimes /> Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPurchases.length === 0 && (
              <div className="empty-state">No sales records matched your search</div>
            )}
          </div>
        ) : activeTab === 'collect' ? (
          <div className="collect-milk-section">
            <div className="info-card collection-card">
              <form onSubmit={handleMilkSubmit} className="milk-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Select Farmer *</label>
                    <select
                      name="farmerId"
                      value={milkFormData.farmerId}
                      onChange={handleMilkFormChange}
                      required
                    >
                      <option value="">-- Select Farmer --</option>
                      {farmers.filter(f => f.isActive).map(f => (
                        <option key={f._id} value={f._id}>
                          {f.firstName} {f.lastName} (@{f.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity (Liters) *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="quantity"
                      value={milkFormData.quantity}
                      onChange={handleMilkFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (%) *</label>
                    <span className="range-hint">Range: {PARAM_RANGES.fat.label}</span>
                    <select name="fat" value={milkFormData.fat} onChange={handleMilkFormChange} required>
                      {generateOptions(PARAM_RANGES.fat.min, PARAM_RANGES.fat.max, PARAM_RANGES.fat.step).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>SNF (%) *</label>
                    <span className="range-hint">Range: {PARAM_RANGES.snf.label}</span>
                    <select name="snf" value={milkFormData.snf} onChange={handleMilkFormChange} required>
                      {generateOptions(PARAM_RANGES.snf.min, PARAM_RANGES.snf.max, PARAM_RANGES.snf.step).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lactose (%) *</label>
                    <span className="range-hint">Range: {PARAM_RANGES.lactose.label}</span>
                    <select name="lactose" value={milkFormData.lactose} onChange={handleMilkFormChange} required>
                      {generateOptions(PARAM_RANGES.lactose.min, PARAM_RANGES.lactose.max, PARAM_RANGES.lactose.step).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Protein (%) *</label>
                    <span className="range-hint">Range: {PARAM_RANGES.protein.label}</span>
                    <select name="protein" value={milkFormData.protein} onChange={handleMilkFormChange} required>
                      {generateOptions(PARAM_RANGES.protein.min, PARAM_RANGES.protein.max, PARAM_RANGES.protein.step).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>pH Level *</label>
                    <span className="range-hint">Range: {PARAM_RANGES.ph.label}</span>
                    <select name="ph" value={milkFormData.ph} onChange={handleMilkFormChange} required>
                      {generateOptions(PARAM_RANGES.ph.min, PARAM_RANGES.ph.max, PARAM_RANGES.ph.step).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {pricePreview && (
                  <div className="price-preview-card">
                    <div className="preview-details">
                      <p className="preview-label">Calculated Rate</p>
                      <h3 className="preview-value">₹{pricePreview.toFixed(2)} / liter</h3>
                      <p className="preview-total">Estimated Total: ₹{(pricePreview * (milkFormData.quantity || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <button type="submit" className="submit-milk-btn">Record Collection</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  {activeTab === 'farmers' && <th>Aadhar</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'users' ? filteredUsers : filteredFarmers).map((item) => (
                  <tr key={item._id}>
                    <td>{item.firstName} {item.lastName}</td>
                    <td>{item.username}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{item.address}</td>
                    {activeTab === 'farmers' && <td>{item.aadhar}</td>}
                    <td>
                      <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-button edit"
                          onClick={() => openEditModal(item, activeTab.slice(0, -1))}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="icon-button toggle"
                          onClick={() => toggleActive(item._id, activeTab.slice(0, -1), item.isActive)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {item.isActive ? <FaTimes /> : <FaCheck />}
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDelete(item._id, activeTab.slice(0, -1))}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(activeTab === 'users' ? filteredUsers : filteredFarmers).length === 0 && (
              <div className="empty-state">No {activeTab} matched your search</div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === 'add' ? 'Add' : 'Edit'} {modalData.type === 'user' ? 'User' : 'Farmer'}</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                {modalData.type === 'farmer' && (
                  <div className="form-group">
                    <label>Aadhar *</label>
                    <input
                      type="text"
                      value={formData.aadhar}
                      onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
                      required
                      maxLength="12"
                    />
                  </div>
                )}
                {modalType === 'add' && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength="6"
                    />
                  </div>
                )}
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {modalType === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
