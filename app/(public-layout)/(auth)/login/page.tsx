import AuthForm from "@/components/auth-form";

export default function Login() {
  return (
    <div className="flex flex-col items-center gap-5 justify-center h-[70vh]">
      <h3 className="text-2xl font-bold text-center">Login to OpenChat</h3>
      <AuthForm mode="login" />
    </div>
  );
}
