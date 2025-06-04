import { requireAuth, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import InviteCoworker from "@/components/invite-coworker";
import CoworkerList from "@/components/coworker-list";

export default async function AdminPage() {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect("/chat");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Team Management</h2>
            <InviteCoworker />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Organization Info</h2>
            <div className="p-6 border rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Organization Admin
              </p>
              <p className="font-medium">{user.email}</p>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Admin ID
                </p>
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {user.id}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          <CoworkerList />
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-medium mb-2">How to invite coworkers:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Fill in the coworker's name, email, and create a temporary password</li>
              <li>Click "Create Coworker Account" to create their account</li>
              <li>Manually share the email and password with your coworker</li>
              <li>They can then log in using those credentials</li>
              <li>Recommend they change their password after first login</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}