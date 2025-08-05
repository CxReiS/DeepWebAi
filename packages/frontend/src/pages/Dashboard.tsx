import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { apiClient } from "../services/api-client";
import {
  dashboardDataAtom,
  dashboardLoadingAtom,
  dashboardErrorAtom,
} from "../store/atoms";

const Dashboard: React.FC = () => {
  const [data, setData] = useAtom(dashboardDataAtom);
  const [isLoading, setIsLoading] = useAtom(dashboardLoadingAtom);
  const [error, setError] = useAtom(dashboardErrorAtom);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Backend'de /dashboard diye bir endpoint olduğunu varsayıyoruz
        const responseData = await apiClient.get("/dashboard");
        setData(responseData);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [setData, setIsLoading, setError]);

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {data ? (
        <ul>
          <li>Active Users: {data.userCount}</li>
          <li>Active Sessions: {data.activeSessions}</li>
          <li>Latest System Message: {data.latestMessage}</li>
        </ul>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default Dashboard;
