"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

export default function AdminLogin(){
  const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [error,setError]=useState("");
  function submit(e:FormEvent){e.preventDefault(); if(email.toLowerCase()==="admin@galaalguaciles.cl"&&password==="Gala2026!"){sessionStorage.setItem("gala-admin","1"); router.push("/admin/dashboard");}else setError("Usuario o contraseña incorrectos.");}
  return <main className="adminLogin">
    <section className="loginBrand"><div className="adminSeal">II</div><p className="adminEyebrow">Plataforma oficial</p><h1>Gran Gala Nacional<span>de los Alguaciles de Chile 2026</span></h1><p>Centro de administración de asistentes, pagos, mesas, invitados y control de acceso.</p></section>
    <section className="loginCard"><div className="loginCardHeader"><ShieldCheck/><div><p className="adminEyebrow">Acceso restringido</p><h2>Panel de Administración</h2></div></div>
      <form onSubmit={submit}><label>Correo electrónico<span className="inputShell"><UserRound size={19}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@galaalguaciles.cl" required/></span></label>
      <label>Contraseña<span className="inputShell"><LockKeyhole size={19}/><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
      {error&&<p className="loginError">{error}</p>}<button className="adminPrimaryButton">Ingresar al panel</button></form>
      <div className="demoAccess"><strong>Acceso demostración</strong><span>Usuario: admin@galaalguaciles.cl</span><span>Clave: Gala2026!</span></div>
    </section>
  </main>
}
