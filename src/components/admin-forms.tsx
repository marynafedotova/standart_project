"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося увійти.");
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="panel formGrid loginCard" onSubmit={handleSubmit}>
      <h1>Вхід до адмінки</h1>
      <p>Використовуйте email і пароль адміністратора з `.env` або з бази проєкту.</p>
      <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder="Пароль"
        required
      />
      {error ? <p className="errorText">{error}</p> : null}
      <button type="submit" className="button primary" disabled={loading}>
        {loading ? "Входимо..." : "Увійти"}
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" className="button secondary" onClick={handleLogout}>
      Вийти
    </button>
  );
}
