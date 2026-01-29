# Dairy Society Management System - Business Rules

## User Roles

### 1. Admin
- **Default Credentials**: username: `admin`, password: `admin`
- **Responsibilities**:
  - Manage the entire system
  - Provide notifications to farmers about:
    - Availability of cattle feeds
    - Other products for farmers
  - Oversee all operations

### 2. Farmer (Milk Seller)
- **Registration**: Requires Aadhar number
- **Business Activity**: 
  - **Sell ONLY milk** (not milk products)
  - Cannot sell processed dairy products
- **Future Features**:
  - Money management (to be implemented later)

### 3. User (Milk Buyer)
- **Registration**: No Aadhar required
- **Business Activity**:
  - **Buy ONLY milk** from the society
  - Cannot purchase milk products

## Product Rules

- **Farmers sell**: Raw milk only
- **Users buy**: Raw milk only
- **Milk products** (cheese, butter, yogurt, etc.) are NOT part of this system

## Location

- **Address**: Areeparambu, Cherthala

## Future Enhancements

- Money management system for farmers
- Notification system for admin to communicate with farmers
- Cattle feed availability notifications
- Other farmer product notifications
