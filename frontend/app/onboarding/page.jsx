"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { onboardingApi } from "@/lib/api/onboarding";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { OnboardingPageLoading } from "@/components/onboarding/loading-states";
import {
  employeeFlow,
  companyAdminFlow,
  consultantFlow,
  platformAdminFlow,
} from "@/components/onboarding/role-flows";

/**
 * Onboarding Page - PulseHR
 * @page
 * @description Main onboarding page that determines user role and shows appropriate flow
 * 
 * Features:
 * - Detects user role from session/API
 * - Loads appropriate onboarding flow
 * - Saves progress to backend
 * - Redirects to dashboard on completion
 * - Full-screen immersive experience
 */

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);

  // Fetch user data and determine flow
  useEffect(() => {
    async function initializeOnboarding() {
      try {
        setIsLoading(true);

        // Fetch user profile data - api.get returns JSON directly
        const profileResponse = await api.get('/auth/me/');
        const user = profileResponse;

        // Fetch onboarding progress - api.get returns JSON directly
        const progressResponse = await onboardingApi.getProgress();
        const progress = progressResponse;

        setUserData(user);
        setUserRole(user.role);

        // Check if user already completed onboarding
        if (progress.is_completed) {
          // Redirect to dashboard
          redirectToDashboard(user.role);
          return;
        }

        // Load saved progress if any
        if (progress.current_step !== undefined || progress.data) {
          setSavedProgress({
            currentStep: progress.current_step || 0,
            data: progress.data || {}
          });
        }

        // Set appropriate flow based on role
        const flow = getFlowForRole(user.role);
        setCurrentFlow(flow);

      } catch (error) {
        console.error("Failed to initialize onboarding:", error);
        // If onboarding progress doesn't exist yet, continue with empty state
        if (error.response?.status === 404) {
          // Set flow anyway
          if (userData?.role) {
            const flow = getFlowForRole(userData.role);
            setCurrentFlow(flow);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    initializeOnboarding();
  }, []);

  // Get flow configuration based on user role
  function getFlowForRole(role) {
    const flows = {
      employee: employeeFlow,
      company_admin: companyAdminFlow,
      consultant: consultantFlow,
      platform_admin: platformAdminFlow,
    };

    return flows[role] || employeeFlow;
  }

  // Redirect to appropriate dashboard based on role
  function redirectToDashboard(role) {
    const dashboardRoutes = {
      employee: "/dashboard/employee",
      company_admin: "/dashboard/admin",
      consultant: "/dashboard/consultant",
      platform_admin: "/dashboard/platform-admin",
    };

    const route = dashboardRoutes[role] || "/dashboard";
    router.push(route);
  }

  // Handle auto-save
  async function handleSave(data) {
    try {
      await onboardingApi.updateProgress({
        current_step: data.currentStep,
        data: data.formData,
      });

      console.log("Onboarding progress saved:", data);
      
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
      throw error;
    }
  }

  // Handle onboarding completion
  async function handleComplete(data) {
    try {
      setIsLoading(true);

      await onboardingApi.updateProgress({
        current_step: data.currentStep,
        data: data.formData,
        is_completed: true,
      });

      console.log("Onboarding completed:", data);

      // Mark as completed and redirect
      redirectToDashboard(userRole);

    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsLoading(false);
      // TODO: Show error message
    }
  }

  // Handle close (exit onboarding)
  function handleClose() {
    const confirmExit = window.confirm(
      "Sei sicuro di voler uscire dalla configurazione? Potrai riprenderla in seguito."
    );

    if (confirmExit) {
      // Redirect to a safe page (e.g., home or login)
      router.push("/");
    }
  }

  // Show loading state while fetching user data
  if (isLoading || !currentFlow) {
    return (
      <OnboardingPageLoading 
        message={
          isLoading 
            ? "Caricamento configurazione..." 
            : "Preparazione completata..."
        } 
      />
    );
  }

  return (
    <OnboardingWizard
      flow={currentFlow}
      initialStep={savedProgress?.currentStep || 0}
      onComplete={handleComplete}
      onClose={handleClose}
      onSave={handleSave}
      userData={userData}
      autoSave={true}
    />
  );
}
