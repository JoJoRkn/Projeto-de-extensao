// URL-base da API Spring Boot
const API_BASE = "http://localhost:8080/api";

export async function apiLogin(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    return response.json();
}

export async function apiRegister(email, password, type) {
    const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type })
    });

    return response.json();
}
