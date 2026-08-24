import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { Briefcase, Key, Mail, User, Building, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthViewProps {
  onLogin: (profile: UserProfile) => void;
  onNavigateToLanding?: () => void;
  onRoleChange?: (role: UserRole) => void;
}

export default function AuthView({ onLogin, onNavigateToLanding, onRoleChange }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem('auth_role') as UserRole;
    return saved === 'employer' ? 'employer' : 'candidate';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    sessionStorage.setItem('auth_role', role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  }, [role, onRoleChange]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    if (isSignUp && !name) {
      setError('Please provide your full name.');
      return;
    }

    if (isSignUp && role === 'employer' && !companyName) {
      setError('Company name is required for Employer registration.');
      return;
    }

    // Explicitly block Admin Sign Up
    if (isSignUp && (role === 'admin' || email.trim().toLowerCase() === 'revanth23arr@gmail.com')) {
      setError('Admin registration is not allowed. Only one pre-configured Admin account exists.');
      return;
    }

    try {
      if (!isSignUp) {
        // Sign In via Supabase Auth
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInErr) {
          setError(signInErr.message);
          return;
        }

        if (!data.user) {
          setError('Authentication failed. No user returned.');
          return;
        }

        // Fetch user profile from profiles table
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileErr || !profile) {
          setError('User profile not found in database.');
          await supabase.auth.signOut();
          return;
        }

        // Verify selected role matches the profile role (admin can only log in under employer tab)
        if (profile.role === 'admin' && role !== 'employer') {
          setError('This email is registered as an Admin. Please select the correct tab above.');
          await supabase.auth.signOut();
          return;
        }

        if (profile.role !== 'admin' && profile.role !== role) {
          setError(`This email is registered as an ${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}. Please select the correct tab above.`);
          await supabase.auth.signOut();
          return;
        }

        onLogin({
          uid: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          createdAt: profile.created_at,
          companyName: profile.company_name,
          companyWebsite: profile.company_website,
          companyBio: profile.company_bio,
          isApproved: profile.is_approved,
          approvalStatus: profile.approval_status,
          phone: profile.phone,
          bio: profile.bio,
          skills: profile.skills || [],
          education: profile.education || [],
          experience: profile.experience || [],
          certifications: profile.certifications || [],
          resumeUrl: profile.resume_url,
          resumeFileName: profile.resume_file_name,
          resumeText: profile.resume_text,
        });
      } else {
        // Sign Up via Supabase Auth
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
              role,
              companyName: role === 'employer' ? companyName : undefined,
              phone: role === 'candidate' ? phone : undefined,
            }
          }
        });

        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }

        if (!data.user) {
          setError('Sign up failed. No user returned.');
          return;
        }

        // Profile should be automatically created by the database trigger.
        // Let's try to retrieve it, falling back to client-constructed profile if needed immediately.
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileErr || !profile) {
          const fallbackProfile: UserProfile = {
            uid: data.user.id,
            email: email.trim().toLowerCase(),
            name: name || email.split('@')[0],
            role,
            createdAt: new Date().toISOString(),
            companyName: role === 'employer' ? companyName : undefined,
            phone: role === 'candidate' ? phone : undefined,
            skills: role === 'candidate' ? [] : undefined,
            education: [],
            experience: [],
            certifications: []
          };
          onLogin(fallbackProfile);
        } else {
          onLogin({
            uid: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            createdAt: profile.created_at,
            companyName: profile.company_name,
            companyWebsite: profile.company_website,
            companyBio: profile.company_bio,
            isApproved: profile.is_approved,
            approvalStatus: profile.approval_status,
            phone: profile.phone,
            bio: profile.bio,
            skills: profile.skills || [],
            education: profile.education || [],
            experience: profile.experience || [],
            certifications: profile.certifications || [],
            resumeUrl: profile.resume_url,
            resumeFileName: profile.resume_file_name,
            resumeText: profile.resume_text,
          });
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError('An error occurred during authentication. Please try again.');
    }
  };



  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#121829] p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none relative text-left">
        
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="absolute top-4 left-4 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>← Back to Overview</span>
          </button>
        )}
        
        {/* Top Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-md shadow-blue-500/20 mb-4">
            <Briefcase className="h-6 w-6" id="auth-logo-icon" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              id="toggle-auth-mode"
              onClick={() => {
                const nextSignUp = !isSignUp;
                setIsSignUp(nextSignUp);
                setError('');
                if (nextSignUp && role === 'admin') {
                  setRole('candidate');
                }
              }}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition-all"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-3.5 rounded-xl text-sm animate-shake">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}



        {/* Auth Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Role selector tab: Candidate & Employer */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              type="button"
              id="role-tab-candidate"
              onClick={() => {
                setRole('candidate');
                setEmail('');
                setPassword('');
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                role === 'candidate' 
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              id="role-tab-employer"
              onClick={() => {
                setRole('employer');
                setEmail('');
                setPassword('');
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                role === 'employer' 
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Employer</span>
            </button>
          </div>

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    id="auth-name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {isSignUp && role === 'employer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    id="auth-company"
                    placeholder="TechCorp LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {isSignUp && role === 'candidate' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-slate-400 dark:text-slate-500 font-medium">+1</span>
                  <input
                    type="tel"
                    id="auth-phone"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  id="auth-email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  id="auth-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="auth-submit"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer mt-4"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </form>
      </div>


    </div>
  );
}

