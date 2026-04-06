import { useCallback, useEffect, useState } from 'react';
import { adminAPI, doctorAPI, pharmacyAPI, bookingAPI, orderAPI } from '../services/api';

const getList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload && typeof payload === 'object') return []; // Return empty array for invalid objects
  return [];
};

export default function useRoleDashboard(role) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (role === 'admin') {
        const { data } = await adminAPI.getDashboard();
        setDashboard({ type: 'admin', ...data });
        return;
      }

      if (role === 'doctor') {
        const { data } = await doctorAPI.getDashboard();
        setDashboard({ type: 'doctor', ...data });
        return;
      }

      if (role === 'pharmacy') {
        const { data } = await pharmacyAPI.getDashboard();
        setDashboard({ type: 'pharmacy', ...data });
        return;
      }

      // General/patient fallback summary
      const [bookingsResp, ordersResp] = await Promise.all([
        bookingAPI.list(),
        orderAPI.list(),
      ]);

      const bookings = getList(bookingsResp?.data);
      const orders = getList(ordersResp?.data);

      setDashboard({
        type: 'general',
        total_bookings: bookings.length,
        upcoming_bookings: bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
        total_orders: orders.length,
        active_orders: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
        bookings,
        orders,
      });
    } catch (err) {
      setError(err);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  return { dashboard, loading, error, refresh: load };
}
