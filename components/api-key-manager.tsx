"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./firebase-auth-provider";
import { saveAzureCredentials, hasAzureCredentials } from "@/lib/credential-manager";
import { testSaveCredentials } from "@/actions/test-credentials";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ApiKeyManager() {
  const [azureApiKey, setAzureApiKey] = useState("");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadApiSettings = async () => {
      if (!user) return;
      
      try {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin || false);
          
          // Check if organization has Azure credentials configured
          const credentialsExist = await hasAzureCredentials();
          setHasCredentials(credentialsExist);
          
          // If credentials exist, show placeholder text for security
          if (credentialsExist) {
            setAzureApiKey("••••••••••••••••••••••••••••••••");
            setAzureEndpoint("••••••••••••••••••••••••••••••••");
          }
        } else {
          // User document doesn't exist - this will be handled by the credential manager
          console.log("User document not found, will be created automatically");
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error loading API settings:", error);
        toast({
          title: "Loading Error",
          description: "Failed to load your settings. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadApiSettings();
  }, [user, toast]);

  const saveApiKey = async () => {
    // Validate inputs
    if (!azureApiKey.trim() || azureApiKey.includes("••••")) {
      toast({
        title: "Azure API Key Required",
        description: "Please enter your actual Azure API key",
        variant: "destructive",
      });
      return;
    }
    
    if (!azureEndpoint.trim() || azureEndpoint.includes("••••")) {
      toast({
        title: "Azure Endpoint Required",
        description: "Please enter your actual Azure endpoint URL",
        variant: "destructive",
      });
      return;
    }

    // Validate endpoint format
    const endpointPattern = /^https?:\/\/.+\.(openai\.azure\.com|azure\.com)/i;
    if (!endpointPattern.test(azureEndpoint.trim())) {
      toast({
        title: "Invalid Endpoint Format",
        description: "Azure endpoint should be like: https://your-resource.openai.azure.com",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log("Starting credential save process...");
      
      // Show progress
      toast({
        title: "Saving Credentials",
        description: "Please wait while we securely save your Azure credentials...",
      });
      
      // Save credentials with improved error handling
      const result = await saveAzureCredentials(azureApiKey.trim(), azureEndpoint.trim());
      console.log("Save result:", result);
      
      if (result.success) {
        toast({
          title: "Settings Saved Successfully",
          description: "Your Azure AI credentials have been securely saved and encrypted",
        });
        
        // Update state to show masked values
        setHasCredentials(true);
        setAzureApiKey("••••••••••••••••••••••••••••••••");
        setAzureEndpoint("••••••••••••••••••••••••••••••••");
      } else {
        console.error("Save failed:", result.error);
        
        // Provide specific error guidance
        let errorMessage = result.error || "Failed to save credentials";
        let errorTitle = "Save Failed";
        
        if (result.error?.includes("permission")) {
          errorTitle = "Permission Error";
          errorMessage = "You don't have permission to save credentials. Please ensure you're logged in as an admin.";
        } else if (result.error?.includes("authentication")) {
          errorTitle = "Authentication Error";
          errorMessage = "Please log out and log back in, then try again.";
        } else if (result.error?.includes("organization")) {
          errorTitle = "Organization Setup Error";
          errorMessage = "There's an issue with your organization setup. Please try refreshing the page.";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      
      let errorMessage = "An unexpected error occurred while saving credentials";
      if (error?.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your admin status and try again.";
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h3 className="text-lg font-medium mb-4">Azure AI Settings</h3>
        {!isAdmin && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Admin Access Required</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Only administrators can configure Azure AI credentials. If you should have admin access, please contact your organization administrator or visit the debug page to promote your account.
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="azureEndpoint">Azure Endpoint URL</Label>
            <Input
              id="azureEndpoint"
              type="text"
              placeholder="https://your-resource-name.openai.azure.com"
              value={azureEndpoint}
              onChange={(e) => setAzureEndpoint(e.target.value)}
              disabled={!isAdmin}
              className={!isAdmin ? "opacity-50" : ""}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Your Azure OpenAI service endpoint. Examples:
              <br />
              <code className="bg-muted px-1 py-0.5 rounded text-xs">https://your-resource.openai.azure.com</code>
              <br />
              <code className="bg-muted px-1 py-0.5 rounded text-xs">https://your-resource.openai.azure.com/openai/deployments/gpt-35-turbo</code>
              <br />
              <span className="text-xs">Find this in your Azure Portal under "Keys and Endpoint"</span>
            </p>
          </div>
          
          <div>
            <Label htmlFor="azureApiKey">Azure API Key</Label>
            <Input
              id="azureApiKey"
              type="password"
              placeholder="Your Azure AI API key"
              value={azureApiKey}
              onChange={(e) => setAzureApiKey(e.target.value)}
              disabled={!isAdmin}
            />
            <p className="text-sm text-muted-foreground mt-1">
              The API key for your Azure AI service.
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <Button onClick={saveApiKey} className="mt-2" disabled={loading || !isAdmin}>
          {loading ? "Saving..." : isAdmin ? "Save API Settings" : "View Only (Contact Admin)"}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {isAdmin ? (
            hasCredentials ? (
              "🔒 Azure AI credentials are securely stored and encrypted. Enter new values to update them."
            ) : (
              "As an admin, these credentials will be securely stored and encrypted for your entire organization."
            )
          ) : (
            hasCredentials ? (
              "🔒 Azure AI credentials are configured by your organization admin and securely stored."
            ) : (
              "Contact your organization admin to configure Azure AI credentials."
            )
          )}
        </p>
      </div>
    </div>
  );
}
