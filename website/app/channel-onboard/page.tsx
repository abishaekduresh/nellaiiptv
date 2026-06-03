"use client";

import { useState, useEffect, useRef } from "react";
import {
  Tv,
  Send,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  User,
  Link2,
  FileText,
  Tag,
  Languages,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

interface Option {
  id: number;
  name: string;
}

const inputCls =
  "w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 text-sm";
const labelCls = "block text-sm font-medium text-slate-300 mb-2";

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const REQUIRED_DIM = 1080;

export default function ChannelOnboardPage() {
  const [categories, setCategories] = useState<Option[]>([]);
  const [languages, setLanguages] = useState<Option[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    channel_name: "",
    category: "",
    language: "",
    stream_url: "",
    website_url: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    description: "",
  });

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data.data ?? [])).catch(() => {});
    api.get("/languages").then((r) => setLanguages(r.data.data ?? [])).catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "webp"].includes(ext ?? "")) {
      setLogoError("Only .png or .webp files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setLogoError("File size must not exceed 1 MB.");
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth !== REQUIRED_DIM || img.naturalHeight !== REQUIRED_DIM) {
        setLogoError(`Image must be exactly ${REQUIRED_DIM} × ${REQUIRED_DIM} pixels (got ${img.naturalWidth} × ${img.naturalHeight}).`);
        URL.revokeObjectURL(url);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setLogoFile(file);
      setLogoPreview(url);
    };
    img.onerror = () => {
      setLogoError("Could not read image file.");
      URL.revokeObjectURL(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    img.src = url;
  };

  const clearLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (logoError) {
      toast.error("Fix the logo error before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (logoFile) formData.append("logo", logoFile);

      const res = await api.post("/channel-onboarding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status) {
        setSubmitted(true);
      } else {
        toast.error(res.data.message || "Submission failed.");
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat().join(", ");
        toast.error(`Validation: ${msgs}`);
      } else {
        toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-black mb-3">Request Submitted!</h2>
          <p className="text-slate-400 text-base leading-relaxed mb-6">
            Thank you for submitting your channel. Our team will review it and
            get back to you within 2–3 business days.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-semibold transition-all text-sm hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Hero */}
      <div className="relative pt-16 pb-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[130px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden mb-5">
            <img
              src="/assets/logos/Nellai IPTV logo 512x512px.webp"
              alt="Nellai IPTV"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
            Add Your Channel
          </h1>
          <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg">
            Submit your channel for listing on Nellai IPTV. Fill in the details
            below and our team will review your request.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 space-y-8 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Channel Info */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tv size={14} className="text-primary" />
              </div>
              <h3 className="text-white font-bold text-base">Channel Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  Channel Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="channel_name"
                  value={form.channel_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Duresh TV"
                  className={inputCls}
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className={labelCls}>
                  Channel Logo
                  <span className="ml-1.5 text-slate-500 font-normal text-xs">(1080×1080 px · PNG or WebP · max 1 MB)</span>
                </label>
                {logoPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-600 bg-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{logoFile?.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {((logoFile?.size ?? 0) / 1024).toFixed(0)} KB · 1080×1080
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="relative flex items-center gap-4 w-full px-4 h-[80px] border-2 border-dashed border-slate-700 hover:border-primary/50 rounded-xl cursor-pointer transition-colors bg-slate-800/50 hover:bg-slate-800 group overflow-hidden">
                    {/* App logo watermark */}
                    <img
                      src="/assets/logos/Nellai IPTV logo 512x512px.webp"
                      alt=""
                      className="w-12 h-12 rounded-xl object-contain opacity-40 group-hover:opacity-60 transition-opacity shrink-0"
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-primary transition-colors">
                        <Upload size={15} />
                        <span className="text-sm font-medium">Click to upload logo</span>
                      </div>
                      <span className="text-slate-600 text-xs">PNG or WebP · 1080×1080 px · max 1 MB</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.webp,image/png,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
                {logoError && (
                  <p className="mt-2 text-red-400 text-xs flex items-start gap-1">
                    <X size={12} className="mt-0.5 shrink-0" /> {logoError}
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} /> Category <span className="text-red-400">*</span>
                  </span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className={inputCls}
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <Languages size={13} /> Language <span className="text-red-400">*</span>
                  </span>
                </label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                  className={inputCls}
                >
                  <option value="" disabled>Select language</option>
                  {languages.map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-800" />

          {/* Stream Details */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 size={14} className="text-primary" />
              </div>
              <h3 className="text-white font-bold text-base">Stream Details</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>
                  Stream URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  name="stream_url"
                  value={form.stream_url}
                  onChange={handleChange}
                  required
                  placeholder="https:// stream URL .m3u8"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} /> Website URL
                  </span>
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  placeholder="https://yourchannel.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} /> Description
                  </span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description about your channel..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-800" />

          {/* Contact Info */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <h3 className="text-white font-bold text-base">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <User size={13} /> Contact Name <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={form.contact_name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} /> Email <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} /> Phone <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 XXXXX XXXXX"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting || !!logoError}
            className="w-full bg-primary hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 text-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send size={17} />
                Submit Channel Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
