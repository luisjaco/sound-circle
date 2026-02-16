"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Logo from "@/components/Logo";

const GENRES = [
  "Rock", "Pop", "Hip-Hop", "Electronic", "Indie", "Jazz", "Classical",
  "Metal", "R&B", "Country", "Reggae", "Folk", "Punk", "Soul", "Blues"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [artistQuery, setArtistQuery] = useState("");
  const [artistPicks, setArtistPicks] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (index === 0) usernameRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(null); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function validateUsername(value = username) {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter a username.";
    if (trimmed.length < 2) return "Username is too short.";
    if (!/^[\w\d._-]+$/.test(trimmed)) return "Only letters, numbers, ., _, - allowed.";
    return null;
  }

  function next() {
    if (index === 0) {
      setUsernameTouched(true);
      const err = validateUsername();
      setUsernameError(err);
      if (err) {
        const card = document.querySelector(".auth-card");
        if (card) card.classList.add("glow");
        setTimeout(() => { if (card) card.classList.remove("glow"); }, 900);
        return;
      }
    }
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }

  function prev() { setIndex((i) => Math.max(i - 1, 0)); }

  function toggleGenre(g: string) {
    setSelectedGenres((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= 3) return prev;
      return [...prev, g];
    });
  }

  function addArtist(name: string) {
    if (!name) return;
    if (artistPicks.includes(name) || artistPicks.length >= 3) return;
    setArtistPicks((p) => [...p, name]);
    setArtistQuery("");
  }
  function removeArtist(name: string) {
    setArtistPicks((p) => p.filter((x) => x !== name));
  }

  async function finish() {
    console.log({ username, avatarFile, selectedGenres, artistPicks });
    alert("Onboarding saved locally (console). Hook finish() to server.");
  }

  const slides = [
    <div key="username" className="p-2">
      <div className="mb-4">
        <h2 className={clsx("text-3xl font-extrabold transition-opacity", titleVisible ? "opacity-100" : "opacity-0")}>
          Welcome to <span className="text-white">Sound</span><span className="text-[var(--brand)]">Circle</span>
        </h2>
        <p className="hero-sub mt-3">What should we call you?</p>
      </div>

      <div className="mt-6">
        <label className="input-label">Username</label>
        <div className={clsx(
          "input-with-icon",
          usernameTouched && !usernameError && username ? "input-valid" : "",
          usernameTouched && usernameError ? "input-invalid" : ""
        )}>
          <div className="input-icon">@</div>
          <input
            ref={usernameRef}
            value={username}
            onChange={(e) => { setUsername(e.target.value); if (usernameTouched) setUsernameError(validateUsername(e.target.value)); }}
            onBlur={() => { setUsernameTouched(true); setUsernameError(validateUsername()); }}
            onKeyDown={(e) => { if (e.key === "Enter") next(); }}
            placeholder="yourhandle"
            className="input-field"
            aria-label="Username"
          />
        </div>

        {usernameTouched && usernameError ? (
          <p className="text-xs text-red-400 mt-2">{usernameError}</p>
        ) : null}

        <p className="text-xs text-[var(--muted)] mt-2">This will be shown to other users — keep it short.</p>
      </div>
    </div>,

    <div key="avatar" className="p-2">
      <div className="mb-4">
        <h3 className="text-2xl font-extrabold">Profile photo</h3>
        <p className="hero-sub mt-3">Add a photo so people recognise you.</p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="w-36 h-36 rounded-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center overflow-hidden border border-[rgba(255,255,255,0.04)]">
          {avatarPreview ? <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" /> : <div className="text-[var(--muted)]">No photo</div>}
        </div>
        <div style={{ height: 32 }} />
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
          <span className="px-7 py-3 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-base hover:bg-[rgba(255,255,255,0.12)] transition">
            Upload photo
          </span>
        </label>
        <div style={{ height: 8 }} />
        <div className="text-xs text-[var(--muted)] text-center">JPG, PNG — up to 5MB. You can change this later.</div>
      </div>
    </div>,

    <div key="genres" className="p-2">
      <div className="mb-4">
        <h3 className="text-2xl font-extrabold">Pick up to 3 genres</h3>
        <p className="hero-sub mt-3">These help tailor your feed.</p>
      </div>

      <div className="mt-6 genre-row">
        <div className="genre-grid">
          {GENRES.map((g) => {
            const active = selectedGenres.includes(g);
            return (
              <button
                type="button"
                key={g}
                onClick={() => toggleGenre(g)}
                className={clsx(
                  "genre-btn",
                  active
                    ? "genre-active bg-[rgba(16,183,89,0.25)] border-[rgba(16,183,89,0.55)] shadow-[0_0_0_1px_rgba(16,183,89,0.35)] text-white"
                    : "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.14)] text-white/90"
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-[var(--muted)] mt-4">Selected: <strong className="text-white">{selectedGenres.join(", ") || "None"}</strong></div>
    </div>,

    <div key="artists" className="p-2">
      <div className="mb-4">
        <h3 className="text-2xl font-extrabold">Pick up to 3 artists</h3>
        <p className="hero-sub mt-3">Search for artists to follow (MusicBrainz later).</p>
      </div>

      <div className="mt-6">
        <label className="input-label">Search artists</label>

        { }
        <div className="input-with-icon" style={{ padding: 0 }}>
          <input
            value={artistQuery}
            onChange={(e) => setArtistQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const q = artistQuery.trim();
                if (q) addArtist(q);
              }
            }}
            placeholder="Type an artist and press Enter"
            aria-label="Search artists"
            className="input-field"
            style={{ padding: "12px 14px", width: "100%" }}
          />
        </div>
        <div style={{ height: 8 }} />
        { }
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              const q = artistQuery.trim();
              if (q) addArtist(q);
            }}
            className="w-full max-w-xs btn-primary"
            aria-label="Add artist"
          >
            Add
          </button>
        </div>

        <div className="artist-list mt-5">
          {artistPicks.length === 0 ? (
            <div className="text-[var(--muted)]">No artists chosen yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {artistPicks.map((a) => (
                <div
                  key={a}
                  className="artist-token bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] rounded-full px-3 py-1 flex items-center gap-2 text-white"
                >
                  <span className="text-sm">{a}</span>
                  <button
                    onClick={() => removeArtist(a)}
                    aria-label={`Remove ${a}`}
                    className="text-xs text-[var(--muted)] hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,

    <div key="connect" className="p-2">
      <div className="mb-4">
        <h3 className="text-2xl font-extrabold">Connect music services</h3>
        <p className="hero-sub mt-3">Optionally connect Spotify or Apple Music to import your listening history.</p>
      </div>

      <div className="mt-6 space-y-4">
        { }
        <button
          className="w-full rounded-full py-4 flex items-center justify-center gap-3 bg-[var(--brand)] transition"
          onClick={() => { /* TODO: open spotify OAuth */ alert("Spotify connect flow (stub)"); }}
          aria-label="Connect with Spotify"
          style={{ boxShadow: "none" }}
        >
          <img
            src="/brand/spotify.svg"
            alt="Spotify logo"
            className="h-5 w-auto max-w-[260px] object-contain"
          />

          <span className="text-white font-semibold text-lg"></span>
        </button>
        <div style={{ height: 8 }} />
        { }
        <button
          className="w-full rounded-full py-4 flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.92)] transition"
          onClick={() => router.push('/library')}
          aria-label="Connect with Apple Music"
          style={{ boxShadow: "none" }}
        >
          <img
            src="/brand/apple-music.svg"
            alt="Apple Music logo"
            className="h-5 w-auto max-w-[160px] object-contain"
          />

          <span className="text-black font-semibold text-lg"></span>
        </button>
        <div style={{ height: 32 }} />
        <div className="text-xs text-[var(--muted)] mt-12 text-center">You can connect later if you'd prefer.</div>
      </div>
    </div>,

    <div key="done" className="p-2">
      <div className="mb-4">
        <h3 className="text-2xl font-extrabold">All set</h3>
        <p className="hero-sub mt-3">Review & finish</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="text-xs text-[var(--muted)]">Username:</div>
          <div style={{ height: 4 }} />
          <div className="mt-1"><strong className="text-white">@{username || "—"}</strong></div>
        </div>

        <div>
          <div style={{ height: 12 }} />
          <div className="text-xs text-[var(--muted)]">Genres:</div>
          <div style={{ height: 4 }} />
          <div className="mt-1"><span className="text-white">{selectedGenres.join(", ") || "—"}</span></div>
        </div>

        <div>
          <div style={{ height: 12 }} />
          <div className="text-xs text-[var(--muted)]">Artists:</div>
          <div style={{ height: 4 }} />
          <div className="mt-1"><span className="text-white">{artistPicks.join(", ") || "—"}</span></div>
        </div>

        { }
        <div style={{ height: 32 }} />
        <div className="mt-4 text-[var(--muted)] text-sm">Tap the arrow to finish!</div>
      </div>
    </div>
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="auth-wrapper w-full max-w-xl mx-auto">
        <div className={clsx("auth-card")}>
          <div className="text-center mb-4">
            <Logo className="mx-auto mb-4 animate-spin-slow" />
            <div className="text-sm text-[var(--muted)]">Step {Math.min(index + 1, slides.length)}/{slides.length}</div>
            <h1 className="text-3xl font-extrabold mt-2">Complete your profile</h1>
          </div>

          <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
            <div
              className="flex transition-transform duration-400 ease-in-out"
              style={{ width: `${slides.length * 100}%`, transform: `translateX(-${index * (100 / slides.length)}%)` }}
            >
              {slides.map((s, i) => (
                <div key={i} style={{ width: `${100 / slides.length}%` }} className="px-2 py-4">
                  <div className="form-panel">
                    {s}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              {index > 0 ? (
                <button
                  onClick={prev}
                  aria-label="Back"
                  className="onboard-arrow bg-[rgba(255,255,255,0.06)] text-white shadow-none hover:bg-[rgba(255,255,255,0.08)]"
                  style={{ boxShadow: "none" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 12H5M11 19l-7-7 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="onboard-footer-right">
              {index < slides.length - 1 ? (
                <button onClick={next} className="onboard-arrow bg-[var(--brand)] text-black" aria-label="Next">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button onClick={finish} className="onboard-arrow bg-[var(--brand)] text-black" aria-label="Finish">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

