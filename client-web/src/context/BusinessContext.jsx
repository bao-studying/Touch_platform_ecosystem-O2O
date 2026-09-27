import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const BusinessContext = createContext(null);

export const BusinessProvider = ({ children }) => {
  const { admin } = useAuth();
  const [business, setBusiness] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshBusiness = useCallback(async () => {
    const res = await api.get("/business/mine");
    if (res.data.length > 0) {
      setBusiness(res.data[0]); // MVP: 1 doanh nghiệp chính / admin
      return res.data[0];
    }
    setBusiness(null);
    return null;
  }, []);

  const refreshLinks = useCallback(async (businessId) => {
    if (!businessId) return;
    const res = await api.get(`/links/business/${businessId}`);
    setLinks(res.data);
  }, []);

  useEffect(() => {
    if (!admin) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const biz = await refreshBusiness();
      if (biz) await refreshLinks(biz._id);
      setLoading(false);
    })();
  }, [admin, refreshBusiness, refreshLinks]);

  const updateBusinessLocal = (patch) => setBusiness((prev) => ({ ...prev, ...patch }));

  return (
    <BusinessContext.Provider
      value={{
        business,
        links,
        loading,
        refreshBusiness,
        refreshLinks: () => refreshLinks(business?._id),
        updateBusinessLocal,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
