import { createContext, useContext, useEffect, useState } from "react";
import superAdminApi from "../api/superAdminAxios";

const SuperAdminAuthContext = createContext(null);

export const SuperAdminAuthProvider = ({ children }) => {
  const [superAdmin, setSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("o2o_superadmin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    superAdminApi
      .get("/super-admin/auth/me")
      .then((res) => setSuperAdmin(res.data))
      .catch(() => localStorage.removeItem("o2o_superadmin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await superAdminApi.post("/super-admin/auth/login", { email, password });
    localStorage.setItem("o2o_superadmin_token", res.data.token);
    setSuperAdmin(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("o2o_superadmin_token");
    setSuperAdmin(null);
  };

  return (
    <SuperAdminAuthContext.Provider value={{ superAdmin, loading, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
};

export const useSuperAdminAuth = () => useContext(SuperAdminAuthContext);
