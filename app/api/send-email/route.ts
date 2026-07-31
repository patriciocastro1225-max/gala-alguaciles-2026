import { NextRequest, NextResponse } from "next/server";

type Recipient={email:string;name:string;table:string;circle:string;qr:string};

function escapeHtml(value:string){
  return value.replace(/[&<>'"]/g,(character)=>{
    if(character==="&")return "&amp;";
    if(character==="<")return "&lt;";
    if(character===">")return "&gt;";
    if(character==="\"")return "&quot;";
    return "&#39;";
  });
}

export async function POST(request:NextRequest){
  const apiKey=process.env.RESEND_API_KEY; const from=process.env.EMAIL_FROM;
  if(!apiKey||!from)return NextResponse.json({error:"Falta configurar RESEND_API_KEY y EMAIL_FROM en Netlify."},{status:503});
  const body=await request.json() as {subject?:string;message?:string;recipients?:Recipient[]};
  if(!body.subject?.trim()||!body.message?.trim()||!body.recipients?.length)return NextResponse.json({error:"Faltan asunto, mensaje o destinatarios."},{status:400});
  const results=[];
  for(const person of body.recipients.slice(0,50)){
    const text=body.message.replaceAll("[Nombre]",person.name).replaceAll("[Mesa]",person.table).replaceAll("[Círculo]",person.circle).replaceAll("[QR]",person.qr);
    const html=`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #d5c08b;padding:32px"><h2 style="color:#173b2b">II Gran Gala Nacional de los Alguaciles de Chile 2026</h2><p style="white-space:pre-line;line-height:1.6">${escapeHtml(text)}</p><p><strong>Código de acreditación:</strong> ${escapeHtml(person.qr)}</p><p style="color:#81652c">25 de noviembre de 2026 · Club Palestino</p></div>`;
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[person.email],subject:body.subject,html})});
    const payload=await response.json(); results.push({email:person.email,ok:response.ok,id:payload.id,error:payload.message});
  }
  const sent=results.filter(r=>r.ok).length;
  return NextResponse.json({sent,failed:results.length-sent,results},{status:sent?200:502});
}
