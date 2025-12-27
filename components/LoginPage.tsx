
import React, { useState, useEffect } from 'react';
import { UserRole, DriverProfile, CustomerProfile, AdminProfile } from '../types';
import { dispatchOTP } from '../geminiService';

interface LoginPageProps {
  onLogin: (id: string, role: UserRole) => void;
  onSignupCustomer: (data: any) => void;
  onShowDriverRegistration: () => void;
  drivers: DriverProfile[];
  customers: CustomerProfile[];
  admins: AdminProfile[];
  superAdminEmail: string;
  superAdminPassword: string;
  checkDuplicates: (name: string, email: string, phone: string) => string | null;
  onNotify: (title: string, body: string, icon: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  onSignupCustomer, 
  onShowDriverRegistration, 
  drivers, 
  customers, 
  admins,
  superAdminEmail,
  superAdminPassword,
  checkDuplicates,
  onNotify
}) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP_CUSTOMER' | 'ADMIN_LOGIN' | 'OTP'>('LOGIN');
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 3) {
      setView('ADMIN_LOGIN');
      setLogoClicks(0);
    } else {
      setLogoClicks(newCount);
      setTimeout(() => setLogoClicks(0), 2000);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { identifier, password } = credentials;

    if (identifier === superAdminEmail && password === superAdminPassword) {
      onLogin('admin1', 'ADMIN');
      return;
    }

    const registeredAdmin = admins.find(a => a.email === identifier && a.password === password);
    if (registeredAdmin) {
      onLogin(registeredAdmin.id, 'ADMIN');
      return;
    }

    if (view === 'ADMIN_LOGIN') {
      setError('Invalid Admin credentials.');
      return;
    }

    const driver = drivers.find(d => (d.email === identifier || d.phone === identifier) && d.password === password);
    if (driver) {
      onLogin(driver.id, 'DRIVER');
      return;
    }

    const customer = customers.find(c => (c.email === identifier || c.phone === identifier) && c.password === password);
    if (customer) {
      onLogin(customer.id, 'CUSTOMER');
      return;
    }

    setError('Invalid credentials. Please check your login details.');
    setTimeout(() => setError(''), 3000);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.name || !signupData.email || !signupData.phone || !signupData.password) {
      setError('Please fill all fields');
      return;
    }

    const duplicateError = checkDuplicates(signupData.name, signupData.email, signupData.phone);
    if (duplicateError) {
      setError(duplicateError);
      return;
    }

    setIsVerifying(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    
    // Dispatch via Gemini for "Real-time" effect
    const dispatchResult = await dispatchOTP(signupData.name, signupData.email, code, 'email');
    
    setTimeout(() => {
      setIsVerifying(false);
      setView('OTP');
      onNotify("New Email Received", dispatchResult.message, "fa-envelope");
      // Also simulate SMS arrival
      onNotify("New Message (SMS)", `Your InRide code is ${code}`, "fa-comment-sms");
    }, 1500);
  };

  const handleOtpInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const entered = otpCode.join('');
    if (entered === generatedOtp) {
      onSignupCustomer(signupData);
    } else {
      setError('Invalid verification code. Please try again.');
      setOtpCode(['', '', '', '', '', '']);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    if (role === 'ADMIN') {
      onLogin('admin1', 'ADMIN');
    } else if (role === 'DRIVER') {
      const driver = drivers.find(d => d.status === 'APPROVED') || drivers[0];
      if (driver) onLogin(driver.id, 'DRIVER');
    } else if (role === 'CUSTOMER') {
      const customer = customers[0];
      if (customer) onLogin(customer.id, 'CUSTOMER');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Branding Side */}
        <div className="bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <i className="fas fa-taxi text-[200px] -rotate-12"></i>
          </div>
          
          <div className="relative z-10">
            <div 
              onClick={handleLogoClick}
              className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-10 shadow-xl cursor-default select-none active:scale-95 transition-transform"
            >
              <i className="fas fa-taxi text-3xl"></i>
            </div>
            <h1 className="text-5xl font-black mb-6 leading-tight tracking-tighter">
              {view === 'ADMIN_LOGIN' ? 'Internal' : 'InRide'} <br/><span className="text-indigo-500">{view === 'ADMIN_LOGIN' ? 'Control.' : 'Cab booking Platform'}</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
              Connect with verified drivers and premium transit solutions in seconds.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <i className="fas fa-shield-check text-emerald-400"></i>
              </div>
              <p className="text-sm font-bold text-slate-300">Verified Fleet</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <i className="fas fa-mobile-screen text-indigo-400"></i>
              </div>
              <p className="text-sm font-bold text-slate-300">Real-time Verification</p>
            </div>
          </div>
        </div>

        {/* Auth Side */}
        <div className="p-12 md:p-16 flex flex-col justify-center overflow-y-auto min-h-[600px]">
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center text-center animate-pulse">
               <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <i className="fas fa-paper-plane text-indigo-600 text-3xl animate-bounce"></i>
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">Sending Dispatch</h3>
               <p className="text-slate-500 font-medium">Delivering secure code to your device...</p>
            </div>
          ) : view === 'OTP' ? (
            <div className="animate-fade-in text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Verify it's you</h2>
              <p className="text-slate-500 font-medium mb-10">We've dispatched a code to <br/><span className="text-indigo-600 font-black">{signupData.email}</span></p>
              
              <div className="flex justify-between gap-2 mb-8">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    className="w-12 h-14 bg-slate-50 border-2 border-slate-100 rounded-xl text-center font-black text-xl focus:border-indigo-600 outline-none transition-all"
                  />
                ))}
              </div>

              {error && <p className="text-rose-500 text-xs font-bold mb-6">{error}</p>}

              <button 
                onClick={handleVerifyOtp}
                className="w-full py-5 bg-indigo-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl"
              >
                Verify & Signup
              </button>
              
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Code not received?</p>
                 <p className="text-[10px] text-slate-500 mt-1">Check the notification at the top of the screen.</p>
              </div>
            </div>
          ) : view === 'LOGIN' || view === 'ADMIN_LOGIN' ? (
            <div className="animate-fade-in">
              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {view === 'ADMIN_LOGIN' ? 'Admin Portal' : 'Welcome'}
              </h2>
              <p className="text-slate-500 font-bold mb-8 uppercase text-[10px] tracking-[0.2em]">
                {view === 'ADMIN_LOGIN' ? 'Secure Access' : 'Log in to continue'}
              </p>

              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                  <button onClick={() => handleQuickLogin('CUSTOMER')} className="whitespace-nowrap bg-white px-3 py-2 rounded-lg border border-slate-200 text-[9px] font-black uppercase text-indigo-600">User</button>
                  <button onClick={() => handleQuickLogin('DRIVER')} className="whitespace-nowrap bg-white px-3 py-2 rounded-lg border border-slate-200 text-[9px] font-black uppercase text-indigo-600">Driver</button>
                  <button onClick={() => handleQuickLogin('ADMIN')} className="whitespace-nowrap bg-white px-3 py-2 rounded-lg border border-slate-200 text-[9px] font-black uppercase text-indigo-600">Admin</button>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Phone</label>
                  <input 
                    type="text" required
                    value={credentials.identifier}
                    onChange={e => setCredentials({...credentials, identifier: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" required
                    value={credentials.password}
                    onChange={e => setCredentials({...credentials, password: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
                {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest">Log In</button>
              </form>

              {view === 'LOGIN' && (
                <div className="mt-8 text-center">
                   <p className="text-slate-500 text-sm mb-4">New here? <button onClick={() => setView('SIGNUP_CUSTOMER')} className="text-indigo-600 font-black">Sign up</button></p>
                   <button onClick={onShowDriverRegistration} className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest">Join as Driver</button>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              <button onClick={() => setView('LOGIN')} className="mb-6 text-indigo-600 font-black text-xs uppercase flex items-center gap-2"><i className="fas fa-arrow-left"></i> Back</button>
              <h2 className="text-4xl font-black text-slate-900 mb-2">Signup</h2>
              <p className="text-slate-500 font-bold mb-8 uppercase text-[10px] tracking-[0.2em]">Start your journey</p>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <input type="text" placeholder="Full Name" value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" required />
                <input type="email" placeholder="Email Address" value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" required />
                <input type="tel" placeholder="Phone Number" value={signupData.phone} onChange={e => setSignupData({...signupData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" required />
                <input type="password" placeholder="Password" value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" required />
                
                {error && <p className="text-rose-500 text-xs font-bold text-center mt-2">{error}</p>}
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[20px] font-black uppercase tracking-widest mt-4">Generate OTP</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
