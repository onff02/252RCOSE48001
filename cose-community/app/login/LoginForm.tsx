"use client";
import { useFormState } from "react-dom";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, { error: null });

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input name="identifier" placeholder="Email or username" className="w-full border rounded px-3 py-2" />
        <input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" />
        <button className="w-full bg-black text-white py-2 rounded">Login</button>
      </form>
      {state?.error && (
        <div role="alert" className="text-sm text-red-600 mt-2">{state.error}</div>
      )}
    </>
  );
}


