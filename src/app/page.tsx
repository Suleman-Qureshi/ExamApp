import Link from "next/link";
import "../style/main.css"
export default function Home() {
 
  return (
   <>  
    <main className="home-container w-screen flex justify-center">
      <div className="home-card">
        <h1>Welcome to the Online Exam Platform</h1>
        <p>
          Please 
          <Link href="/login" id="login-link" className="home-link">login</Link> 
          or 
          <Link href="/register" id="register-link" className="home-link">register</Link>.
        </p>
      </div>
    </main>
   </> 
  );
}
