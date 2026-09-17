import { NextRequest, NextResponse } from "next/server";

type Seat = { seat_number: number; guest_name: string; guest_type: string; qr_code: string };
type Recipient = { attendee_id?: string; email: string; name: string; table: string; circle: string; qr: string; seats?: Seat[] };

function escapeHtml(value: string) { return String(value ?? "").replace(/[&<>'"]/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#39;"); }
function qrImageUrl(value: string) { return `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=260&margin=2&ecLevel=H`; }
function googleCalendarUrl(){const p=new URLSearchParams({action:"TEMPLATE",text:"II Gran Gala Nacional de los Alguaciles de Chile 2026",dates:"20261125T230000Z/20261126T050000Z",details:"II Gran Gala Nacional de los Alguaciles de Chile 2026. Tenida: Formal Sport.",location:"Club Palestino, Av. Presidente Kennedy 9351, Las Condes, Santiago, Chile"});return `https://calendar.google.com/calendar/render?${p.toString()}`;}

async function loadSeats(attendeeId:string|undefined, fallback:Recipient):Promise<Seat[]>{
 if(!attendeeId)return [{seat_number:1,guest_name:fallback.name,guest_type:"Titular",qr_code:fallback.qr}];
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const key=serviceKey||anonKey;
 if(!url||!key)throw new Error("Falta configuración de Supabase para obtener los QR individuales.");
 const r=await fetch(`${url}/rest/v1/attendee_seats?attendee_id=eq.${encodeURIComponent(attendeeId)}&select=seat_number,guest_name,guest_type,qr_code&order=seat_number.asc`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
 if(!r.ok){const detail=await r.text();throw new Error(`No fue posible obtener los QR individuales: ${detail}`);}
 const rows=await r.json();
 if(!Array.isArray(rows)||!rows.length)throw new Error(`No existen accesos QR para ${fallback.name}.`);
 return rows as Seat[];
}

export async function POST(request:NextRequest){
 const apiKey=process.env.RESEND_API_KEY;const from=process.env.EMAIL_FROM;
 if(!apiKey||!from)return NextResponse.json({error:"Falta configurar RESEND_API_KEY y EMAIL_FROM en Netlify."},{status:503});
 const body=await request.json() as {subject?:string;message?:string;recipients?:Recipient[]};
 if(!body.subject?.trim()||!body.message?.trim()||!body.recipients?.length)return NextResponse.json({error:"Faltan asunto, mensaje o destinatarios."},{status:400});
 const results=[];const googleUrl=googleCalendarUrl();const icsUrl="https://grangala.cl/api/calendar";
 for(const person of body.recipients.slice(0,50)){
  if(!person.email)continue;
  try{
   const seats=person.seats?.length?person.seats:await loadSeats(person.attendee_id,person);
   const text=body.message.replaceAll("[Nombre]",person.name).replaceAll("[Mesa]",person.table).replaceAll("[Círculo]",person.circle).replaceAll("[QR]",seats.length>1?`A continuación encontrará los ${seats.length} códigos QR individuales asociados a esta inscripción.`:"Su código QR personal se encuentra a continuación");
   const qrCards=seats.map(s=>`<div style="margin:18px 0;padding:20px 14px;border:1px solid #e3d5ae;background:#faf7ef;text-align:center"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#8a6a2d">${escapeHtml(s.guest_type)} · Acceso ${s.seat_number}</div><div style="font-size:18px;font-weight:700;color:#173b2b;margin-top:7px">${escapeHtml(s.guest_name)}</div><img src="${qrImageUrl(s.qr_code)}" width="240" height="240" alt="QR ${escapeHtml(s.guest_name)}" style="display:block;width:240px;height:240px;max-width:100%;margin:14px auto 8px;background:#fff;border:10px solid #fff"/><div style="font-size:12px;color:#5d665f">QR personal e intransferible. Preséntelo en la acreditación.</div><div style="font-family:monospace;font-size:13px;font-weight:700;margin-top:8px;color:#173b2b">${escapeHtml(s.qr_code)}</div></div>`).join("");
   const html=`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #d5c08b;background:#fff;padding:34px;color:#18241d"><div style="border-bottom:3px solid #b8954d;padding-bottom:18px;margin-bottom:24px"><div style="font-size:12px;letter-spacing:2px;color:#9a7734;text-transform:uppercase">Invitación oficial</div><h2 style="margin:7px 0 0;color:#173b2b">II Gran Gala Nacional de los Alguaciles de Chile 2026</h2></div><p style="white-space:pre-line;line-height:1.7">${escapeHtml(text)}</p><div style="margin:24px 0;padding:18px;border:1px solid #e3d5ae;background:#f8f5ec;text-align:center"><div style="font-size:12px;text-transform:uppercase;letter-spacing:1.3px;color:#8a6a2d;margin-bottom:10px">Guarde la Gala en su agenda</div><a href="${googleUrl}" style="display:inline-block;margin:4px;padding:11px 16px;background:#173b2b;color:#fff;text-decoration:none;font-weight:700;border-radius:4px">Agregar a Google Calendar</a><a href="${icsUrl}" style="display:inline-block;margin:4px;padding:11px 16px;background:#b8954d;color:#fff;text-decoration:none;font-weight:700;border-radius:4px">Agregar a Apple / Outlook</a><div style="font-size:12px;color:#6d746f;margin-top:10px">25 de noviembre de 2026 · 20:00 horas · Club Palestino</div></div><div style="margin-top:24px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#8a6a2d;text-align:center">${seats.length>1?`Códigos QR de acceso · ${seats.length} personas`:"Código QR personal de acreditación"}</div>${qrCards}</div><p style="font-size:13px;color:#81652c">25 de noviembre de 2026 · 20:00 horas · Club Palestino</p></div>`;
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[person.email],subject:body.subject,html})});const payload=await response.json();results.push({attendee_id:person.attendee_id??null,email:person.email,ok:response.ok,id:payload.id,error:payload.message,qr_count:seats.length});
  }catch(e){results.push({attendee_id:person.attendee_id??null,email:person.email,ok:false,error:e instanceof Error?e.message:"Error obteniendo QR individuales."});}
 }
 const sent=results.filter(r=>r.ok).length;const failed=results.length-sent;return NextResponse.json({sent,failed,results},{status:sent>0?200:502});
}
