import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaSignOutAlt, FaCheese, FaUserTie, FaShoppingCart, FaFillDrip, FaHistory, FaCalculator } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('profile'); // 'profile', 'history'
  const [milkRecords, setMilkRecords] = React.useState([]);
  const [purchases, setPurchases] = React.useState([]);
  const [availability, setAvailability] = React.useState({ available: 0, rate: 50, deliveryCharge: 10 });
  const [loadingRecords, setLoadingRecords] = React.useState(false);
  const [loadingAvailability, setLoadingAvailability] = React.useState(false);
  const [purchaseQty, setPurchaseQty] = React.useState('');
  const [deliveryType, setDeliveryType] = React.useState('COD');
  const [purchaseMessage, setPurchaseMessage] = React.useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    if (activeTab === 'history' && user?.role === 'farmer') {
      fetchMilkHistory();
    }
    if (activeTab === 'my-purchases' && user?.role === 'user') {
      fetchMyPurchases();
    }
    if (activeTab === 'purchase' && user?.role === 'user') {
      fetchAvailability();
    }
  }, [activeTab]);

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

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseQty || purchaseQty <= 0) {
      setPurchaseMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/purchase',
        {
          quantity: parseFloat(purchaseQty),
          deliveryType: deliveryType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPurchaseMessage({ type: 'success', text: `Order placed successfully! (${deliveryType === 'Takeaway' ? 'Takeaway' : 'COD'})` });
      setPurchaseQty('');
      fetchAvailability();
    } catch (error) {
      setPurchaseMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to place order'
      });
    }
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

  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <FaUserTie />;
      case 'farmer':
        return <FaCheese />;
      case 'user':
        return <FaShoppingCart />;
      default:
        return <FaUser />;
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator';
      case 'farmer':
        return 'Farmer (Milk Seller)';
      case 'user':
        return 'Customer (Milk Buyer)';
      default:
        return 'User';
    }
  };

  const totalCost = purchaseQty ? (parseFloat(purchaseQty) * availability.rate + availability.deliveryCharge).toFixed(2) : '0.00';

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div className="welcome-section">
            <div className="user-avatar">
              {getRoleIcon()}
            </div>
            <div>
              <h1>Welcome, {user?.firstName}!</h1>
              <p className="user-role">{getRoleName()}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt /> Logout
          </button>
        </div>

        <div className="dashboard-tabs">
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <FaUser /> Profile
          </button>
          {user?.role === 'farmer' && (
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <FaHistory /> Transaction Ledger
            </button>
          )}
          {user?.role === 'user' && (
            <>
              <button className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`} onClick={() => setActiveTab('purchase')}>
                <FaFillDrip /> Purchase Milk
              </button>
              <button className={`tab-btn ${activeTab === 'my-purchases' ? 'active' : ''}`} onClick={() => setActiveTab('my-purchases')}>
                <FaHistory /> My Purchases
              </button>
            </>
          )}
        </div>

        <div className="dashboard-content">
          {activeTab === 'profile' && (
            <div className="info-card">
              <h2>User Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{user?.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span className="info-value">{getRoleName()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="milk-history-section">
              <div className="info-card">
                <div className="section-header-with-search">
                  <h2>Transaction Ledger</h2>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {loadingRecords ? (
                  <p>Loading records...</p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Qty (L)</th>
                          <th>Price/L</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map(record => (
                          <tr key={record._id}>
                            <td>{new Date(record.date).toLocaleDateString()}</td>
                            <td>{record.quantity}</td>
                            <td>₹{record.pricePerLiter.toFixed(2)}</td>
                            <td>₹{record.totalAmount.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge ${record.status}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredRecords.length === 0 && <p className="no-records">No transactions matched your search.</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="purchase-section">
              <div className="info-card">
                <h2>Purchase Pure Milk</h2>
                <div className="availability-badge">
                  {loadingAvailability ? 'Checking availability...' : (
                    availability.available > 0 ? (
                      <span className="available">Available Milk Today: {availability.available.toFixed(2)} L</span>
                    ) : (
                      <span className="unavailable">Sorry, no milk available for purchase today.</span>
                    )
                  )}
                </div>

                {availability.available > 0 && (
                  <form onSubmit={handlePurchase} className="purchase-form">
                    <div className="rate-info">
                      <p>Rate: ₹{availability.rate}/L (Today's Avg)</p>
                      <p>Delivery: ₹{deliveryType === 'Takeaway' ? '0' : availability.deliveryCharge}</p>
                    </div>

                    <div className="form-group-row">
                      <div className="form-group">
                        <label>Quantity (Liters)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={purchaseQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val > availability.available) {
                              setPurchaseMessage({ type: 'error', text: `Maximum available is ${availability.available.toFixed(2)}L` });
                            } else {
                              setPurchaseMessage({ type: '', text: '' });
                            }
                            setPurchaseQty(val);
                          }}
                          placeholder="Enter quantity"
                          max={availability.available}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Order Type</label>
                        <select
                          value={deliveryType}
                          onChange={(e) => setDeliveryType(e.target.value)}
                        >
                          <option value="COD">Home Delivery (COD)</option>
                          <option value="Takeaway">Takeaway (Zero Delivery)</option>
                        </select>
                      </div>
                    </div>

                    <div className="cost-summary">
                      <p>Milk Cost: ₹{(purchaseQty ? (parseFloat(purchaseQty) * availability.rate) : 0).toFixed(2)}</p>
                      <p>Delivery Charge: ₹{deliveryType === 'Takeaway' ? '0.00' : availability.deliveryCharge.toFixed(2)}</p>
                      <div className="total-cost">
                        Total Amount: ₹{totalCost}
                      </div>
                    </div>

                    <div className="payment-method-info">
                      <p><FaShoppingCart /> Payment Mode: <strong>{deliveryType === 'Takeaway' ? 'Pay at Society' : 'Cash on Delivery (COD)'}</strong></p>
                    </div>

                    <button type="submit" className="purchase-btn" disabled={!purchaseQty || purchaseQty > availability.available}>
                      Place Order
                    </button>
                  </form>
                )}

                {purchaseMessage.text && (
                  <div className={`message ${purchaseMessage.type}`}>
                    {purchaseMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'my-purchases' && (
            <div className="my-purchases-section">
              <div className="info-card">
                <div className="section-header-with-search">
                  <h2>My Purchase History</h2>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search purchases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {loadingRecords ? (
                  <p>Loading purchases...</p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Qty (L)</th>
                          <th>Rate/L</th>
                          <th>Delivery</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPurchases.map(purchase => (
                          <tr key={purchase._id}>
                            <td>{new Date(purchase.date).toLocaleDateString()}</td>
                            <td>{purchase.quantity}</td>
                            <td>₹{purchase.rate}</td>
                            <td>₹{purchase.deliveryCharge}</td>
                            <td>₹{purchase.totalAmount.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge ${purchase.status}`}>
                                {purchase.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredPurchases.length === 0 && <p className="no-records">No purchase history found.</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="society-info">
            <h3>Dairy Society Management System</h3>
            <p>Areeparambu, Cherthala</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
