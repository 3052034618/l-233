import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ReceiptPage from "@/pages/ReceiptPage";
import EmbalmingPage from "@/pages/EmbalmingPage";
import FarewellPage from "@/pages/FarewellPage";
import CremationPage from "@/pages/CremationPage";
import StoragePage from "@/pages/StoragePage";
import VehiclePage from "@/pages/VehiclePage";
import ReportsPage from "@/pages/ReportsPage";
import NotificationsPage from "@/pages/NotificationsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="receipt" element={<ReceiptPage />} />
          <Route path="embalming" element={<EmbalmingPage />} />
          <Route path="farewell" element={<FarewellPage />} />
          <Route path="cremation" element={<CremationPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="vehicle" element={<VehiclePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
