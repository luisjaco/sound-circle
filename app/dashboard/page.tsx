'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from "@/components/Button";

type User = {
    id: string,
    email: string
}

export default function Dashboard() {

    const [user, setUser ] = useState<User | null>(null);
    const router = useRouter();

    useEffect( () => {
        async function loadUser() {
            const res = await fetch('/api/me', { credentials: 'include'})

            // check if logged out
            if (!res.ok) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            setUser(data.user);
        };

        loadUser();
    }, [])

    async function handleLogout(e: React.FormEvent) {
        e.preventDefault();


        const res = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
        });

        const data = await res.json();

        // ensure successful logout.
        if (!res.ok) {
            // proof of concept, we wont do anything if logout doesn't work.
        }

        // move on
        router.push('/'); 
    }

    return (
        <div>
            <p>
                just a test. you are logged in, {user ? user.email : ''}
            </p>
            <Button type="submit" variant="primary" className="w-full mt-6" onClick={handleLogout}>Log Out</Button>
        </div>
    )
}