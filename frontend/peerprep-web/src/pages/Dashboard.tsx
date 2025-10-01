import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  return (
    <main style={{ maxWidth: 720, margin: "3rem auto" }}>
      <h1>Welcome</h1>
      <p>You are logged in as <b>{user?.email}</b></p>
      <button onClick={signOut}>Log out</button>
    </main>
  );
}