import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

class AuthService {
  private authState: AuthState = {
    user: null,
    isLoading: true
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.checkAuth();
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  private setState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.notify();
  }

  async checkAuth() {
    try {
      this.setState({ isLoading: true });
      const response = await apiRequest("GET", "/api/auth/me");
      const data = await response.json();
      this.setState({ user: data.user, isLoading: false });
      return data.user;
    } catch (error) {
      this.setState({ user: null, isLoading: false });
      return null;
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      this.setState({ user: data.user, isLoading: false });
      return data.user;
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      const response = await apiRequest("POST", "/api/auth/register", { name, email, password });
      const data = await response.json();
      this.setState({ user: data.user, isLoading: false });
      return data.user;
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  }

  async logout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
      this.setState({ user: null, isLoading: false });
    } catch (error) {
      // Even if logout fails on server, clear local state
      this.setState({ user: null, isLoading: false });
    }
  }

  getState() {
    return this.authState;
  }
}

export const authService = new AuthService();
