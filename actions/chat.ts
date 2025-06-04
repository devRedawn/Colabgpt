"use server";

import { getUser } from "@/lib/auth";
import { generateRandomId } from "@/lib/utils";
import { JsonMessagesArraySchema } from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAzureCredentials } from "@/lib/credential-manager";
import { encryptMessage } from "@/lib/encryption";

export type Message = {
  message: string;
  conversationId: string;
};

export type NewMessage = Omit<Message, "conversationId">;

export async function newChat(params: NewMessage) {
  const user = await getUser();
  if (!user) redirect("/login");
  
  let id: string | undefined;
  let error: undefined | { message: string };
  
  try {
    // Get Azure credentials server-side
    const credentials = await getAzureCredentials();
    if (credentials.error || !credentials.azureApiKey || !credentials.azureEndpoint) {
      return { message: credentials.error || "Azure AI credentials not configured" };
    }

    const responseMessage = await createCompletion(
      params.message,
      credentials.azureApiKey,
      credentials.azureEndpoint
    );
    
    const newConversationId = generateRandomId(8);
    const newMessageJson = [
      {
        id: newConversationId,
        question: encryptMessage(params.message),
        answer: encryptMessage(responseMessage),
      },
    ];
    
    // Create a new document in the conversations collection
    const db = getAdminFirestore();
    const newConversationRef = db.collection("conversations").doc();
    
    await newConversationRef.set({
      messages: newMessageJson,
      name: encryptMessage(params.message), // Encrypt conversation name too
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    id = newConversationRef.id;
  } catch (err) {
    if (err instanceof Error) error = { message: err.message };
    console.error("Error creating new chat:", err);
  }

  if (error) return error;
  redirect(`/chat/${id}`);
}

export async function chat(params: Message) {
  let error: undefined | { message: string };
  
  try {
    // Get Azure credentials server-side
    const credentials = await getAzureCredentials();
    if (credentials.error || !credentials.azureApiKey || !credentials.azureEndpoint) {
      return { message: credentials.error || "Azure AI credentials not configured" };
    }

    const responseMessage = await createCompletion(
      params.message,
      credentials.azureApiKey,
      credentials.azureEndpoint
    );
    
    const newConversationId = generateRandomId(8);
    
    // Get the conversation document
    const db = getAdminFirestore();
    const conversationRef = db.collection("conversations").doc(params.conversationId);
    const conversationSnap = await conversationRef.get();
    
    if (!conversationSnap.exists) {
      throw new Error("Conversation not found");
    }
    
    const conversationData = conversationSnap.data();
    
    // Parse the existing messages and add the new message
    const updatedMessageJson = [
      ...JsonMessagesArraySchema.parse(conversationData?.messages),
      {
        id: newConversationId,
        question: encryptMessage(params.message),
        answer: encryptMessage(responseMessage),
      },
    ];
    
    // Update the conversation document
    await conversationRef.update({
      messages: updatedMessageJson,
      updatedAt: new Date(),
    });
  } catch (err) {
    if (err instanceof Error) error = { message: err.message };
    console.error("Error updating chat:", err);
  }

  if (error) return error;
  revalidatePath(`/chat/${params.conversationId}`);
}

async function createCompletion(
  message: string,
  azureApiKey: string,
  azureEndpoint: string
): Promise<string> {
  if (!azureApiKey || !azureEndpoint) {
    throw new Error("Azure API key and endpoint are required.");
  }
  
  // Default values
  let deploymentName = "gpt-35-turbo";
  let apiVersion = "2023-05-15";
  let baseEndpoint = azureEndpoint.trim().replace(/\/+$/, "");
  
  // Check if the endpoint is a complete URL with chat/completions
  const fullUrlMatch = azureEndpoint.match(/^(https:\/\/[^\/]+)\/openai\/deployments\/([^\/\?]+)\/chat\/completions\?api-version=([^&]+)/i);
  if (fullUrlMatch) {
    baseEndpoint = fullUrlMatch[1];
    deploymentName = fullUrlMatch[2];
    apiVersion = fullUrlMatch[3];
  } else {
    // Check if endpoint includes the full path with deployment but no chat/completions
    const fullPathMatch = azureEndpoint.match(/\/openai\/deployments\/([^\/\?]+)/i);
    if (fullPathMatch && fullPathMatch[1]) {
      deploymentName = fullPathMatch[1];
      baseEndpoint = azureEndpoint.split('/openai/deployments/')[0];
    } else {
      // Check if endpoint contains just deployment name at the end
      const deploymentMatch = azureEndpoint.match(/\/deployments\/([^\/\?]+)/i);
      if (deploymentMatch && deploymentMatch[1]) {
        deploymentName = deploymentMatch[1];
        baseEndpoint = azureEndpoint.replace(/\/deployments\/([^\/\?]+).*$/, "");
      }
    }
    
    // Check if API version is specified in the original URL
    const apiVersionMatch = azureEndpoint.match(/api-version=([^&]+)/i);
    if (apiVersionMatch && apiVersionMatch[1]) {
      apiVersion = apiVersionMatch[1];
    }
  }
  
  // Construct the correct URL
  const url = `${baseEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
  
  console.log("Azure AI Request URL:", url);
  console.log("Deployment Name:", deploymentName);
  
  try {
    const requestBody = {
      messages: [{ role: "user", content: message }],
      max_tokens: 2000,
      temperature: 0.7,
    };
    
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log("Response Status:", response.status);
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Azure AI API Error:", response.status, errorData);
      
      if (response.status === 404) {
        throw new Error(`Azure AI endpoint not found. Please check:\n1. Your endpoint URL: ${baseEndpoint}\n2. Your deployment name: ${deploymentName}\n3. Ensure the deployment exists in your Azure OpenAI service`);
      }
      
      throw new Error(`Azure AI API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    console.log("Azure AI Response:", data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from Azure AI");
    }
    
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Error in Azure AI completion:", error);
    throw new Error(`Failed to get response from Azure AI: ${error.message}`);
  }
}
