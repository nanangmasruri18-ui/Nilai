const API_BASE = ""; // Relative URL since we are running on the same port

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("merdeka_assessment_token", token);
  } else {
    localStorage.removeItem("merdeka_assessment_token");
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("merdeka_assessment_token");
};

export const getAuthUser = (): any | null => {
  const user = localStorage.getItem("merdeka_assessment_user");
  return user ? JSON.parse(user) : null;
};

export const getAuthTeacher = (): any | null => {
  const teacher = localStorage.getItem("merdeka_assessment_teacher");
  return teacher ? JSON.parse(teacher) : null;
};

export const setAuthSession = (token: string | null, user: any | null, teacher: any | null = null) => {
  setAuthToken(token);
  if (user) {
    localStorage.setItem("merdeka_assessment_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("merdeka_assessment_user");
  }
  if (teacher) {
    localStorage.setItem("merdeka_assessment_teacher", JSON.stringify(teacher));
  } else {
    localStorage.removeItem("merdeka_assessment_teacher");
  }
};

export const clearAuthSession = () => {
  setAuthSession(null, null, null);
};

async function handleResponse(response: Response) {
  if (response.status === 410) {
    clearAuthSession();
    window.location.reload();
    throw new Error("Sesi Anda telah berakhir, silakan login kembali.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server.");
  }
  return data;
}

export const api = {
  get: async (url: string) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${url}`, { method: "GET", headers });
    return handleResponse(res);
  },

  post: async (url: string, body: any) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (url: string, body: any) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${url}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (url: string) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${url}`, { method: "DELETE", headers });
    return handleResponse(res);
  },
};
