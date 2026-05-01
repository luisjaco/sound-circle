'use client';

import { useEffect, useRef, useState } from 'react';
import { validateUsernameSB } from '@/app/(auth)/onboarding/queries';
import { useMusicKit } from "@/components/providers/MusicKitProvider";
import { Loader2, ArrowLeft, User, Lock, Music, ChevronRight, X, Camera, Settings } from 'lucide-react';
import SpotifyButton from '@/components/SpotifyButton';
import AppleMusicButton from '@/components/AppleMusicButton';

export default function SettingsPage() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [originalUsername, setOriginalUsername] = useState('');
    const [bio, setBio] = useState('');
    const [city, setCity] = useState('');
    const [stateValue, setStateValue] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [submitMessage, setSubmitMessage] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'password'>('main');

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (!res.ok) { setLoading(false); return; }
                setName(data.user.name ?? '');
                setUsername(data.user.username ?? '');
                setOriginalUsername(data.user.username ?? '');
                setBio(data.user.bio ?? '');
                setCity(data.user.city ?? '');
                setStateValue(data.user.state ?? '');
                setLoading(false);
            } catch {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setProfilePicture(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfilePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setProfilePreview(null);
        }
    };

    const validateUsernameLocal = (u?: string): boolean => {
        const user = u ?? username;
        if (!user) { setUsernameError('Please enter a username.'); return false; }
        if (user.length < 2) { setUsernameError('Username is too short.'); return false; }
        if (!/^[\w.-]+$/.test(user)) { setUsernameError('Only letters, numbers, and ., _, - are allowed.'); return false; }
        if (user.length > 20) { setUsernameError('Username must be 20 characters or less.'); return false; }
        setUsernameError(''); return true;
    };

    const validateUsernameRemote = async () => {
        if (!validateUsernameLocal()) return false;
        if (username.trim() === originalUsername.trim()) { setUsernameError(''); return true; }
        const { errorMessage, result } = await validateUsernameSB(username.trim());
        if (!result) { setUsernameError(errorMessage); return false; }
        setUsernameError(''); return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitMessage(''); setSubmitSuccess(false);
        if (!name.trim()) { setSubmitMessage('Name is required.'); return; }
        const usernameOk = await validateUsernameRemote();
        if (!usernameOk) return;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('username', username);
        formData.append('bio', bio);
        formData.append('city', city);
        formData.append('state', stateValue);
        if (profilePicture) formData.append('profilePicture', profilePicture);

        if (currentPassword || newPassword || confirmNewPassword) {
            const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                setPasswordError('All password fields are required.'); return;
            }
            if (!passwordRegex.test(newPassword)) {
                setPasswordError('Password must be 8+ chars with uppercase, lowercase, number, and special character.'); return;
            }
            if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match.'); return; }
            setPasswordError('');
            formData.append('currentPassword', currentPassword);
            formData.append('newPassword', newPassword);
        }

        const res = await fetch('/api/settings', { method: 'PATCH', body: formData });
        const data = await res.json();
        if (!res.ok) { setSubmitMessage(data.error || 'Update failed.'); return; }
        setSubmitSuccess(true);
        setSubmitMessage(data.message || 'Profile updated successfully.');
        setOriginalUsername(username); // update local original so validation works correctly
        setTimeout(() => {
            window.scrollTo(0, 0);
            window.location.reload();
        }, 1300);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black">
            <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
        </div>
    );

    const header = (
        <header className='px-20'>
            <h1 className="text-5xl w-full font-bold pt-15 pb-3 border-b border-gray-800 flex items-center mb-15">
                <Settings className='h-12 w-12 mr-5' /> Settings
            </h1>
        </header>
    )

    // ─── Shared input style matching site's login/onboarding fields ─────────
    const inputCls = "w-full bg-[#282828] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 outline-none focus:border-gray-500 transition-colors";

    // ─── Section: Edit Profile ───────────────────────────────────────────────
    if (activeSection === 'profile') return (
        <div className="min-h-screen bg-black pb-20">
            {header}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-5">

                {/* Back button row */}
                <div className="flex items-center gap-3 mb-2">
                    <button type="button" onClick={() => setActiveSection('main')} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Edit Profile</h1>
                </div>

                {/* Avatar preview */}
                <div className="flex flex-col items-center gap-3 py-4">
                    <div
                        className="relative w-24 h-24 rounded-full overflow-hidden bg-[#282828] border-2 border-gray-700 cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {profilePreview ? (
                            <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-10 h-10 text-gray-500" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#1DB954] text-sm font-medium hover:text-[#1ed760] transition-colors"
                    >
                        Change Photo
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                </div>

                {/* Fields */}
                <div>
                    <label className="block text-white text-sm font-medium mb-1">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">Bio</label>
                    <input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself" className={inputCls} />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">City</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">State</label>
                    <input value={stateValue} onChange={(e) => setStateValue(e.target.value)} placeholder="State" className={inputCls} />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">Username</label>
                    <input
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); validateUsernameLocal(e.target.value); }}
                        onBlur={validateUsernameRemote}
                        placeholder="username"
                        className={inputCls}
                    />
                    {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                </div>
                <div className="space-y-4">
                    {submitMessage && (
                        <p className={`text-sm text-center ${submitSuccess ? 'text-[#1DB954]' : 'text-red-400'}`}>{submitMessage}</p>
                    )}

                    <button type="submit" className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 rounded-full transition-colors text-sm">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );

    // ─── Section: Change Password ────────────────────────────────────────────
    if (activeSection === 'password') return (
        <div className="min-h-screen bg-black pb-20">
            {header}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-5">

                {/* Back button row */}
                <div className="flex items-center gap-3 mb-2">
                    <button type="button" onClick={() => setActiveSection('main')} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Change Password</h1>
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-1">Confirm New Password</label>
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputCls} />
                </div>

                {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}

                {submitMessage && (
                    <p className={`text-sm text-center ${submitSuccess ? 'text-[#1DB954]' : 'text-red-400'}`}>{submitMessage}</p>
                )}

                <button type="submit" className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 rounded-full transition-colors text-sm">
                    Update Password
                </button>
            </form>
        </div>
    );

    // ─── Main Settings Menu ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black pb-20">
            {header}
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                
                {/* Account */}
                <div>
                    <h2 className="text-gray-400 text-sm font-medium mb-3 px-2 tracking-wider">ACCOUNT</h2>
                    <div className="bg-[#181818] rounded-lg overflow-hidden">
                        <button
                            onClick={() => setActiveSection('profile')}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#282828] transition-colors border-b border-gray-800"
                        >
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div className="text-left">
                                    <p className="text-white text-sm font-medium">Edit Profile</p>
                                    <p className="text-gray-400 text-xs">Update your personal information</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                        <button
                            onClick={() => setActiveSection('password')}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#282828] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-gray-400" />
                                <div className="text-left">
                                    <p className="text-white text-sm font-medium">Change Password</p>
                                    <p className="text-gray-400 text-xs">Update your password</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Connected Services */}
                <div>
                    <h2 className="text-gray-400 text-sm font-medium mb-3 px-2 tracking-wider">CONNECTED SERVICES</h2>
                    <div className="bg-[#181818] rounded-lg overflow-hidden divide-y divide-gray-800">
                        <div className="p-4 flex items-center gap-3">
                            <SpotifyButton />
                        </div>
                        <div className="p-4 flex items-center gap-3">
                            <AppleMusicButton />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2 px-2">
                        Linking your music accounts helps you quickly find and review albums from your listening history.
                    </p>
                </div>

            </div>
        </div>
    );
}
