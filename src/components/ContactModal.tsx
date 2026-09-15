import React, { useState } from 'react';
import { X, MessageCircle, Mail, Copy, Check, Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Marketing Agency',
    message: '',
  });

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch transmission.');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        category: 'Marketing Agency',
        message: '',
      });

      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 4000);
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Transmission failed. Please use Direct WhatsApp or Email above.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[36px] sm:rounded-[48px] border border-[#2f2f2f]/20 p-6 sm:p-10 pb-10 sm:pb-12 bg-[#f4f0ea]/95 backdrop-blur-2xl shadow-2xl text-[#2f2f2f]"
        style={{
          boxShadow:
            'inset 0 1.5px 2px rgba(255, 255, 255, 0.6), 0 32px 64px -16px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center glass-btn text-[#2f2f2f] cursor-pointer"
          aria-label="Close Contact Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-display text-2xl font-medium tracking-[0.14em] uppercase text-[#2f2f2f]">
              VXRE
            </span>
            <span className="text-xs font-sans-custom tracking-widest text-[#2f2f2f]/50 uppercase">
              // Direct Line
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-[#2f2f2f] leading-none mb-2">
            Initiate Contact
          </h2>
          <p className="font-sans-custom text-xs sm:text-sm text-[#2f2f2f]/70 font-light">
            Connect directly with the imperial directors for private advisory, digital campaigns, and
            strategic agency retainers.
          </p>
        </div>

        {/* Priority Quick Connect Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* WhatsApp Card */}
          <div className="p-4 rounded-3xl bg-white/70 border border-[#2f2f2f]/10 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-sans-custom text-xs font-bold uppercase tracking-wider">
                  WhatsApp Direct
                </span>
              </div>
              <button
                onClick={() => handleCopy('+57 315 1969168', 'phone')}
                className="text-[#2f2f2f]/50 hover:text-[#2f2f2f] p-1"
                title="Copy phone number"
              >
                {copiedPhone ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div>
              <div className="font-mono text-sm font-semibold text-[#2f2f2f]">
                +57 315 1969168
              </div>
              <div className="text-[11px] text-[#2f2f2f]/60 mt-0.5">Instant WhatsApp reply</div>
            </div>
            <a
              href="https://wa.me/573151969168"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans-custom text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-xs"
            >
              Open WhatsApp Chat
            </a>
          </div>

          {/* Email Card */}
          <div className="p-4 rounded-3xl bg-white/70 border border-[#2f2f2f]/10 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2f2f2f]">
                <div className="w-8 h-8 rounded-full bg-[#2f2f2f]/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#2f2f2f]" />
                </div>
                <span className="font-sans-custom text-xs font-bold uppercase tracking-wider">
                  Official Email
                </span>
              </div>
              <button
                onClick={() => handleCopy('contact@vxre.run.place', 'email')}
                className="text-[#2f2f2f]/50 hover:text-[#2f2f2f] p-1"
                title="Copy email address"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div>
              <div className="font-mono text-xs sm:text-sm font-semibold text-[#2f2f2f] truncate">
                contact@vxre.run.place
              </div>
              <div className="text-[11px] text-[#2f2f2f]/60 mt-0.5">Encrypted inbox delivery</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <a
                href="mailto:contact@vxre.run.place?subject=Inquiry%20via%20VXRE%20Portal"
                onClick={(e) => {
                  // Fallback for browsers / devices with no native mail app configured
                  try {
                    navigator.clipboard.writeText('contact@vxre.run.place');
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2500);
                  } catch (err) {
                    console.warn(err);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-2xl glass-btn font-sans-custom text-xs font-bold uppercase tracking-wider text-center transition-colors hover:bg-black/5"
              >
                {copiedEmail ? 'Email Copied!' : 'Send Direct Email'}
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@vxre.run.place&su=Inquiry%20via%20VXRE%20Portal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[10px] text-[#2f2f2f]/60 hover:text-[#2f2f2f] transition-colors underline"
              >
                Or compose in Gmail (web)
              </a>
            </div>
          </div>
        </div>

        {/* Agency Inquiry Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-sans-custom font-bold uppercase tracking-wider text-[#2f2f2f]/70 mb-1.5">
                Your Name / Entity
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Roman Vance"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-[#2f2f2f]/15 text-sm text-[#2f2f2f] placeholder-[#2f2f2f]/40 focus:outline-none focus:ring-2 focus:ring-[#2f2f2f]/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-sans-custom font-bold uppercase tracking-wider text-[#2f2f2f]/70 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@domain.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-[#2f2f2f]/15 text-sm text-[#2f2f2f] placeholder-[#2f2f2f]/40 focus:outline-none focus:ring-2 focus:ring-[#2f2f2f]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-sans-custom font-bold uppercase tracking-wider text-[#2f2f2f]/70 mb-1.5">
              Service Specialization
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                'Marketing Agency',
                'Social Media',
                'Advertising',
                'Web & Privacy',
              ].map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setFormData({ ...formData, category })}
                  className={`py-2 px-2.5 rounded-2xl text-[11px] font-sans-custom font-semibold tracking-tight transition-all text-center ${
                    formData.category === category
                      ? 'bg-[#2f2f2f] text-white shadow-xs'
                      : 'bg-white/60 text-[#2f2f2f]/70 hover:bg-white border border-[#2f2f2f]/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-sans-custom font-bold uppercase tracking-wider text-[#2f2f2f]/70 mb-1.5">
              Project Brief or Inquiry
            </label>
            <textarea
              rows={3}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Outline your scope, timeline, and goals..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-[#2f2f2f]/15 text-sm text-[#2f2f2f] placeholder-[#2f2f2f]/40 focus:outline-none focus:ring-2 focus:ring-[#2f2f2f]/30 resize-none"
            />
          </div>

          {/* Status Message Alerts */}
          {status === 'error' && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Transmission Notice</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Thank you for reaching out!</p>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Our team has received your inquiry and will reach out to you as soon as possible.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-4 rounded-2xl bg-[#2f2f2f] hover:bg-black text-white font-sans-custom text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 mt-1 shadow-md hover:shadow-xl cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span>Encrypting & Dispatching...</span>
              </>
            ) : status === 'success' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Response Received • Thank You</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Submit Transmission</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
