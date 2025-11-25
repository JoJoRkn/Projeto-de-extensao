// assets/js/api.js

// URL-base da API Spring Boot
const API_BASE = "http://localhost:8080/api";

// --- Função Auxiliar para tratamento de Requisições ---
async function handleFetch(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // ⚠️ VERIFICAÇÃO CRÍTICA: Se a resposta HTTP for um erro (4xx ou 5xx),
        // o backend provavelmente retornou o status: "error" no corpo JSON,
        // mas devemos garantir que a promessa só seja resolvida com sucesso em casos válidos.
        if (!response.ok || result.status === "error") {
            // Se o status HTTP não for 2xx OU se o backend indicar erro no payload (result.status === "error")
            // Retorna o objeto de erro do backend para o frontend tratar.
            return result;
        }

        // Sucesso (status HTTP 2xx e status: "ok" ou "created" no payload)
        return result;

    } catch (error) {
        // Erro de rede (servidor não encontrado, CORS bloqueado, etc.)
        console.error("Erro de conexão/rede:", error);
        return { 
            status: "error", 
            message: "Erro de rede: Não foi possível conectar ao servidor Spring Boot." 
        };
    }
}

// --------------------------------------------------------------------------------

export async function apiLogin(email, password) {
    const endpoint = "/auth/login";
    return handleFetch(endpoint, { email, password });
}

export async function apiRegister(email, password, type) {
    const endpoint = "/auth/register";
    return handleFetch(endpoint, { email, password, type });
}
