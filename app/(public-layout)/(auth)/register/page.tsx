import AuthForm from "@/components/auth-form";

export default function Register() {
  return (
    <div className="flex flex-col items-center gap-5 justify-center h-[70vh]">
      <h3 className="text-2xl font-bold text-center">Register to OpenChat</h3>
      <AuthForm mode="register" />
    </div>
  );
}
