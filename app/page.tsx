export default function Home() {
  return (
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"28px",background:"linear-gradient(145deg,#071e1b 0%,#10382e 55%,#071e1b 100%)",color:"#f7f0dc",textAlign:"center"}}>
      <section style={{maxWidth:820,width:"100%",padding:"55px 24px",border:"1px solid rgba(224,191,111,.5)",borderRadius:16,background:"rgba(0,0,0,.18)"}}>
        <p style={{fontSize:15,letterSpacing:4,color:"#e5c57c",textTransform:"uppercase",marginBottom:24}}>II Gran Gala Nacional · Alguaciles de Chile</p>
        <h1 style={{fontSize:"clamp(44px,9vw,92px)",lineHeight:1.05,fontWeight:700,margin:"0 0 22px",color:"#f4d58e"}}>EVENTO LLENO</h1>
        <p style={{fontSize:"clamp(23px,4vw,39px)",fontWeight:500,margin:"0 0 26px"}}>¡Los esperamos el 25 de noviembre!</p>
        <p style={{fontSize:"clamp(16px,2.5vw,22px)",lineHeight:1.7,margin:"0 0 12px"}}>Agradecemos la gran acogida a nuestra II Gran Gala Nacional.</p>
        <p style={{fontSize:18,margin:"0 0 8px"}}>25 de noviembre de 2026 · 20:00 horas</p>
        <p style={{fontSize:18,margin:0}}>Club Palestino</p>
      </section>
    </main>
  );
}
