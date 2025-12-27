
import React, { useState, useEffect } from 'react';
import { UserRole, DriverStatus, BookingStatus, DriverProfile, CustomerProfile, AdminProfile, Booking, Location, BankDetails } from './types';
import LoginPage from './components/LoginPage';
import CustomerDashboard from './components/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard';
import DriverRegistration from './components/DriverRegistration';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

const COMMISSION_RATE = 0.07;

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(() => {
    return localStorage.getItem('inride_current_role') as UserRole | null;
  });
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('inride_current_userid');
  });
  const [isRegisteringDriver, setIsRegisteringDriver] = useState(false);
  
  const [incomingNotification, setIncomingNotification] = useState<{title: string, body: string, icon: string} | null>(null);

  // Core Data State
  const [superAdminEmail, setSuperAdminEmail] = useState(() => localStorage.getItem('inride_sa_email') || 'whitehills003@gmail.com');
  const [superAdminPassword, setSuperAdminPassword] = useState(() => localStorage.getItem('inride_sa_password') || 'Admin@WhiteHills2025');
  const [adminBalance, setAdminBalance] = useState<number>(() => parseFloat(localStorage.getItem('inride_admin_balance') || '2500.00'));
  const [adminBankDetails, setAdminBankDetails] = useState<BankDetails | undefined>(() => {
    const saved = localStorage.getItem('inride_admin_bank');
    return saved ? JSON.parse(saved) : undefined;
  });

  const [drivers, setDrivers] = useState<DriverProfile[]>(() => {
    const saved = localStorage.getItem('inride_drivers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    const saved = localStorage.getItem('inride_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [admins, setAdmins] = useState<AdminProfile[]>(() => {
    const saved = localStorage.getItem('inride_admins');
    return saved ? JSON.parse(saved) : [];
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('inride_bookings');
    return saved ? JSON.parse(saved).map((b: any) => ({ ...b, timestamp: new Date(b.timestamp) })) : [];
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem('inride_drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('inride_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('inride_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('inride_admin_balance', adminBalance.toString()); }, [adminBalance]);

  useEffect(() => {
    if (role) localStorage.setItem('inride_current_role', role);
    else localStorage.removeItem('inride_current_role');
    if (userId) localStorage.setItem('inride_current_userid', userId);
    else localStorage.removeItem('inride_current_userid');
  }, [role, userId]);

  const checkDuplicates = (name: string, email: string, phone: string): string | null => {
    const allUsers = [...customers, ...drivers, ...admins, { name: 'Super Admin', email: superAdminEmail, phone: '000' }];
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) return 'Email already registered';
    if (allUsers.some(u => u.phone === phone)) return 'Phone number already registered';
    if (allUsers.some(u => u.name.toLowerCase() === name.toLowerCase())) return 'Username already taken';
    return null;
  };

  const notify = (title: string, body: string, icon: string) => {
    setIncomingNotification({ title, body, icon });
    setTimeout(() => setIncomingNotification(null), 8000);
  };

  const handleLogin = (id: string, userRole: UserRole) => {
    setUserId(id);
    setRole(userRole);
  };

  const handleLogout = () => {
    setRole(null);
    setUserId(null);
  };

  const handleRegisterCustomer = (data: Partial<CustomerProfile>) => {
    const newId = `c_${Math.random().toString(36).substr(2, 5)}`;
    const newCustomer: CustomerProfile = { id: newId, name: data.name!, email: data.email!, phone: data.phone!, password: data.password!, balance: 1000.00 };
    setCustomers(prev => [...prev, newCustomer]);
    setUserId(newId);
    setRole('CUSTOMER');
  };

  const handleRegisterDriver = (data: any) => {
    const newId = `d_${Math.random().toString(36).substr(2, 5)}`;
    const newDriver: DriverProfile = {
      id: newId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      licenseNumber: data.license,
      vehicleInfo: data.vehicle,
      status: DriverStatus.PENDING,
      documents: data.docs,
      rating: 4.5,
      totalRatings: 0,
      location: { lat: 0, lng: 0 }, // Will be set by GPS
      balance: 200.00 
    };
    setDrivers(prev => [...prev, newDriver]);
    setUserId(newId);
    setRole('DRIVER');
    setIsRegisteringDriver(false);
  };

  const handleAddAdmin = (data: Partial<AdminProfile>) => {
    const newAdmin: AdminProfile = { id: `admin_${Math.random().toString(36).substr(2, 5)}`, name: data.name!, email: data.email!, phone: data.phone!, password: data.password! };
    setAdmins(prev => [...prev, newAdmin]);
  };

  const handleSwitchRole = () => {
    if (role === 'ADMIN') return;
    if (role === 'CUSTOMER') {
      const existingDriver = drivers.find(d => d.id === userId);
      if (existingDriver) setRole('DRIVER');
      else setIsRegisteringDriver(true);
    } else setRole('CUSTOMER');
  };

  const updateCustomerBalance = (id: string, amount: number) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, balance: c.balance + amount } : c));
  const updateDriverBalance = (id: string, amount: number) => setDrivers(prev => prev.map(d => d.id === id ? { ...d, balance: d.balance + amount } : d));
  const updateAdminBalance = (amount: number) => setAdminBalance(prev => prev + amount);

  const addBooking = (booking: Booking) => setBookings(prev => [booking, ...prev]);

  const acceptOffer = (bookingId: string, driverId: string, fare: number) => {
    const customer = customers.find(c => c.id === userId);
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.paymentMethod === 'WALLET' && customer && customer.balance < fare) {
      alert("Insufficient wallet balance!");
      return;
    }
    if (booking?.paymentMethod === 'WALLET') updateCustomerBalance(userId!, -fare);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: BookingStatus.ASSIGNED, driverId, fare } : b));
  };

  const cancelBooking = (id: string) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: BookingStatus.CANCELLED } : b));

  const updateBookingStatus = (bid: string, status: BookingStatus, extra?: any) => {
    setBookings(prev => {
      const updated = prev.map(b => b.id === bid ? { ...b, status, ...extra, offers: extra?.newOffer ? [...b.offers, extra.newOffer] : b.offers } : b);
      if (status === BookingStatus.COMPLETED) {
        const booking = updated.find(b => b.id === bid);
        if (booking && booking.driverId) {
          const comm = booking.fare * COMMISSION_RATE;
          updateAdminBalance(comm);
          if (booking.paymentMethod === 'WALLET') updateDriverBalance(booking.driverId, booking.fare - comm);
          else updateDriverBalance(booking.driverId, -comm);
        }
      }
      return updated;
    });
  };

  const getCurrentUser = () => {
    if (!userId) return null;
    if (role === 'DRIVER') return drivers.find(d => d.id === userId) || null;
    if (role === 'CUSTOMER') return customers.find(c => c.id === userId) || null;
    if (role === 'ADMIN') {
      if (userId === 'admin1') return { id: userId, name: 'Super Admin', email: superAdminEmail, phone: '000', isSuperAdmin: true } as any;
      return admins.find(a => a.id === userId) || null;
    }
    return null;
  };

  const renderView = () => {
    const user = getCurrentUser();
    if (!role) {
      if (isRegisteringDriver) return <DriverRegistration onRegister={handleRegisterDriver} onCancel={() => setIsRegisteringDriver(false)} checkDuplicates={checkDuplicates} onNotify={notify} />;
      return <LoginPage onLogin={handleLogin} onSignupCustomer={handleRegisterCustomer} onShowDriverRegistration={() => setIsRegisteringDriver(true)} drivers={drivers} customers={customers} admins={admins} superAdminEmail={superAdminEmail} superAdminPassword={superAdminPassword} checkDuplicates={checkDuplicates} onNotify={notify} />;
    }
    switch (role) {
      case 'CUSTOMER':
        if (isRegisteringDriver) return <DriverRegistration onRegister={handleRegisterDriver} onCancel={() => setIsRegisteringDriver(false)} checkDuplicates={checkDuplicates} onNotify={notify} />;
        return user ? <CustomerDashboard userId={userId!} drivers={drivers} bookings={bookings.filter(b => b.customerId === userId)} onBook={addBooking} onAcceptOffer={acceptOffer} onCancelBooking={cancelBooking} onRateDriver={() => {}} balance={(user as CustomerProfile).balance} onTopUp={(amt) => updateCustomerBalance(userId!, amt)} /> : null;
      case 'DRIVER':
        return user ? <DriverDashboard profile={user as DriverProfile} bookings={bookings} onUpdateBooking={updateBookingStatus} onTopUpWallet={(amt) => updateDriverBalance(userId!, amt)} /> : null;
      case 'ADMIN':
        return <AdminDashboard currentAdmin={user} drivers={drivers} admins={admins} onAddAdmin={handleAddAdmin} bookings={bookings} onUpdateDriver={(id, status, note) => setDrivers(prev => prev.map(d => d.id === id ? { ...d, status, aiVerificationNote: note } : d))} onDeleteDriver={(id) => setDrivers(prev => prev.filter(d => d.id !== id))} adminBalance={adminBalance} onAdminPayout={updateAdminBalance} adminBankDetails={adminBankDetails} onUpdateAdminBank={setAdminBankDetails} onUpdateSuperAdminCredentials={(email, pass) => { setSuperAdminEmail(email); setSuperAdminPassword(pass); }} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentRole={role} onLogout={handleLogout} onSwitchRole={handleSwitchRole} currentUser={getCurrentUser()} />
      <main className="flex-grow pt-16">{renderView()}</main>
      {incomingNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 animate-slide-down">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-4 flex gap-4 items-start ring-4 ring-indigo-500/10">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0"><i className={`fas ${incomingNotification.icon}`}></i></div>
            <div className="flex-grow">
               <div className="flex justify-between items-center mb-1"><h4 className="font-black text-slate-900 text-sm">{incomingNotification.title}</h4><span className="text-[10px] font-bold text-slate-400 uppercase">Now</span></div>
               <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">{incomingNotification.body}</p>
            </div>
            <button onClick={() => setIncomingNotification(null)} className="text-slate-300 hover:text-slate-600"><i className="fas fa-times text-xs"></i></button>
          </div>
        </div>
      )}
      <footer className="bg-slate-900 text-white py-8 px-4 text-center"><p className="text-sm opacity-60 font-medium">InRide Cab Platform &copy; 2024</p></footer>
    </div>
  );
};

export default App;
