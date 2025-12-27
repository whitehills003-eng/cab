
import React, { useState } from 'react';
import { DriverDocuments } from '../types';
import { dispatchOTP } from '../geminiService';

interface DriverRegistrationProps {
  onRegister: (data: any) => void;
  onCancel?: () => void;
  checkDuplicates: (name: string, email: string, phone: string) => string | null;
  onNotify: (title: string, body: string, icon: string) => void;
}

const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onRegister, onCancel, checkDuplicates, onNotify }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    license: '',
    vehicle: ''
  });

  const [docs, setDocs] = useState<DriverDocuments>({
    aadharCard: '',
    drivingLicense: '',
    vehicleRegistration: '',
    pollutionCertificate: '',
    insurance: ''
  });

  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (field: keyof DriverDocuments, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocs(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const duplicateError = checkDuplicates(formData.name, formData.email, formData.phone);
    if (duplicateError) {
      setError(duplicateError);
      return;
    }

    setIsSending(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    // AI Simulated Dispatch
    const dispatchResult = await dispatchOTP(formData.name, formData.phone, code, 'phone');

    setTimeout(() => {
      setIsSending(false);
      setStep('OTP');
      setError('');
      onNotify("New SMS Received", dispatchResult.message, "fa-comment-sms");
    }, 1500);
  };

  const handleOtpInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);
    if (val && index < 5) {
      document.getElementById(`driver-otp-${index + 1}`)?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode.join('') === generatedOtp) {
      onRegister({ ...formData, docs });
    } else {
      setError('Invalid code. Please try again.');
      setOtpCode(['', '', '', '', '', '']);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <button 
        onClick={onCancel}
        className="mb-8 text-slate-500 hover:text-indigo-600 font-black text-xs uppercase flex items-center gap-3 transition-all"
      >
        <i className="fas fa-arrow-left"></i>
        Cancel
      </button>

      {isSending ? (
        <div className="bg-white rounded-[50px] p-24 text-center shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8 animate-pulse">
               <i className="fas fa-paper-plane text-indigo-600 text-3xl"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Initiating Dispatch</h2>
            <p className="text-slate-500 font-medium">Securing verification code for {formData.phone}...</p>
        </div>
      ) : step === 'OTP' ? (
        <div className="bg-white rounded-[50px] p-16 shadow-2xl max-w-md mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Verify Device</h2>
          <p className="text-slate-500 font-medium mb-10 text-sm">Enter the code dispatched to <span className="text-indigo-600 font-black">{formData.phone}</span></p>
          
          <div className="flex justify-between gap-2 mb-8">
            {otpCode.map((digit, i) => (
              <input
                key={i}
                id={`driver-otp-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpInput(i, e.target.value)}
                className="w-12 h-14 bg-slate-50 border-2 border-slate-100 rounded-xl text-center font-black text-xl focus:border-indigo-600 outline-none"
              />
            ))}
          </div>

          {error && <p className="text-rose-500 text-xs font-bold mb-6">{error}</p>}

          <button 
            onClick={handleVerifyOtp}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
          >
            Verify Identity
          </button>
          
          <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">
             Check the simulation toast at the top of the screen
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[50px] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 px-12 py-16 text-white relative">
            <h2 className="text-5xl font-black mb-4 tracking-tighter">Driver Registration</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Join our elite fleet of verified professionals.</p>
          </div>
          
          <form onSubmit={handleInitialSubmit} className="p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <input type="text" placeholder="Full Legal Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] font-bold" />
              <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] font-bold" />
              <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] font-bold" />
              <input type="password" placeholder="Account Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] font-bold" />
              <input type="text" placeholder="License Number" required value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] font-bold" />
              <input type="text" placeholder="Vehicle Info (Make/Model/Year)" required value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] font-bold" />
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><i className="fas fa-file-shield text-indigo-600"></i> Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UploadField label="Aadhar Card" onChange={e => handleFileChange('aadharCard', e)} isUploaded={!!docs.aadharCard} />
                <UploadField label="License Copy" onChange={e => handleFileChange('drivingLicense', e)} isUploaded={!!docs.drivingLicense} />
                <UploadField label="RC Details" onChange={e => handleFileChange('vehicleRegistration', e)} isUploaded={!!docs.vehicleRegistration} />
              </div>
            </div>

            {error && <p className="text-rose-500 text-center font-bold">{error}</p>}

            <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[35px] hover:bg-black transition-all shadow-xl text-xl">
              Initiate Application
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const UploadField: React.FC<{ label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isUploaded: boolean }> = ({ label, onChange, isUploaded }) => (
  <div className="relative border-2 border-dashed rounded-[35px] p-6 transition-all flex flex-col items-center justify-center gap-2 bg-slate-50 border-slate-200">
    <input type="file" required accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" />
    <i className={`fas ${isUploaded ? 'fa-check-circle text-emerald-500' : 'fa-cloud-arrow-up text-slate-300'} text-2xl`}></i>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
  </div>
);

export default DriverRegistration;
