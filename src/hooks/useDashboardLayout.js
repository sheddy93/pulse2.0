import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export const useDashboardLayout = (userEmail, dashboardType, defaultLayout) => {
  const [layout, setLayout] = useState(defaultLayout);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load layout from database on mount
  useEffect(() => {
    if (!userEmail || !dashboardType) {
      setLoading(false);
      return;
    }

    const loadLayout = async () => {
      try {
        const layouts = await base44.entities.DashboardLayout.filter({
          user_email: userEmail,
          dashboard_type: dashboardType,
          is_active: true
        });
        
        if (layouts.length > 0) {
          setLayout(layouts[0].layout);
        }
      } catch (error) {
        console.error("Failed to load dashboard layout:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLayout();
  }, [userEmail, dashboardType]);

  // Save layout to database
  const saveLayout = async (newLayout) => {
    if (!userEmail || !dashboardType || isSaving) return;

    setIsSaving(true);
    try {
      const layouts = await base44.entities.DashboardLayout.filter({
        user_email: userEmail,
        dashboard_type: dashboardType,
        is_active: true
      });

      if (layouts.length > 0) {
        await base44.entities.DashboardLayout.update(layouts[0].id, {
          layout: newLayout
        });
      } else {
        await base44.entities.DashboardLayout.create({
          user_email: userEmail,
          dashboard_type: dashboardType,
          layout: newLayout,
          is_active: true
        });
      }

      setLayout(newLayout);
    } catch (error) {
      console.error("Failed to save dashboard layout:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateWidget = (widgetId, changes) => {
    const newLayout = {
      ...layout,
      widgets: (layout.widgets || []).map(w =>
        w.id === widgetId ? { ...w, ...changes } : w
      )
    };
    setLayout(newLayout);
    saveLayout(newLayout);
  };

  return {
    layout,
    loading,
    isSaving,
    setLayout,
    updateWidget,
    saveLayout
  };
};